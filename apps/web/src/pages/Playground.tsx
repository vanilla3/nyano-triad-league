import React from "react";
import { useSearchParams } from "react-router-dom";

import type { CardData, MatchResultWithHistory, RulesetConfigV1, TranscriptV1 } from "@nyano/triad-engine";
import {
  simulateMatchV1WithHistory,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
} from "@nyano/triad-engine";

import { BoardView } from "@/components/BoardView";
import { CardMini } from "@/components/CardMini";
import { TurnLog } from "@/components/TurnLog";
import { buildCardsMapFromVector, buildTranscriptFromVector } from "@/lib/build";
import { stringifyWithBigInt } from "@/lib/json";
import { base64UrlEncodeUtf8, tryGzipCompressUtf8ToBase64Url } from "@/lib/base64url";
import { VECTORS, type VectorKey } from "@/lib/vectors";

type SimOk = {
  ok: true;
  transcript: TranscriptV1;
  cards: Map<bigint, CardData>;
  current: MatchResultWithHistory;
  v1: MatchResultWithHistory;
  v2: MatchResultWithHistory;
};

type SimState = SimOk | { ok: false; error: string };

function rulesetLabel(key: VectorKey): string {
  switch (key) {
    case "core_tactics_v1":
      return "Core + Tactics (on-chain subset) · v1";
    case "core_tactics_shadow_v2":
      return "Core + Tactics + Shadow(ignore warning) · v2";
    default:
      return key;
  }
}

function rulesetConfigForVector(key: VectorKey): RulesetConfigV1 {
  return key === "core_tactics_shadow_v2"
    ? ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2
    : ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1;
}

function parseVectorKey(v: string | null): VectorKey {
  if (v === "core_tactics_v1" || v === "core_tactics_shadow_v2") return v;
  return "core_tactics_v1";
}

