import React from "react";
import { Link } from "react-router-dom";

import { CopyField } from "@/components/CopyField";
import { useToast } from "@/components/Toast";
import { EVENTS, getEventStatus, type EventV1 } from "@/lib/events";
import { publishStreamCommand, makeStreamCommandId, publishStreamVoteState, readStoredOverlayState, subscribeOverlayState, type OverlayStateV1 } from "@/lib/streamer_bus";

function origin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function pickDefaultEvent(events: EventV1[]): string {
  const now = Date.now();
  const active = events.find((e) => {
    const st = getEventStatus(e, now);
    return st === "active" || st === "always";
  });
  return (active ?? events[0])?.id ?? "";
}

function ageLabel(updatedAtMs?: number): string {
  if (!updatedAtMs) return "—";
  const delta = Math.max(0, Date.now() - updatedAtMs);
  const s = Math.floor(delta / 1000);
  if (s < 1) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}

function currentPlayer(firstPlayer?: 0 | 1, turn?: number): 0 | 1 | null {
  if (typeof firstPlayer !== "number") return null;
  if (typeof turn !== "number") return null;
  return ((firstPlayer + (turn % 2)) % 2) as 0 | 1;
}

type ParsedMove = {
  cell: number;
  cardIndex: number;
  warningMarkCell?: number | null;
};

function parseChatMove(text: string): ParsedMove | null {
  const t = text.trim();

  // accepted:
  //  - "!move 4 2"
  //  - "!m 4 2"
  //  - "4 2"
  // optional warning mark:
  //  - "!move 4 2 wm=6"
  //  - "4 2 wm 6"
  //  - "4 2 w 6"
  const re = /^(?:!?(?:move|m)\s*)?(?<cell>\d)\s+(?<card>\d)(?:\s+(?:wm|w)\s*=?\s*(?<wm>\d))?$/i;
  const m = t.match(re);
  if (!m || !m.groups) return null;

  const cell = Number(m.groups.cell);
  const cardIndex = Number(m.groups.card);

  if (!Number.isFinite(cell) || cell < 0 || cell > 8) return null;
  if (!Number.isFinite(cardIndex) || cardIndex < 0 || cardIndex > 4) return null;

  const wmRaw = m.groups.wm;
  const wm = typeof wmRaw === "string" && wmRaw.length > 0 ? Number(wmRaw) : null;
  if (wm !== null && (!Number.isFinite(wm) || wm < 0 || wm > 8)) return null;

  return { cell, cardIndex, warningMarkCell: wm };
}

function moveKey(m: ParsedMove): string {
  const wm = typeof m.warningMarkCell === "number" ? ` wm=${m.warningMarkCell}` : "";
  return `cell ${m.cell} · card ${m.cardIndex}${wm}`;
}

