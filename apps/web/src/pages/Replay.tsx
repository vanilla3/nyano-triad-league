import React from "react";
import { useToast } from "@/components/Toast";
import { Disclosure } from "@/components/Disclosure";
import { Link, useSearchParams } from "react-router-dom";

import type { CardData, MatchResultWithHistory, RulesetConfigV1, TranscriptV1 } from "@nyano/triad-engine";
import {
  simulateMatchV1WithHistory,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
} from "@nyano/triad-engine";

import OFFICIAL from "@root/rulesets/official_onchain_rulesets.json";

import { BoardView } from "@/components/BoardView";
import { CardMini } from "@/components/CardMini";
import { TurnLog } from "@/components/TurnLog";
import {
  base64UrlEncodeUtf8,
  safeBase64UrlDecodeUtf8,
  safeGzipDecompressUtf8FromBase64Url,
  tryGzipCompressUtf8ToBase64Url,
} from "@/lib/base64url";
import { stringifyWithBigInt } from "@/lib/json";
import { formatEventPeriod, getEventById, getEventStatus } from "@/lib/events";
import { hasEventAttempt, upsertEventAttempt, type EventAttemptV1 } from "@/lib/event_attempts";
import { fetchNyanoCards } from "@/lib/nyano_rpc";
import { publishOverlayState } from "@/lib/streamer_bus";
import { parseTranscriptV1Json } from "@/lib/transcript_import";

type Mode = "auto" | "v1" | "v2" | "compare";

type SimState =
  | { ok: false; error: string }
  | {
      ok: true;
      transcript: TranscriptV1;
      cards: Map<bigint, CardData>;
      owners: Map<bigint, `0x${string}`>;
      currentRulesetLabel: string;
      current: MatchResultWithHistory;
      v1: MatchResultWithHistory;
      v2: MatchResultWithHistory;
    };

function clampInt(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}


function turnPlayer(firstPlayer: 0 | 1, turnIndex: number): 0 | 1 {
  return ((firstPlayer + (turnIndex % 2)) % 2) as 0 | 1;
}


function parseMode(v: string | null): Mode {
  if (v === "auto" || v === "v1" || v === "v2" || v === "compare") return v;
  return "auto";
}

function boardEquals(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ca = a[i];
    const cb = b[i];
    if (ca === null && cb === null) continue;
    if (ca === null || cb === null) return false;
    if (ca.owner !== cb.owner) return false;
    if (String(ca.card?.tokenId) !== String(cb.card?.tokenId)) return false;
  }
  return true;
}

function computeDelta(boardPrev: any, boardNow: any): { placedCell: number | null; flippedCells: number[] } {
  let placedCell: number | null = null;
  const flippedCells: number[] = [];

  for (let i = 0; i < boardNow.length; i++) {
    const a = boardPrev[i];
    const b = boardNow[i];

    if (a === null && b !== null) {
      placedCell = i;
      continue;
    }
    if (a !== null && b !== null && a.owner !== b.owner) {
      flippedCells.push(i);
    }
  }
  return { placedCell, flippedCells };
}

function rulesetLabelFromConfig(cfg: RulesetConfigV1): string {
  if (cfg === ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2) return "engine v2 (shadow ignores warning)";
  return "engine v1 (core+tactics)";
}

function pickDefaultMode(rulesetId: string): Mode {
  try {
    const rulesets = (OFFICIAL as any).rulesets as Array<{ rulesetId: string; engineId: number }>;
    const hit = rulesets.find((r) => r.rulesetId.toLowerCase() === rulesetId.toLowerCase());
    if (!hit) return "compare";
    return hit.engineId === 2 ? "v2" : "v1";
  } catch {
    return "compare";
  }
}

