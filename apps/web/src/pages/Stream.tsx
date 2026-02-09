import React from "react";
import { Link } from "react-router-dom";

import { StreamOperationsHUD, computeConnectionHealth, type ExternalResult, type OpsLogEntry } from "@/components/StreamOperationsHUD";

import { CopyField } from "@/components/CopyField";
import { NyanoImage } from "@/components/NyanoImage";
import { useToast } from "@/components/Toast";
import { EVENTS, getEventStatus, type EventV1 } from "@/lib/events";
import { readBoolSetting, readNumberSetting, readStringSetting, readStreamLock, writeBoolSetting, writeNumberSetting, writeStreamLock, writeStringSetting } from "@/lib/local_settings";
import { postNyanoWarudoSnapshot } from "@/lib/nyano_warudo_bridge";
import { formatViewerMoveText, parseChatMoveLoose, parseViewerMoveText } from "@/lib/triad_viewer_command";
import {
  cellIndexToCoord,
  computeEmptyCells,
  computeRemainingCardIndices,
  computeStrictAllowed,
  computeToPlay,
  computeWarningMarksUsed,
  computeWarningMarksRemaining,
  fnv1a32Hex,
  toViewerMoveText,
  type ViewerMove,
} from "@/lib/triad_vote_utils";
import { publishOverlayState, publishStreamCommand, makeStreamCommandId, publishStreamVoteState, readStoredOverlayState, subscribeOverlayState, type OverlayStateV1 } from "@/lib/streamer_bus";

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




const VIEWER_CMD_EXAMPLE = formatViewerMoveText({ side: 0, slot: 2, cell: 4, warningMarkCell: 2 });
// => #triad A2->B2 wm=C1

function moveKey(m: ViewerMove): string {
  return toViewerMoveText(m);
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


function downloadTextFile(filename: string, content: string, mime: string) {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    toast.error("Download failed", String(err));
  }
}

function safeFileStem(): string {
  const parts = [
    e?.id ?? "event",
    typeof live?.turn === "number" ? `turn${live.turn}` : null,
    new Date().toISOString().replace(/[:.]/g, "-"),
  ].filter(Boolean);
  return parts.join("_");
}


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
  const [controlledSide, setControlledSide] = React.useState<0 | 1>(() => readNumberSetting("stream.controlledSide", 0, 0, 1) as 0 | 1);
  const [voteSeconds, setVoteSeconds] = React.useState<number>(() => readNumberSetting("stream.voteSeconds", 15, 5, 120));
  const [autoStartEachTurn, setAutoStartEachTurn] = React.useState<boolean>(() => readBoolSetting("stream.autoStartEachTurn", false));

  // ── Settings lock (persisted) ──
  const [settingsLocked, setSettingsLocked] = React.useState<boolean>(() => readStreamLock());
  React.useEffect(() => { writeStreamLock(settingsLocked); }, [settingsLocked]);

  const [voteOpen, setVoteOpen] = React.useState<boolean>(false);
  const [voteTurn, setVoteTurn] = React.useState<number | null>(null);
  const [voteEndsAtMs, setVoteEndsAtMs] = React.useState<number | null>(null);

  const [userName, setUserName] = React.useState<string>(() => readStringSetting("stream.userName", "viewer"));
  const [chatText, setChatText] = React.useState<string>("#triad A2->B2");


// Nyano Warudo bridge (Triad League → nyano-warudo)
const [warudoBaseUrl, setWarudoBaseUrl] = React.useState<string>(() => {
  const env = import.meta.env?.VITE_NYANO_WARUDO_BASE_URL as string | undefined;
  return readStringSetting("nyanoWarudo.baseUrl", env ?? "");
});
const [autoSendStateOnVoteStart, setAutoSendStateOnVoteStart] = React.useState<boolean>(() =>
  readBoolSetting("nyanoWarudo.autoSendStateOnVoteStart", true)
);
const [autoSendPromptOnVoteStart, setAutoSendPromptOnVoteStart] = React.useState<boolean>(() =>
  readBoolSetting("nyanoWarudo.autoSendPromptOnVoteStart", false)
);
const [autoResendStateDuringVoteOpen, setAutoResendStateDuringVoteOpen] = React.useState<boolean>(() =>
  readBoolSetting("nyanoWarudo.autoResendStateDuringVoteOpen", false)
);
const [autoSendStateOnVoteEnd, setAutoSendStateOnVoteEnd] = React.useState<boolean>(() =>
  readBoolSetting("nyanoWarudo.autoSendStateOnVoteEnd", false)
);
const [lastBridgePayload, setLastBridgePayload] = React.useState<string>("");
const [lastBridgeResult, setLastBridgeResult] = React.useState<string>("");
const [lastExternalResult, setLastExternalResult] = React.useState<ExternalResult | null>(null);