export function StreamPage() {
  const toast = useToast();

  const [eventId, setEventId] = React.useState<string>(() => pickDefaultEvent(EVENTS));
  const e = React.useMemo(() => EVENTS.find((x) => x.id === eventId) ?? null, [eventId]);

  // viewer link (safe)
  const matchUrl = e ? `${origin()}/match?event=${encodeURIComponent(e.id)}` : `${origin()}/match`;
  // host link (accepts /stream commands)
  const hostMatchUrl = e ? `${origin()}/match?event=${encodeURIComponent(e.id)}&stream=1&ctrl=A` : `${origin()}/match?stream=1&ctrl=A`;

  const overlayUrl = `${origin()}/overlay?controls=0`;
  const overlayTransparentUrl = `${origin()}/overlay?controls=0&bg=transparent`;
  const replayBroadcastUrl = `${origin()}/replay?broadcast=1`;

  const copy = async (label: string, v: string) => {
    await navigator.clipboard.writeText(v);
    toast.success("Copied", label);
  };

  // live state from Match/Replay via overlay bus
  const [live, setLive] = React.useState<OverlayStateV1 | null>(() => readStoredOverlayState());

  React.useEffect(() => {
    return subscribeOverlayState((s) => setLive(s));
  }, []);

  // Ensure the overlay is not stuck in OPEN state after refresh
  React.useEffect(() => {
    publishStreamVoteState({ version: 1, updatedAtMs: Date.now(), status: "closed" });
  }, []);

  // chat vote console (prototype)
  const [controlledSide, setControlledSide] = React.useState<0 | 1>(0); // A by default
  const [voteSeconds, setVoteSeconds] = React.useState<number>(15);
  const [autoStartEachTurn, setAutoStartEachTurn] = React.useState<boolean>(false);

  const [voteOpen, setVoteOpen] = React.useState<boolean>(false);
  const [voteTurn, setVoteTurn] = React.useState<number | null>(null);
  const [voteEndsAtMs, setVoteEndsAtMs] = React.useState<number | null>(null);

  const [userName, setUserName] = React.useState<string>("viewer");
  const [chatText, setChatText] = React.useState<string>("!move 4 2");

  const [votesByUser, setVotesByUser] = React.useState<Record<string, ParsedMove>>({});

  const liveTurn = typeof live?.turn === "number" ? live.turn : null;
  const liveFirst = typeof live?.firstPlayer === "number" ? (live.firstPlayer as 0 | 1) : null;
  const liveCurrent = currentPlayer(liveFirst ?? undefined, liveTurn ?? undefined);

  const canVoteNow =
    live?.mode === "live" &&
    typeof liveTurn === "number" &&
    typeof liveCurrent === "number" &&
    liveCurrent === controlledSide;

  const resetVotes = React.useCallback(() => {
    setVotesByUser({});
  }, []);

  const startVote = React.useCallback(() => {
    if (!canVoteNow) {
      toast.warn("Vote", "Live match is not ready or it's not the controlled side's turn.");
      return;
    }
    const sec = Math.max(5, Math.min(60, Math.floor(voteSeconds || 15)));
    const now = Date.now();
    setVoteOpen(true);
    setVoteTurn(liveTurn);
    setVoteEndsAtMs(now + sec * 1000);
    resetVotes();
    toast.success("Vote", `Started (${sec}s) for turn ${liveTurn}`);
  }, [canVoteNow, voteSeconds, liveTurn, resetVotes, toast]);

  const pickWinner = React.useCallback((): ParsedMove | null => {
    const entries = Object.values(votesByUser);
    if (entries.length === 0) return null;

    const counts = new Map<string, { move: ParsedMove; count: number }>();
    for (const mv of entries) {
      const k = JSON.stringify(mv);
      const prev = counts.get(k);
      if (prev) prev.count += 1;
      else counts.set(k, { move: mv, count: 1 });
    }

    // pick highest count; break ties by (cell asc, cardIndex asc, warningMarkCell asc/null last)
    const sorted = Array.from(counts.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (a.move.cell !== b.move.cell) return a.move.cell - b.move.cell;
      if (a.move.cardIndex !== b.move.cardIndex) return a.move.cardIndex - b.move.cardIndex;
      const aw = typeof a.move.warningMarkCell === "number" ? a.move.warningMarkCell : 999;
      const bw = typeof b.move.warningMarkCell === "number" ? b.move.warningMarkCell : 999;
      return aw - bw;
    });

    return sorted[0]?.move ?? null;
  }, [votesByUser]);

  const finalizeVote = React.useCallback(() => {
    if (!voteOpen) return;

    const mv = pickWinner();
    if (!mv) {
      toast.warn("Vote", "No votes.");
      setVoteOpen(false);
      setVoteTurn(null);
      setVoteEndsAtMs(null);
      return;
    }

    if (!canVoteNow || liveTurn === null) {
      toast.warn("Vote", "Live match is not ready.");
      setVoteOpen(false);
      setVoteTurn(null);
      setVoteEndsAtMs(null);
      return;
    }

    publishStreamCommand({
      version: 1,
      id: makeStreamCommandId("move"),
      issuedAtMs: Date.now(),
      type: "commit_move_v1",
      by: controlledSide,
      forTurn: liveTurn,
      move: mv,
      source: "stream_vote_console",
    });

    toast.success("Sent", moveKey(mv));
    setVoteOpen(false);
    setVoteTurn(null);
    setVoteEndsAtMs(null);
    resetVotes();
  }, [voteOpen, pickWinner, canVoteNow, liveTurn, controlledSide, resetVotes, toast]);

  // timer tick
  React.useEffect(() => {
    if (!voteOpen || !voteEndsAtMs) return;
    const t = window.setInterval(() => {
      if (Date.now() >= voteEndsAtMs) {
        window.clearInterval(t);
        finalizeVote();
      }
    }, 250);
    return () => window.clearInterval(t);
  }, [voteOpen, voteEndsAtMs, finalizeVote]);

  // auto start on each turn if enabled
  React.useEffect(() => {
    if (!autoStartEachTurn) return;
    if (!canVoteNow) return;
    // if turn changed, restart
    if (typeof liveTurn !== "number") return;
    if (voteOpen && voteTurn === liveTurn) return;
    startVote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartEachTurn, canVoteNow, liveTurn]);

  // keep vote scoped to the correct turn
  React.useEffect(() => {
    if (!voteOpen) return;
    if (voteTurn === null || liveTurn === null) return;
    if (voteTurn !== liveTurn) {
      // turn advanced; close vote silently (next vote may auto-start)
      setVoteOpen(false);
      setVoteTurn(null);
      setVoteEndsAtMs(null);
      resetVotes();
    }
  }, [voteOpen, voteTurn, liveTurn, resetVotes]);

  const addVoteFromChat = React.useCallback(() => {
    const mv = parseChatMove(chatText);
    if (!mv) {
      toast.error("Vote", "Could not parse. Example: !move 4 2 wm=6");
      return;
    }
    const u = userName.trim() || "viewer";
    setVotesByUser((prev) => ({ ...prev, [u]: mv }));
  }, [chatText, userName, toast]);

  const counts = React.useMemo(() => {
    const entries = Object.values(votesByUser);
    const map = new Map<string, { move: ParsedMove; count: number }>();
    for (const mv of entries) {
      const k = JSON.stringify(mv);
      const prev = map.get(k);
      if (prev) prev.count += 1;
      else map.set(k, { move: mv, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [votesByUser]);

  const timeLeft = React.useMemo(() => {
    if (!voteOpen || !voteEndsAtMs) return null;
    return Math.max(0, Math.ceil((voteEndsAtMs - Date.now()) / 1000));
  }, [voteOpen, voteEndsAtMs]);

// Broadcast vote state to the overlay (OBS) so viewers can see countdown + top votes.
React.useEffect(() => {
  const now = Date.now();
  const totalVotes = Object.keys(votesByUser).length;
  const top = counts.slice(0, 3).map((x) => ({ move: x.move, count: x.count }));

  if (!voteOpen) {
    publishStreamVoteState({
      version: 1,
      updatedAtMs: now,
      status: "closed",
      eventId: live?.eventId,
      eventTitle: live?.eventTitle,
      turn: typeof liveTurn === "number" ? liveTurn : undefined,
      controlledSide,
      totalVotes,
      top,
    });
    return;
  }

  publishStreamVoteState({
    version: 1,
    updatedAtMs: now,
    status: "open",
    eventId: live?.eventId,
    eventTitle: live?.eventTitle,
    turn: voteTurn ?? (typeof liveTurn === "number" ? liveTurn : undefined),
    controlledSide,
    endsAtMs: voteEndsAtMs ?? undefined,
    totalVotes,
    top,
    note: canVoteNow ? "Voting…" : "Waiting for the host to be ready…",
  });
}, [voteOpen, voteEndsAtMs, voteTurn, votesByUser, counts, controlledSide, live?.eventId, live?.eventTitle, liveTurn, canVoteNow]);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="text-lg font-semibold">🎥 Nyano Stream Studio</div>
            <div className="text-sm text-slate-600">
              Twitch配信に向けた「導線・見せ方・共有」を整えます。まずは OBS Overlay → その次に Chat voting。
            </div>
          </div>
        </div>

        <div className="card-bd space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold text-slate-800">Step 1 · Feature an Event</div>
              <div className="mt-2 flex flex-col gap-2">
                <label className="text-xs text-slate-600">Event</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={eventId}
                  onChange={(ev) => setEventId(ev.target.value)}
                >
                  {EVENTS.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.title}
                    </option>
                  ))}
                </select>

                {e ? <div className="text-xs text-slate-500 mt-2">{e.description}</div> : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button className="btn btn-sm btn-primary" onClick={() => copy("Challenge link", matchUrl)}>
                    Copy challenge link
                  </button>
                  <a className="btn btn-sm no-underline" href={matchUrl} target="_blank" rel="noreferrer noopener">
                    Open (viewer)
                  </a>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button className="btn btn-sm" onClick={() => copy("Host match (stream)", hostMatchUrl)}>
                    Copy host match (stream)
                  </button>
                  <a className="btn btn-sm no-underline" href={hostMatchUrl} target="_blank" rel="noreferrer noopener">
                    Open (host)
                  </a>
                </div>

                <div className="text-[11px] text-slate-500">
                  Host側は <span className="font-mono">stream=1</span> で投票結果を反映できます。
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold text-slate-800">Step 2 · Add OBS Overlay</div>
              <div className="mt-2 space-y-3">
                <CopyField label="Overlay URL (no controls)" value={overlayUrl} href={overlayUrl} />
                <CopyField label="Overlay URL (transparent)" value={overlayTransparentUrl} href={overlayTransparentUrl} />
                <div className="text-xs text-slate-500">
                  OBSのBrowser Sourceに貼るだけで、<span className="font-mono">/match</span> や <span className="font-mono">/replay</span> の進行が表示されます。
                </div>
              </div>
            </div>
          </div>

          <div className="callout callout-info">
            <div className="text-xs font-semibold">配信の“最短”の回し方（暫定）</div>
            <div className="mt-1 text-sm text-slate-800">
              視聴者には <span className="font-mono">challenge link</span> を配り、勝ったリプレイURLをチャットに貼ってもらいます。
              <br />
              配信側は <Link to="/replay">Replay</Link> で拾って、解説・採点・ランキング化へ。
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
            <div className="text-xs font-semibold text-slate-800">Step 3 · Review replays on stream</div>
            <div className="mt-1 text-sm text-slate-700">
              <span className="font-mono">/replay</span> で共有URLを開き、<span className="font-semibold">Broadcast to overlay</span> をONにすると、
              overlayが step と一緒に追随します（解説がしやすい）。
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button className="btn btn-sm btn-primary" onClick={() => copy("Replay (broadcast)", replayBroadcastUrl)}>
                Copy replay (broadcast)
              </button>
              <a className="btn btn-sm no-underline" href={replayBroadcastUrl} target="_blank" rel="noreferrer noopener">
                Open
              </a>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              ※ OBS側は <span className="font-mono">/overlay</span> を表示しておけばOK
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-800">Step 4 · Nyano vs Chat (prototype)</div>
                <div className="mt-1 text-xs text-slate-600">
                  Twitch連携の前に、まずは <span className="font-mono">/stream</span> で投票集計 → <span className="font-mono">/match</span> に反映する最小ループを作ります。
                </div>
              </div>

              <div className="text-xs text-slate-500">
                live: <span className="font-mono">{live?.mode ?? "—"}</span> · updated: <span className="font-mono">{ageLabel(live?.updatedAtMs)}</span>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-slate-700">Live status (from overlay bus)</div>
                <div className="mt-1 text-xs text-slate-700">
                  Event: <span className="font-mono">{live?.eventId ?? "—"}</span>
                </div>
                <div className="mt-1 text-xs text-slate-700">
                  Turn: <span className="font-mono">{typeof liveTurn === "number" ? liveTurn : "—"}</span> · to play:{" "}
                  <span className="font-mono">{liveCurrent === 0 ? "A" : liveCurrent === 1 ? "B" : "—"}</span>
                </div>
                {live?.lastMove ? (
                  <div className="mt-1 text-xs text-slate-700">
                    Last: <span className="font-mono">{live.lastMove.by === 0 ? "A" : "B"}</span> cell{" "}
                    <span className="font-mono">{live.lastMove.cell}</span> card{" "}
                    <span className="font-mono">{live.lastMove.cardIndex}</span>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-slate-700">Vote control</div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-[11px] text-slate-600">Controlled side</label>
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    value={String(controlledSide)}
                    onChange={(e) => setControlledSide((Number(e.target.value) === 1 ? 1 : 0) as 0 | 1)}
                  >
                    <option value="0">A</option>
                    <option value="1">B</option>
                  </select>

                  <label className="text-[11px] text-slate-600">Vote seconds</label>
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    type="number"
                    min={5}
                    max={60}
                    value={voteSeconds}
                    onChange={(e) => setVoteSeconds(Number(e.target.value))}
                  />

                  <label className="text-[11px] text-slate-600">Auto start each turn</label>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={autoStartEachTurn} onChange={(e) => setAutoStartEachTurn(e.target.checked)} />
                    enable
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button className="btn btn-sm btn-primary" onClick={startVote} disabled={!canVoteNow}>
                    Start vote
                  </button>
                  <button className="btn btn-sm" onClick={finalizeVote} disabled={!voteOpen}>
                    End & send
                  </button>
                  <button className="btn btn-sm" onClick={resetVotes}>
                    Clear votes
                  </button>
                  {voteOpen ? (
                    <span className="badge badge-emerald">OPEN · {timeLeft ?? "?"}s</span>
                  ) : (
                    <span className="badge">CLOSED</span>
                  )}
                </div>

                <div className="mt-2 text-[11px] text-slate-500">
                  ※ <span className="font-mono">/match</span> は <span className="font-mono">stream=1</span>（Host link）で開いてください。
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-slate-700">Simulated chat input</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="viewer"
                  />
                  <input
                    className="col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="!move 4 2 wm=6"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button className="btn btn-sm btn-primary" onClick={addVoteFromChat} disabled={!voteOpen}>
                    Add vote
                  </button>
                  <div className="text-[11px] text-slate-500">example: <span className="font-mono">!move 4 2</span> / <span className="font-mono">4 2 wm=6</span></div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-slate-700">Top votes</div>
                {counts.length === 0 ? (
                  <div className="mt-2 text-xs text-slate-500">No votes yet.</div>
                ) : (
                  <div className="mt-2 space-y-1">
                    {counts.slice(0, 5).map((x, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono">{moveKey(x.move)}</span>
                        <span className="badge badge-sky">{x.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 text-[11px] text-slate-500">
                  tie-break: cell→cardIndex→wm（小さい方が勝ち）
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-500">
              ここで確立した「command bus」は、次の段階で Twitch Bridge（EventSub/IRC）に置き換え可能です。
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <div>
            <div className="text-base font-semibold">Links</div>
            <div className="text-xs text-slate-600">便利リンク</div>
          </div>
        </div>
        <div className="card-bd flex flex-wrap items-center gap-2">
          <Link className="btn no-underline" to="/events">
            Events
          </Link>
          <Link className="btn no-underline" to="/match">
            Match
          </Link>
          <Link className="btn no-underline" to="/replay">
            Replay
          </Link>
          <a className="btn no-underline" href={overlayUrl} target="_blank" rel="noreferrer noopener">
            Overlay
          </a>
        </div>
      </div>
    </div>
  );
}