function clampInt(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
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

export function PlaygroundPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialVectorKey = parseVectorKey(searchParams.get("vec"));
  const initialCompare = searchParams.get("cmp") === "1";

  const [vectorKey, setVectorKey] = React.useState<VectorKey>(initialVectorKey);
  const [compareMode, setCompareMode] = React.useState<boolean>(initialCompare);

  const vf = VECTORS[vectorKey];
  const cases = vf.cases;

  const initialCase = clampInt(Number(searchParams.get("case") ?? "0"), 0, Math.max(0, cases.length - 1));
  const [caseIndex, setCaseIndex] = React.useState<number>(initialCase);

  const [step, setStep] = React.useState<number>(clampInt(Number(searchParams.get("step") ?? "0"), 0, 9));

  // Reset case/step only on user-initiated vector changes (not the initial mount from URL).
  const didMountRef = React.useRef(false);
  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setCaseIndex(0);
    setStep(0);
  }, [vectorKey]);

  // Reset step when switching case (after mount).
  const didMountCaseRef = React.useRef(false);
  React.useEffect(() => {
    if (!didMountCaseRef.current) {
      didMountCaseRef.current = true;
      return;
    }
    setStep(0);
  }, [caseIndex]);

  // Persist state to shareable URL.
  React.useEffect(() => {
    const next: Record<string, string> = {
      vec: vectorKey,
      case: String(caseIndex),
      step: String(step),
    };
    if (compareMode) next.cmp = "1";
    setSearchParams(next, { replace: true });
  }, [vectorKey, caseIndex, step, compareMode, setSearchParams]);

  const sim: SimState = React.useMemo(() => {
    const c = cases[caseIndex];
    if (!c) return { ok: false, error: "case not found" };

    try {
      const transcript = buildTranscriptFromVector(c);
      const cards = buildCardsMapFromVector(c);

      const currentRuleset = rulesetConfigForVector(vectorKey);

      // current = declared ruleset for the vector
      const current = simulateMatchV1WithHistory(transcript, cards, currentRuleset);

      // compare baselines (always computed; cheap)
      const v1 = simulateMatchV1WithHistory(transcript, cards, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
      const v2 = simulateMatchV1WithHistory(transcript, cards, ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2);

      return { ok: true, transcript, cards, current, v1, v2 };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? String(e) };
    }
  }, [vectorKey, caseIndex]);

  // clamp step if URL provides out-of-range values
  React.useEffect(() => {
    if (!sim.ok) return;
    const stepMax = sim.current.boardHistory.length - 1;
    if (step > stepMax) setStep(stepMax);
  }, [sim.ok, sim, step]);

  const stepMax = sim.ok ? sim.current.boardHistory.length - 1 : 0;
  const focusTurnIndex = step > 0 ? step - 1 : null;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const [copied, setCopied] = React.useState<string | null>(null);
  const copyWithToast = async (label: string, text: string) => {
    await copy(text);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1200);
  };

  const buildReplayLink = async (): Promise<string> => {
    if (!sim.ok) throw new Error("simulation is not ready");

    // NOTE: Replay page replays using *on-chain* Nyano stats fetched via RPC.
    // Playground vectors may use synthetic CardData; results can differ.
    const transcriptJson = stringifyWithBigInt(sim.transcript);

    const base = new URL(window.location.origin);
    const url = new URL("/replay", base);

    const z = await tryGzipCompressUtf8ToBase64Url(transcriptJson);
    if (z) url.searchParams.set("z", z);
    else url.searchParams.set("t", base64UrlEncodeUtf8(transcriptJson));

    url.searchParams.set("mode", compareMode ? "compare" : "auto");
    url.searchParams.set("step", String(step));
    return url.toString();
  };


  // keyboard: left/right to step
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
      if (e.key === "ArrowRight") setStep((s) => Math.min(stepMax, s + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepMax]);

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
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5">
              placed: {placedCell !== null ? placedCell : "—"}
            </span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5">
              flipped: {flippedCells.length}
            </span>
          </div>
        ) : (
          <div className="text-xs text-slate-500">initial board</div>
        )}
      </div>
    );
  };

  const compareDiverged =
    sim.ok && !boardEquals(sim.v1.boardHistory[step], sim.v2.boardHistory[step]);

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">Playground</div>
          <div className="text-xs text-slate-500">
            テストベクタからケースを選び、決定論エンジンで再現し、盤面をリプレイします。URL共有で議論が回る形を目指します。
          </div>
        </div>

        <div className="card-bd grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <div className="text-xs font-medium text-slate-600">Vector set</div>
            <select
              className="select"
              value={vectorKey}
              onChange={(e) => setVectorKey(parseVectorKey(e.target.value))}
            >
              <option value="core_tactics_v1">{rulesetLabel("core_tactics_v1")}</option>
              <option value="core_tactics_shadow_v2">{rulesetLabel("core_tactics_shadow_v2")}</option>
            </select>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-600">Case</div>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} />
                compare v1 vs v2
              </label>
            </div>
            <select className="select" value={caseIndex} onChange={(e) => setCaseIndex(Number(e.target.value))}>
              {cases.map((c, i) => (
                <option key={c.name} value={i}>
                  {i + 1}. {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <div className="font-medium">{vf.schema}</div>
            <div className="mt-1">{vf.notes?.join(" / ")}</div>
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-500">
              Share: <span className="kbd">?vec</span> <span className="kbd">case</span> <span className="kbd">step</span>{" "}
              {compareMode ? <span className="kbd">cmp</span> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button className="btn" onClick={() => copyWithToast("link", window.location.href)}>
                Copy share link
              </button>
              {copied ? <span className="text-xs text-slate-600">copied: {copied}</span> : null}
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
                  <div className="text-xs text-slate-500">step {step}/{stepMax}</div>
                  {compareMode ? (
                    <span
                      className={[
                        "rounded-md border px-2 py-0.5 text-xs",
                        compareDiverged ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600",
                      ].join(" ")}
                    >
                      {compareDiverged ? "diverged" : "same"}
                    </span>
                  ) : null}
                </div>

                <div className="text-xs text-slate-500">
                  <span className="kbd">←</span>/<span className="kbd">→</span>
                </div>
              </div>

              <div className="card-bd grid gap-4">
                {compareMode ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {renderReplay("engine v1", sim.v1)}
                    {renderReplay("engine v2", sim.v2)}
                  </div>
                ) : (
                  renderReplay(rulesetLabel(vectorKey), sim.current)
                )}

                <div className="grid gap-2">
                  <input
                    type="range"
                    min={0}
                    max={stepMax}
                    value={step}
                    onChange={(e) => setStep(Number(e.target.value))}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div>
                      {step === 0 ? (
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5">initial</span>
                      ) : (
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5">
                          after turn {step}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="btn" onClick={() => setStep(0)} disabled={step === 0}>
                        reset
                      </button>
                      <button className="btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                        ←
                      </button>
                      <button
                        className="btn"
                        onClick={() => setStep((s) => Math.min(stepMax, s + 1))}
                        disabled={step === stepMax}
                      >
                        →
                      </button>
                    </div>
                  </div>
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
                    <button
                      className="btn"
                      onClick={() => {
                        void (async () => {
                          try {
                            const link = await buildReplayLink();
                            await copyWithToast("replay link", link);
                          } catch (e: any) {
                            await copyWithToast("error", e?.message ?? String(e));
                          }
                        })();
                      }}
                      title="Replayはオンチェーン属性で再現します（Playgroundのベクタと結果が変わる可能性があります）"
                    >
                      Copy replay link (on-chain)
                    </button>
                  </div>
                </div>

                  <div className="mt-2 text-xs text-slate-500">
                    ※ Replayリンクは Nyano のオンチェーン属性で再現します。Playgroundのベクタ(CardData)とは結果が変わる可能性があります。
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
              <div className="text-xs text-slate-500">“なぜこの結果になったか”を議論しやすくするため、カード情報を並べます。</div>
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
            </div>
          </section>

          <section className="card">
            <div className="card-hd">
              <div className="text-base font-semibold">Transcript（読み物）</div>
              <div className="text-xs text-slate-500">
                対戦は「transcript + cards + ruleset config」から決定論で再現されます。
              </div>
            </div>

            <div className="card-bd grid gap-4 md:grid-cols-2">
              <div className="grid gap-1 text-sm">
                <div className="text-xs text-slate-500">players</div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">A</div>
                  <code className="text-xs">{sim.transcript.header.playerA}</code>
                  <div className="mt-2 text-xs text-slate-500">B</div>
                  <code className="text-xs">{sim.transcript.header.playerB}</code>
                </div>
              </div>

              <div className="grid gap-1 text-sm">
                <div className="text-xs text-slate-500">decks</div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                  <div className="text-slate-500">deckA</div>
                  <div className="font-mono">{sim.transcript.header.deckA.map(String).join(", ")}</div>
                  <div className="mt-2 text-slate-500">deckB</div>
                  <div className="font-mono">{sim.transcript.header.deckB.map(String).join(", ")}</div>
                </div>
              </div>

              <div className="md:col-span-2 grid gap-1 text-sm">
                <div className="text-xs text-slate-500">turns</div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                  <div className="text-slate-500">
                    moves/warningMarks/earthBoostEdges は packed bytes を decode して turn 配列に展開しています。
                  </div>
                  <div className="mt-2 font-mono text-slate-700">
                    turns: {sim.transcript.turns.length} / 9
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="card">
          <div className="card-hd">
            <div className="text-base font-semibold">Error</div>
          </div>
          <div className="card-bd text-sm text-slate-700">{sim.error}</div>
        </section>
      )}
    </div>
  );
}