// ── Ops log (capped at 20 entries) ──
const MAX_OPS_LOG = 20;
const [opsLog, setOpsLog] = React.useState<OpsLogEntry[]>([]);
const appendOpsLog = React.useCallback((level: OpsLogEntry["level"], source: string, message: string) => {
  setOpsLog((prev) => {
    const next = [...prev, { timestampMs: Date.now(), level, source, message }];
    return next.length > MAX_OPS_LOG ? next.slice(-MAX_OPS_LOG) : next;
  });
}, []);

// ── Connection health (derived) ──
const connectionHealth = React.useMemo(
  () => computeConnectionHealth(live, warudoBaseUrl, lastExternalResult),
  [live, warudoBaseUrl, lastExternalResult],
);

React.useEffect(() => {
  // persist for convenience (stream ops)
  writeStringSetting("nyanoWarudo.baseUrl", warudoBaseUrl);
}, [warudoBaseUrl]);

React.useEffect(() => {
  // persist toggles too (avoid stream ops mistakes after refresh)
  writeBoolSetting("nyanoWarudo.autoSendStateOnVoteStart", autoSendStateOnVoteStart);
  writeBoolSetting("nyanoWarudo.autoSendPromptOnVoteStart", autoSendPromptOnVoteStart);
  writeBoolSetting("nyanoWarudo.autoResendStateDuringVoteOpen", autoResendStateDuringVoteOpen);
  writeBoolSetting("nyanoWarudo.autoSendStateOnVoteEnd", autoSendStateOnVoteEnd);
}, [autoSendStateOnVoteStart, autoSendPromptOnVoteStart, autoResendStateDuringVoteOpen, autoSendStateOnVoteEnd]);

React.useEffect(() => {
  writeNumberSetting("stream.controlledSide", controlledSide);
  writeNumberSetting("stream.voteSeconds", voteSeconds);
  writeBoolSetting("stream.autoStartEachTurn", autoStartEachTurn);
  writeStringSetting("stream.userName", userName);
}, [controlledSide, voteSeconds, autoStartEachTurn, userName]);

function bestEffortBoardToProtocolBoard(state: OverlayStateV1 | null): Array<any | null> {
  // For nyano-warudo display/aggregation: keep it simple.
  const out: Array<any | null> = Array.from({ length: 9 }, () => null);
  if (!state || !Array.isArray(state.board)) return out;

  const deckA = Array.isArray(state.deckA) ? state.deckA.map(String) : [];
  const deckB = Array.isArray(state.deckB) ? state.deckB.map(String) : [];

  const b = state.board;
  for (let i = 0; i < 9; i++) {
    const cell = b[i];
    if (!cell) continue;
    const ownerRaw = cell.owner;
    const owner: "A" | "B" | null = ownerRaw === 0 ? "A" : ownerRaw === 1 ? "B" : null;
    if (!owner) continue;

    const tokenId = cell.card?.tokenId != null ? String(cell.card.tokenId) : null;
    const deck = owner === "A" ? deckA : deckB;
    const slot = tokenId ? deck.findIndex((x) => x === tokenId) : -1;

    out[i] = {
      owner,
      cardSlot: slot >= 0 ? slot : undefined,
      tokenId: tokenId ?? undefined,
    };
  }
  return out;
}

function buildStateJsonContent(state: OverlayStateV1 | null, controlled: 0 | 1): any {
  const now = Date.now();
  const turn = typeof state?.turn === "number" ? Number(state!.turn) : null;
  const toPlay = computeToPlay(state);

  const strict = computeStrictAllowed(state);
  const emptyCells = computeEmptyCells(state);

  const legalMoves: any[] = [];
  if (strict) {
    for (const txt of strict.allowlist) {
      const parsed = parseViewerMoveText(txt);
      if (parsed) {
        legalMoves.push({ cell: parsed.cell, cardIndex: parsed.cardIndex, viewer: txt });
      }
    }
  } else {
    // Fallback: compute manually
    const remainToPlay = toPlay !== null ? computeRemainingCardIndices(state, toPlay) : [];
    for (const cell of emptyCells) {
      for (const cardIndex of remainToPlay) {
        legalMoves.push({ cell, cardIndex, viewer: toViewerMoveText({ cell, cardIndex }) });
      }
    }
  }

  const usedA = computeRemainingCardIndices(state, 0);
  const usedB = computeRemainingCardIndices(state, 1);
  const remainA = new Set(usedA);
  const remainB = new Set(usedB);

  return {
    protocol: "triad_league_state_json_v1",
    sentAtMs: now,
    eventId: state?.eventId ?? null,
    eventTitle: state?.eventTitle ?? null,
    mode: state?.mode ?? null,
    status: state?.status ?? null,
    turn,
    toPlay: toPlay === 0 ? "A" : toPlay === 1 ? "B" : null,
    controlledSide: controlled === 0 ? "A" : "B",
    viewerCommandFormat: VIEWER_CMD_EXAMPLE,

    // Protocol snapshot (best-effort)
    protocolV1: state?.protocolV1 ?? null,

    // Board in a minimal & stable shape
    board: bestEffortBoardToProtocolBoard(state),

    // Hand slots (tokenIds only, stable)
    hands: {
      A: Array.isArray(state?.deckA)
        ? state!.deckA.map((t, i) => ({ slot: i, tokenId: String(t), used: !remainA.has(i) }))
        : [],
      B: Array.isArray(state?.deckB)
        ? state!.deckB.map((t, i) => ({ slot: i, tokenId: String(t), used: !remainB.has(i) }))
        : [],
    },

    // Turn-local legal action space
    legalMoves,
    strictAllowed: strict ? {
      allowlist: strict.allowlist,
      hash: strict.hash,
    } : {
      allowlist: legalMoves.map((m) => String(m.viewer)).sort(),
      hash: fnv1a32Hex(legalMoves.map((m) => String(m.viewer)).sort().join("\n")),
    },
    warningMark: strict ? {
      used: strict.warningMark.used,
      remaining: strict.warningMark.remaining,
      candidates: strict.warningMark.candidates,
    } : {
      used: toPlay !== null ? computeWarningMarksUsed(state, toPlay) : 0,
      remaining: toPlay !== null ? computeWarningMarksRemaining(state, toPlay) : 0,
      candidates: [],
    },
  };
}

