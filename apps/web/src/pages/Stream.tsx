import React from "react";
import { Link, useSearchParams } from "react-router-dom";

import { StreamOperationsHUD, computeConnectionHealth, type ExternalResult, type OpsLogEntry } from "@/components/StreamOperationsHUD";

import { NyanoImage } from "@/components/NyanoImage";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintPageGuide } from "@/components/mint/MintPageGuide";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintIcon, type MintIconName } from "@/components/mint/icons/MintIcon";
import { useToast } from "@/components/Toast";
import { EVENTS, fetchEventConfig, getEventStatus, type EventV1 } from "@/lib/events";
import { executeRecovery, recoveryActionLabel } from "@/lib/stream_recovery";
import { buildStreamUrls } from "@/lib/stream_urls";
import { appPath } from "@/lib/appUrl";
import { WarudoBridgePanel } from "@/components/stream/WarudoBridgePanel";
import { VoteControlPanel } from "@/components/stream/VoteControlPanel";
import { StreamSharePanel } from "@/components/stream/StreamSharePanel";
import {
  readBoolSetting,
  readNumberSetting,
  readStringSetting,
  readStreamLock,
  readStreamLockTimestamp,
  readAntiSpamRateLimitMs,
  readAntiSpamMaxVoteChanges,
  readStreamSlowModeSeconds,
  readStreamBannedUsersText,
  readStreamBlockedWordsText,
  writeBoolSetting,
  writeNumberSetting,
  writeStreamLock,
  writeStreamLockTimestamp,
  writeAntiSpamRateLimitMs,
  writeAntiSpamMaxVoteChanges,
  writeStreamSlowModeSeconds,
  writeStreamBannedUsersText,
  writeStreamBlockedWordsText,
  writeStringSetting,
} from "@/lib/local_settings";
import { validateUsername, checkRateLimit, checkVoteChangeLimit, DEFAULT_ANTI_SPAM_CONFIG, type AntiSpamConfig } from "@/lib/anti_spam";
import {
  buildStreamModerationConfig,
  checkSlowMode,
  findBlockedWord,
  isUserBanned,
  parseModerationListText,
  recordSlowModeAcceptedVote,
} from "@/lib/stream_moderation";
import { postNyanoWarudoSnapshot } from "@/lib/nyano_warudo_bridge";
import { errorMessage } from "@/lib/errorMessage";
import { writeClipboardText } from "@/lib/clipboard";
import { formatViewerMoveText, parseChatMoveLoose, parseViewerMoveText } from "@/lib/triad_viewer_command";
import { resolveClassicMetadataFromOverlayState, type ClassicResolvedMetadata } from "@/lib/classic_ruleset_visibility";
import {
  cellIndexToCoord,
  computeEmptyCells,
  computeRemainingCardIndices,
  computeStrictAllowed,
  computeToPlay,
  computeWarningMarksUsed,
  computeWarningMarksRemaining,
  toViewerMoveText,
  type ViewerMove,
} from "@/lib/triad_vote_utils";
import { publishOverlayState, publishStreamCommand, makeStreamCommandId, publishStreamVoteState, readStoredOverlayState, subscribeOverlayState, type OverlayStateV1 } from "@/lib/streamer_bus";
import { MINT_PAGE_GUIDES } from "@/lib/mint_page_guides";
import { appendThemeToPath, resolveAppTheme } from "@/lib/theme";

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
  if (s < 1) return "たった今";
  if (s < 60) return `${s}秒前`;
  const m = Math.floor(s / 60);
  return `${m}分前`;
}




const VIEWER_CMD_EXAMPLE = formatViewerMoveText({ side: 0, slot: 2, cell: 4, warningMarkCell: 2 });
// => #triad A2->B2 wm=C1

/** Display-friendly move text reflecting the actual controlled side (P0-PARSE). */
function moveDisplay(m: ViewerMove, side: 0 | 1): string {
  return formatViewerMoveText({
    side,
    slot: m.cardIndex + 1,
    cell: m.cell,
    warningMarkCell: typeof m.warningMarkCell === "number" ? m.warningMarkCell : null,
  });
}

function formatClassicOpenSlots(indices: readonly number[]): string {
  return indices.map((idx) => String(idx + 1)).join(", ");
}

function formatClassicSwapSlots(aIndex: number, bIndex: number): string {
  return `A${aIndex + 1} <-> B${bIndex + 1}`;
}

type ClassicStateJsonOpen = {
  mode: "all_open" | "three_open";
  playerA: number[];
  playerB: number[];
};

type ClassicStateJsonSwap = {
  playerA: number;
  playerB: number;
};

type ClassicStateJson = {
  rulesetId: string;
  open: ClassicStateJsonOpen | null;
  swap: ClassicStateJsonSwap | null;
};

function toClassicStateJson(classic: ClassicResolvedMetadata | null): ClassicStateJson | null {
  if (!classic) return null;
  return {
    rulesetId: classic.rulesetId,
    open: classic.open
      ? {
          mode: classic.open.mode,
          playerA: [...classic.open.playerA],
          playerB: [...classic.open.playerB],
        }
      : null,
    swap: classic.swap
      ? {
          playerA: classic.swap.aIndex,
          playerB: classic.swap.bIndex,
        }
      : null,
  };
}