export function ReplayPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const eventId = searchParams.get("event") ?? "";
  const event = React.useMemo(() => (eventId ? getEventById(eventId) : null), [eventId]);
  const eventStatus = event ? getEventStatus(event) : null;


  // Initial values from shareable URL
  const initialT = searchParams.get("t");
  const initialZ = searchParams.get("z");

  // t = raw base64url(json), z = gzip(base64url(bytes)) [preferred if available]
  const initialTextFromT = initialT ? safeBase64UrlDecodeUtf8(initialT) ?? "" : "";

  const initialMode = parseMode(searchParams.get("mode"));
  const initialStep = clampInt(Number(searchParams.get("step") ?? "0"), 0, 9);

  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [text, setText] = React.useState<string>(initialZ ? "" : initialTextFromT);

  const [loading, setLoading] = React.useState(false);
  const [sim, setSim] = React.useState<SimState>({ ok: false, error: "Paste transcript JSON and load." });

  const [step, setStep] = React.useState<number>(initialStep);
  const toast = useToast();
  const initialBroadcast = searchParams.get("broadcast") === "1";
  const [broadcastOverlay, setBroadcastOverlay] = React.useState<boolean>(initialBroadcast);


  const copy = async (v: string) => {
    await navigator.clipboard.writeText(v);
  };

  const copyWithToast = async (label: string, v: string) => {
    await copy(v);
    toast.success("Copied", label);
  };

  const pushOverlay = React.useCallback(
    (opts?: { silent?: boolean }) => {
      const updatedAtMs = Date.now();
      try {
        if (!sim.ok) {
          publishOverlayState({
            version: 1,
            updatedAtMs,
            mode: "replay",
            eventId: event?.id ?? (eventId || undefined),
            eventTitle: event?.title,
            error: sim.error || "Replay not loaded",
          });
          if (!opts?.silent) toast.warn("Overlay", "Replay not ready");
          return;
        }

        const res = sim.current;
        const transcript = sim.transcript;

        const lastIndex = step - 1;
        const last = lastIndex >= 0 ? res.turns[lastIndex] : null;

        const lastMove =
          last && typeof (last as any).cell === "number"
            ? {
                turnIndex: lastIndex,
                by: turnPlayer(transcript.header.firstPlayer as 0 | 1, lastIndex),
                cell: Number((last as any).cell),
                cardIndex: Number((last as any).cardIndex ?? 0),
                warningMarkCell: typeof (last as any).warningMarkCell === "number" ? Number((last as any).warningMarkCell) : null,
              }
            : undefined;

        publishOverlayState({
          version: 1,
          updatedAtMs,
          mode: "replay",
          eventId: event?.id ?? (eventId || undefined),
          eventTitle: event?.title,
          turn: step,
          firstPlayer: transcript.header.firstPlayer as 0 | 1,
          playerA: transcript.header.playerA,
          playerB: transcript.header.playerB,
          rulesetId: transcript.header.rulesetId,
          seasonId: transcript.header.seasonId,
          deckA: transcript.header.deckA.map((x) => x.toString()),
          deckB: transcript.header.deckB.map((x) => x.toString()),
          board: res.boardHistory[step],
          lastMove,
          status: {
            finished: step >= 9,
            winner: res.winner === 0 ? "A" : "B",
            tilesA: Number(res.tiles.A),
            tilesB: Number(res.tiles.B),
            matchId: res.matchId,
          },
        });

        if (!opts?.silent) toast.success("Overlay", "Sent to OBS overlay");
      } catch (e: any) {
        publishOverlayState({
          version: 1,
          updatedAtMs,
          mode: "replay",
          eventId: event?.id ?? (eventId || undefined),
          eventTitle: event?.title,
          error: e?.message ?? String(e),
        });
        if (!opts?.silent) toast.error("Overlay", e?.message ?? String(e));
      }
    },
    [sim, step, event?.id, event?.title, eventId, toast]
  );

  const setBroadcastOverlayWithUrl = (nextOn: boolean) => {
    setBroadcastOverlay(nextOn);
    const next = new URLSearchParams(searchParams);
    if (nextOn) next.set("broadcast", "1");
    else next.delete("broadcast");
    setSearchParams(next, { replace: true });
  };

  React.useEffect(() => {
    if (!broadcastOverlay) return;
    // silent sync while stepping through replay
    pushOverlay({ silent: true });
  }, [broadcastOverlay, step, sim.ok, pushOverlay]);


  const load = async (override?: { text?: string; mode?: Mode; step?: number }) => {
    setLoading(true);
    setSim({ ok: false, error: "" });
    try {
      const inputText = (override?.text ?? text).trim();
      if (!inputText) throw new Error("transcript JSON is empty");

      const transcript = parseTranscriptV1Json(inputText);

      // Determine preferred mode from rulesetId if mode=auto.
      const mode0 = override?.mode ?? mode;
      const effectiveMode: Mode = mode0 === "auto" ? pickDefaultMode(transcript.header.rulesetId) : mode0;

      // Fetch on-chain cards for all deck tokenIds
      const tokenIds = [...transcript.header.deckA, ...transcript.header.deckB];
      const bundles = await fetchNyanoCards(tokenIds);

      const cards = new Map<bigint, CardData>();
      const owners = new Map<bigint, `0x${string}`>();
      for (const [tid, b] of bundles.entries()) {
        cards.set(tid, b.card);
        owners.set(tid, b.owner);
      }

      // Always compute both (cheap compared to RPC reads)
      const v1 = simulateMatchV1WithHistory(transcript, cards, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
      const v2 = simulateMatchV1WithHistory(transcript, cards, ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2);

      let current: MatchResultWithHistory = v1;
      let label = rulesetLabelFromConfig(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);

      if (effectiveMode === "v2") {
        current = v2;
        label = rulesetLabelFromConfig(ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2);
      } else if (effectiveMode === "compare") {
        // pick one as "current" for right-side panels; keep label explicit
        current = v1;
        label = "compare v1 vs v2";
      } else if (effectiveMode === "v1") {
        current = v1;
        label = rulesetLabelFromConfig(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
      }

      setSim({ ok: true, transcript, cards, owners, currentRulesetLabel: label, current, v1, v2 });

      const stepMax = current.boardHistory.length - 1;
      const startStep = clampInt(override?.step ?? 0, 0, stepMax);
      setStep(startStep);
    } catch (e: any) {
      setSim({ ok: false, error: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  };

  // If this page is opened via a share link (?t=... or ?z=...), auto-load once.
  const didAutoLoadRef = React.useRef(false);
  React.useEffect(() => {
    if (didAutoLoadRef.current) return;
    didAutoLoadRef.current = true;

    const auto = async () => {
      if (initialZ) {
        const decoded = await safeGzipDecompressUtf8FromBase64Url(initialZ);
        if (!decoded) {
          setSim({ ok: false, error: "Invalid share link (z parameter could not be decompressed)." });
          return;
        }
        setText(decoded);
        await load({ text: decoded, mode: initialMode, step: initialStep });
        return;
      }

      if (initialT) {
        if (!initialTextFromT) {
          setSim({ ok: false, error: "Invalid share link (t parameter could not be decoded)." });
          return;
        }
        await load({ text: initialTextFromT, mode: initialMode, step: initialStep });
        return;
      }
    };

    void auto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const stepMax = sim.ok ? sim.current.boardHistory.length - 1 : 0;
  const focusTurnIndex = step > 0 ? step - 1 : null;

  React.useEffect(() => {
    if (!sim.ok) return;
    const stepMaxNow = sim.current.boardHistory.length - 1;
    if (step > stepMaxNow) setStep(stepMaxNow);
  }, [sim.ok, sim, step]);

  // Keep URL step/mode in sync IF a share param exists (so links can point to a specific step).
  React.useEffect(() => {
    if (!searchParams.get("t") && !searchParams.get("z")) return;

    const curMode = searchParams.get("mode") ?? "auto";
    const curStep = searchParams.get("step") ?? "0";

    const nextMode = mode;
    const nextStep = String(step);

    if (curMode === nextMode && curStep === nextStep) return;

    const next = new URLSearchParams(searchParams);
    next.set("mode", nextMode);
    next.set("step", nextStep);
    setSearchParams(next, { replace: true });
  }, [mode, step, searchParams, setSearchParams]);

  // keyboard
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
      if (e.key === "ArrowRight") setStep((s) => Math.min(stepMax, s + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepMax]);

  const compare = sim.ok && (mode === "compare" || (mode === "auto" && pickDefaultMode(sim.transcript.header.rulesetId) === "compare"));
  const diverged = sim.ok ? !boardEquals(sim.v1.boardHistory[step], sim.v2.boardHistory[step]) : false;

  const renderReplay = (label: string, res: MatchResultWithHistory) => {
    const boardNow = res.boardHistory[step];
    const boardPrev = step === 0 ? res.boardHistory[0] : res.boardHistory[step - 1];
    const { placedCell, flippedCells } = step === 0 ? { placedCell: null, flippedCells: [] } : computeDelta(boardPrev, boardNow);

    return (
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-slate-500">
            winner: {res.winner === 0 ? "A" : "B"} · tiles A:{res.tiles.A}/B:{res.tiles.B}
          </div>
        </div>

        <BoardView
          board={boardNow}
          focusCell={focusTurnIndex !== null ? res.turns[focusTurnIndex]?.cell : null}
          placedCell={placedCell}
          flippedCells={flippedCells}
        />

        {step > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5">placed: {placedCell !== null ? placedCell : "—"}</span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5">flipped: {flippedCells.length}</span>
          </div>
        ) : (
          <div className="text-xs text-slate-500">initial board</div>
        )}
      </div>
    );
  };

  
  const buildCanonicalReplayLink = async (): Promise<string> => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("transcript JSON is empty");

    const origin = window.location.origin;
    const url = new URL(`${origin}/replay`);

    url.searchParams.delete("t");
    url.searchParams.delete("z");

    const z = await tryGzipCompressUtf8ToBase64Url(trimmed);
    if (z) url.searchParams.set("z", z);
    else url.searchParams.set("t", base64UrlEncodeUtf8(trimmed));

    if (eventId) url.searchParams.set("event", eventId);
    url.searchParams.set("mode", "auto");
    url.searchParams.set("step", "9");
    return url.toString();
  };

  const saveToMyAttempts = async () => {
    if (!eventId) throw new Error("eventId is missing");
    if (!sim.ok) throw new Error("replay is not ready");

    const replayUrl = await buildCanonicalReplayLink();

    const a: EventAttemptV1 = {
      id: sim.current.matchId,
      createdAt: new Date().toISOString(),
      eventId,
      replayUrl,
      matchId: sim.current.matchId,
      winner: sim.current.winner as 0 | 1,
      tilesA: Number(sim.current.tiles.A),
      tilesB: Number(sim.current.tiles.B),
      rulesetLabel: sim.currentRulesetLabel,
      deckA: sim.transcript.header.deckA.map((x) => x.toString()),
      deckB: sim.transcript.header.deckB.map((x) => x.toString()),
    };

    upsertEventAttempt(a);
  };

const buildShareLink = async (): Promise<string> => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("transcript JSON is empty");

    const url = new URL(window.location.href);

    // Prefer compressed share param (z) if supported; fall back to raw (t).
    url.searchParams.delete("t");
    url.searchParams.delete("z");

    const z = await tryGzipCompressUtf8ToBase64Url(trimmed);
    if (z) url.searchParams.set("z", z);
    else url.searchParams.set("t", base64UrlEncodeUtf8(trimmed));

    url.searchParams.set("mode", mode);
    url.searchParams.set("step", String(step));
    return url.toString();
  };

  return (
    <div className="grid gap-6">
      {eventId ? (
        <section className="card">
          <div className="card-hd flex flex-wrap items-center justify-between gap-2">
            <div className="grid gap-1">
              <div className="text-base font-semibold">Replay Event</div>
              <div className="text-xs text-slate-500">
                {event ? (
                  <>
                    <span className="font-medium">{event.title}</span> · status: <span className="font-medium">{eventStatus}</span> · {formatEventPeriod(event)}
                  </>
                ) : (
                  <>
                    eventId: <span className="font-mono">{eventId}</span>（unknown）
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link className="btn no-underline" to="/events">
                Events
              </Link>
              {event ? (
                <Link className="btn btn-primary no-underline" to={`/match?event=${encodeURIComponent(event.id)}`}>
                  Challenge again
                </Link>
              ) : null}
            </div>
          </div>

          {event ? (
            <div className="card-bd grid gap-2 text-sm text-slate-700">
              <p>{event.description}</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                Nyano deck tokenIds: <span className="font-mono">{event.nyanoDeckTokenIds.join(", ")}</span>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">Replay from transcript</div>
          <div className="text-xs text-slate-500">
            transcript JSON を貼り付けると、デッキの tokenId をオンチェーンから読み出して再現します（read-only）。 共有リンク（?z=... または ?t=...）で “議論の入口” を軽くします。
          </div>
        </div>

        <div className="card-bd grid gap-4">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-medium text-slate-600">Transcript JSON</div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span>mode</span>
                <select className="select w-48" value={mode} onChange={(e) => setMode(parseMode(e.target.value))}>
                  <option value="auto">auto (by rulesetId)</option>
                  <option value="v1">engine v1</option>
                  <option value="v2">engine v2</option>
                  <option value="compare">compare</option>
                </select>

                <button className="btn btn-primary" onClick={() => load()} disabled={loading}>
                  {loading ? "Loading…" : "Load & replay"}
                </button>

                <button
                  className="btn"
                  onClick={() => {
                    void (async () => {
                      try {
                        const link = await buildShareLink();
                        await copyWithToast("share link", link);
                      } catch (e: any) {
                        setSim({ ok: false, error: e?.message ?? String(e) });
                      }
                    })();
                  }}
                >
                  Copy share link
                </button>

                {eventId ? (
                  (() => {
                    const saved = sim.ok ? hasEventAttempt(eventId, sim.current.matchId) : false;
                    return (
                      <button
                        className="btn"
                        disabled={!sim.ok || saved}
                        onClick={() => {
                          (async () => {
                            try {
                              await saveToMyAttempts();
                              toast.success("Saved", "Added to My Attempts");
                            } catch (e: any) {
                              setSim({ ok: false, error: e?.message ?? String(e) });
                            }
                          })();
                        }}
                      >
                        {saved ? "Saved" : "Save"}
                      </button>
                    );
                  })()
                ) : null}

                
              </div>
            </div>

            <textarea
              className="input font-mono text-xs"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Playgroundの "Copy transcript JSON" を貼り付けてください（または共有リンクを開いてください）'
            />

            <div className="mt-3">
              <Disclosure title={<span>Streamer tools (Overlay)</span>}>
                <div className="grid gap-3">
                  <div className="text-xs text-slate-600">
                    OBSの <span className="font-mono">/overlay</span> を開いた状態で、Replay の <span className="font-mono">step</span> を動かすと overlay が追随します。
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={broadcastOverlay}
                        onChange={(e) => setBroadcastOverlayWithUrl(e.target.checked)}
                      />
                      Broadcast to overlay (sync step)
                    </label>

                    <button className="btn btn-sm" onClick={() => pushOverlay()}>
                      Send snapshot
                    </button>

                    <a
                      className="btn btn-sm no-underline"
                      href={`${window.location.origin}/overlay?controls=0`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Open overlay
                    </a>

                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        void copyWithToast("overlay URL", `${window.location.origin}/overlay?controls=0`);
                      }}
                    >
                      Copy overlay URL
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Tip: 配信者側で <span className="font-mono">/replay?broadcast=1</span> を使うと、step同期が最初からONになります。
                  </div>
                </div>
              </Disclosure>
            </div>



            {!sim.ok && sim.error ? <div className="text-sm text-rose-700">Error: {sim.error}</div> : null}

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="kbd">←</span>/<span className="kbd">→</span> で step 移動
            </div>
          </div>
        </div>
      </section>

      {sim.ok ? (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <div className="card-hd flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-base font-semibold">Replay</div>
                  <div className="text-xs text-slate-500">{sim.currentRulesetLabel}</div>
                  <div className="text-xs text-slate-500">
                    step {step}/{stepMax}
                  </div>
                  {compare ? (
                    <span
                      className={[
                        "rounded-md border px-2 py-0.5 text-xs",
                        diverged ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600",
                      ].join(" ")}
                    >
                      {diverged ? "diverged" : "same"}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn" onClick={() => setStep(0)} disabled={step === 0}>
                    reset
                  </button>
                  <button className="btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                    ←
                  </button>
                  <button className="btn" onClick={() => setStep((s) => Math.min(stepMax, s + 1))} disabled={step === stepMax}>
                    →
                  </button>
                </div>
              </div>

              <div className="card-bd grid gap-4">
                {compare ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {renderReplay("engine v1", sim.v1)}
                    {renderReplay("engine v2", sim.v2)}
                  </div>
                ) : (
                  renderReplay(sim.currentRulesetLabel, sim.current)
                )}

                <div className="grid gap-2">
                  <input type="range" min={0} max={stepMax} value={step} onChange={(e) => setStep(Number(e.target.value))} />
                  <div className="text-xs text-slate-600">{step === 0 ? "initial" : `after turn ${step}`}</div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">
                      current winner: {sim.current.winner === 0 ? "A" : "B"} · tiles A:{sim.current.tiles.A} / B:{sim.current.tiles.B}
                    </div>
                    <div className="text-xs text-slate-500">tieBreak: {sim.current.tieBreak}</div>
                  </div>

                  <div className="mt-2 grid gap-2 text-xs text-slate-600">
                    <div>
                      <span className="font-medium">rulesetId</span>: <code>{sim.transcript.header.rulesetId}</code>
                    </div>
                    <div>
                      <span className="font-medium">matchId</span>: <code>{sim.current.matchId}</code>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button className="btn" onClick={() => copyWithToast("transcript", stringifyWithBigInt(sim.transcript))}>
                      Copy transcript JSON
                    </button>
                    <button className="btn" onClick={() => copyWithToast("result", stringifyWithBigInt(sim.current))}>
                      Copy result JSON
                    </button>
                  </div>

                  <div className="mt-3">
                    <Disclosure title={<span>Show raw JSON (debug)</span>}>
                      <div className="grid gap-3">
                        <div>
                          <div className="text-xs font-medium text-slate-600">transcript</div>
                          <pre className="mt-1 overflow-x-auto rounded-xl border border-slate-200 bg-white/70 p-3 text-xs">
                            {stringifyWithBigInt(sim.transcript)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-600">result</div>
                          <pre className="mt-1 overflow-x-auto rounded-xl border border-slate-200 bg-white/70 p-3 text-xs">
                            {stringifyWithBigInt(sim.current)}
                          </pre>
                        </div>
                      </div>
                    </Disclosure>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-hd">
                <div className="text-base font-semibold">Turn log</div>
                <div className="text-xs text-slate-500">クリックするとそのターンへジャンプします。</div>
              </div>
              <div className="card-bd">
                <TurnLog
                  turns={sim.current.turns}
                  boardHistory={sim.current.boardHistory}
                  selectedTurnIndex={focusTurnIndex ?? -1}
                  onSelect={(t) => setStep(t + 1)}
                />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-hd">
              <div className="text-base font-semibold">Deck inspector</div>
              <div className="text-xs text-slate-500">オンチェーン属性からカード性能に変換して表示します。</div>
            </div>

            <div className="card-bd grid gap-6 md:grid-cols-2">
              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">playerA deck</div>
                <div className="grid grid-cols-5 gap-2">
                  {sim.transcript.header.deckA.map((tid) => {
                    const card = sim.cards.get(tid);
                    return card ? <CardMini key={tid.toString()} card={card} owner={0} subtle /> : null;
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">playerB deck</div>
                <div className="grid grid-cols-5 gap-2">
                  {sim.transcript.header.deckB.map((tid) => {
                    const card = sim.cards.get(tid);
                    return card ? <CardMini key={tid.toString()} card={card} owner={1} subtle /> : null;
                  })}
                </div>
              </div>

              <div className="md:col-span-2 grid gap-2 text-xs text-slate-600">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="font-medium text-slate-700">owners (read-only)</div>
                  <div className="mt-2 grid gap-1 font-mono">
                    {Array.from(sim.owners.entries()).map(([tid, o]) => (
                      <div key={tid.toString()}>
                        #{tid.toString()} → {o}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