function buildAiPrompt(state: OverlayStateV1 | null, controlled: 0 | 1): string {
  const turn = typeof state?.turn === "number" ? Number(state!.turn) : null;
  const toPlay = computeToPlay(state);

  const _strict = computeStrictAllowed(state);
  const emptyCells = computeEmptyCells(state);
  const remain = toPlay !== null ? computeRemainingCardIndices(state, toPlay) : [];
  const wUsed = toPlay !== null ? computeWarningMarksUsed(state, toPlay) : 0;
  const wRemain = toPlay !== null ? computeWarningMarksRemaining(state, toPlay) : 0;

  const boardMini = bestEffortBoardToProtocolBoard(state);

  const lines: string[] = [];
  lines.push("Nyano Triad League snapshot (ai_prompt)");
  lines.push(`event: ${state?.eventTitle ?? state?.eventId ?? "—"}`);
  lines.push(`mode: ${state?.mode ?? "—"}  turn: ${turn ?? "—"}/9`);
  lines.push(`to_play: ${toPlay === 0 ? "A" : toPlay === 1 ? "B" : "—"}  controlled: ${controlled === 0 ? "A" : "B"}`);
  lines.push("");
  lines.push("Objective:");
  lines.push("- Choose ONE strong move for the side to_play. Return ONLY the viewer command.");
  lines.push("");
  lines.push("Viewer command format:");
  lines.push("- #triad A<slot>-><cell> wm=<cell> (wm optional)");
  lines.push(`  examples: ${VIEWER_CMD_EXAMPLE}   /   ${formatViewerMoveText({ side: 0, slot: 3, cell: 8, warningMarkCell: 0 })}`);
  lines.push("");
  lines.push("Board (A1..C3): each cell = owner+slot (tokenId if known)");
  // render grid
  const cellLabel = (i: number): string => {
    const c = boardMini[i];
    if (!c) return "--";
    const owner = c.owner ?? "?";
    const slot = typeof c.cardSlot === "number" ? `A${c.cardSlot + 1}` : "A?";
    return `${owner}${slot}`;
  };
  lines.push(`A1 ${cellLabel(0)} | B1 ${cellLabel(1)} | C1 ${cellLabel(2)}`);
  lines.push(`A2 ${cellLabel(3)} | B2 ${cellLabel(4)} | C2 ${cellLabel(5)}`);
  lines.push(`A3 ${cellLabel(6)} | B3 ${cellLabel(7)} | C3 ${cellLabel(8)}`);
  lines.push("");
  lines.push(`Empty cells: ${emptyCells.map(cellIndexToCoord).join(", ")}`);
  lines.push(`Remaining hand slots for to_play: ${remain.map((i) => `A${i + 1}`).join(", ") || "—"}`);
  lines.push(`WarningMark: remaining=${wRemain} (used=${wUsed}) candidates=${wRemain > 0 ? emptyCells.map(cellIndexToCoord).join(", ") : "—"}`);
  lines.push("");
  lines.push("Legal moves (cell+slot):");
  // Print up to 30 moves to keep prompt readable
  const max = 30;
  let printed = 0;
  for (const cell of emptyCells) {
    for (const cardIndex of remain) {
      if (printed >= max) break;
      lines.push(`- ${formatViewerMoveText({ side: 0, slot: cardIndex + 1, cell })}`);
      printed += 1;
    }
    if (printed >= max) break;
  }
  if (emptyCells.length * remain.length > max) lines.push(`... (${emptyCells.length * remain.length} total)`);
  lines.push("");
  lines.push("Return format: ONLY one line, e.g. '#triad A2->B2' or '#triad A2->B2 wm=C1'");

  return lines.join("\n");
}