export function StreamPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const theme = resolveAppTheme(searchParams);
  const isMintTheme = theme === "mint";
  const themed = React.useCallback((path: string) => appendThemeToPath(path, theme), [theme]);

  const [events, setEvents] = React.useState<EventV1[]>(EVENTS);
  const [eventId, setEventId] = React.useState<string>(() => {
    const stored = readStringSetting("stream.eventId", "");
    if (stored && EVENTS.find((x) => x.id === stored)) return stored;
    return pickDefaultEvent(EVENTS);
  });
  const e = React.useMemo(() => events.find((x) => x.id === eventId) ?? null, [eventId, events]);

  // Persist event selection (P0-PERSIST)
  React.useEffect(() => {
    writeStringSetting("stream.eventId", eventId);
  }, [eventId]);

  // Fetch event config on mount (falls back to hardcoded EVENTS)
  React.useEffect(() => {
    fetchEventConfig().then((fetched) => {
      setEvents(fetched);
      // If current eventId doesn't exist in fetched list, switch to first active
      if (!fetched.find((x) => x.id === eventId)) {
        setEventId(pickDefaultEvent(fetched));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const {
    matchUrl,
    hostMatchUrl,
    overlayUrl,
    overlayTransparentUrl,
    replayBroadcastUrl,
  } = React.useMemo(() => buildStreamUrls(e?.id), [e?.id]);
  const appendThemeToAbsoluteUrl = React.useCallback((rawUrl: string): string => {
    try {
      const parsed = new URL(rawUrl);
      if (!parsed.searchParams.has("theme")) parsed.searchParams.set("theme", theme);
      return parsed.toString();
    } catch {
      return rawUrl;
    }
  }, [theme]);
  const themedMatchUrl = React.useMemo(() => appendThemeToAbsoluteUrl(matchUrl), [appendThemeToAbsoluteUrl, matchUrl]);
  const themedHostMatchUrl = React.useMemo(() => appendThemeToAbsoluteUrl(hostMatchUrl), [appendThemeToAbsoluteUrl, hostMatchUrl]);
  const themedOverlayUrl = React.useMemo(() => appendThemeToAbsoluteUrl(overlayUrl), [appendThemeToAbsoluteUrl, overlayUrl]);
  const themedOverlayTransparentUrl = React.useMemo(
    () => appendThemeToAbsoluteUrl(overlayTransparentUrl),
    [appendThemeToAbsoluteUrl, overlayTransparentUrl],
  );
  const themedReplayBroadcastUrl = React.useMemo(
    () => appendThemeToAbsoluteUrl(replayBroadcastUrl),
    [appendThemeToAbsoluteUrl, replayBroadcastUrl],
  );
  const streamQuickActions = React.useMemo<Array<{ to: string; label: string; subtitle: string; icon: MintIconName }>>(
    () => [
      { to: themed(`/match?event=${encodeURIComponent(eventId)}&ui=mint`), label: "対戦", subtitle: "配信対戦", icon: "match" },
      { to: themed("/overlay?controls=0"), label: "オーバーレイ", subtitle: "OBS表示", icon: "stream" },
      { to: themed("/replay?broadcast=1"), label: "リプレイ", subtitle: "配信モード", icon: "replay" },
      { to: themed("/events"), label: "イベント", subtitle: "シーズン一覧", icon: "events" },
    ],
    [eventId, themed],
  );
  const matchPath = React.useMemo(() => appPath("match"), []);
  const replayPath = React.useMemo(() => appPath("replay"), []);
  const overlayPath = React.useMemo(() => appPath("overlay"), []);
  const streamPath = React.useMemo(() => appPath("stream"), []);
  const replayBroadcastPath = React.useMemo(() => appPath("replay?broadcast=1"), []);

  const copy = async (label: string, v: string) => {
    await writeClipboardText(v);
    toast.success("コピーしました", label);
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
  } catch (err: unknown) {
    toast.error("ダウンロード失敗", errorMessage(err));
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


  // ── Persistent error tracking (P0-ERR) ──
  const [lastError, setLastError] = React.useState<{ message: string; timestampMs: number } | null>(null);

  // Detect RPC/external errors from overlay state
  React.useEffect(() => {
    if (!live) return;
    if (live.rpcStatus && !live.rpcStatus.ok) {
      setLastError({ message: live.rpcStatus.message ?? "RPC connection failed", timestampMs: live.rpcStatus.timestampMs });
    }
    if (live.externalStatus && live.externalStatus.lastOk === false) {
      setLastError({ message: live.externalStatus.lastMessage ?? "External integration error", timestampMs: live.externalStatus.lastTimestampMs ?? Date.now() });
    }
  }, [live?.rpcStatus, live?.externalStatus]); // eslint-disable-line react-hooks/exhaustive-deps -- only re-run on status change

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
  const [lockTimestamp, setLockTimestamp] = React.useState<number>(() => readStreamLockTimestamp());
  React.useEffect(() => {
    writeStreamLock(settingsLocked);
    if (settingsLocked) {
      const ts = Date.now();
      setLockTimestamp(ts);
      writeStreamLockTimestamp(ts);
    } else {
      writeStreamLockTimestamp(0);
    }
  }, [settingsLocked]);

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

interface LegalMoveEntry { cell: number; cardIndex: number; viewer: string }

interface StateJsonContent {
  protocol: string;
  sentAtMs: number;
  eventId: string | null;
  eventTitle: string | null;
  mode: string | null;
  status: unknown;
  turn: number | null;
  toPlay: "A" | "B" | null;
  controlledSide: "A" | "B";
  viewerCommandFormat: string;
  protocolV1: unknown;
  board: Array<{ owner: "A" | "B"; cardSlot?: number; tokenId?: string } | null>;
  hands: {
    A: Array<{ slot: number; tokenId: string; used: boolean }>;
    B: Array<{ slot: number; tokenId: string; used: boolean }>;
  };
  legalMoves: LegalMoveEntry[];
  strictAllowed: { allowlist: string[]; hash: string } | null;
  warningMark: { used: number; remaining: number; candidates: string[] } | null;
  classic: ClassicStateJson | null;
}

function buildStateJsonContent(state: OverlayStateV1 | null, controlled: 0 | 1): StateJsonContent {
  const now = Date.now();
  const turn = typeof state?.turn === "number" ? Number(state!.turn) : null;
  const toPlay = computeToPlay(state);

  // SINGLE SOURCE OF TRUTH: computeStrictAllowed() is the only hash authority (P2-2-4)
  const strict = computeStrictAllowed(state);

  const legalMoves: LegalMoveEntry[] = [];
  if (strict) {
    for (const txt of strict.allowlist) {
      const parsed = parseViewerMoveText(txt);
      if (parsed) {
        legalMoves.push({ cell: parsed.cell, cardIndex: parsed.cardIndex, viewer: txt });
      }
    }
  }

  const usedA = computeRemainingCardIndices(state, 0);
  const usedB = computeRemainingCardIndices(state, 1);
  const remainA = new Set(usedA);
  const remainB = new Set(usedB);
  const classic = toClassicStateJson(resolveClassicMetadataFromOverlayState(state));

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

    // Turn-local legal action space (empty when no active game)
    legalMoves,
    strictAllowed: strict
      ? { allowlist: strict.allowlist, hash: strict.hash }
      : null,
    warningMark: strict
      ? { used: strict.warningMark.used, remaining: strict.warningMark.remaining, candidates: strict.warningMark.candidates }
      : null,
    classic,
  };
}

function buildAiPrompt(state: OverlayStateV1 | null, controlled: 0 | 1): string {
  const turn = typeof state?.turn === "number" ? Number(state!.turn) : null;
  const toPlay = computeToPlay(state);

  const strict = computeStrictAllowed(state);
  const emptyCells = computeEmptyCells(state);
  const remain = toPlay !== null ? computeRemainingCardIndices(state, toPlay) : [];
  const wUsed = toPlay !== null ? computeWarningMarksUsed(state, toPlay) : 0;
  const wRemain = toPlay !== null ? computeWarningMarksRemaining(state, toPlay) : 0;

  const boardMini = bestEffortBoardToProtocolBoard(state);
  const classic = resolveClassicMetadataFromOverlayState(state);

  const lines: string[] = [];
  lines.push("Nyano Triad League snapshot (ai_prompt)");
  if (classic?.open) {
    if (classic.open.mode === "all_open") {
      lines.push("classic_open: all_open");
    } else {
      lines.push(`classic_open: three_open A[${formatClassicOpenSlots(classic.open.playerA)}] / B[${formatClassicOpenSlots(classic.open.playerB)}]`);
    }
  }
  if (classic?.swap) {
    lines.push(`classic_swap: A${classic.swap.aIndex + 1} <-> B${classic.swap.bIndex + 1}`);
  }
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
  lines.push(
    `WarningMark: remaining=${wRemain} (used=${wUsed}) candidates=${
      wRemain > 0 ? (strict?.warningMark.candidates.join(", ") ?? emptyCells.map(cellIndexToCoord).join(", ")) : "—"
    }`
  );
  lines.push("");
  lines.push("Legal moves (cell+slot):");
  // Print up to 30 moves to keep prompt readable
  const max = 30;
  const legalMoves = strict?.allowlist ?? [];
  if (legalMoves.length === 0) {
    lines.push("- (none)");
  } else {
    for (const move of legalMoves.slice(0, max)) lines.push(`- ${move}`);
    if (legalMoves.length > max) lines.push(`... (${legalMoves.length} total)`);
  }
  lines.push("");
  lines.push("Return format: ONLY one line, e.g. '#triad A2->B2' or '#triad A2->B2 wm=C1'");

  return lines.join("\n");
}

const sendNyanoWarudo = React.useCallback(
  async (kind: "ai_prompt" | "state_json", opts?: { silent?: boolean }) => {
    const state = live;
    if (!state) {
      const msg = `ライブ状態がありません（${matchPath} または ${replayBroadcastPath} を開いてください）。`;
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
      message: res.ok ? `${kind} を送信しました` : `${kind} の送信に失敗しました (${res.status})`,
      timestampMs: Date.now(),
    });
    // Track persistent error for HUD (P0-ERR)
    if (!res.ok) {
      setLastError({ message: `Warudo ${kind} の送信に失敗しました (${res.status})`, timestampMs: Date.now() });
    }
    // Propagate warudo errors to overlay state so /overlay can display them
    if (!res.ok) {
      const current = readStoredOverlayState();
      if (current) {
        publishOverlayState({
          ...current,
          externalStatus: {
            lastOk: false,
            lastMessage: `Warudo ${kind} の送信に失敗しました (${res.status})`,
            lastTimestampMs: Date.now(),
          },
        });
      }
    }
    appendOpsLog(res.ok ? "info" : "error", "warudo", res.ok ? `Sent ${kind}` : `Failed ${kind} (${res.status})`);
    if (!opts?.silent) {
      if (res.ok) toast.success("Nyano Warudo", `${kind} を送信しました`);
      else toast.error("Nyano Warudo", `${kind} の送信に失敗しました`);
    }
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps -- buildAiPrompt/buildStateJsonContent are stable module-level fns
  [live, controlledSide, warudoBaseUrl, toast, appendOpsLog, matchPath, replayBroadcastPath]
);


const downloadStateJson = React.useCallback(() => {
  const state = live;
  if (!state) {
    toast.warn("ダウンロード", "ライブ状態がありません。");
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
    toast.warn("ダウンロード", "ライブ状態がありません。");
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
    toast.warn("ダウンロード", "ライブ状態がありません。");
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
  const liveClassic = React.useMemo(() => resolveClassicMetadataFromOverlayState(live), [live]);
  const liveClassicOpen = liveClassic?.open ?? null;

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
    attempts: number;
    accepted: number;
    duplicates: number;
    rateLimited: number;
    illegal: number;
    usernameRejected: number;
    changeExceeded: number;
    bannedUserRejected: number;
    blockedWordRejected: number;
    slowModeRejected: number;
  }>({
    attempts: 0,
    accepted: 0,
    duplicates: 0,
    rateLimited: 0,
    illegal: 0,
    usernameRejected: 0,
    changeExceeded: 0,
    bannedUserRejected: 0,
    blockedWordRejected: 0,
    slowModeRejected: 0,
  });
  const rateLimitMapRef = React.useRef<Map<string, number>>(new Map());
  const voteChangeCountRef = React.useRef<Map<string, number>>(new Map());
  const slowModeMapRef = React.useRef<Map<string, number>>(new Map());

  // ── Anti-spam configuration (persisted) ──
  const [antiSpamRateLimitMs, setAntiSpamRateLimitMs] = React.useState<number>(() => readAntiSpamRateLimitMs());
  const [antiSpamMaxVoteChanges, setAntiSpamMaxVoteChanges] = React.useState<number>(() => readAntiSpamMaxVoteChanges());
  const antiSpamConfig = React.useMemo<AntiSpamConfig>(() => ({
    ...DEFAULT_ANTI_SPAM_CONFIG,
    rateLimitMs: antiSpamRateLimitMs,
    maxVoteChangesPerRound: antiSpamMaxVoteChanges,
  }), [antiSpamRateLimitMs, antiSpamMaxVoteChanges]);

  // ── Moderation configuration (persisted) ──
  const [moderationSlowModeSeconds, setModerationSlowModeSeconds] = React.useState<number>(() =>
    readStreamSlowModeSeconds(),
  );
  const [moderationBannedUsersText, setModerationBannedUsersText] = React.useState<string>(() =>
    readStreamBannedUsersText(),
  );
  const [moderationBlockedWordsText, setModerationBlockedWordsText] = React.useState<string>(() =>
    readStreamBlockedWordsText(),
  );
  const moderationConfig = React.useMemo(
    () =>
      buildStreamModerationConfig({
        slowModeSeconds: moderationSlowModeSeconds,
        bannedUsersText: moderationBannedUsersText,
        blockedWordsText: moderationBlockedWordsText,
      }),
    [moderationSlowModeSeconds, moderationBannedUsersText, moderationBlockedWordsText],
  );
  const moderationBannedUsersCount = React.useMemo(
    () => parseModerationListText(moderationBannedUsersText).length,
    [moderationBannedUsersText],
  );
  const moderationBlockedWordsCount = React.useMemo(
    () => parseModerationListText(moderationBlockedWordsText).length,
    [moderationBlockedWordsText],
  );

  // Persist anti-spam settings (P2-SPAM)
  React.useEffect(() => {
    writeAntiSpamRateLimitMs(antiSpamRateLimitMs);
    writeAntiSpamMaxVoteChanges(antiSpamMaxVoteChanges);
  }, [antiSpamRateLimitMs, antiSpamMaxVoteChanges]);

  React.useEffect(() => {
    writeStreamSlowModeSeconds(moderationSlowModeSeconds);
    writeStreamBannedUsersText(moderationBannedUsersText);
    writeStreamBlockedWordsText(moderationBlockedWordsText);
  }, [moderationSlowModeSeconds, moderationBannedUsersText, moderationBlockedWordsText]);

  // Apply event's voteTimeSeconds as default when event changes (P2-SPAM)
  React.useEffect(() => {
    if (e?.voteTimeSeconds && e.voteTimeSeconds > 0) {
      setVoteSeconds(e.voteTimeSeconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when event changes
  }, [e?.id]);

  const resetVotes = React.useCallback(() => {
    setVotesByUser({});
    setVoteAudit({
      attempts: 0,
      accepted: 0,
      duplicates: 0,
      rateLimited: 0,
      illegal: 0,
      usernameRejected: 0,
      changeExceeded: 0,
      bannedUserRejected: 0,
      blockedWordRejected: 0,
      slowModeRejected: 0,
    });
    rateLimitMapRef.current.clear();
    voteChangeCountRef.current.clear();
    slowModeMapRef.current.clear();
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

    toast.success("Sent", moveDisplay(mv, controlledSide));
    appendOpsLog("info", "vote", `Finalized: ${moveDisplay(mv, controlledSide)}`);
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

    // Moderation: banned user list (Phase 4)
    if (isUserBanned(u, moderationConfig)) {
      setVoteAudit((prev) => ({
        ...prev,
        attempts: prev.attempts + 1,
        bannedUserRejected: prev.bannedUserRejected + 1,
      }));
      toast.warn("Vote", `Banned user: ${u}`);
      return;
    }

    // Moderation: blocked words in raw chat input (Phase 4)
    const blockedWord = findBlockedWord(chatText, moderationConfig);
    if (blockedWord) {
      setVoteAudit((prev) => ({
        ...prev,
        attempts: prev.attempts + 1,
        blockedWordRejected: prev.blockedWordRejected + 1,
      }));
      toast.warn("Vote", `Blocked by NG word: "${blockedWord}"`);
      return;
    }

    // Moderation: per-user slow mode
    const slowCheck = checkSlowMode(
      u,
      now,
      slowModeMapRef.current,
      moderationConfig.slowModeSeconds,
    );
    if (!slowCheck.ok) {
      setVoteAudit((prev) => ({
        ...prev,
        attempts: prev.attempts + 1,
        slowModeRejected: prev.slowModeRejected + 1,
      }));
      toast.warn("Vote", `Slow mode: ${u} (wait ${Math.ceil(slowCheck.waitMs / 1000)}s)`);
      return;
    }

    // Username validation (P2-SPAM)
    const usernameCheck = validateUsername(u, antiSpamConfig);
    if (!usernameCheck.ok && usernameCheck.reason === "invalid_username") {
      setVoteAudit((prev) => ({ ...prev, attempts: prev.attempts + 1, usernameRejected: prev.usernameRejected + 1 }));
      toast.warn("Vote", `Invalid username: ${u} (${usernameCheck.detail})`);
      return;
    }

    // Rate limit: per-user configurable cooldown (P2-SPAM)
    const rlCheck = checkRateLimit(u, now, rateLimitMapRef.current, antiSpamConfig);
    if (!rlCheck.ok && rlCheck.reason === "rate_limited") {
      setVoteAudit((prev) => ({ ...prev, attempts: prev.attempts + 1, rateLimited: prev.rateLimited + 1 }));
      toast.warn("Vote", `Rate limited: ${u} (wait ${Math.ceil(rlCheck.waitMs / 1000)}s)`);
      return;
    }

    // Vote change limit: per-user per-round cap (P2-SPAM)
    const vcCheck = checkVoteChangeLimit(u, voteChangeCountRef.current, antiSpamConfig);
    if (!vcCheck.ok && vcCheck.reason === "max_changes_exceeded") {
      setVoteAudit((prev) => ({ ...prev, attempts: prev.attempts + 1, changeExceeded: prev.changeExceeded + 1 }));
      toast.warn("Vote", `Vote change limit reached: ${u} (max ${vcCheck.limit})`);
      return;
    }

    // Legality check: verify the move is in the current allowlist (P2-350)
    const strict = computeStrictAllowed(live);
    if (strict) {
      // Compare without warningMark — allowlist entries are base moves only
      const baseMoveText = toViewerMoveText({ cell: mv.cell, cardIndex: mv.cardIndex });
      if (!strict.allowlist.includes(baseMoveText)) {
        setVoteAudit((prev) => ({ ...prev, attempts: prev.attempts + 1, illegal: prev.illegal + 1 }));
        toast.warn("Vote", `Illegal move: ${baseMoveText} — not in ${strict.count} legal moves`);
        return;
      }
    }

    // Duplicate check (same user, overwrite is allowed but track it)
    setVotesByUser((prev) => {
      const isDuplicate = u in prev;
      setVoteAudit((a) => ({
        attempts: a.attempts + 1,
        accepted: a.accepted + 1,
        duplicates: isDuplicate ? a.duplicates + 1 : a.duplicates,
        rateLimited: a.rateLimited,
        illegal: a.illegal,
        usernameRejected: a.usernameRejected,
        changeExceeded: a.changeExceeded,
        bannedUserRejected: a.bannedUserRejected,
        blockedWordRejected: a.blockedWordRejected,
        slowModeRejected: a.slowModeRejected,
      }));
      return { ...prev, [u]: mv };
    });
    rateLimitMapRef.current.set(u, now);
    voteChangeCountRef.current.set(u, (voteChangeCountRef.current.get(u) ?? 0) + 1);
    recordSlowModeAcceptedVote(u, now, slowModeMapRef.current);
  }, [chatText, userName, controlledSide, toast, antiSpamConfig, moderationConfig, live]);

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
    note: canVoteNow ? "投票受付中…" : "ホスト準備待ち…",
  });
}, [voteOpen, voteEndsAtMs, voteTurn, votesByUser, counts, controlledSide, live?.eventId, live?.eventTitle, liveTurn, canVoteNow]);


function buildMoveText(cell: number, cardIndex: number, wm: number | null, side: 0 | 1 = 0): string {
  return formatViewerMoveText({ side, slot: cardIndex + 1, cell, warningMarkCell: wm ?? undefined });
}

const _applyPickerToChatText = React.useCallback(() => {
  if (pickCell === null || pickCardIndex === null) {
    toast.warn("ピッカー", "先にセルとカードを選択してください。");
    return;
  }
  const wm = pickWarningMarkCell;
  const txt = buildMoveText(pickCell, pickCardIndex, wm, controlledSide);
  setChatText(txt);
  toast.success("ピッカー", "チャットコマンドを入力しました。");
}, [pickCell, pickCardIndex, pickWarningMarkCell, controlledSide, toast]);

const _addVoteFromPicker = React.useCallback(() => {
  if (!voteOpen) {
    toast.warn("投票", "先に投票を開始してください。");
    return;
  }
  if (pickCell === null || pickCardIndex === null) {
    toast.warn("投票", "先にセルとカードを選択してください。");
    return;
  }
  const u = userName.trim() || "viewer";
  setVotesByUser((prev) => ({
    ...prev,
    [u]: { cell: pickCell, cardIndex: pickCardIndex, warningMarkCell: pickWarningMarkCell },
  }));
  toast.success("投票", "ピッカーから投票を追加しました。");
}, [voteOpen, pickCell, pickCardIndex, pickWarningMarkCell, userName, toast]);

const _clearPicker = React.useCallback(() => {
  setPickCell(null);
  setPickCardIndex(null);
  setPickWarningMarkCell(null);
}, []);

const copyViewerInstructions = React.useCallback(() => {
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
  void writeClipboardText(instructions);
  toast.success("コピーしました", "視聴者向け案内をクリップボードへコピーしました");
}, [controlledSide, toast]);

return (
    <div className="stream-page space-y-6">
      {isMintTheme ? (
        <section className="mint-stream-quicknav" aria-label="Stream quick navigation">
          {streamQuickActions.map((action) => (
            <GlassPanel key={action.label} variant="card" className="mint-stream-quicknav__card">
              <MintPressable to={action.to} className="mint-stream-quicknav__action" fullWidth>
                <MintIcon name={action.icon} size={18} />
                <span className="mint-stream-quicknav__label">{action.label}</span>
                <span className="mint-stream-quicknav__sub">{action.subtitle}</span>
              </MintPressable>
            </GlassPanel>
          ))}
        </section>
      ) : null}
      {isMintTheme ? (
        <section className="mint-stream-summary" aria-label="Stream overview">
          <GlassPanel variant="pill" className="mint-stream-summary__item mint-stream-summary__item--wide">
            <span className="mint-stream-summary__label">イベント</span>
            <span className="mint-stream-summary__value">{e?.title ?? "イベント未選択"}</span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-stream-summary__item">
            <span className="mint-stream-summary__label">現在ターン</span>
            <span className="mint-stream-summary__value">{liveTurn ?? "—"}</span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-stream-summary__item">
            <span className="mint-stream-summary__label">投票</span>
            <span className="mint-stream-summary__value">
              {voteOpen ? (timeLeft !== null ? `残り ${timeLeft}s` : "受付中") : "受付終了"}
            </span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-stream-summary__item">
            <span className="mint-stream-summary__label">オーバーレイ</span>
            <span className="mint-stream-summary__value">{connectionHealth.overlayConnected ? "接続中" : "待機中"}</span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-stream-summary__item">
            <span className="mint-stream-summary__label">対戦バス</span>
            <span className="mint-stream-summary__value">{connectionHealth.matchConnected ? "接続中" : "待機中"}</span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-stream-summary__item">
            <span className="mint-stream-summary__label">Warudo</span>
            <span className="mint-stream-summary__value">
              {!connectionHealth.warudoConfigured
                ? "未設定"
                : connectionHealth.warudoLastOk === true
                  ? "正常"
                  : connectionHealth.warudoLastOk === false
                    ? "エラー"
                    : "不明"}
            </span>
          </GlassPanel>
        </section>
      ) : null}
      {isMintTheme ? <MintPageGuide spec={MINT_PAGE_GUIDES.stream} className="mint-stream-guide" /> : null}

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
        lastError={lastError}
        onDismissError={() => setLastError(null)}
      />
      <div className="stream-page__lock-row flex items-center justify-end gap-3">
        {settingsLocked && lockTimestamp > 0 && (
          <span className="text-xs text-slate-500">
            ロック中 {ageLabel(lockTimestamp)}
          </span>
        )}
        <button
          className={settingsLocked ? "btn btn-sm btn-error" : "btn btn-sm btn-primary"}
          onClick={() => {
            if (settingsLocked) {
              if (!window.confirm("配信中にロック解除しますか？\n設定変更による配信トラブルに注意してください。")) return;
            }
            setSettingsLocked((v) => !v);
          }}
          aria-label={settingsLocked ? "設定ロック解除 (Unlock settings)" : "設定ロック (Lock settings)"}
        >
          {settingsLocked ? "🔒 設定ロック中 (解除)" : "🔓 設定をロック"}
        </button>
      </div>
      <div className="card stream-page__studio-card">
        <div className="card-hd">
          <div>
            <div className="flex items-center gap-3">
              <NyanoImage size={56} className="shrink-0" alt="Nyano" />
              <div className="text-lg font-semibold">🎥 Nyano Stream Studio</div>
            </div>
            <div className="text-sm text-slate-600">
              OBSオーバーレイとチャット投票を使って、視聴者と一緒に対戦を楽しめます。
            </div>
          </div>
        </div>

        <div className="card-bd space-y-4">
          {/* Step 1 · Event Selection */}
          <div className="stream-page__step rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
            <div className="text-xs font-semibold text-slate-800">ステップ1 · 注目イベントを選ぶ</div>
            <div className="mt-2 flex flex-col gap-2">
              <label className="text-xs text-slate-600">イベント</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={eventId}
                onChange={(ev) => setEventId(ev.target.value)}
                disabled={settingsLocked}
                aria-label="Event"
              >
                {events.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
              {e ? <div className="text-xs text-slate-500 mt-2">{e.description}</div> : null}
            </div>
          </div>

          {/* Step 2 · Share & QR Codes (P2-310) */}
          <StreamSharePanel
            matchUrl={themedMatchUrl}
            hostMatchUrl={themedHostMatchUrl}
            overlayUrl={themedOverlayUrl}
            overlayTransparentUrl={themedOverlayTransparentUrl}
            replayBroadcastUrl={themedReplayBroadcastUrl}
            controlledSide={controlledSide}
            eventTitle={e?.title}
            emptyCells={_remainingCellsLive}
            remainingCards={_remainingCardsLive}
            turn={liveTurn ?? undefined}
          />

          <div className="callout callout-info stream-page__callout">
            <div className="text-xs font-semibold">配信のおすすめ進行</div>
            <div className="mt-1 text-sm text-slate-800">
              視聴者には <span className="font-mono">対戦リンク</span> を配り、勝ったリプレイURLをチャットに貼ってもらいます。
              <br />
              配信側は <Link to={themed("/replay")}>リプレイ</Link> で回収して、解説・採点・ランキング化へ。
            </div>
          </div>

          <div className="stream-page__step rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
            <div className="text-xs font-semibold text-slate-800">ステップ3 · リプレイを配信で確認</div>
            <div className="mt-1 text-sm text-slate-700">
              <span className="font-mono">{replayPath}</span> で共有URLを開き、<span className="font-semibold">オーバーレイ送信</span> をONにすると、
              オーバーレイが手順と一緒に追随します（解説がしやすい）。
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button className="btn btn-sm btn-primary" onClick={() => copy("リプレイ配信URL", themedReplayBroadcastUrl)}>
                リプレイ配信URLをコピー
              </button>
              <a className="btn btn-sm no-underline" href={themedReplayBroadcastUrl} target="_blank" rel="noreferrer noopener">
                開く
              </a>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              ※ OBS側は <span className="font-mono">{overlayPath}</span> を表示しておけばOK
            </div>
          </div>

          <div className="stream-page__step rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-800">ステップ4 · Nyano vs チャット投票</div>
                <div className="mt-1 text-xs text-slate-600">
                  Twitch連携の前に、まずは <span className="font-mono">{streamPath}</span> で投票集計 → <span className="font-mono">{matchPath}</span> に反映する最小ループを作ります。
                </div>
              </div>

              <div className="text-xs text-slate-500" role="status" aria-live="polite">
                状態: <span className="font-mono">{live?.mode ?? "—"}</span> · 更新: <span className="font-mono">{ageLabel(live?.updatedAtMs)}</span>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="stream-page__live-status rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-slate-700">ライブ状態（オーバーレイ連携）</div>
                <div className="mt-1 text-xs text-slate-700">
                  イベント: <span className="font-mono">{live?.eventId ?? "—"}</span>
                </div>
                <div className="mt-1 text-xs text-slate-700">
                  ターン: <span className="font-mono">{typeof liveTurn === "number" ? liveTurn : "—"}</span> · 手番:{" "}
                  <span className="font-mono">{liveCurrent === 0 ? "A" : liveCurrent === 1 ? "B" : "—"}</span>
                </div>
                {liveClassicOpen ? (
                  <div className="mt-1 text-xs text-slate-700">
                    classic 公開:{" "}
                    <span className="font-mono">
                      {liveClassicOpen.mode === "all_open"
                        ? "全カード公開"
                        : `A[${formatClassicOpenSlots(liveClassicOpen.playerA)}] / B[${formatClassicOpenSlots(liveClassicOpen.playerB)}]`}
                    </span>
                  </div>
                ) : null}
                {liveClassic?.swap ? (
                  <div className="mt-1 text-xs text-slate-700">
                    Classic 入れ替え: <span className="font-mono">{formatClassicSwapSlots(liveClassic.swap.aIndex, liveClassic.swap.bIndex)}</span>
                  </div>
                ) : null}
                {live?.lastMove ? (
                  <div className="mt-1 text-xs text-slate-700">
                    直前: <span className="font-mono">{live.lastMove.by === 0 ? "A" : "B"}{" "}
                    {moveDisplay({ cell: live.lastMove.cell, cardIndex: live.lastMove.cardIndex }, live.lastMove.by as 0 | 1)}</span>
                  </div>
                ) : null}
              </div>

              <VoteControlPanel
                controlledSide={controlledSide}
                onChangeControlledSide={setControlledSide}
                voteSeconds={voteSeconds}
                onChangeVoteSeconds={setVoteSeconds}
                autoStartEachTurn={autoStartEachTurn}
                onChangeAutoStartEachTurn={setAutoStartEachTurn}
                settingsLocked={settingsLocked}
                canVoteNow={canVoteNow}
                voteOpen={voteOpen}
                timeLeft={timeLeft}
                onStartVote={startVote}
                onFinalizeVote={finalizeVote}
                onResetVotes={resetVotes}
                userName={userName}
                onChangeUserName={setUserName}
                chatText={chatText}
                onChangeChatText={setChatText}
                onAddVoteFromChat={addVoteFromChat}
                counts={counts}
                voteAudit={voteAudit}
                onCopyViewerInstructions={copyViewerInstructions}
                antiSpamRateLimitMs={antiSpamRateLimitMs}
                onChangeAntiSpamRateLimitMs={setAntiSpamRateLimitMs}
                antiSpamMaxVoteChanges={antiSpamMaxVoteChanges}
                onChangeAntiSpamMaxVoteChanges={setAntiSpamMaxVoteChanges}
                moderationSlowModeSeconds={moderationSlowModeSeconds}
                onChangeModerationSlowModeSeconds={setModerationSlowModeSeconds}
                moderationBannedUsersText={moderationBannedUsersText}
                onChangeModerationBannedUsersText={setModerationBannedUsersText}
                moderationBlockedWordsText={moderationBlockedWordsText}
                onChangeModerationBlockedWordsText={setModerationBlockedWordsText}
                moderationBannedUsersCount={moderationBannedUsersCount}
                moderationBlockedWordsCount={moderationBlockedWordsCount}
              />
            </div>


            <WarudoBridgePanel
              warudoBaseUrl={warudoBaseUrl}
              onChangeBaseUrl={setWarudoBaseUrl}
              autoSendStateOnVoteStart={autoSendStateOnVoteStart}
              onChangeAutoSendStateOnVoteStart={setAutoSendStateOnVoteStart}
              autoSendPromptOnVoteStart={autoSendPromptOnVoteStart}
              onChangeAutoSendPromptOnVoteStart={setAutoSendPromptOnVoteStart}
              autoResendStateDuringVoteOpen={autoResendStateDuringVoteOpen}
              onChangeAutoResendStateDuringVoteOpen={setAutoResendStateDuringVoteOpen}
              autoSendStateOnVoteEnd={autoSendStateOnVoteEnd}
              onChangeAutoSendStateOnVoteEnd={setAutoSendStateOnVoteEnd}
              settingsLocked={settingsLocked}
              onSendAiPrompt={() => sendNyanoWarudo("ai_prompt")}
              onSendStateJson={() => sendNyanoWarudo("state_json")}
              onDownloadStateJson={downloadStateJson}
              onDownloadTranscript={downloadTranscript}
              onDownloadAiPrompt={downloadAiPrompt}
              lastBridgePayload={lastBridgePayload}
              lastBridgeResult={lastBridgeResult}
            />

            <div className="mt-3 text-[11px] text-slate-500">
              ここで使うコマンド連携は、次の段階で Twitch 連携（EventSub/IRC）に置き換え可能です。
            </div>
          </div>
        </div>
      </div>

      {/* ── Recovery / Troubleshooting (Phase 2 — one-click + guide) ── */}
      <div className="card stream-page__recovery rounded-2xl border border-amber-200 bg-amber-50/50 px-4 py-3">
        <div className="text-xs font-semibold text-amber-800 mb-2">復旧メニュー</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {(["clear_overlay", "clear_votes", "full_reset"] as const).map((action) => (
            <button
              key={action}
              className={`btn btn-sm ${action === "full_reset" ? "btn-error" : "btn-outline"}`}
              aria-label={recoveryActionLabel(action)}
              onClick={() => {
                const result = executeRecovery(action);
                const label = recoveryActionLabel(action);
                appendOpsLog("warn", "recovery", `${label}: cleared ${result.cleared.length} key(s)`);
                toast.success(label, `${result.cleared.length} 件のキーをクリアしました`);
                if (action === "full_reset") {
                  setSettingsLocked(false);
                }
              }}
            >
              {recoveryActionLabel(action)}
            </button>
          ))}
        </div>
        <details>
          <summary className="text-xs text-amber-700 cursor-pointer">トラブルシューティング</summary>
          <div className="mt-2 grid gap-3 text-xs text-amber-900">
            <div>
              <div className="font-semibold">オーバーレイに「データ更新停止」が出る</div>
              <ol className="list-decimal pl-4 mt-1 space-y-0.5">
                <li>Match タブが開いていて接続中か確認する</li>
                <li>Match タブを再読み込みする（stateは localStorage から復元）</li>
                <li>RPCエラーが続く場合は blockchain RPC endpoint を確認する</li>
              </ol>
            </div>
            <div>
              <div className="font-semibold">投票結果がオーバーレイに表示されない</div>
              <ol className="list-decimal pl-4 mt-1 space-y-0.5">
                <li>Stream タブと Overlay タブが同じオリジンか確認する</li>
                <li>ブラウザコンソールで BroadcastChannel エラーを確認する</li>
                <li>両タブを再読み込みする（vote state はリセット）</li>
              </ol>
            </div>
            <div>
              <div className="font-semibold">Warudo bridge が応答しない</div>
              <ol className="list-decimal pl-4 mt-1 space-y-0.5">
                <li>base URL が正しいか確認する（末尾にスラッシュなし）</li>
                <li>「state送信」を手動実行して疎通を確認する</li>
                <li>nyano-warudo の server logs で CORS/timeout を確認する</li>
              </ol>
            </div>
          </div>
        </details>
      </div>

      <div className="card stream-page__links">
        <div className="card-hd">
          <div>
            <div className="text-base font-semibold">リンク</div>
            <div className="text-xs text-slate-600">便利リンク</div>
          </div>
        </div>
        <div className="card-bd flex flex-wrap items-center gap-2">
          <Link className="btn no-underline" to={themed("/events")}>
            イベント
          </Link>
          <Link className="btn no-underline" to={themed("/match?ui=mint")}>
            対戦
          </Link>
          <Link className="btn no-underline" to={themed("/replay")}>
            リプレイ
          </Link>
          <a className="btn no-underline" href={themedOverlayUrl} target="_blank" rel="noreferrer noopener">
            オーバーレイ
          </a>
        </div>
      </div>
    </div>
  );
}