const sendNyanoWarudo = React.useCallback(
  async (kind: "ai_prompt" | "state_json", opts?: { silent?: boolean }) => {
    const state = live;
    if (!state) {
      const msg = "No live state yet (open /match or /replay with broadcast=1).";
      setLastBridgeResult(msg);
      if (!opts?.silent) toast.warn("Nyano Warudo", msg);
      return;
    }

    const content =
      kind === "ai_prompt"
        ? buildAiPrompt(state, controlledSide)
        : JSON.stringify(buildStateJsonContent(state, controlledSide), null, 2);

    setLastBridgePayload(content);

    const res = await postNyanoWarudoSnapshot(warudoBaseUrl, {
      source: "triad_league",
      kind,
      content,
    });

    const summary = `ok=${res.ok} status=${res.status} ${res.text ? `\n${res.text}` : ""}`;
    setLastBridgeResult(summary);
    setLastExternalResult({
      kind: "warudo",
      ok: res.ok,
      message: res.ok ? `${kind} sent` : `${kind} failed (${res.status})`,
      timestampMs: Date.now(),
    });
    // Propagate warudo errors to overlay state so /overlay can display them
    if (!res.ok) {
      const current = readStoredOverlayState();
      if (current) {
        publishOverlayState({
          ...current,
          externalStatus: {
            lastOk: false,
            lastMessage: `Warudo ${kind} failed (${res.status})`,
            lastTimestampMs: Date.now(),
          },
        });
      }
    }
    appendOpsLog(res.ok ? "info" : "error", "warudo", res.ok ? `Sent ${kind}` : `Failed ${kind} (${res.status})`);
    if (!opts?.silent) {
      if (res.ok) toast.success("Nyano Warudo", `Sent ${kind}`);
      else toast.error("Nyano Warudo", `Failed to send ${kind}`);
    }
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps -- buildAiPrompt/buildStateJsonContent are stable module-level fns
  [live, controlledSide, warudoBaseUrl, toast, appendOpsLog]
);


const downloadStateJson = React.useCallback(() => {
  const state = live;
  if (!state) {
    toast.warn("Download", "No live state yet.");
    return;
  }
  const contentObj = buildStateJsonContent(state, controlledSide);
  const content = JSON.stringify(contentObj, null, 2);
  setLastBridgePayload(content);
  downloadTextFile(`triad_state_json_${safeFileStem()}.json`, content, "application/json");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- downloadTextFile/safeFileStem/buildStateJsonContent are stable inner/module fns
}, [live, controlledSide, toast]);

const downloadTranscript = React.useCallback(() => {
  const state = live;
  if (!state) {
    toast.warn("Download", "No live state yet.");
    return;
  }
  const protocolV1 = state?.protocolV1 ?? null;
  const content = JSON.stringify(
    {
      protocol: "triad_league_transcript_v1",
      exportedAtMs: Date.now(),
      eventId: state.eventId ?? null,
      eventTitle: state.eventTitle ?? null,
      result: state?.status ?? null,
      protocolV1,
    },
    null,
    2
  );
  setLastBridgePayload(content);
  downloadTextFile(`triad_transcript_${safeFileStem()}.json`, content, "application/json");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- downloadTextFile/safeFileStem are stable inner fns
}, [live, toast]);

const downloadAiPrompt = React.useCallback(() => {
  const state = live;
  if (!state) {
    toast.warn("Download", "No live state yet.");
    return;
  }
  const content = buildAiPrompt(state, controlledSide);
  setLastBridgePayload(content);
  downloadTextFile(`triad_ai_prompt_${safeFileStem()}.txt`, content, "text/plain");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- downloadTextFile/safeFileStem/buildAiPrompt are stable inner/module fns
}, [live, controlledSide, toast]);


  // Quick move picker (error prevention + faster stream ops)
  const [pickCell, setPickCell] = React.useState<number | null>(null);
  const [pickCardIndex, setPickCardIndex] = React.useState<number | null>(null);
  const [pickWarningMarkCell, setPickWarningMarkCell] = React.useState<number | null>(null);

  const [votesByUser, setVotesByUser] = React.useState<Record<string, ViewerMove>>({});

  const liveTurn = typeof live?.turn === "number" ? live.turn : null;
  const liveCurrent = computeToPlay(live);

const canVoteNow =
  live?.mode === "live" &&
  typeof liveTurn === "number" &&
  typeof liveCurrent === "number" &&
  liveCurrent === controlledSide;

// Best-effort "legal move" hints from the host (/match) via overlay bus.
const _remainingCellsLive = React.useMemo(() => computeEmptyCells(live), [live]);

const _remainingCardsLive = React.useMemo(() => computeRemainingCardIndices(live, controlledSide), [live, controlledSide]);

const _remainingWarningMarks = React.useMemo(() => computeWarningMarksRemaining(live, controlledSide), [live, controlledSide]);

  // ── Vote audit trail ──
  const [voteAudit, setVoteAudit] = React.useState<{
    attempts: number; accepted: number; duplicates: number; rateLimited: number;
  }>({ attempts: 0, accepted: 0, duplicates: 0, rateLimited: 0 });
  const rateLimitMapRef = React.useRef<Map<string, number>>(new Map());
  const RATE_LIMIT_MS = 2000;

  const resetVotes = React.useCallback(() => {
    setVotesByUser({});
    setVoteAudit({ attempts: 0, accepted: 0, duplicates: 0, rateLimited: 0 });
    rateLimitMapRef.current.clear();
  }, []);

  const startVote = React.useCallback(() => {
    if (!canVoteNow) {
      toast.warn("Vote", "Live match is not ready or it's not the controlled side's turn.");
      return;
    }
    const sec = Math.max(5, Math.min(60, Math.floor(voteSeconds || 15)));
    const now = Date.now();
    setVoteOpen(true);

    // best-effort (do not block stream ops)
    // IMPORTANT: Send state_json at vote start so nyano-warudo strictAllowed can lock an up-to-date allowlist during the vote.
    if (autoSendStateOnVoteStart) {
      sendNyanoWarudo("state_json", { silent: true }).catch(() => {});
    }
    if (autoSendPromptOnVoteStart) {
      sendNyanoWarudo("ai_prompt", { silent: true }).catch(() => {});
    }
    setVoteTurn(liveTurn);
    setVoteEndsAtMs(now + sec * 1000);
    resetVotes();
    toast.success("Vote", `Started (${sec}s) for turn ${liveTurn}`);
    appendOpsLog("info", "vote", `Started (${sec}s) turn ${liveTurn}`);
  }, [canVoteNow, voteSeconds, liveTurn, resetVotes, toast, autoSendStateOnVoteStart, autoSendPromptOnVoteStart, sendNyanoWarudo, appendOpsLog]);

  const pickWinner = React.useCallback((): ViewerMove | null => {
    const entries = Object.values(votesByUser);
    if (entries.length === 0) return null;

    const counts = new Map<string, { move: ViewerMove; count: number }>();
    for (const mv of entries) {
      const k = toViewerMoveText(mv);
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


if (autoSendStateOnVoteEnd) {
  sendNyanoWarudo("state_json", { silent: true }).catch(() => {});
}

    toast.success("Sent", moveKey(mv));
    appendOpsLog("info", "vote", `Finalized: ${moveKey(mv)}`);
    setVoteOpen(false);
    setVoteTurn(null);
    setVoteEndsAtMs(null);
    resetVotes();
  }, [voteOpen, pickWinner, canVoteNow, liveTurn, controlledSide, resetVotes, toast, autoSendStateOnVoteEnd, sendNyanoWarudo, appendOpsLog]);

// keep nyano-warudo strictAllowed allowlist fresh during an open vote (optional)
const resendTimerRef = React.useRef<number | null>(null);
const lastResendSigRef = React.useRef<string>("");

React.useEffect(() => {
  if (!autoResendStateDuringVoteOpen) return;
  if (!voteOpen) return;
  if (!live) return;

  // Signature of "things that affect legal moves" (keep tiny to avoid noise)
  const sigObj = {
    updatedAtMs: live.updatedAtMs ?? null,
    turn: typeof live.turn === "number" ? live.turn : null,
    firstPlayer: typeof live.firstPlayer === "number" ? live.firstPlayer : null,
    usedCells: Array.isArray(live.usedCells) ? live.usedCells : null,
    usedA: Array.isArray(live.usedCardIndicesA) ? live.usedCardIndicesA : null,
    usedB: Array.isArray(live.usedCardIndicesB) ? live.usedCardIndicesB : null,
    wA: typeof live.warningMarksUsedA === "number" ? live.warningMarksUsedA : null,
    wB: typeof live.warningMarksUsedB === "number" ? live.warningMarksUsedB : null,
  };
  const sig = JSON.stringify(sigObj);
  if (sig === lastResendSigRef.current) return;
  lastResendSigRef.current = sig;

  if (resendTimerRef.current) window.clearTimeout(resendTimerRef.current);
  resendTimerRef.current = window.setTimeout(() => {
    sendNyanoWarudo("state_json", { silent: true }).catch(() => {});
  }, 250);

  return () => {
    if (resendTimerRef.current) window.clearTimeout(resendTimerRef.current);
    resendTimerRef.current = null;
  };
// eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: updatedAtMs triggers resend; live is accessed via sendNyanoWarudo closure
}, [autoResendStateDuringVoteOpen, voteOpen, live?.updatedAtMs, controlledSide, sendNyanoWarudo]);

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
    const parsed = parseChatMoveLoose(chatText, controlledSide);
    if (!parsed) {
      toast.error("Vote", "Could not parse. Example: #triad A2->B2 or !move 4 2");
      return;
    }
    const mv: ViewerMove = { cell: parsed.cell, cardIndex: parsed.cardIndex, warningMarkCell: parsed.warningMarkCell };
    const u = userName.trim() || "viewer";
    const now = Date.now();

    // Rate limit: same user within RATE_LIMIT_MS
    const lastVoteAt = rateLimitMapRef.current.get(u);
    if (lastVoteAt && now - lastVoteAt < RATE_LIMIT_MS) {
      setVoteAudit((prev) => ({ ...prev, attempts: prev.attempts + 1, rateLimited: prev.rateLimited + 1 }));
      toast.warn("Vote", `Rate limited: ${u} (wait ${Math.ceil((RATE_LIMIT_MS - (now - lastVoteAt)) / 1000)}s)`);
      return;
    }

    // Duplicate check (same user, overwrite is allowed but track it)
    setVotesByUser((prev) => {
      const isDuplicate = u in prev;
      setVoteAudit((a) => ({
        attempts: a.attempts + 1,
        accepted: a.accepted + 1,
        duplicates: isDuplicate ? a.duplicates + 1 : a.duplicates,
        rateLimited: a.rateLimited,
      }));
      return { ...prev, [u]: mv };
    });
    rateLimitMapRef.current.set(u, now);
  }, [chatText, userName, controlledSide, toast, RATE_LIMIT_MS]);

  const counts = React.useMemo(() => {
    const entries = Object.values(votesByUser);
    const map = new Map<string, { move: ViewerMove; count: number }>();
    for (const mv of entries) {
      const k = toViewerMoveText(mv);
      const prev = map.get(k);
      if (prev) prev.count += 1;
      else map.set(k, { move: mv, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (a.move.cell !== b.move.cell) return a.move.cell - b.move.cell;
      if (a.move.cardIndex !== b.move.cardIndex) return a.move.cardIndex - b.move.cardIndex;
      const aw = typeof a.move.warningMarkCell === "number" ? a.move.warningMarkCell : 999;
      const bw = typeof b.move.warningMarkCell === "number" ? b.move.warningMarkCell : 999;
      return aw - bw;
    });
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


function buildMoveText(cell: number, cardIndex: number, wm: number | null, side: 0 | 1 = 0): string {
  return formatViewerMoveText({ side, slot: cardIndex + 1, cell, warningMarkCell: wm ?? undefined });
}

const _applyPickerToChatText = React.useCallback(() => {
  if (pickCell === null || pickCardIndex === null) {
    toast.warn("Picker", "Select a cell and a card first.");
    return;
  }
  const wm = pickWarningMarkCell;
  const txt = buildMoveText(pickCell, pickCardIndex, wm, controlledSide);
  setChatText(txt);
  toast.success("Picker", "Filled chat command");
}, [pickCell, pickCardIndex, pickWarningMarkCell, controlledSide, toast]);

const _addVoteFromPicker = React.useCallback(() => {
  if (!voteOpen) {
    toast.warn("Vote", "Start vote first.");
    return;
  }
  if (pickCell === null || pickCardIndex === null) {
    toast.warn("Vote", "Select a cell and a card first.");
    return;
  }
  const u = userName.trim() || "viewer";
  setVotesByUser((prev) => ({
    ...prev,
    [u]: { cell: pickCell, cardIndex: pickCardIndex, warningMarkCell: pickWarningMarkCell },
  }));
  toast.success("Vote", "Added vote from picker");
}, [voteOpen, pickCell, pickCardIndex, pickWarningMarkCell, userName, toast]);

const _clearPicker = React.useCallback(() => {
  setPickCell(null);
  setPickCardIndex(null);
  setPickWarningMarkCell(null);
}, []);

return (
    <div className="space-y-6">
      <StreamOperationsHUD
        live={live}
        controlledSide={controlledSide}
        voteOpen={voteOpen}
        voteEndsAtMs={voteEndsAtMs}
        totalVotes={Object.keys(votesByUser).length}
        voteTurn={voteTurn}
        lastExternalResult={lastExternalResult}
        connectionHealth={connectionHealth}
        opsLog={opsLog}
        settingsLocked={settingsLocked}
      />
      <div className="flex justify-end">
        <button
          className={settingsLocked ? "btn btn-sm btn-error" : "btn btn-sm btn-primary"}
          onClick={() => setSettingsLocked((v) => !v)}
        >
          {settingsLocked ? "🔒 設定ロック中 (解除)" : "🔓 設定をロック"}
        </button>
      </div>
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="flex items-center gap-3">
              <NyanoImage size={56} className="shrink-0" alt="Nyano" />
              <div className="text-lg font-semibold">🎥 Nyano Stream Studio</div>
            </div>
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
                  disabled={settingsLocked}
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

                <div className="mt-2 grid gap-2">
                  <label className="text-[11px] text-slate-600">Controlled side</label>

                  <select
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    value={String(controlledSide)}
                    onChange={(e) => setControlledSide((Number(e.target.value) === 1 ? 1 : 0) as 0 | 1)}
                    disabled={settingsLocked}
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
                    disabled={settingsLocked}
                  />

                  <label className="text-[11px] text-slate-600">Auto start each turn</label>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={autoStartEachTurn} onChange={(e) => setAutoStartEachTurn(e.target.checked)} disabled={settingsLocked} />
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

            {/* RM06-020: Viewer command help callout */}
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-emerald-800">Viewer Command Guide</div>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    const side = controlledSide === 0 ? "A" : "B";
                    const instructions = [
                      `【Nyano Triad League 投票コマンド】`,
                      ``,
                      `フォーマット: #triad ${side}<スロット>-><セル>`,
                      `例: #triad ${side}2->B2`,
                      ``,
                      `Warning Mark付き: #triad ${side}2->B2 wm=C1`,
                      ``,
                      `スロット: ${side}1~${side}5 (手持ちカード番号)`,
                      `セル: A1 B1 C1 / A2 B2 C2 / A3 B3 C3`,
                      ``,
                      `投票は制限時間内に1人1票。最多票の手が採用されます！`,
                    ].join("\n");
                    navigator.clipboard.writeText(instructions);
                    toast.success("Copied", "Viewer instructions copied to clipboard");
                  }}
                >
                  Copy Viewer Instructions
                </button>
              </div>
              <div className="mt-2 grid gap-1.5 text-xs text-emerald-700">
                <div>
                  <span className="font-mono font-semibold">#triad {controlledSide === 0 ? "A" : "B"}2-&gt;B2</span>{" "}
                  — Card slot 2 to cell B2
                </div>
                <div>
                  <span className="font-mono font-semibold">#triad {controlledSide === 0 ? "A" : "B"}3-&gt;C1 wm=A1</span>{" "}
                  — Card slot 3 to cell C1, warning mark on A1
                </div>
              </div>
              <div className="mt-2 text-[11px] text-emerald-600">
                <span className="font-semibold">Common mistakes:</span>{" "}
                Wrong side letter (use {controlledSide === 0 ? "A" : "B"}) · Slot out of range (1-5) · Cell already occupied · Missing <span className="font-mono">#triad</span> prefix
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
                    placeholder="#triad A2->B2 wm=C3"
                  />
                </div>
                {/* RM06-020: Real-time validation feedback */}
                {chatText.trim().length > 0 && (() => {
                  const parsed = parseChatMoveLoose(chatText, controlledSide);
                  if (parsed) {
                    const moveText = toViewerMoveText({ cell: parsed.cell, cardIndex: parsed.cardIndex, warningMarkCell: parsed.warningMarkCell });
                    return (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">&#x2713;</span>
                        <span>Valid: <span className="font-mono font-semibold">{moveText}</span> (cell {cellIndexToCoord(parsed.cell)}, slot {parsed.cardIndex + 1}{typeof parsed.warningMarkCell === "number" ? `, wm=${cellIndexToCoord(parsed.warningMarkCell)}` : ""})</span>
                      </div>
                    );
                  }
                  return (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-500">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">&#x2717;</span>
                      <span>Invalid command. Use format: <span className="font-mono">#triad {controlledSide === 0 ? "A" : "B"}2-&gt;B2</span></span>
                    </div>
                  );
                })()}

                <div className="mt-2 flex items-center gap-2">
                  <button className="btn btn-sm btn-primary" onClick={addVoteFromChat} disabled={!voteOpen}>
                    Add vote
                  </button>
                  <div className="text-[11px] text-slate-500">example: <span className="font-mono">{"#triad A2->B2"}</span> / <span className="font-mono">{"#triad A3->C1 wm=A1"}</span></div>
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
                {voteAudit.attempts > 0 && (
                  <div className="mt-1 text-[10px] text-slate-400">
                    {voteAudit.attempts} attempts · {voteAudit.accepted} accepted · {voteAudit.duplicates} dup · {voteAudit.rateLimited} rate-limited
                  </div>
                )}
              </div>
            </div>


<div className="mt-3 grid gap-3 md:grid-cols-2">
  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
    <div className="flex items-center justify-between gap-2">
      <div className="text-[11px] font-semibold text-slate-700">Nyano Warudo Bridge</div>
      <div className="text-[11px] text-slate-500 font-mono">POST /v1/snapshots</div>
    </div>
    <div className="mt-2 space-y-2">
      <label className="text-[11px] text-slate-600">nyano-warudo Base URL</label>
      <input
        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
        value={warudoBaseUrl}
        onChange={(e) => setWarudoBaseUrl(e.target.value)}
        placeholder="http://localhost:8787"
        disabled={settingsLocked}
      />
      <div className="text-[11px] text-slate-500">
        ※ CORSで失敗する場合は nyano-warudo 側で localhost を許可してください。
      </div>

      <div className="mt-2 grid gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={autoSendStateOnVoteStart}
            onChange={(e) => setAutoSendStateOnVoteStart(e.target.checked)}
            disabled={settingsLocked}
          />
          vote start → state_json (strictAllowed lock)
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={autoSendPromptOnVoteStart}
            onChange={(e) => setAutoSendPromptOnVoteStart(e.target.checked)}
            disabled={settingsLocked}
          />
          vote start → ai_prompt (optional)
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={autoResendStateDuringVoteOpen}
            onChange={(e) => setAutoResendStateDuringVoteOpen(e.target.checked)}
            disabled={settingsLocked}
          />
          vote open → refresh state_json on state updates
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={autoSendStateOnVoteEnd}
            onChange={(e) => setAutoSendStateOnVoteEnd(e.target.checked)}
            disabled={settingsLocked}
          />
          vote end → state_json
        </label>
      </div>

      <div className="mt-1 text-[11px] text-slate-500">
        ※ state_json は投票開始の瞬間に送ると、strictAllowed（合法手 allowlist）が投票中にズレにくくなります。
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button className="btn btn-sm btn-primary" onClick={() => sendNyanoWarudo("ai_prompt")}>
          Send ai_prompt
        </button>
        <button className="btn btn-sm" onClick={() => sendNyanoWarudo("state_json")}>
          Send state_json
        </button>
      </div>

<div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
  <div className="text-[11px] font-semibold text-slate-700">Samples (share to nyano-warudo)</div>
  <div className="mt-1 text-[11px] text-slate-500">
    “実戦の1ゲーム分サンプル” を渡す用途。payload は右の欄にも残ります。
  </div>
  <div className="mt-2 flex flex-wrap items-center gap-2">
    <button className="btn btn-sm" onClick={downloadStateJson}>
      Download state_json
    </button>
    <button className="btn btn-sm" onClick={downloadTranscript}>
      Download transcript
    </button>
    <button className="btn btn-sm" onClick={downloadAiPrompt}>
      Download ai_prompt
    </button>
  </div>
</div>

      <div className="mt-2 text-[11px] text-slate-500">
        viewer cmd format: <span className="font-mono">#triad A2-&gt;B2 wm=C1</span>
      </div>
    </div>
  </div>

  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
    <div className="text-[11px] font-semibold text-slate-700">Last payload / result</div>
    <div className="mt-2 space-y-2">
      <CopyField label="payload (content)" value={lastBridgePayload || "—"} />
      <CopyField label="result" value={lastBridgeResult || "—"} />
    </div>
  </div>
</div>

            <div className="mt-3 text-[11px] text-slate-500">
              ここで確立した「command bus」は、次の段階で Twitch Bridge（EventSub/IRC）に置き換え可能です。
            </div>
          </div>
        </div>
      </div>

      {/* ── Recovery Procedures (Phase 1 — operator guide) ── */}
      <details className="card rounded-2xl border border-amber-200 bg-amber-50/50 px-4 py-3">
        <summary className="text-xs font-semibold text-amber-800 cursor-pointer">
          Recovery Procedures (トラブルシューティング)
        </summary>
        <div className="mt-2 grid gap-3 text-xs text-amber-900">
          <div>
            <div className="font-semibold">Overlay shows &quot;Data stale&quot;</div>
            <ol className="list-decimal pl-4 mt-1 space-y-0.5">
              <li>Check Match tab is still open and connected</li>
              <li>Refresh Match tab (state auto-recovers from localStorage)</li>
              <li>If RPC errors persist, check blockchain RPC endpoint</li>
            </ol>
          </div>
          <div>
            <div className="font-semibold">Vote not appearing in overlay</div>
            <ol className="list-decimal pl-4 mt-1 space-y-0.5">
              <li>Verify Stream tab and Overlay tab are on the same origin</li>
              <li>Check browser console for BroadcastChannel errors</li>
              <li>Refresh both tabs (vote state resets)</li>
            </ol>
          </div>
          <div>
            <div className="font-semibold">Warudo bridge not responding</div>
            <ol className="list-decimal pl-4 mt-1 space-y-0.5">
              <li>Check base URL is correct (no trailing slash)</li>
              <li>Click &quot;Send state&quot; manually to test connectivity</li>
              <li>Check nyano-warudo server logs for CORS or timeout errors</li>
            </ol>
          </div>
          <div>
            <div className="font-semibold">Full reset procedure</div>
            <ol className="list-decimal pl-4 mt-1 space-y-0.5">
              <li>Close all Nyano tabs</li>
              <li>Open Match tab → load decks → start new match</li>
              <li>Open Overlay tab → verify board appears</li>
              <li>Open Stream tab → configure side + vote timer → test vote</li>
            </ol>
          </div>
        </div>
      </details>

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
