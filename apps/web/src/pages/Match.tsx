import React from "react";
import { useToast } from "@/components/Toast";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import type { BoardState, CardData, FlipTraceV1, MatchResultWithHistory, PlayerIndex, RulesetConfig, TranscriptV1, Turn, TurnSummary } from "@nyano/triad-engine";
import {
  computeRulesetId,
  resolveClassicForcedCardIndex,
  resolveClassicOpenCardIndices,
  resolveClassicSwapIndices,
  simulateMatchV1WithHistory,
} from "@nyano/triad-engine";
import { parseRulesetKeyOrDefault, resolveRulesetOrThrow, type RulesetKey } from "@/lib/ruleset_registry";
import { parseDeckRestriction, validateDeckAgainstRestriction } from "@/lib/deck_restriction";

import { BoardView } from "@/components/BoardView";
import { BoardViewRPG, HandDisplayRPG, GameResultOverlayRPG, TurnLogRPG } from "@/components/BoardViewRPG";
import type { TurnLogEntry } from "@/components/BoardViewRPG";
import { BoardViewMint } from "@/components/BoardViewMint";
import { DuelStageMint } from "@/components/DuelStageMint";
import { BattleHudMint } from "@/components/BattleHudMint";
import { BattleTopHudMint } from "@/components/BattleTopHudMint";
import { HandDisplayMint } from "@/components/HandDisplayMint";
import { GameResultOverlayMint } from "@/components/GameResultOverlayMint";
import { PlayerSidePanelMint } from "@/components/PlayerSidePanelMint";
import { ScoreBar } from "@/components/ScoreBar";
import { LastMoveFeedback, useBoardFlipAnimation } from "@/components/BoardFlipAnimator";
import { CardFlight } from "@/components/CardFlight";
import { useCardFlight } from "@/hooks/useCardFlight";
import { NyanoImage } from "@/components/NyanoImage";
import { CardMini } from "@/components/CardMini";
import { HiddenDeckPreviewCard } from "@/components/HiddenDeckPreviewCard";
import { TurnLog } from "@/components/TurnLog";
import { GameResultOverlay, type GameResult } from "@/components/GameResultOverlay";
import {
  pickReactionKind,
  resolveReactionCutInImpact,
  type NyanoReactionInput,
} from "@/components/NyanoReaction";
import { NyanoReactionSlot } from "@/components/NyanoReactionSlot";
import { flipTracesSummary } from "@/components/flipTraceDescribe";
import { base64UrlEncodeUtf8, tryGzipCompressUtf8ToBase64Url } from "@/lib/base64url";
import { getDeck, listDecks, upsertDeck, type DeckV1 } from "@/lib/deck_store";
import { getEventById, getEventStatus, type EventV1 } from "@/lib/events";
import { stringifyWithBigInt } from "@/lib/json";
import { buildReplayBundleV2, stringifyReplayBundle } from "@/lib/replay_bundle";
import { fetchMintedTokenIds, fetchNyanoCards } from "@/lib/nyano_rpc";
import { publishOverlayState, subscribeStreamCommand, type StreamCommandV1 } from "@/lib/streamer_bus";
import { pickAiMove as pickAiMoveNew, type AiDifficulty, type AiReasonCode } from "@/lib/ai/nyano_ai";
import { computeAiAutoMoveDelayMs } from "@/lib/ai/turn_timing";
import { generateMoveTip } from "@/lib/ai/move_tips";
import { assessBoardAdvantage } from "@/lib/ai/board_advantage";
import { annotateReplayMoves } from "@/lib/ai/replay_annotations";
import { errorMessage } from "@/lib/errorMessage";
import { AiNotesList } from "@/components/AiReasonDisplay";
import { NyanoAvatar } from "@/components/NyanoAvatar";
import { MiniTutorial } from "@/components/MiniTutorial";
import { SkeletonBoard, SkeletonHand } from "@/components/Skeleton";
import { fetchGameIndex } from "@/lib/nyano/gameIndex";
import {
  buildCardDataFromIndex,
  buildEmergencyGuestFallbackData,
  generateBalancedDemoPair,
} from "@/lib/demo_decks";
import { markOnboardingStepDone } from "@/lib/onboarding";
import { QrCode } from "@/components/QrCode";
import { createTelemetryTracker } from "@/lib/telemetry";
import { createSfxEngine, type SfxEngine, type SfxName } from "@/lib/sfx";
import { readUiDensity, readVfxQuality, writeUiDensity, writeVfxQuality, type UiDensity, type VfxPreference } from "@/lib/local_settings";
import type { FlipTraceArrow } from "@/components/FlipArrowOverlay";
import { MatchDrawerMint, DrawerToggleButton } from "@/components/MatchDrawerMint";
import { MatchSetupPanelMint } from "@/components/match/MatchSetupPanelMint";
import { writeClipboardText } from "@/lib/clipboard";
import { appAbsoluteUrl, buildReplayShareUrl } from "@/lib/appUrl";
import { computeStageBoardSizing, shouldShowStageSecondaryControls } from "@/lib/stage_layout";
import { BattleStageEngine } from "@/engine/components/BattleStageEngine";
import { applyVfxQualityToDocument, resolveVfxQuality, type VfxQuality } from "@/lib/visual/visualSettings";
import { MAX_CHAIN_CAP_PER_TURN, parseChainCapPerTurnParam } from "@/lib/ruleset_meta";
import {
  deriveChoiceCommitHex,
  deriveRevealCommitHex,
  parseFirstPlayerResolutionMode,
  randomBytes32Hex,
  resolveFirstPlayer,
  type FirstPlayerResolutionMode,
} from "@/lib/first_player_resolve";
import {
  applySearchParamPatch,
  buildFirstPlayerModeCanonicalParamPatch,
} from "@/lib/first_player_params";

type OpponentMode = "pvp" | "vs_nyano_ai";
type DataMode = "fast" | "verified";
type MatchBoardUi = "mint" | "engine" | "rpg";

const STAGE_VFX_OPTIONS: ReadonlyArray<{ value: VfxPreference; label: string }> = [
  { value: "auto", label: "auto" },
  { value: "off", label: "off" },
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
];

function formatStageVfxLabel(pref: VfxPreference, resolved: VfxQuality): string {
  if (pref === "auto") return `auto (${resolved})`;
  return pref;
}

type SimOk = {
  ok: true;
  transcript: TranscriptV1;
  ruleset: RulesetConfig;
  rulesetId: `0x${string}`;
  full: MatchResultWithHistory;
  // preview = slice to committed turns only
  previewTurns: MatchResultWithHistory["turns"];
  previewHistory: MatchResultWithHistory["boardHistory"];
};

type SimState = { ok: false; error: string } | SimOk;

const EMPTY_BOARD: BoardState = Array.from({ length: 9 }, () => null);

function toHexBytes32(bytes: Uint8Array): `0x${string}` {
  return ("0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}

function randomSalt(): `0x${string}` {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return toHexBytes32(b);
}

function turnPlayer(firstPlayer: PlayerIndex, turnIndex: number): PlayerIndex {
  return ((firstPlayer + (turnIndex % 2)) % 2) as PlayerIndex;
}

function looksLikeRpcError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("failed to fetch") || m.includes("http request failed") || m.includes("rpc") || m.includes("cors") || m.includes("429");
}

function parseDeckTokenIds(d: DeckV1 | null): bigint[] {
  if (!d) return [];
  return d.tokenIds.map((x) => BigInt(x));
}

function computeUsed(turns: Turn[], firstPlayer: PlayerIndex): { cells: Set<number>; usedA: Set<number>; usedB: Set<number> } {
  const cells = new Set<number>();
  const usedA = new Set<number>();
  const usedB = new Set<number>();
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    cells.add(t.cell);
    const p = turnPlayer(firstPlayer, i);
    if (p === 0) usedA.add(t.cardIndex);
    else usedB.add(t.cardIndex);
  }
  return { cells, usedA, usedB };
}

function countWarningMarks(turns: Turn[], firstPlayer: PlayerIndex): { A: number; B: number } {
  let A = 0;
  let B = 0;
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    if (t.warningMarkCell === undefined) continue;
    const p = turnPlayer(firstPlayer, i);
    if (p === 0) A++;
    else B++;
  }
  return { A, B };
}

function fillTurns(
  partial: Turn[],
  firstPlayer: PlayerIndex,
  ruleset: RulesetConfig,
  headerForClassic: Pick<TranscriptV1["header"], "salt" | "playerA" | "playerB" | "rulesetId">
): Turn[] {
  const { cells, usedA, usedB } = computeUsed(partial, firstPlayer);

  const remainingCells: number[] = [];
  for (let c = 0; c < 9; c++) if (!cells.has(c)) remainingCells.push(c);

  const remainingA: number[] = [];
  const remainingB: number[] = [];
  for (let i = 0; i < 5; i++) {
    if (!usedA.has(i)) remainingA.push(i);
    if (!usedB.has(i)) remainingB.push(i);
  }

  const out: Turn[] = [...partial];

  for (let i = partial.length; i < 9; i++) {
    const p = turnPlayer(firstPlayer, i);
    const cell = remainingCells.shift();
    if (cell === undefined) throw new Error("no remaining cells (internal)");
    const used = p === 0 ? usedA : usedB;
    const forced = resolveClassicForcedCardIndex({
      ruleset,
      header: headerForClassic,
      turnIndex: i,
      player: p,
      usedCardIndices: used,
    });

    let cardIndex: number | undefined;
    if (forced !== null) {
      cardIndex = forced;
      if (used.has(cardIndex)) throw new Error(`no remaining forced cardIndex for player ${p}`);
      if (p === 0) {
        const idx = remainingA.indexOf(cardIndex);
        if (idx >= 0) remainingA.splice(idx, 1);
      } else {
        const idx = remainingB.indexOf(cardIndex);
        if (idx >= 0) remainingB.splice(idx, 1);
      }
    } else {
      cardIndex = p === 0 ? remainingA.shift() : remainingB.shift();
    }
    if (cardIndex === undefined) throw new Error(`no remaining cardIndex for player ${p}`);
    out.push({ cell, cardIndex });
    used.add(cardIndex);
  }

  return out;
}

async function copyToClipboard(text: string): Promise<void> {
  await writeClipboardText(text);
}

// AI logic has been extracted to @/lib/ai/nyano_ai.ts

function parseOpponentMode(v: string | null): OpponentMode {
  if (!v) return "pvp";
  if (v === "vs_nyano_ai" || v === "ai" || v === "nyano") return "vs_nyano_ai";
  return "pvp";
}

function formatClassicOpenSlots(indices: readonly number[]): string {
  return indices.map((idx) => String(idx + 1)).join(", ");
}

function parseAiDifficulty(v: string | null): AiDifficulty {
  if (v === "easy") return "easy";
  if (v === "hard") return "hard";
  if (v === "expert") return "expert";
  return "normal";
}

function parseFirstPlayer(v: string | null): PlayerIndex {
  return v === "1" ? 1 : 0;
}

function parseSeason(v: string | null): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseBool01(v: string | null, defaultValue: boolean): boolean {
  if (v === "1") return true;
  if (v === "0") return false;
  return defaultValue;
}

function parseFocusMode(v: string | null): boolean {
  if (!v) return false;
  const normalized = v.toLowerCase();
  return normalized === "1" || normalized === "focus";
}

function parseMatchBoardUi(v: string | null): MatchBoardUi {
  if (v === "engine") return "engine";
  if (v === "rpg") return "rpg";
  return "mint";
}

/** Lazy QR code for share URL - avoids computing gzip in render */
function ShareQrCode({ sim, event, ui }: { sim: SimState; event: EventV1 | null; ui?: string }) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!sim.ok) return;
    const json = stringifyWithBigInt(sim.transcript, 0);
    const z = tryGzipCompressUtf8ToBase64Url(json);
    setUrl(
      buildReplayShareUrl({
        data: z ? { key: "z", value: z } : { key: "t", value: base64UrlEncodeUtf8(json) },
        step: 9,
        eventId: event?.id,
        ui,
        absolute: true,
      })
    );
  }, [sim, event, ui]);

  if (!url) return <div className="text-xs text-slate-400">Generating...</div>;
  return <QrCode value={url} size={160} />;
}

/* ==========================================================================
   MATCH PAGE
   ========================================================================== */

export function MatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const ui = parseMatchBoardUi((searchParams.get("ui") || "").toLowerCase());
  const isRpg = ui === "rpg";
  const isMint = ui === "mint";
  const isEngine = ui === "engine";
  const [engineRendererFailed, setEngineRendererFailed] = React.useState(false);
  const [engineRendererError, setEngineRendererError] = React.useState<string | null>(null);
  const useEngineRenderer = isEngine && !engineRendererFailed;
  const useMintUi = isMint || isEngine;
  const focusParam = searchParams.get("focus") ?? searchParams.get("layout");
  const isFocusMode = parseFocusMode(focusParam);
  const isEngineFocus = isEngine && isFocusMode;
  const stageMatchUrl = React.useMemo(() => {
    const next = new URLSearchParams(searchParams);
    next.set("ui", "engine");
    next.set("focus", "1");
    next.delete("layout");
    const query = next.toString();
    return query ? `/battle-stage?${query}` : "/battle-stage";
  }, [searchParams]);
  const isBattleStageRoute = /\/battle-stage$/.test(location.pathname);
  const isStageFocusRoute = isBattleStageRoute && isEngineFocus;
  const stageViewportRef = React.useRef<HTMLDivElement>(null);
  const [stageBoardSizing, setStageBoardSizing] = React.useState(() =>
    computeStageBoardSizing({
      viewportWidthPx: typeof window === "undefined" ? 1366 : window.innerWidth,
      viewportHeightPx: typeof window === "undefined" ? 900 : window.innerHeight,
      kind: "battle",
    })
  );
  const engineBoardMaxWidthPx = isBattleStageRoute ? stageBoardSizing.maxWidthPx : undefined;
  const engineBoardMinHeightPx = isBattleStageRoute ? stageBoardSizing.minHeightPx : undefined;
  const decks = React.useMemo(() => listDecks(), []);

  React.useEffect(() => {
    if (!isBattleStageRoute) return;

    const updateSizing = () => {
      setStageBoardSizing(
        computeStageBoardSizing({
          viewportWidthPx: window.innerWidth,
          viewportHeightPx: window.innerHeight,
          kind: "battle",
        })
      );
    };

    updateSizing();
    window.addEventListener("resize", updateSizing);
    return () => window.removeEventListener("resize", updateSizing);
  }, [isBattleStageRoute]);

  React.useEffect(() => {
    if (isEngine) return;
    setEngineRendererFailed(false);
    setEngineRendererError(null);
  }, [isEngine]);

  // ── Telemetry (NIN-UX-003) ──
  const telemetry = React.useMemo(() => createTelemetryTracker(), []);
  React.useEffect(() => {
    return () => { telemetry.flush(); };
  }, [telemetry]);

  // ── SFX Engine (NIN-UX-031) ──
  const sfx = React.useMemo<SfxEngine | null>(() => (useMintUi ? createSfxEngine() : null), [useMintUi]);
  const [sfxMuted, setSfxMuted] = React.useState(() => sfx?.isMuted() ?? false);
  React.useEffect(() => {
    return () => { sfx?.dispose(); };
  }, [sfx]);

  const handleSfxToggle = React.useCallback(() => {
    if (!sfx) return;
    const next = !sfx.isMuted();
    sfx.setMuted(next);
    setSfxMuted(next);
  }, [sfx]);

  const playMatchUiSfx = React.useCallback((name: SfxName) => {
    sfx?.play(name);
  }, [sfx]);

  const isGuestMode = searchParams.get("mode") === "guest";
  const dataModeParam = (searchParams.get("dm") ?? "fast") as DataMode;
  const [dataMode, setDataMode] = React.useState<DataMode>(isGuestMode ? "fast" : dataModeParam);

  const eventId = searchParams.get("event") ?? "";
  const event: EventV1 | null = React.useMemo(() => (eventId ? getEventById(eventId) : null), [eventId]);
  const eventStatus = event ? getEventStatus(event) : null;

  const [eventNyanoDeckOverride, setEventNyanoDeckOverride] = React.useState<bigint[] | null>(null);
  React.useEffect(() => {
    setEventNyanoDeckOverride(null);
  }, [eventId]);

  const deckAId = searchParams.get("a") ?? "";
  const deckBId = searchParams.get("b") ?? "";

  const deckA = React.useMemo(() => (deckAId ? getDeck(deckAId) : null), [deckAId]);
  const deckB = React.useMemo(() => (deckBId ? getDeck(deckBId) : null), [deckBId]);

  const opponentModeParam = parseOpponentMode(searchParams.get("opp"));
  const aiDifficultyParam = parseAiDifficulty(searchParams.get("ai"));

  const aiAutoPlay = parseBool01(searchParams.get("auto"), true);
  const streamMode = parseBool01(searchParams.get("stream"), false);
  const streamCtrlParam = (searchParams.get("ctrl") ?? "A").toUpperCase();
  const streamControlledSide = (streamCtrlParam === "B" ? 1 : 0) as PlayerIndex;
  const uiParam: MatchBoardUi = ui;

  const rulesetKeyParam = parseRulesetKeyOrDefault(searchParams.get("rk"), "v2");
  const chainCapRawParam = searchParams.get("ccap");
  const chainCapPerTurnParam = parseChainCapPerTurnParam(chainCapRawParam);
  const seasonIdParam = parseSeason(searchParams.get("season"));
  const firstPlayerModeParam = parseFirstPlayerResolutionMode(searchParams.get("fpm"));
  const manualFirstPlayerParam = parseFirstPlayer(searchParams.get("fp"));
  const mutualChoiceAParam = parseFirstPlayer(searchParams.get("fpa"));
  const mutualChoiceBParam = parseFirstPlayer(searchParams.get("fpb"));
  const commitRevealSaltParam = searchParams.get("fps") ?? "";
  const seedResolutionParam = searchParams.get("fpsd") ?? "";
  const committedMutualPlayerAParam = searchParams.get("fpoa") ?? "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa";
  const committedMutualPlayerBParam = searchParams.get("fpob") ?? "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB";
  const committedMutualNonceAParam = searchParams.get("fpna") ?? "";
  const committedMutualNonceBParam = searchParams.get("fpnb") ?? "";
  const committedMutualCommitAParam = searchParams.get("fcoa") ?? "";
  const committedMutualCommitBParam = searchParams.get("fcob") ?? "";
  const commitRevealAParam = searchParams.get("fra") ?? "";
  const commitRevealBParam = searchParams.get("frb") ?? "";
  const commitRevealCommitAParam = searchParams.get("fca") ?? "";
  const commitRevealCommitBParam = searchParams.get("fcb") ?? "";

  const isEvent = Boolean(event);
  const opponentMode: OpponentMode = isEvent ? "vs_nyano_ai" : opponentModeParam;
  const isVsNyanoAi = opponentMode === "vs_nyano_ai";
  const aiPlayer: PlayerIndex = 1;
  const aiDifficulty: AiDifficulty = isEvent ? (event!.aiDifficulty as AiDifficulty) : aiDifficultyParam;

  const rulesetKey: RulesetKey = isEvent ? (event!.rulesetKey as RulesetKey) : rulesetKeyParam;
  const seasonId: number = isEvent ? event!.seasonId : seasonIdParam;
  const firstPlayerMode = isEvent ? "manual" : firstPlayerModeParam;
  const firstPlayerResolution = React.useMemo(
    () =>
      resolveFirstPlayer({
        mode: firstPlayerMode,
        manualFirstPlayer: manualFirstPlayerParam,
        mutualChoiceA: mutualChoiceAParam,
        mutualChoiceB: mutualChoiceBParam,
        committedMutualChoice: {
          matchSalt: commitRevealSaltParam,
          playerA: committedMutualPlayerAParam,
          playerB: committedMutualPlayerBParam,
          choiceA: mutualChoiceAParam,
          choiceB: mutualChoiceBParam,
          nonceA: committedMutualNonceAParam,
          nonceB: committedMutualNonceBParam,
          commitA: committedMutualCommitAParam,
          commitB: committedMutualCommitBParam,
        },
        commitReveal: {
          matchSalt: commitRevealSaltParam,
          revealA: commitRevealAParam,
          revealB: commitRevealBParam,
          commitA: commitRevealCommitAParam,
          commitB: commitRevealCommitBParam,
        },
        seedResolution: {
          matchSalt: commitRevealSaltParam,
          seed: seedResolutionParam,
        },
      }),
    [
      firstPlayerMode,
      manualFirstPlayerParam,
      mutualChoiceAParam,
      mutualChoiceBParam,
      commitRevealSaltParam,
      seedResolutionParam,
      committedMutualPlayerAParam,
      committedMutualPlayerBParam,
      committedMutualNonceAParam,
      committedMutualNonceBParam,
      committedMutualCommitAParam,
      committedMutualCommitBParam,
      commitRevealAParam,
      commitRevealBParam,
      commitRevealCommitAParam,
      commitRevealCommitBParam,
    ],
  );
  const firstPlayer: PlayerIndex = isEvent ? (event!.firstPlayer as PlayerIndex) : firstPlayerResolution.firstPlayer;

  const [salt, setSalt] = React.useState<`0x${string}`>(() => randomSalt());
  const [deadline, setDeadline] = React.useState<number>(() => Math.floor(Date.now() / 1000) + 24 * 3600);

  const [loading, setLoading] = React.useState(false);
  const [cards, setCards] = React.useState<Map<bigint, CardData> | null>(null);
  const [_owners, setOwners] = React.useState<Map<bigint, `0x${string}`> | null>(null);

  const [playerA, setPlayerA] = React.useState<`0x${string}`>("0x0000000000000000000000000000000000000000");
  const [playerB, setPlayerB] = React.useState<`0x${string}`>("0x0000000000000000000000000000000000000000");

  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [showResultOverlay, setShowResultOverlay] = React.useState(false);
  const [draftCell, setDraftCell] = React.useState<number | null>(null);
  const [draftCardIndex, setDraftCardIndex] = React.useState<number | null>(null);
  const [draftWarningMarkCell, setDraftWarningMarkCell] = React.useState<number | null>(null);
  const [dragCardIndex, setDragCardIndex] = React.useState<number | null>(null);
  const [isHandDragging, setIsHandDragging] = React.useState(false);

  const [selectedTurnIndex, setSelectedTurnIndex] = React.useState<number>(0);

  const [status, setStatus] = React.useState<string | null>(null);
  const toast = useToast();
  const handleEngineRendererInitError = React.useCallback((message: string) => {
    setEngineRendererFailed(true);
    setEngineRendererError(message);
    toast.warn("Pixi renderer unavailable", "Switched to Mint fallback board");
  }, [toast]);
  const handleRetryEngineRenderer = React.useCallback(() => {
    setEngineRendererFailed(false);
    setEngineRendererError(null);
  }, []);
  const overlayUrl = React.useMemo(() => appAbsoluteUrl("overlay?controls=0"), []);
  const lastStreamCmdIdRef = React.useRef<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [isStageFullscreen, setIsStageFullscreen] = React.useState(
    () => typeof document !== "undefined" && Boolean(document.fullscreenElement),
  );

  React.useEffect(() => {
    const handleFullscreenChange = () => setIsStageFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleStageFullscreen = React.useCallback(async () => {
    if (!isStageFocusRoute) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      const target = stageViewportRef.current;
      if (!target) return;
      await target.requestFullscreen();
    } catch (e: unknown) {
      toast.warn("Fullscreen", errorMessage(e));
    }
  }, [isStageFocusRoute, toast]);

  // RPC status tracking for overlay propagation (Phase 0 stability)
  const rpcStatusRef = React.useRef<{ ok: boolean; message?: string; timestampMs: number } | undefined>(undefined);

  type AiNoteEntry = { reason: string; reasonCode: AiReasonCode };
  const [aiNotes, setAiNotes] = React.useState<Record<number, AiNoteEntry>>({});
  const [aiAutoMoveDueAtMs, setAiAutoMoveDueAtMs] = React.useState<number | null>(null);
  const [aiCountdownMs, setAiCountdownMs] = React.useState<number | null>(null);
  const [guestDeckSaved, setGuestDeckSaved] = React.useState(false);

  // F-1: Mint drawer state
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // F-2: UI Density toggle (minimal/standard/full)
  const [density, setDensity] = React.useState<UiDensity>(() =>
    useMintUi ? readUiDensity("minimal") : "full"
  );
  const handleDensityChange = React.useCallback((d: UiDensity) => {
    setDensity(d);
    writeUiDensity(d);
  }, []);
  const [vfxPreference, setVfxPreference] = React.useState<VfxPreference>(() => readVfxQuality("auto"));
  const [resolvedVfxQuality, setResolvedVfxQuality] = React.useState<VfxQuality>(() => resolveVfxQuality());
  const [showStageAssist, setShowStageAssist] = React.useState(() => !isStageFocusRoute);
  const showStageAssistUi = !isStageFocusRoute || showStageAssist;
  const stageControlsManualOverrideRef = React.useRef(false);
  const stageActionFeedbackTimerRef = React.useRef<number | null>(null);
  const [stageActionFeedback, setStageActionFeedback] = React.useState("");
  const [stageActionFeedbackTone, setStageActionFeedbackTone] = React.useState<"info" | "success" | "warn">("info");
  const [showStageControls, setShowStageControls] = React.useState(() => {
    if (!isStageFocusRoute) return true;
    if (typeof window === "undefined") return true;
    return shouldShowStageSecondaryControls(window.innerWidth);
  });

  React.useEffect(() => {
    if (!isStageFocusRoute) {
      setShowStageAssist(true);
      return;
    }
    setShowStageAssist(false);
  }, [isStageFocusRoute]);

  React.useEffect(() => {
    stageControlsManualOverrideRef.current = false;
    if (!isStageFocusRoute) {
      setShowStageControls(true);
      return;
    }
    if (typeof window === "undefined") {
      setShowStageControls(true);
      return;
    }
    setShowStageControls(shouldShowStageSecondaryControls(window.innerWidth));
  }, [isStageFocusRoute]);

  React.useEffect(() => {
    if (!isStageFocusRoute || typeof window === "undefined") return;
    const handleResize = () => {
      if (stageControlsManualOverrideRef.current) return;
      setShowStageControls(shouldShowStageSecondaryControls(window.innerWidth));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isStageFocusRoute]);

  const toggleStageControls = React.useCallback(() => {
    stageControlsManualOverrideRef.current = true;
    setShowStageControls((prev) => !prev);
  }, []);

  const pushStageActionFeedback = React.useCallback((message: string, tone: "info" | "success" | "warn" = "info") => {
    if (!isStageFocusRoute) return;
    setStageActionFeedback(message);
    setStageActionFeedbackTone(tone);
    if (typeof window === "undefined") return;
    if (stageActionFeedbackTimerRef.current !== null) {
      window.clearTimeout(stageActionFeedbackTimerRef.current);
    }
    stageActionFeedbackTimerRef.current = window.setTimeout(() => {
      stageActionFeedbackTimerRef.current = null;
      setStageActionFeedback("");
      setStageActionFeedbackTone("info");
    }, 1800);
  }, [isStageFocusRoute]);

  React.useEffect(() => {
    if (isStageFocusRoute) return;
    setStageActionFeedback("");
    setStageActionFeedbackTone("info");
    if (typeof window !== "undefined" && stageActionFeedbackTimerRef.current !== null) {
      window.clearTimeout(stageActionFeedbackTimerRef.current);
      stageActionFeedbackTimerRef.current = null;
    }
  }, [isStageFocusRoute]);

  React.useEffect(() => () => {
    if (typeof window !== "undefined" && stageActionFeedbackTimerRef.current !== null) {
      window.clearTimeout(stageActionFeedbackTimerRef.current);
    }
  }, []);

  const handleStageVfxChange = React.useCallback((nextPreference: VfxPreference) => {
    setVfxPreference(nextPreference);
    writeVfxQuality(nextPreference);
    const nextResolved = resolveVfxQuality();
    setResolvedVfxQuality(nextResolved);
    applyVfxQualityToDocument(nextResolved);
    playMatchUiSfx("card_place");
    pushStageActionFeedback(`VFX ${formatStageVfxLabel(nextPreference, nextResolved)}`, "info");
  }, [playMatchUiSfx, pushStageActionFeedback]);

  const resetMatch = React.useCallback(() => {
    setTurns([]);
    setDraftCell(null);
    setDraftCardIndex(null);
    setDraftWarningMarkCell(null);
    setDragCardIndex(null);
    setIsHandDragging(false);
    setSelectedTurnIndex(0);
    setAiNotes({});
    setAiAutoMoveDueAtMs(null);
    setAiCountdownMs(null);
    setGuestDeckSaved(false);
    setSalt(randomSalt());
    setDeadline(Math.floor(Date.now() / 1000) + 24 * 3600);
    try {
      boardAnim.clear();
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boardAnim is declared later (forward ref); stable hook return
  }, []);

  /** Rematch: reset game state but keep the same decks/cards */
  const handleRematch = React.useCallback(() => {
    setTurns([]);
    setDraftCell(null);
    setDraftCardIndex(null);
    setDraftWarningMarkCell(null);
    setDragCardIndex(null);
    setIsHandDragging(false);
    setSelectedTurnIndex(0);
    setAiNotes({});
    setAiAutoMoveDueAtMs(null);
    setAiCountdownMs(null);
    setGuestDeckSaved(false);
    setSalt(randomSalt());
    setDeadline(Math.floor(Date.now() / 1000) + 24 * 3600);
    setShowResultOverlay(false);
    setError(null);
    setStatus(null);
    try {
      boardAnim.clear();
    } catch {
      // ignore
    }
    // Cards and deck tokens are NOT reset - same decks reused
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boardAnim is declared later (forward ref); stable hook return
  }, []);

  const handleSaveGuestDeck = () => {
    if (guestDeckATokens.length !== 5) return;
    const ts = new Date();
    const datePart = ts.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
    const timePart = ts.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    const label = `Guest Deck ${datePart} ${timePart}`;
    upsertDeck({
      name: label,
      tokenIds: guestDeckATokens,
      origin: "guest",
      difficulty: aiDifficulty,
      rulesetKey,
      memo: `${aiDifficulty} / ${rulesetKey}`,
    });
    setGuestDeckSaved(true);
    toast.success("Deck saved!", "Find it on the Decks page.");
  };

  React.useEffect(() => {
    if (!isGuestMode) return;
    markOnboardingStepDone("start_first_match");
  }, [isGuestMode]);

  React.useEffect(() => {
    if (!isGuestMode) return;
    if (turns.length < 1) return;
    markOnboardingStepDone("commit_first_move");
  }, [isGuestMode, turns.length]);

  React.useEffect(() => {
    resetMatch();
    setCards(null);
    setOwners(null);
    setStatus(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckAId, deckBId, eventId]);

  React.useEffect(() => {
    resetMatch();
    setStatus(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPlayer]);

  React.useEffect(() => {
    if (isEvent) return;
    const patch = buildFirstPlayerModeCanonicalParamPatch(firstPlayerModeParam, searchParams, randomBytes32Hex);
    const { next, changed } = applySearchParamPatch(searchParams, patch);
    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [isEvent, firstPlayerModeParam, searchParams, setSearchParams]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const setParams = (updates: Record<string, string | undefined>) => {
    const { next, changed } = applySearchParamPatch(searchParams, updates);
    if (changed) setSearchParams(next, { replace: true });
  };

  const setFocusMode = React.useCallback((enabled: boolean) => {
    const { next, changed } = applySearchParamPatch(searchParams, {
      focus: enabled ? "1" : undefined,
      layout: undefined,
    });
    if (!enabled && isBattleStageRoute) {
      const query = next.toString();
      navigate(query ? `/match?${query}` : "/match", { replace: true });
      return;
    }
    if (changed) setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, isBattleStageRoute, navigate]);

  const handleBoardUiChange = (nextUi: MatchBoardUi) => {
    if (nextUi === "engine") {
      setParam("ui", nextUi);
      return;
    }
    setParams({ ui: nextUi, focus: undefined, layout: undefined });
  };

  const handleFirstPlayerModeChange = (nextMode: FirstPlayerResolutionMode) => {
    setParams({
      ...buildFirstPlayerModeCanonicalParamPatch(nextMode, searchParams, randomBytes32Hex),
    });
  };

  const handleCopySetupLink = async () => {
    const query = searchParams.toString();
    const path = location.pathname.replace(/^\//, "");
    const url = appAbsoluteUrl(query ? `${path}?${query}` : path);
    const ok = await writeClipboardText(url);
    if (ok) toast.success("Copied", "Setup link copied");
    else toast.warn("Copy failed", "Please copy the URL manually.");
  };

  React.useEffect(() => {
    if (isEngine || !isFocusMode) return;
    const { next, changed } = applySearchParamPatch(searchParams, {
      focus: undefined,
      layout: undefined,
    });
    if (changed) setSearchParams(next, { replace: true });
  }, [isEngine, isFocusMode, searchParams, setSearchParams]);

  const clearEvent = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("event");
    setSearchParams(next, { replace: true });
  };

  const deckATokens = React.useMemo(() => parseDeckTokenIds(deckA), [deckA]);
  const deckBTokens = React.useMemo(() => {
    if (event) return (eventNyanoDeckOverride ?? event.nyanoDeckTokenIds.map((x) => BigInt(x)));
    return parseDeckTokenIds(deckB);
  }, [deckB, event, eventNyanoDeckOverride]);

  // Guest mode: store generated deck tokenIds so they persist across resets
  const [guestDeckATokens, setGuestDeckATokens] = React.useState<bigint[]>([]);
  const [guestDeckBTokens, setGuestDeckBTokens] = React.useState<bigint[]>([]);

  // Effective deck tokens: guest mode uses generated decks, normal mode uses selected decks
  const effectiveDeckATokens = isGuestMode && guestDeckATokens.length === 5 ? guestDeckATokens : deckATokens;
  const effectiveDeckBTokens = isGuestMode && guestDeckBTokens.length === 5 ? guestDeckBTokens : deckBTokens;

  const baseRuleset = React.useMemo(() => resolveRulesetOrThrow(rulesetKey), [rulesetKey]);
  const ruleset: RulesetConfig = React.useMemo(() => {
    const next = structuredClone(baseRuleset) as RulesetConfig;
    if (chainCapPerTurnParam !== null) {
      next.meta = { ...(next.meta ?? {}), chainCapPerTurn: chainCapPerTurnParam };
    }
    return next;
  }, [baseRuleset, chainCapPerTurnParam]);
  const rulesetId = React.useMemo(() => computeRulesetId(ruleset), [ruleset]);

  const used = React.useMemo(() => computeUsed(turns, firstPlayer), [turns, firstPlayer]);
  const remainingCardsA = Math.max(0, 5 - used.usedA.size);
  const remainingCardsB = Math.max(0, 5 - used.usedB.size);
  const warnUsed = React.useMemo(() => countWarningMarks(turns, firstPlayer), [turns, firstPlayer]);
  const currentTurnIndex = turns.length;
  const currentPlayer = turnPlayer(firstPlayer, currentTurnIndex);
  const isAiTurn = isVsNyanoAi && currentPlayer === aiPlayer;
  const enableHandDragDrop = useMintUi
    && !isRpg
    && !isAiTurn
    && turns.length < 9;

  const currentDeckTokens = currentPlayer === 0 ? effectiveDeckATokens : effectiveDeckBTokens;
  const currentUsed = currentPlayer === 0 ? used.usedA : used.usedB;
  const classicForcedCardIndex = React.useMemo(() => {
    return resolveClassicForcedCardIndex({
      ruleset,
      header: { salt, playerA, playerB, rulesetId },
      turnIndex: currentTurnIndex,
      player: currentPlayer,
      usedCardIndices: currentUsed,
    });
  }, [ruleset, salt, playerA, playerB, rulesetId, currentTurnIndex, currentPlayer, currentUsed]);
  const classicSwapIndices = React.useMemo(() => {
    return resolveClassicSwapIndices({
      ruleset,
      header: { salt, playerA, playerB, rulesetId },
    });
  }, [ruleset, salt, playerA, playerB, rulesetId]);
  const classicOpenCardIndices = React.useMemo(() => {
    return resolveClassicOpenCardIndices({
      ruleset,
      header: { salt, playerA, playerB, rulesetId },
    });
  }, [ruleset, salt, playerA, playerB, rulesetId]);
  const guestOpponentVisibleCardIndices = React.useMemo(() => {
    if (!classicOpenCardIndices) return null;
    return new Set<number>(classicOpenCardIndices.playerB);
  }, [classicOpenCardIndices]);
  const effectiveUsedCardIndices = React.useMemo(() => {
    const out = new Set<number>(currentUsed);
    if (classicForcedCardIndex !== null) {
      for (let i = 0; i < 5; i++) {
        if (i !== classicForcedCardIndex) out.add(i);
      }
    }
    return out;
  }, [currentUsed, classicForcedCardIndex]);
  const currentWarnRemaining = currentPlayer === 0 ? Math.max(0, 3 - warnUsed.A) : Math.max(0, 3 - warnUsed.B);
  const currentHandCards: CardData[] = React.useMemo(() => {
    if (!cards) return [];
    return currentDeckTokens.map((tid) => cards.get(tid)).filter(Boolean) as CardData[];
  }, [cards, currentDeckTokens]);

  const availableCells = React.useMemo(() => {
    const out: number[] = [];
    for (let c = 0; c < 9; c++) if (!used.cells.has(c)) out.push(c);
    return out;
  }, [used.cells]);

  // P0-1: selectableCells for BoardView (only empty cells when it's not AI turn and game isn't over)
  const selectableCells = React.useMemo(() => {
    if (!cards || turns.length >= 9 || isAiTurn) return new Set<number>();
    return new Set(availableCells);
  }, [cards, turns.length, isAiTurn, availableCells]);

  const _availableCardIndexes = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < 5; i++) if (!effectiveUsedCardIndices.has(i)) out.push(i);
    return out;
  }, [effectiveUsedCardIndices]);

  React.useEffect(() => {
    if (classicForcedCardIndex === null) return;
    setDraftCardIndex(classicForcedCardIndex);
  }, [classicForcedCardIndex]);

  const canLoad = isGuestMode || Boolean(deckA && deckATokens.length === 5 && deckBTokens.length === 5);

  const classicSwapLabel = classicSwapIndices
    ? `Classic Swap: A${classicSwapIndices.aIndex + 1} / B${classicSwapIndices.bIndex + 1}`
    : null;
  const classicOpenLabel = classicOpenCardIndices
    ? classicOpenCardIndices.mode === "all_open"
      ? "Classic Open: all cards revealed"
      : `Classic Three Open: A[${formatClassicOpenSlots(classicOpenCardIndices.playerA)}] / B[${formatClassicOpenSlots(classicOpenCardIndices.playerB)}]`
    : null;

  const handleRandomizeCommitReveal = () => {
    setParams({
      fps: randomBytes32Hex(),
      fra: randomBytes32Hex(),
      frb: randomBytes32Hex(),
      fca: "",
      fcb: "",
    });
  };

  const handleDeriveCommitRevealCommits = () => {
    const commitA = deriveRevealCommitHex(commitRevealSaltParam, commitRevealAParam);
    const commitB = deriveRevealCommitHex(commitRevealSaltParam, commitRevealBParam);
    if (!commitA || !commitB) {
      toast.warn("Commit derive failed", "matchSalt/revealA/revealB must be bytes32 hex.");
      return;
    }
    setParams({ fca: commitA, fcb: commitB });
    toast.success("Commits derived", "commitA/commitB updated from reveals.");
  };

  const handleRandomizeCommittedMutualChoice = () => {
    setParams({
      fps: randomBytes32Hex(),
      fpna: randomBytes32Hex(),
      fpnb: randomBytes32Hex(),
      fcoa: "",
      fcob: "",
    });
  };

  const handleDeriveCommittedMutualChoiceCommits = () => {
    const commitA = deriveChoiceCommitHex({
      matchSalt: commitRevealSaltParam,
      player: committedMutualPlayerAParam,
      firstPlayer: mutualChoiceAParam,
      nonce: committedMutualNonceAParam,
    });
    const commitB = deriveChoiceCommitHex({
      matchSalt: commitRevealSaltParam,
      player: committedMutualPlayerBParam,
      firstPlayer: mutualChoiceBParam,
      nonce: committedMutualNonceBParam,
    });
    if (!commitA || !commitB) {
      toast.warn("Commit derive failed", "matchSalt/player/choice/nonce values must be valid.");
      return;
    }
    setParams({ fcoa: commitA, fcob: commitB });
    toast.success("Commits derived", "Committed mutual choice commits were updated.");
  };

  const handleRandomizeSeedResolution = () => {
    setParams({
      fps: randomBytes32Hex(),
      fpsd: randomBytes32Hex(),
    });
  };

  const loadCardsFromIndex = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);

    const applyGuestFallback = (reason: string) => {
      const fallback = buildEmergencyGuestFallbackData();
      setGuestDeckATokens(fallback.deckATokenIds);
      setGuestDeckBTokens(fallback.deckBTokenIds);
      setCards(fallback.cardsByTokenId);
      setOwners(null);
      setPlayerA("0x0000000000000000000000000000000000000001" as `0x${string}`);
      setPlayerB("0x0000000000000000000000000000000000000002" as `0x${string}`);
      setError(`Game Index load failed; fallback guest deck was used. (${reason})`);
      setStatus(`Guest mode: fallback deck loaded (${fallback.cardsByTokenId.size} cards)`);
      toast.warn("Game Index unavailable", "Fallback guest cards loaded");
    };

    try {
      const index = await fetchGameIndex();
      if (!index) {
        if (isGuestMode) {
          applyGuestFallback("index unavailable");
          return;
        }
        setError("Game Index unavailable. Please try Verified mode.");
        return;
      }

      if (isGuestMode) {
        // Generate balanced demo pair
        const pair = generateBalancedDemoPair(index);
        const aTokens = pair.deckA.tokenIds.map((x) => BigInt(x));
        const bTokens = pair.deckB.tokenIds.map((x) => BigInt(x));
        setGuestDeckATokens(aTokens);
        setGuestDeckBTokens(bTokens);

        const allTokenIds = [...pair.deckA.tokenIds, ...pair.deckB.tokenIds];
        const cardMap = buildCardDataFromIndex(index, allTokenIds);
        setCards(cardMap);
        setOwners(null);
        setPlayerA("0x0000000000000000000000000000000000000001" as `0x${string}`);
        setPlayerB("0x0000000000000000000000000000000000000002" as `0x${string}`);
        setStatus(`Guest mode: loaded ${cardMap.size} cards from game index`);
      } else {
        // Fast mode for normal play
        const allTokenIds = [...deckATokens, ...deckBTokens].map((t) => t.toString());
        const cardMap = buildCardDataFromIndex(index, allTokenIds);

        if (cardMap.size < allTokenIds.length) {
          const missing = allTokenIds.filter((id) => !cardMap.has(BigInt(id)));
          setError(`Missing tokenIds in Game Index: ${missing.join(", ")}. Please try Verified mode.`);
          return;
        }

        // Deck restriction check (P2-DECK-RESTRICT)
        if (event?.deckRestriction) {
          const rule = parseDeckRestriction(event.deckRestriction);
          const playerTokenIds = deckATokens.map((t) => t.toString());
          const validation = validateDeckAgainstRestriction(playerTokenIds, rule);
          if (!validation.valid) {
            setError(`Deck restriction violation (${rule.label}): ${validation.violations.join("; ")}`);
            return;
          }
        }

        setCards(cardMap);
        setOwners(null);
        setStatus(`Fast mode: loaded ${cardMap.size} cards from game index`);
      }
    } catch (e: unknown) {
      const msg = errorMessage(e);
      if (isGuestMode) {
        applyGuestFallback(msg);
        return;
      }
      setError(`Game Index load failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCardsFromRpc = async () => {
    setError(null);
    setStatus(null);

    if (!deckA || deckATokens.length !== 5) {
      setError("Please select Deck A (5 cards).");
      return;
    }
    if (deckBTokens.length !== 5) {
      setError("Deck B is invalid (must contain 5 cards).");
      return;
    }

    setLoading(true);
    try {
      let deckBForLoad = deckBTokens;

      if (event && !eventNyanoDeckOverride) {
        const raw = event.nyanoDeckTokenIds.join(",");
        const looksPlaceholder = raw === "1,2,3,4,5";

        if (looksPlaceholder) {
          const minted = await fetchMintedTokenIds(5, 0);
          deckBForLoad = minted;
          setEventNyanoDeckOverride(minted);

          toast.success(
            "Nyano deck auto-selected",
            minted.map((t) => `#${t.toString()}`).join(", ")
          );
        }
      }

      const tokenIds = [...deckATokens, ...deckBForLoad];
      const bundles = await fetchNyanoCards(tokenIds);

      const cardsByTokenId = new Map<bigint, CardData>();
      const ownersByTokenId = new Map<bigint, `0x${string}`>();

      for (const [tid, b] of bundles.entries()) {
        cardsByTokenId.set(tid, b.card);
        ownersByTokenId.set(tid, b.owner);
      }

      setCards(cardsByTokenId);
      setOwners(ownersByTokenId);

      const a0 = deckATokens[0];
      const b0 = deckBTokens[0];
      if (a0 !== undefined) setPlayerA(ownersByTokenId.get(a0) ?? playerA);
      if (b0 !== undefined) setPlayerB(ownersByTokenId.get(b0) ?? playerB);

      setStatus(`Verified: loaded ${bundles.size} cards from mainnet`);
      rpcStatusRef.current = { ok: true, timestampMs: Date.now() };
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setError(msg);
      rpcStatusRef.current = { ok: false, message: msg, timestampMs: Date.now() };

      if (msg.includes("missing tokenid")) {
        toast.warn("Card load failed", "Missing tokenId found. Please verify it on /nyano.");
      } else if (looksLikeRpcError(msg)) {
        toast.warn("Card load failed", "RPC request failed. Check /nyano RPC Settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCards = () => {
    if (isGuestMode || dataMode === "fast") {
      return loadCardsFromIndex();
    }
    return loadCardsFromRpc();
  };

  // Auto-load cards in guest mode
  React.useEffect(() => {
    if (isGuestMode && !cards && !loading) {
      void loadCardsFromIndex();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuestMode]);

  const sim: SimState = React.useMemo(() => {
    if (!cards) return { ok: false, error: "Cards are not loaded. Press Load Cards first." };
    if (effectiveDeckATokens.length !== 5 || effectiveDeckBTokens.length !== 5) return { ok: false, error: "Deck A/B must each have 5 cards." };

    try {
      const header = {
        version: 1 as const,
        rulesetId,
        seasonId,
        playerA,
        playerB,
        deckA: effectiveDeckATokens,
        deckB: effectiveDeckBTokens,
        firstPlayer,
        deadline,
        salt,
      };
      const fullTurns = fillTurns(turns, firstPlayer, ruleset, header);

      const transcript: TranscriptV1 = {
        header,
        turns: fullTurns,
      };

      const full = simulateMatchV1WithHistory(transcript, cards, ruleset);

      const n = turns.length;
      const previewTurns = full.turns.slice(0, n);
      const previewHistory = full.boardHistory.slice(0, n + 1);

      return { ok: true, transcript, ruleset, rulesetId, full, previewTurns, previewHistory };
    } catch (e: unknown) {
      return { ok: false, error: errorMessage(e) };
    }
  }, [cards, effectiveDeckATokens, effectiveDeckBTokens, turns, firstPlayer, ruleset, rulesetId, seasonId, playerA, playerB, deadline, salt]);

  // P1-120: Move tip for BattleHudMint (same data shapes as publishOverlayState)
  const moveTip = React.useMemo(() => {
    if (!sim.ok || turns.length === 0) return null;
    const lastIdx = turns.length - 1;
    const last = turns[lastIdx];
    const lastSummary = sim.previewTurns[lastIdx];
    if (!last || !lastSummary) return null;

    const summaryLite = {
      flipCount: Number(lastSummary.flipCount ?? 0),
      comboCount: Number(lastSummary.comboCount ?? 0),
      comboEffect: (lastSummary.comboEffect ?? "none") as "fever" | "momentum" | "domination" | "none",
      triadPlus: Number(lastSummary.appliedBonus?.triadPlus ?? 0),
      ignoreWarningMark: Boolean(lastSummary.appliedBonus?.ignoreWarningMark),
      warningTriggered: Boolean(lastSummary.warningTriggered),
      warningPlaced: typeof lastSummary.warningPlaced === "number"
        ? Number(lastSummary.warningPlaced) : null,
      flips: lastSummary.flipTraces?.map((f) => ({
        from: f.from, to: f.to, isChain: f.isChain,
        kind: f.kind, dir: f.dir as "up" | "right" | "down" | "left" | undefined,
        vert: f.vert as "up" | "down" | undefined,
        horiz: f.horiz as "left" | "right" | undefined,
        aVal: f.aVal, dVal: f.dVal, tieBreak: f.tieBreak, winBy: f.winBy,
      })),
    };
    const moveLite = {
      turnIndex: lastIdx,
      by: turnPlayer(firstPlayer, lastIdx) as 0 | 1,
      cell: Number(last.cell),
      cardIndex: Number(last.cardIndex ?? 0),
    };
    return generateMoveTip(summaryLite, moveLite);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sim already depends on turns
  }, [sim, turns.length, firstPlayer]);

  const matchId = sim.ok ? sim.full.matchId : null;

  const gameResult: GameResult | null = sim.ok
    ? {
        winner: sim.full.winner === 0 || sim.full.winner === 1 ? sim.full.winner : "draw",
        tilesA: Number(sim.full.tiles.A),
        tilesB: Number(sim.full.tiles.B),
        matchId: sim.full.matchId,
      }
    : null;

  // P1-140: Replay annotations for TurnLog enrichment (computed only after game completes)
  const replayAnnotations = React.useMemo(() => {
    if (!sim.ok || turns.length < 9) return [];
    return annotateReplayMoves(sim.full, firstPlayer as 0 | 1);
  }, [sim, turns.length, firstPlayer]);

  // P1-140: Board advantages for TurnLog AdvantageBadge
  const boardAdvantages = React.useMemo(() => {
    if (!sim.ok) return [];
    return sim.previewHistory.map((b) => assessBoardAdvantage(b));
  }, [sim]);

  React.useEffect(() => {
    if (turns.length >= 9 && sim.ok) {
      setShowResultOverlay(true);
    } else {
      setShowResultOverlay(false);
    }
  }, [turns.length, sim.ok, matchId]);

  const boardNow = sim.ok ? sim.previewHistory[turns.length] ?? EMPTY_BOARD : EMPTY_BOARD;
  const boardAnim = useBoardFlipAnimation(boardNow, sim.ok);
  const cardFlight = useCardFlight();

  // --- Overlay state publishing (unchanged) ---
  React.useEffect(() => {
    try {
      const updatedAtMs = Date.now();

      if (!sim.ok) {
        publishOverlayState({
          version: 1,
          updatedAtMs,
          mode: "live",
          eventId: event?.id,
          eventTitle: event?.title,
          error: sim.error,
        });
        return;
      }

      const lastIndex = turns.length - 1;
      const last = lastIndex >= 0 ? turns[lastIndex] : null;

      const lastMove =
        last && typeof last.cell === "number"
          ? {
              turnIndex: lastIndex,
              by: turnPlayer(firstPlayer, lastIndex),
              cell: Number(last.cell),
              cardIndex: Number(last.cardIndex ?? 0),
              warningMarkCell: typeof last.warningMarkCell === "number" ? Number(last.warningMarkCell) : null,
            }
          : undefined;

      const lastSummary: TurnSummary | null = lastIndex >= 0 ? (sim.previewTurns[lastIndex] ?? null) : null;
      const lastTurnSummary =
        lastSummary
          ? {
              flipCount: Number(lastSummary.flipCount ?? 0),
              comboCount: Number(lastSummary.comboCount ?? 0),
              comboEffect: lastSummary.comboEffect ?? "none",
              triadPlus: Number(lastSummary.appliedBonus?.triadPlus ?? 0),
              ignoreWarningMark: Boolean(lastSummary.appliedBonus?.ignoreWarningMark),
              warningTriggered: Boolean(lastSummary.warningTriggered),
              warningPlaced: typeof lastSummary.warningPlaced === "number" ? Number(lastSummary.warningPlaced) : null,
              flips: lastSummary.flipTraces
                ? lastSummary.flipTraces.map((f) => ({
                    from: f.from,
                    to: f.to,
                    isChain: f.isChain,
                    kind: f.kind,
                    dir: f.dir as "up" | "right" | "down" | "left" | undefined,
                    vert: f.vert as "up" | "down" | undefined,
                    horiz: f.horiz as "left" | "right" | undefined,
                    aVal: f.aVal,
                    dVal: f.dVal,
                    tieBreak: f.tieBreak,
                    winBy: f.winBy,
                  }))
                : undefined,
            }
          : undefined;

      const protocolV1 =
        sim.ok
          ? {
              header: {
                version: Number(sim.transcript.header.version),
                rulesetId: String(sim.transcript.header.rulesetId),
                seasonId: Number(sim.transcript.header.seasonId),
                playerA: String(sim.transcript.header.playerA),
                playerB: String(sim.transcript.header.playerB),
                deckA: sim.transcript.header.deckA.map((x) => x.toString()),
                deckB: sim.transcript.header.deckB.map((x) => x.toString()),
                firstPlayer: sim.transcript.header.firstPlayer as 0 | 1,
                deadline: Number(sim.transcript.header.deadline),
                salt: String(sim.transcript.header.salt),
              },
              turns: turns.map((t) => ({
                cell: Number(t.cell),
                cardIndex: Number(t.cardIndex),
                ...(typeof t.warningMarkCell === "number" ? { warningMarkCell: Number(t.warningMarkCell) } : {}),
              })),
            }
          : undefined;

      publishOverlayState({
        version: 1,
        updatedAtMs,
        mode: "live",
        eventId: event?.id,
        eventTitle: event?.title,
        turn: turns.length,
        firstPlayer,
        playerA,
        playerB,
        rulesetId,
        seasonId,
        deckA: effectiveDeckATokens.map((t) => t.toString()),
        deckB: effectiveDeckBTokens.map((t) => t.toString()),
        protocolV1,
        usedCells: Array.from(used.cells).sort((a, b) => a - b),
        usedCardIndicesA: Array.from(used.usedA).sort((a, b) => a - b),
        usedCardIndicesB: Array.from(used.usedB).sort((a, b) => a - b),
        warningMarksUsedA: warnUsed.A,
        warningMarksUsedB: warnUsed.B,
        board: boardNow,
        lastMove,
        lastTurnSummary,
        aiNote: lastIndex >= 0 ? aiNotes[lastIndex]?.reason : undefined,
        aiReasonCode: lastIndex >= 0 ? aiNotes[lastIndex]?.reasonCode : undefined,
        rpcStatus: rpcStatusRef.current,
        advantage: (() => {
          const adv = assessBoardAdvantage(boardNow);
          return { scoreA: adv.scoreA, levelA: adv.levelA, labelJa: adv.labelJa, badgeColor: adv.badgeColor };
        })(),
        status: sim.full
          ? {
              finished: turns.length >= 9,
              winner: sim.full.winner === "draw" ? "draw" : sim.full.winner === 0 ? "A" : "B",
              tilesA: Number(sim.full.tiles.A),
              tilesB: Number(sim.full.tiles.B),
              matchId: sim.full.matchId,
            }
          : undefined,
      });
    } catch {
      // ignore
    }
  }, [
    sim,
    turns,
    boardNow,
    event?.id,
    event?.title,
    firstPlayer,
    playerA,
    playerB,
    rulesetId,
    seasonId,
    effectiveDeckATokens,
    effectiveDeckBTokens,
    aiNotes,
    used.cells,
    used.usedA,
    used.usedB,
    warnUsed.A,
    warnUsed.B,
  ]);

  const commitTurn = React.useCallback(
    (next: Turn) => {
      setError(null);
      setStatus(null);

      if (turns.length >= 9) {
        setError("All 9 turns are already committed. Reset the match to continue.");
        telemetry.recordInvalidAction();
        return;
      }

      if (next.cell < 0 || next.cell > 8) {
        setError("cell must be in range 0..8.");
        telemetry.recordInvalidAction();
        return;
      }
      if (used.cells.has(next.cell)) {
        setError(`cell ${next.cell} is already used.`);
        telemetry.recordInvalidAction();
        return;
      }

      if (next.cardIndex < 0 || next.cardIndex > 4) {
        setError("cardIndex must be in range 0..4.");
        telemetry.recordInvalidAction();
        return;
      }
      if (classicForcedCardIndex !== null && next.cardIndex !== classicForcedCardIndex) {
        setError(`This turn requires cardIndex ${classicForcedCardIndex}.`);
        telemetry.recordInvalidAction();
        return;
      }
      if (currentUsed.has(next.cardIndex)) {
        setError(`cardIndex ${next.cardIndex} is already used.`);
        telemetry.recordInvalidAction();
        return;
      }

      if (next.warningMarkCell !== undefined) {
        if (currentWarnRemaining <= 0) {
          setError("No warning marks remaining.");
          telemetry.recordInvalidAction();
          return;
        }
        if (next.warningMarkCell === next.cell) {
          setError("warningMarkCell は placed cell と同じにできません");
          telemetry.recordInvalidAction();
          return;
        }
        if (next.warningMarkCell < 0 || next.warningMarkCell > 8) {
          setError("warningMarkCell must be in range 0..8.");
          telemetry.recordInvalidAction();
          return;
        }
        if (used.cells.has(next.warningMarkCell)) {
          setError(`warningMarkCell ${next.warningMarkCell} is already occupied.`);
          telemetry.recordInvalidAction();
          return;
        }
      }

      telemetry.recordPlace();
      setTurns((prev) => [...prev, next]);
      setDraftCell(null);
      setDraftCardIndex(null);
      setDraftWarningMarkCell(null);
      setSelectedTurnIndex(Math.max(0, turns.length));
    },
    [turns.length, used.cells, currentUsed, currentWarnRemaining, telemetry, classicForcedCardIndex]
  );

  const commitMoveWithSelection = React.useCallback((cell: number, cardIndex: number) => {
    const resolvedCardIndex = classicForcedCardIndex ?? cardIndex;
    const move = {
      cell,
      cardIndex: resolvedCardIndex,
      warningMarkCell: draftWarningMarkCell === null ? undefined : draftWarningMarkCell,
    };

    if (isStageFocusRoute) {
      pushStageActionFeedback("Move committed", "success");
    }

    // Card flight animation (mint / engine mode)
    if (useMintUi && !cardFlight.isFlying) {
      const sourceEl = document.querySelector(`[data-hand-card="${resolvedCardIndex}"]`) as HTMLElement | null;
      const targetEl = document.querySelector(`[data-board-cell="${cell}"]`) as HTMLElement | null;
      const card = currentHandCards[resolvedCardIndex];
      if (sourceEl && targetEl && card) {
        cardFlight.launch(card, currentPlayer, sourceEl, targetEl, () => {
          commitTurn(move);
        });
        return;
      }
    }

    // Fallback: commit immediately (non-mint or elements not found)
    commitTurn(move);
  }, [
    cardFlight,
    commitTurn,
    currentHandCards,
    currentPlayer,
    draftWarningMarkCell,
    classicForcedCardIndex,
    isStageFocusRoute,
    pushStageActionFeedback,
    useMintUi,
  ]);

  const commitMove = React.useCallback(() => {
    if (isAiTurn) return;

    if (draftCell === null) {
      setError("Choose a cell before committing the move.");
      telemetry.recordInvalidAction();
      return;
    }
    if (draftCardIndex === null) {
      setError("card を選択してください");
      telemetry.recordInvalidAction();
      return;
    }

    commitMoveWithSelection(draftCell, draftCardIndex);
  }, [commitMoveWithSelection, draftCardIndex, draftCell, isAiTurn, telemetry]);

  const handleHandCardDragStart = React.useCallback((idx: number) => {
    if (!enableHandDragDrop) return;
    if (classicForcedCardIndex !== null && idx !== classicForcedCardIndex) return;
    telemetry.recordInteraction();
    setDraftCardIndex(idx);
    setDragCardIndex(idx);
    setIsHandDragging(true);
  }, [enableHandDragDrop, telemetry, classicForcedCardIndex]);

  const handleHandCardDragEnd = React.useCallback(() => {
    setIsHandDragging(false);
    setDragCardIndex(null);
  }, []);

  const handleBoardDragHover = React.useCallback((cell: number | null) => {
    if (!isHandDragging) return;
    setDraftCell(cell);
  }, [isHandDragging]);

  const handleBoardDrop = React.useCallback((cell: number) => {
    if (!enableHandDragDrop || isAiTurn || turns.length >= 9) return;
    const resolvedCardIndex = classicForcedCardIndex ?? dragCardIndex ?? draftCardIndex;
    if (resolvedCardIndex === null) {
      setError("card を選択してください");
      telemetry.recordInvalidAction();
      return;
    }
    setDraftCardIndex(resolvedCardIndex);
    setDraftCell(cell);
    commitMoveWithSelection(cell, resolvedCardIndex);
    setIsHandDragging(false);
    setDragCardIndex(null);
  }, [
    commitMoveWithSelection,
    classicForcedCardIndex,
    dragCardIndex,
    draftCardIndex,
    enableHandDragDrop,
    isAiTurn,
    telemetry,
    turns.length,
  ]);

  React.useEffect(() => {
    if (enableHandDragDrop) return;
    setIsHandDragging(false);
    setDragCardIndex(null);
  }, [enableHandDragDrop]);

  React.useEffect(() => {
    setIsHandDragging(false);
    setDragCardIndex(null);
  }, [turns.length]);

  const undoMove = React.useCallback(() => {
    setError(null);
    setStatus(null);
    setTurns((prev) => prev.slice(0, -1));
    setAiNotes((prev) => {
      const next = { ...prev };
      delete next[turns.length - 1];
      return next;
    });
    setDraftCell(null);
    setDraftCardIndex(null);
    setDraftWarningMarkCell(null);
    setSelectedTurnIndex((x) => Math.max(0, Math.min(x, Math.max(0, turns.length - 2))));
    if (isStageFocusRoute) {
      pushStageActionFeedback("Move undone", "info");
    }
  }, [isStageFocusRoute, pushStageActionFeedback, turns.length]);

  const doAiMove = React.useCallback(() => {
    if (!isVsNyanoAi) return;
    if (!cards) return;
    if (turns.length >= 9) return;
    if (currentPlayer !== aiPlayer) return;

    const move = pickAiMoveNew({
      difficulty: aiDifficulty,
      boardNow,
      deckTokens: effectiveDeckBTokens,
      usedCardIndexes: used.usedB,
      usedCells: used.cells,
      cards,
      my: aiPlayer,
      warningMarksRemaining: Math.max(0, 3 - warnUsed.B),
    });

    const resolvedCardIndex = classicForcedCardIndex ?? move.cardIndex;
    const tid = effectiveDeckBTokens[resolvedCardIndex];
    const note = `Nyano chose cell ${move.cell}, cardIndex ${resolvedCardIndex}${tid !== undefined ? ` (#${tid.toString()})` : ""} - ${move.reason}`;
    setAiNotes((prev) => ({ ...prev, [turns.length]: { reason: note, reasonCode: move.reasonCode } }));
    setStatus(note);

    commitTurn({
      cell: move.cell,
      cardIndex: resolvedCardIndex,
      warningMarkCell: move.warningMarkCell,
    });
  }, [isVsNyanoAi, cards, turns.length, currentPlayer, aiPlayer, aiDifficulty, boardNow, effectiveDeckBTokens, used.usedB, used.cells, commitTurn, warnUsed.B, classicForcedCardIndex]);

  React.useEffect(() => {
    if (!isVsNyanoAi || !aiAutoPlay || !cards || turns.length >= 9 || currentPlayer !== aiPlayer) {
      setAiAutoMoveDueAtMs(null);
      setAiCountdownMs(null);
      return;
    }
    const delayMs = computeAiAutoMoveDelayMs({
      difficulty: aiDifficulty,
      turnIndex: turns.length,
    });
    const dueAt = Date.now() + delayMs;
    setAiAutoMoveDueAtMs(dueAt);
    setAiCountdownMs(delayMs);
    const t = window.setTimeout(() => {
      setAiAutoMoveDueAtMs(null);
      setAiCountdownMs(null);
      doAiMove();
    }, delayMs);
    return () => {
      window.clearTimeout(t);
    };
  }, [isVsNyanoAi, aiAutoPlay, cards, turns.length, currentPlayer, aiPlayer, aiDifficulty, doAiMove]);

  React.useEffect(() => {
    if (aiAutoMoveDueAtMs === null) return;
    const updateCountdown = () => {
      const remaining = aiAutoMoveDueAtMs - Date.now();
      setAiCountdownMs(Math.max(0, remaining));
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 120);
    return () => window.clearInterval(timer);
  }, [aiAutoMoveDueAtMs]);

  // Stream commands (from /stream)
  React.useEffect(() => {
    if (!streamMode) return;

    return subscribeStreamCommand((cmd: StreamCommandV1) => {
      try {
        if (!cmd || cmd.version !== 1) return;
        if (cmd.id === lastStreamCmdIdRef.current) return;
        lastStreamCmdIdRef.current = cmd.id;

        if (cmd.type !== "commit_move_v1") return;
        if (turns.length >= 9) return;

        if (cmd.by !== streamControlledSide) return;
        if (isVsNyanoAi && currentPlayer === aiPlayer) return;
        if (cmd.forTurn !== turns.length) return;
        if (cmd.by !== currentPlayer) return;

        const wm = cmd.move.warningMarkCell;
        const resolvedCardIndex = classicForcedCardIndex ?? cmd.move.cardIndex;
        commitTurn({
          cell: cmd.move.cell,
          cardIndex: resolvedCardIndex,
          warningMarkCell: typeof wm === "number" ? wm : undefined,
        });

        toast.success("Stream move", `cell ${cmd.move.cell} · cardIndex ${resolvedCardIndex}`);
      } catch {
        // ignore
      }
    });
  }, [streamMode, streamControlledSide, turns.length, currentPlayer, isVsNyanoAi, aiPlayer, commitTurn, toast, classicForcedCardIndex]);

  const canFinalize = turns.length === 9 && sim.ok;

  const copyTranscriptJson = async () => {
    setError(null);
    if (!sim.ok) {
      setError(sim.error);
      return;
    }
    try {
      const json = stringifyWithBigInt(sim.transcript, 2);
      await copyToClipboard(json);
      toast.success("Copied", "transcript JSON");
    } catch (e: unknown) {
      toast.error("Copy failed", errorMessage(e));
    }
  };

  /** Build replay URL (relative or absolute). Respects BASE_URL for subpath deployments.
   *  v2: embeds card data in the payload so Replay can work without RPC/GameIndex.
   *  Falls back to v1 (transcript-only) if cards haven't loaded yet. */
  const buildReplayUrl = React.useCallback((absolute?: boolean): string | null => {
    if (!sim.ok) return null;
    // v2 when cards available; v1 fallback otherwise
    const json = cards
      ? stringifyReplayBundle(buildReplayBundleV2(sim.transcript, cards))
      : stringifyWithBigInt(sim.transcript, 0);
    const z = tryGzipCompressUtf8ToBase64Url(json);
    const data: { key: "z" | "t"; value: string } =
      z ? { key: "z", value: z } : { key: "t", value: base64UrlEncodeUtf8(json) };
    return buildReplayShareUrl({
      data,
      step: 9,
      eventId: event?.id,
      ui: uiParam,
      absolute,
    });
  }, [sim, event, cards, uiParam]);

  const copyShareUrl = async () => {
    setError(null);
    try {
      const url = buildReplayUrl(true);
      if (!url) { toast.warn("Share", "Match not ready - play 9 turns first"); return; }
      await copyToClipboard(url);
      toast.success("Copied!", "Share URL copied to clipboard");
    } catch (e: unknown) {
      toast.error("Share failed", errorMessage(e));
    }
  };

  const openReplay = React.useCallback(async () => {
    setError(null);
    setStatus(null);
    try {
      const url = buildReplayUrl(false);
      if (!url) { toast.warn("Replay", "Match not ready - play 9 turns first"); return; }
      // SPA navigation via react-router (popup-safe, preserves client state)
      navigate(url);
    } catch (e: unknown) {
      toast.error("Replay failed", errorMessage(e));
    }
  }, [buildReplayUrl, navigate, toast]);

  const toggleStageControlsWithFeedback = React.useCallback(() => {
    pushStageActionFeedback(showStageControls ? "Controls hidden" : "Controls shown");
    playMatchUiSfx("card_place");
    toggleStageControls();
  }, [playMatchUiSfx, pushStageActionFeedback, showStageControls, toggleStageControls]);

  const toggleStageAssistWithFeedback = React.useCallback(() => {
    setShowStageAssist((prev) => {
      const next = !prev;
      if (isStageFocusRoute) {
        pushStageActionFeedback(next ? "HUD shown" : "HUD hidden");
        playMatchUiSfx("card_place");
      }
      return next;
    });
  }, [isStageFocusRoute, playMatchUiSfx, pushStageActionFeedback]);

  const toggleStageFullscreenWithFeedback = React.useCallback(() => {
    pushStageActionFeedback(isStageFullscreen ? "Exit fullscreen" : "Enter fullscreen");
    playMatchUiSfx("card_place");
    void toggleStageFullscreen();
  }, [isStageFullscreen, playMatchUiSfx, pushStageActionFeedback, toggleStageFullscreen]);

  const exitFocusModeWithFeedback = React.useCallback(() => {
    pushStageActionFeedback("Exiting focus mode", "warn");
    playMatchUiSfx("flip");
    setFocusMode(false);
  }, [playMatchUiSfx, pushStageActionFeedback, setFocusMode]);

  const openReplayWithFeedback = React.useCallback(() => {
    pushStageActionFeedback("Opening replay");
    playMatchUiSfx("card_place");
    void openReplay();
  }, [openReplay, playMatchUiSfx, pushStageActionFeedback]);

  const doAiMoveWithFeedback = React.useCallback(() => {
    pushStageActionFeedback("Nyano move requested");
    playMatchUiSfx("card_place");
    doAiMove();
  }, [doAiMove, playMatchUiSfx, pushStageActionFeedback]);

  // P0-1: Cell select handler for BoardView / BoardViewRPG
  const handleCellSelect = React.useCallback(
    (cell: number) => {
      if (isAiTurn || turns.length >= 9) return;
      setDraftCell(cell);
    },
    [isAiTurn, turns.length],
  );

  // P1-2: Build NyanoReaction input from last turn
  const nyanoReactionInput: NyanoReactionInput | null = React.useMemo(() => {
    if (!sim.ok) return null;

    const lastIdx = turns.length - 1;
    const lastSummary = lastIdx >= 0 ? sim.previewTurns[lastIdx] : null;

    // Count current tiles
    let tilesA = 0;
    let tilesB = 0;
    for (const cell of boardNow) {
      if (!cell) continue;
      if (cell.owner === 0) tilesA++;
      else tilesB++;
    }

    return {
      flipCount: lastSummary ? Number(lastSummary.flipCount ?? 0) : 0,
      hasChain: lastSummary?.flipTraces ? lastSummary.flipTraces.some((t) => t.isChain) : false,
      comboEffect: lastSummary?.comboEffect ?? "none",
      warningTriggered: Boolean(lastSummary?.warningTriggered),
      tilesA,
      tilesB,
      perspective: 0 as PlayerIndex,
      finished: turns.length >= 9,
      winner: turns.length >= 9 ? sim.full.winner : null,
    };
  }, [sim, turns.length, boardNow]);
  const currentAiReasonCode = React.useMemo(
    () => (turns.length > 0 ? aiNotes[turns.length - 1]?.reasonCode : undefined),
    [aiNotes, turns.length],
  );
  const nyanoReactionImpact = React.useMemo(() => {
    if (!nyanoReactionInput) return "low" as const;
    const kind = pickReactionKind(nyanoReactionInput);
    return resolveReactionCutInImpact(kind, currentAiReasonCode);
  }, [nyanoReactionInput, currentAiReasonCode]);
  const [stageImpactBurst, setStageImpactBurst] = React.useState(false);

  React.useEffect(() => {
    if (!isEngineFocus || !nyanoReactionInput) {
      setStageImpactBurst(false);
      return;
    }
    if (nyanoReactionImpact === "low") {
      setStageImpactBurst(false);
      return;
    }
    setStageImpactBurst(true);
    const burstMs = nyanoReactionImpact === "high" ? 960 : 760;
    const timer = window.setTimeout(() => setStageImpactBurst(false), burstMs);
    return () => window.clearTimeout(timer);
  }, [isEngineFocus, nyanoReactionInput, nyanoReactionImpact, turns.length]);

  // P1-1: flipTraces summary for last turn
  const lastFlipSummaryText: string | null = React.useMemo(() => {
    if (!sim.ok || turns.length === 0) return null;
    const lastSummary = sim.previewTurns[turns.length - 1];
    if (!lastSummary?.flipTraces || lastSummary.flipTraces.length === 0) return null;
    return flipTracesSummary(lastSummary.flipTraces);
  }, [sim, turns.length]);

  // D-1/D-2: Extract FlipTraceArrow[] for Mint arrow overlay
  const lastFlipTraces: readonly FlipTraceArrow[] | null = React.useMemo(() => {
    if (!useMintUi || !sim.ok || turns.length === 0) return null;
    const lastSummary = sim.previewTurns[turns.length - 1];
    if (!lastSummary?.flipTraces || lastSummary.flipTraces.length === 0) return null;
    return lastSummary.flipTraces.map((f: FlipTraceV1) => ({
      from: Number(f.from),
      to: Number(f.to),
      isChain: Boolean(f.isChain),
      kind: f.kind === "diag" ? "diag" as const : "ortho" as const,
      aVal: Number(f.aVal ?? 0),
      dVal: Number(f.dVal ?? 0),
      tieBreak: Boolean(f.tieBreak),
    }));
  }, [useMintUi, sim, turns.length]);

  // D-3: SFX trigger on board animation changes
  const prevFlipCountRef = React.useRef(0);
  React.useEffect(() => {
    if (!sfx || !boardAnim.isAnimating) return;
    const flipCount = boardAnim.flippedCells.length;
    if (boardAnim.placedCell !== null && prevFlipCountRef.current === 0) {
      sfx.play("card_place");
    }
    if (flipCount > 0 && flipCount !== prevFlipCountRef.current) {
      const hasChain = lastFlipTraces?.some((t) => t.isChain) ?? false;
      sfx.play(hasChain ? "chain_flip" : "flip");
    }
    prevFlipCountRef.current = flipCount;
  }, [sfx, boardAnim.isAnimating, boardAnim.placedCell, boardAnim.flippedCells.length, lastFlipTraces]);

  // D-3: SFX on game end
  React.useEffect(() => {
    if (!sfx || turns.length < 9 || !sim.ok) return;
    const winner = sim.full.winner;
    if (winner === "draw") return; // no fanfare for draw
    // Perspective = player A: victory if A wins, defeat if B wins
    if (winner === 0) sfx.play("victory_fanfare");
    else sfx.play("defeat_sad");
  }, [sfx, turns.length, sim]);

  // D-3: SFX error buzz on validation error
  React.useEffect(() => {
    if (!sfx || !error) return;
    sfx.play("error_buzz");
  }, [sfx, error]);

  // P0-2: Build TurnLogRPG entries from sim
  const rpgLogEntries: TurnLogEntry[] = React.useMemo(() => {
    if (!sim.ok) return [];
    return sim.previewTurns.map((t) => ({
      turnIndex: t.turnIndex,
      player: t.player,
      cell: t.cell,
      janken: cards?.get(t.tokenId)?.jankenHand ?? 0,
      flipCount: t.flipCount,
    }));
  }, [sim, cards]);

  const showMintTopHud = isMint && showStageAssistUi && sim.ok;
  const showMintDetailHud = useMintUi && showStageAssistUi && sim.ok && (!isMint || density !== "minimal");
  const showMintPlayerPanels = isMint && !isStageFocusRoute;
  const showDesktopQuickCommit = useMintUi
    && !isRpg
    && !isAiTurn
    && turns.length < 9
    && (draftCardIndex !== null || draftCell !== null)
    && !isStageFocusRoute;
  const showFocusHandDock = isEngineFocus
    && useMintUi
    && !isRpg
    && turns.length < 9
    && currentDeckTokens.length > 0;
  const showFocusToolbarActions = isStageFocusRoute && showFocusHandDock && showStageControls;
  const canCommitFromFocusToolbar = !isAiTurn && draftCell !== null && draftCardIndex !== null;
  const canUndoFromFocusToolbar = !isAiTurn && turns.length > 0;
  const canManualAiMoveFromFocusToolbar = isVsNyanoAi && !aiAutoPlay && isAiTurn;

  React.useEffect(() => {
    if (!isStageFocusRoute || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || target?.isContentEditable) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const lower = e.key.toLowerCase();
      if (e.key === "Escape") {
        e.preventDefault();
        exitFocusModeWithFeedback();
        return;
      }
      if (lower === "f") {
        e.preventDefault();
        toggleStageFullscreenWithFeedback();
        return;
      }
      if (lower === "c") {
        e.preventDefault();
        toggleStageControlsWithFeedback();
        return;
      }
      if (lower === "h") {
        e.preventDefault();
        toggleStageAssistWithFeedback();
        return;
      }
      if (lower === "r" && canFinalize) {
        e.preventDefault();
        openReplayWithFeedback();
        return;
      }
      if (e.key === "Enter" && canCommitFromFocusToolbar) {
        e.preventDefault();
        commitMove();
        return;
      }
      if (e.key === "Backspace" && canUndoFromFocusToolbar) {
        e.preventDefault();
        undoMove();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    isStageFocusRoute,
    exitFocusModeWithFeedback,
    toggleStageFullscreenWithFeedback,
    toggleStageControlsWithFeedback,
    toggleStageAssistWithFeedback,
    canFinalize,
    openReplayWithFeedback,
    canCommitFromFocusToolbar,
    commitMove,
    canUndoFromFocusToolbar,
    undoMove,
  ]);

  /* ======================================================================
     RENDER
     ====================================================================== */

  return (
    <div
      ref={stageViewportRef}
      className={
        isStageFocusRoute
          ? "stage-focus-root"
          : isEngineFocus
            ? "grid gap-4"
            : "grid gap-6"
      }
    >
      {/* ── Result Overlay ── */}
      {gameResult && (
        useMintUi ? (
          <GameResultOverlayMint
            show={showResultOverlay && turns.length >= 9}
            result={gameResult}
            onDismiss={() => setShowResultOverlay(false)}
            onRematch={handleRematch}
            onReplay={() => { void openReplay(); }}
            onShare={() => { void copyShareUrl(); }}
            annotations={replayAnnotations}
          />
        ) : isRpg ? (
          <GameResultOverlayRPG
            show={showResultOverlay && turns.length >= 9}
            result={gameResult}
            onDismiss={() => setShowResultOverlay(false)}
            onRematch={handleRematch}
            onReplay={() => { void openReplay(); }}
            onShare={() => { void copyShareUrl(); }}
          />
        ) : (
          <GameResultOverlay
            show={showResultOverlay && turns.length >= 9}
            result={gameResult}
            onDismiss={() => setShowResultOverlay(false)}
            onRematch={handleRematch}
            onReplay={() => { void openReplay(); }}
            onShare={() => { void copyShareUrl(); }}
          />
        )
      )}

      {isEngineFocus && (
        <section
          className={[
            "rounded-2xl border px-3 py-2",
            isStageFocusRoute ? "stage-focus-toolbar" : "",
          ].filter(Boolean).join(" ")}
          aria-label={isStageFocusRoute ? "Stage focus toolbar" : "Engine focus toolbar"}
          style={{ background: "var(--mint-surface, #fff)", borderColor: "var(--mint-accent-muted, #A7F3D0)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold" style={{ color: "var(--mint-text-secondary, #4B5563)" }}>
              Pixi Focus Mode · turn {currentTurnIndex}/9 · warning left {currentWarnRemaining}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {showFocusToolbarActions ? (
                <div className="stage-focus-toolbar-actions">
                  <span className="stage-focus-toolbar-status">
                    {draftCardIndex !== null ? `card ${draftCardIndex + 1}` : "pick card"} | {draftCell !== null ? `cell ${draftCell}` : "pick cell"}
                  </span>
                  <span className="stage-focus-toolbar-hint" aria-label="Battle focus toolbar hint">
                    tap/drag then commit · Enter/Backspace · F/C/H/R/Esc
                  </span>
                  <label className="stage-focus-toolbar-speed">
                    warning
                    <select
                      className="stage-focus-toolbar-speed-select"
                      value={draftWarningMarkCell === null ? "" : String(draftWarningMarkCell)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraftWarningMarkCell(v === "" ? null : Number(v));
                      }}
                      disabled={isAiTurn || turns.length >= 9 || currentWarnRemaining <= 0}
                      aria-label="Warning mark from focus toolbar"
                    >
                      <option value="">none</option>
                      {availableCells
                        .filter((c) => c !== draftCell)
                        .map((c) => (
                          <option key={`focus-toolbar-w-${c}`} value={String(c)}>cell {c}</option>
                        ))}
                    </select>
                  </label>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={commitMove}
                    disabled={!canCommitFromFocusToolbar}
                    aria-label="Commit move from focus toolbar"
                  >
                    Commit
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={undoMove}
                    disabled={!canUndoFromFocusToolbar}
                    aria-label="Undo move from focus toolbar"
                  >
                    Undo
                  </button>
                  {canManualAiMoveFromFocusToolbar ? (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={doAiMoveWithFeedback}
                      aria-label="Nyano AI move from focus toolbar"
                    >
                      Nyano Move
                    </button>
                  ) : null}
                </div>
              ) : null}
              {isStageFocusRoute ? (
                <span
                  className={[
                    "stage-focus-toolbar-feedback",
                    `stage-focus-toolbar-feedback--${stageActionFeedbackTone}`,
                  ].join(" ")}
                  role="status"
                  aria-live="polite"
                  aria-label="Battle focus action feedback"
                >
                  {stageActionFeedback || "Ready"}
                </span>
              ) : null}
              {isStageFocusRoute ? (
                <>
                  <label className="stage-focus-toolbar-speed">
                    vfx
                    <select
                      className="stage-focus-toolbar-speed-select"
                      value={vfxPreference}
                      onChange={(e) => handleStageVfxChange(e.target.value as VfxPreference)}
                      aria-label="VFX quality from focus toolbar"
                    >
                      {STAGE_VFX_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value === "auto" ? `auto (${resolvedVfxQuality})` : option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {sfx ? (
                    <button
                      className={[
                        "mint-sfx-toggle",
                        sfxMuted && "mint-sfx-toggle--muted",
                      ].filter(Boolean).join(" ")}
                      onClick={handleSfxToggle}
                      title={sfxMuted ? "Sound ON" : "Sound OFF"}
                      aria-label={sfxMuted ? "Unmute sound effects" : "Mute sound effects"}
                    >
                      {sfxMuted ? "🔇" : "🔊"}
                    </button>
                  ) : null}
                  <button className="btn btn-sm" onClick={toggleStageFullscreenWithFeedback}>
                    {isStageFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  </button>
                  <button className="btn btn-sm" onClick={toggleStageControlsWithFeedback}>
                    {showStageControls ? "Hide Controls" : "Show Controls"}
                  </button>
                  <button className="btn btn-sm" onClick={toggleStageAssistWithFeedback}>
                    {showStageAssist ? "Hide HUD" : "Show HUD"}
                  </button>
                </>
              ) : null}
              <button className="btn btn-sm" onClick={exitFocusModeWithFeedback}>
                Exit Focus
              </button>
              <button className="btn btn-sm" onClick={openReplayWithFeedback} disabled={!canFinalize}>
                Replay
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Hero ── */}
      {!isEngineFocus && (<section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col items-start gap-4 p-4 md:flex-row md:items-center md:p-6">
          <NyanoImage size={96} className="shadow-sm" alt="Nyano" />
          <div className="min-w-0">
            <div className="text-xl font-semibold">Nyano Triad League</div>
            <div className="mt-1 text-sm text-slate-600">
              Play Nyano NFT cards in a community-driven triad battle. Share transcripts, stream matches, and gather votes.
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">ETH on-chain</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Replay share</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Twitch voting</span>
            </div>
          </div>
        </div>
      </section>)}

      {/* ── Event ── */}
      {!isEngineFocus && event ? (
        <section className="card">
          <div className="card-hd flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-base font-semibold">Event: {event.title}</div>
              <div className="text-xs text-slate-500">
                status: <span className="font-medium">{eventStatus}</span> · ruleset={event.rulesetKey} · ai={event.aiDifficulty}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link className="btn no-underline" to="/events">All events</Link>
              <button className="btn" onClick={clearEvent}>Leave event</button>
            </div>
          </div>
          <div className="card-bd grid gap-2 text-sm text-slate-700">
            <p>{event.description}</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Nyano deck tokenIds: <span className="font-mono">{event.nyanoDeckTokenIds.join(", ")}</span>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Guest mode banner ── */}
      {!isEngineFocus && isGuestMode && (
        <section className="rounded-2xl border border-nyano-200 bg-nyano-50 p-4">
          <div className="flex items-center gap-3">
            <NyanoAvatar size={48} expression="playful" />
            <div>
              <div className="font-semibold text-nyano-800">Guest Quick Play</div>
              <div className="text-xs text-nyano-600">
                Trying a random deck in guest mode. To play with your own deck, create one in <Link className="font-medium underline" to="/decks">Decks</Link>.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Mini Tutorial (guest mode, first visit only) ── */}
      {!isEngineFocus && isGuestMode && <MiniTutorial />}

            {/* Match Setup */}
      {!isEngineFocus && !isGuestMode ? (
        <MatchSetupPanelMint
          defaultOpen={!cards}
          decks={decks}
          deckAId={deckAId}
          deckBId={deckBId}
          deckA={deckA}
          deckB={deckB}
          eventDeckTokenIds={event ? event.nyanoDeckTokenIds : null}
          isEvent={isEvent}
          opponentMode={opponentMode}
          isVsNyanoAi={isVsNyanoAi}
          aiDifficulty={aiDifficulty}
          aiAutoPlay={aiAutoPlay}
          streamMode={streamMode}
          streamCtrlParam={streamCtrlParam}
          ui={ui}
          isEngine={isEngine}
          stageMatchUrl={stageMatchUrl}
          rulesetKey={rulesetKey}
          chainCapPerTurnParam={chainCapPerTurnParam}
          chainCapRawParam={chainCapRawParam}
          maxChainCapPerTurn={MAX_CHAIN_CAP_PER_TURN}
          classicSwapLabel={classicSwapLabel}
          classicOpenLabel={classicOpenLabel}
          rulesetId={rulesetId}
          firstPlayerMode={firstPlayerMode}
          manualFirstPlayerParam={manualFirstPlayerParam}
          mutualChoiceAParam={mutualChoiceAParam}
          mutualChoiceBParam={mutualChoiceBParam}
          commitRevealSaltParam={commitRevealSaltParam}
          seedResolutionParam={seedResolutionParam}
          committedMutualPlayerAParam={committedMutualPlayerAParam}
          committedMutualPlayerBParam={committedMutualPlayerBParam}
          committedMutualNonceAParam={committedMutualNonceAParam}
          committedMutualNonceBParam={committedMutualNonceBParam}
          committedMutualCommitAParam={committedMutualCommitAParam}
          committedMutualCommitBParam={committedMutualCommitBParam}
          commitRevealAParam={commitRevealAParam}
          commitRevealBParam={commitRevealBParam}
          commitRevealCommitAParam={commitRevealCommitAParam}
          commitRevealCommitBParam={commitRevealCommitBParam}
          firstPlayerResolution={firstPlayerResolution}
          firstPlayer={firstPlayer}
          dataMode={dataMode}
          canLoad={canLoad}
          loading={loading}
          status={status}
          error={!cards ? error : null}
          showRpcSettingsCta={Boolean(!cards && error && looksLikeRpcError(error))}
          overlayUrl={overlayUrl}
          onSetParam={setParam}
          onSetFocusMode={setFocusMode}
          onFirstPlayerModeChange={handleFirstPlayerModeChange}
          onBoardUiChange={handleBoardUiChange}
          onSetDataMode={setDataMode}
          onLoadCards={loadCards}
          onResetMatch={resetMatch}
          onNewSalt={() => setSalt(randomSalt())}
          onCopySetupLink={handleCopySetupLink}
          onRandomizeCommitReveal={handleRandomizeCommitReveal}
          onDeriveCommitRevealCommits={handleDeriveCommitRevealCommits}
          onRandomizeCommittedMutualChoice={handleRandomizeCommittedMutualChoice}
          onDeriveCommittedMutualChoiceCommits={handleDeriveCommittedMutualChoiceCommits}
          onRandomizeSeedResolution={handleRandomizeSeedResolution}
        />
      ) : null}
{/* ==================================================================
         GAME ARENA - unified play section (P0-1 / P0-2)
         ================================================================== */}
      <section
        className={
          isEngineFocus
            ? ["rounded-2xl border", isStageFocusRoute ? "stage-focus-arena-shell" : ""].filter(Boolean).join(" ")
            : isRpg
              ? "rounded-2xl"
              : "card"
        }
        style={
          isRpg
            ? { background: "#0A0A0A" }
            : isEngineFocus
              ? { background: "var(--mint-surface, #fff)", borderColor: "var(--mint-accent-muted, #A7F3D0)" }
              : undefined
        }
      >
        {!isRpg && !isEngineFocus && (
          <div className="card-hd flex flex-wrap items-start justify-between gap-2">
            <div>
            <div className="text-base font-semibold">
              Game · turn {currentTurnIndex}/9
              {isAiTurn ? " · Nyano AI" : ` · Player ${currentPlayer === 0 ? "A" : "B"}`}
            </div>
            <div className="text-xs text-slate-500">
              warning marks left: {currentWarnRemaining}
              {streamMode ? " · stream mode ON" : ""}
              {isGuestMode ? " · guest" : ""}
              {!isGuestMode && (
                <span className={`ml-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${dataMode === "fast" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                  {dataMode === "fast" ? "Fast (index)" : "Verified (on-chain)"}
                </span>
              )}
            </div>
            </div>
            {isEngine ? (
              <div className="flex flex-wrap items-center gap-2">
                <button className="btn btn-sm" onClick={() => setFocusMode(true)}>
                  Enter Pixi Focus
                </button>
                <Link className="btn btn-sm no-underline" to={stageMatchUrl}>
                  Open Stage Page
                </Link>
              </div>
            ) : null}
          </div>
        )}

        <div
          className={
            isRpg
              ? "p-4"
              : isEngineFocus
                ? ["p-2 md:p-3", isStageFocusRoute ? "stage-focus-arena-inner" : ""].filter(Boolean).join(" ")
                : "card-bd"
          }
        >
          {!cards ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              {loading ? (
                <div className="grid gap-4 py-4">
                  <SkeletonBoard className="max-w-[280px] mx-auto" />
                  <SkeletonHand className="max-w-[400px] mx-auto" />
                  <div className="text-center text-xs text-surface-400">Loading cards...</div>
                </div>
              ) : isGuestMode ? (
                <button className="btn btn-primary" onClick={() => void loadCardsFromIndex()}>Start Guest Match</button>
              ) : (
                <>Select decks in Match Setup, then press <strong>Load Cards</strong>.</>
              )}
            </div>
          ) : (
            <div
              className={
                useMintUi
                  ? (isEngineFocus
                    ? ["grid gap-4", isStageFocusRoute ? "stage-focus-columns" : ""].filter(Boolean).join(" ")
                    : "grid gap-6")
                  : "grid gap-6 lg:grid-cols-[1fr_300px]"
              }
            >
              {/* ── Left: Board + Hand ── */}
              <div className={["grid gap-4", isStageFocusRoute ? "stage-focus-main-column" : ""].filter(Boolean).join(" ")}>
                {/* Guest deck preview */}
                {!isEngineFocus && isGuestMode && cards && (
                  <details open={turns.length === 0} className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-surface-700">
                      Deck Preview
                    </summary>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-medium text-player-a-600 mb-1">Your Deck (A)</div>
                        <div className="deck-preview-grid grid grid-cols-5 gap-2">
                          {guestDeckATokens.map((tid, i) => {
                            const c = cards.get(tid);
                            return c ? <CardMini key={i} card={c} owner={0} /> : null;
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-player-b-600 mb-1">Nyano Deck (B)</div>
                        {classicOpenCardIndices ? (
                          <div className="mb-1 text-[11px] text-slate-500">
                            {classicOpenCardIndices.mode === "all_open"
                              ? "Open rule: all cards revealed"
                              : `Open rule: slots ${formatClassicOpenSlots(classicOpenCardIndices.playerB)} revealed`}
                          </div>
                        ) : null}
                        <div className="deck-preview-grid grid grid-cols-5 gap-2">
                          {guestDeckBTokens.map((tid, i) => {
                            const c = cards.get(tid);
                            if (!c) return null;
                            if (!guestOpponentVisibleCardIndices || guestOpponentVisibleCardIndices.has(i)) {
                              return <CardMini key={i} card={c} owner={1} />;
                            }
                            return <HiddenDeckPreviewCard key={i} slotIndex={i} />;
                          })}
                        </div>
                      </div>
                    </div>
                  </details>
                )}

                {/* ScoreBar / BattleHud */}
                {showStageAssistUi && sim.ok && (
                  useMintUi ? (
                    <div className="grid gap-2">
                      {showMintTopHud && (
                        <div className="mint-top-hud-row">
                          <div className="mint-top-hud-row__main">
                            <BattleTopHudMint
                              board={boardNow}
                              turnCount={turns.length}
                              maxTurns={9}
                              currentPlayer={currentPlayer}
                            />
                          </div>
                          {sfx && !isStageFocusRoute && (
                            <button
                              className={[
                                "mint-sfx-toggle",
                                sfxMuted && "mint-sfx-toggle--muted",
                              ].filter(Boolean).join(" ")}
                              onClick={handleSfxToggle}
                              title={sfxMuted ? "Sound ON" : "Sound OFF"}
                              aria-label={sfxMuted ? "Unmute sound effects" : "Mute sound effects"}
                            >
                              {sfxMuted ? "🔇" : "🔊"}
                            </button>
                          )}
                        </div>
                      )}

                      {showMintDetailHud && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <BattleHudMint
                              board={boardNow}
                              turnCount={turns.length}
                              maxTurns={9}
                              currentPlayer={currentPlayer}
                              tone={isEngine ? "pixi" : "mint"}
                              gamePhase={
                                turns.length >= 9 ? "game_over"
                                  : isAiTurn ? "ai_turn"
                                  : draftCardIndex !== null ? "select_cell"
                                  : "select_card"
                              }
                              moveTip={moveTip}
                              aiReasonCode={turns.length > 0 ? aiNotes[turns.length - 1]?.reasonCode : undefined}
                            />
                          </div>
                          {/* D-3: SFX Mute Toggle (engine mode keeps legacy placement) */}
                          {sfx && !isStageFocusRoute && !showMintTopHud && (
                            <button
                              className={[
                                "mint-sfx-toggle",
                                sfxMuted && "mint-sfx-toggle--muted",
                              ].filter(Boolean).join(" ")}
                              onClick={handleSfxToggle}
                              title={sfxMuted ? "Sound ON" : "Sound OFF"}
                              aria-label={sfxMuted ? "Unmute sound effects" : "Mute sound effects"}
                            >
                              {sfxMuted ? "🔇" : "🔊"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <ScoreBar
                      board={boardNow}
                      moveCount={turns.length}
                      maxMoves={9}
                      winner={turns.length >= 9 ? sim.full.winner : null}
                    />
                  )
                )}

                {/* AI turn notice */}
                {showStageAssistUi && isAiTurn && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {aiAutoPlay ? (
                      <span>
                        <span className="font-semibold animate-pulse">Nyano is thinking...</span>
                        {aiCountdownMs !== null ? ` ${Math.max(0.1, aiCountdownMs / 1000).toFixed(1)}s` : ""}
                      </span>
                    ) : (
                      "Nyano turn. Press \"Nyano Move\"."
                    )}
                  </div>
                )}

                {isEngine && engineRendererFailed && (
                  <div
                    className={[
                      "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900",
                      isStageFocusRoute ? "fixed left-3 right-3 top-20 z-40 shadow-lg" : "",
                    ].join(" ")}
                  >
                    <span title={engineRendererError ?? undefined}>
                      Pixi renderer is unavailable. Showing Mint fallback board.
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={handleRetryEngineRenderer}
                      aria-label="Retry Pixi renderer"
                    >
                      Retry Pixi
                    </button>
                  </div>
                )}

                {/* ────────────────────────────────────────────
                    P0-1: Interactive Board (unified input)
                    
                    BoardView / BoardViewRPG with:
                    - selectableCells = empty cells (when it's your turn)
                    - selectedCell = draftCell
                    - onCellSelect = handleCellSelect
                    ──────────────────────────────────────────── */}
                <div
                  className={[
                    isStageFocusRoute ? "stage-focus-board-shell" : "",
                    showMintPlayerPanels ? "mint-battle-layout" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {showMintPlayerPanels && (
                    <PlayerSidePanelMint
                      side="left"
                      playerIndex={0}
                      isActive={currentPlayer === 0}
                      remainingCards={remainingCardsA}
                    />
                  )}

                  <div className={showMintPlayerPanels ? "mint-battle-layout__board" : ""}>
                    {sim.ok ? (
                      isMint || (isEngine && engineRendererFailed) ? (
                        <DuelStageMint impact={nyanoReactionImpact} impactBurst={stageImpactBurst}>
                          <BoardViewMint
                            board={boardNow}
                            selectedCell={draftCell}
                            placedCell={boardAnim.placedCell}
                            flippedCells={boardAnim.flippedCells}
                            selectableCells={selectableCells}
                            onCellSelect={(cell) => { telemetry.recordInteraction(); handleCellSelect(cell); }}
                            currentPlayer={currentPlayer}
                            showCoordinates
                            showActionPrompt
                            gamePhase={
                              turns.length >= 9 ? "game_over"
                                : isAiTurn ? "ai_turn"
                                : draftCardIndex !== null ? "select_cell"
                                : "select_card"
                            }
                            inlineError={error}
                            onDismissError={() => setError(null)}
                            flipTraces={showStageAssistUi && density !== "minimal" ? lastFlipTraces : null}
                            isFlipAnimating={boardAnim.isAnimating}
                            dragDropEnabled={enableHandDragDrop && isHandDragging}
                            onCellDrop={handleBoardDrop}
                            onCellDragHover={handleBoardDragHover}
                          />
                        </DuelStageMint>
                      ) : useEngineRenderer ? (
                        <DuelStageMint impact={nyanoReactionImpact} impactBurst={stageImpactBurst}>
                          <BattleStageEngine
                            board={boardNow}
                            selectedCell={draftCell}
                            selectableCells={selectableCells}
                            onCellSelect={(cell) => { telemetry.recordInteraction(); handleCellSelect(cell); }}
                            currentPlayer={currentPlayer}
                            boardMaxWidthPx={engineBoardMaxWidthPx}
                            boardMinHeightPx={engineBoardMinHeightPx}
                            preloadTokenIds={currentDeckTokens}
                            placedCell={boardAnim.placedCell}
                            flippedCells={boardAnim.flippedCells}
                            vfxQuality={resolvedVfxQuality}
                            showActionPrompt={showStageAssistUi}
                            gamePhase={
                              turns.length >= 9 ? "game_over"
                                : isAiTurn ? "ai_turn"
                                : draftCardIndex !== null ? "select_cell"
                                : "select_card"
                            }
                            inlineError={error}
                            onDismissError={() => setError(null)}
                            flipTraces={showStageAssistUi && density !== "minimal" ? lastFlipTraces : null}
                            isFlipAnimating={boardAnim.isAnimating}
                            dragDropActive={enableHandDragDrop && isHandDragging}
                            onCellDrop={handleBoardDrop}
                            onCellDragHover={handleBoardDragHover}
                            onInitError={handleEngineRendererInitError}
                          />
                        </DuelStageMint>
                      ) : isRpg ? (
                        <BoardViewRPG
                          board={boardNow}
                          selectedCell={draftCell}
                          placedCell={boardAnim.placedCell}
                          flippedCells={boardAnim.flippedCells}
                          selectableCells={selectableCells}
                          onCellSelect={handleCellSelect}
                          currentPlayer={currentPlayer}
                          showCoordinates
                          showCandles
                          showParticles
                        />
                      ) : (
                        <BoardView
                          board={boardNow}
                          selectedCell={draftCell}
                          placedCell={boardAnim.placedCell}
                          flippedCells={boardAnim.flippedCells}
                          selectableCells={selectableCells}
                          onCellSelect={handleCellSelect}
                          currentPlayer={currentPlayer}
                          showCoordinates
                        />
                      )
                    ) : (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                        engine error: {!sim.ok ? sim.error : "unknown"}
                      </div>
                    )}
                  </div>

                  {showMintPlayerPanels && (
                    <PlayerSidePanelMint
                      side="right"
                      playerIndex={1}
                      isActive={currentPlayer === 1}
                      remainingCards={remainingCardsB}
                    />
                  )}
                </div>

                {showDesktopQuickCommit ? (
                  <div
                    className="hidden lg:flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
                    style={{ background: "var(--mint-surface, #ffffff)", borderColor: "var(--mint-accent-muted, #A7F3D0)" }}
                  >
                    <div className="grid gap-0.5 text-xs">
                      <div className="font-semibold" style={{ color: "var(--mint-text, #111827)" }}>
                        Quick Commit
                      </div>
                      <div style={{ color: "var(--mint-text-secondary, #4B5563)" }}>
                        card {draftCardIndex !== null ? draftCardIndex + 1 : "-"} to cell {draftCell ?? "-"}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className="inline-flex items-center gap-2 text-xs font-semibold"
                        style={{ color: "var(--mint-text-secondary, #4B5563)" }}
                      >
                        warning
                        <select
                          className="input h-10 min-w-[170px]"
                          value={draftWarningMarkCell === null ? "" : String(draftWarningMarkCell)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDraftWarningMarkCell(v === "" ? null : Number(v));
                          }}
                          disabled={turns.length >= 9 || isAiTurn || currentWarnRemaining <= 0}
                          aria-label="Quick warning mark cell"
                        >
                          <option value="">None</option>
                          {availableCells
                            .filter((c) => c !== draftCell)
                            .map((c) => (
                              <option key={`quick-${c}`} value={String(c)}>cell {c}</option>
                            ))}
                        </select>
                      </label>
                      <button
                        className="btn btn-primary h-10 px-4"
                        onClick={commitMove}
                        disabled={turns.length >= 9 || isAiTurn || draftCell === null || draftCardIndex === null}
                        aria-label="Quick commit move"
                      >
                        Commit Move
                      </button>
                      <button
                        className="btn h-10 px-4"
                        onClick={undoMove}
                        disabled={turns.length === 0}
                        aria-label="Quick undo move"
                      >
                        Undo
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* FLIGHT-0100: Card flight animation portal */}
                {cardFlight.state && <CardFlight {...cardFlight.state} />}

                {/* Last move feedback */}
                {boardAnim.isAnimating && (
                  <LastMoveFeedback
                    placedCell={boardAnim.placedCell}
                    flippedCells={boardAnim.flippedCells}
                    turnPlayer={turns.length > 0 ? (turnPlayer(firstPlayer, turns.length - 1) === 0 ? "A" : "B") : "A"}
                  />
                )}

                {/* P1-1: Flip summary in Japanese (density >= standard) */}
                {showStageAssistUi && (!useMintUi || density !== "minimal") && lastFlipSummaryText && (
                  <div className={
                    useMintUi
                      ? "rounded-xl border px-3 py-2 text-xs font-semibold"
                      : isRpg
                        ? "rounded-lg px-3 py-2 text-xs font-semibold"
                        : "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                  }
                  style={
                    useMintUi ? { background: "var(--mint-warning-bg)", color: "var(--mint-flip)", borderColor: "rgba(245,158,11,0.2)" }
                    : isRpg ? { background: "rgba(245,166,35,0.15)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }
                    : undefined
                  }
                  >
                    Battle: {lastFlipSummaryText}
                  </div>
                )}

                {/* P1-2: Nyano Reaction (stable slot prevents layout jump) */}
                <NyanoReactionSlot
                  input={nyanoReactionInput}
                  turnIndex={turns.length}
                  rpg={isRpg}
                  mint={useMintUi}
                  tone={isEngine ? "pixi" : "mint"}
                  aiReasonCode={currentAiReasonCode}
                  stageFocus={isStageFocusRoute}
                />

                {showFocusHandDock && (
                  <div
                    className={[
                      "mint-focus-hand-dock sticky bottom-2 z-20 grid gap-2 rounded-2xl border p-2 shadow-xl backdrop-blur",
                      isStageFocusRoute ? "mint-focus-hand-dock--stage" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold text-slate-700">Hand Dock</div>
                      <div className="text-[10px] text-slate-500">
                        {isAiTurn ? "Nyano is thinking..." : `${draftCardIndex !== null ? `card ${draftCardIndex + 1}` : "pick card"} to ${draftCell !== null ? `cell ${draftCell}` : "tap cell"}`}
                      </div>
                    </div>

                    <div className="mint-focus-hand-row">
                      {currentDeckTokens.map((tid, idx) => {
                        const card = cards?.get(tid);
                        const usedHere = effectiveUsedCardIndices.has(idx);
                        const selected = draftCardIndex === idx;
                        const dockDisabled = usedHere || isAiTurn || turns.length >= 9;
                        const center = (currentDeckTokens.length - 1) / 2;
                        const fanOffset = idx - center;
                        const fanRotate = Math.max(-12, Math.min(12, fanOffset * 4));
                        const fanDrop = Math.min(10, Math.abs(fanOffset) * 2.2);
                        const fanStyle = {
                          ["--focus-hand-rot" as const]: `${fanRotate}deg`,
                          ["--focus-hand-drop" as const]: `${fanDrop}px`,
                        } satisfies React.CSSProperties & Record<"--focus-hand-rot" | "--focus-hand-drop", string>;
                        if (!card) {
                          return (
                            <button
                              key={`focus-dock-loading-${idx}`}
                              type="button"
                              className={[
                                "mint-focus-hand-card",
                                "mint-focus-hand-card--loading",
                                selected && "mint-focus-hand-card--selected",
                                dockDisabled && "mint-focus-hand-card--used",
                              ].join(" ")}
                              style={fanStyle}
                              aria-label={`Focus hand card ${idx + 1} loading`}
                              disabled
                            >
                              <div className="text-[10px] font-semibold text-slate-500">#{tid.toString()}</div>
                              <div className="mt-1 text-[10px] text-slate-400">loading</div>
                            </button>
                          );
                        }
                        return (
                          <button
                            key={`focus-dock-${idx}`}
                            type="button"
                            className={[
                              "mint-focus-hand-card",
                              selected && "mint-focus-hand-card--selected",
                              dockDisabled && "mint-focus-hand-card--used",
                            ].join(" ")}
                            style={fanStyle}
                            aria-label={`Focus hand card ${idx + 1}${usedHere ? " (used)" : ""}${selected ? " (selected)" : ""}`}
                            data-hand-card={idx}
                            disabled={dockDisabled}
                            draggable={enableHandDragDrop && !dockDisabled}
                            onClick={() => {
                              if (dockDisabled) return;
                              telemetry.recordInteraction();
                              setDraftCardIndex(idx);
                            }}
                            onDragStart={(e) => {
                              if (!enableHandDragDrop || dockDisabled) {
                                e.preventDefault();
                                return;
                              }
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("application/x-nytl-card-index", String(idx));
                              e.dataTransfer.setData("text/plain", String(idx));
                              handleHandCardDragStart(idx);
                            }}
                            onDragEnd={handleHandCardDragEnd}
                          >
                            <CardMini card={card} owner={currentPlayer} subtle={!selected} className="w-full" />
                          </button>
                        );
                      })}
                    </div>

                    <div className="mint-focus-hand-actions flex flex-wrap items-center gap-2">
                      <select
                        className="input h-9 min-w-[150px] text-xs"
                        value={draftWarningMarkCell === null ? "" : String(draftWarningMarkCell)}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraftWarningMarkCell(v === "" ? null : Number(v));
                        }}
                        disabled={currentWarnRemaining <= 0 || isAiTurn}
                        aria-label="Focus dock warning mark cell"
                      >
                        <option value="">Warning: none</option>
                        {availableCells
                          .filter((c) => c !== draftCell)
                          .map((c) => (
                            <option key={`focus-w-${c}`} value={String(c)}>warning {c}</option>
                          ))}
                      </select>

                      <button
                        className="btn btn-primary h-9 px-3 text-xs"
                        onClick={commitMove}
                        disabled={isAiTurn || draftCell === null || draftCardIndex === null}
                        aria-label="Commit move from focus hand dock"
                      >
                        Commit
                      </button>
                      <button
                        className="btn h-9 px-3 text-xs"
                        onClick={undoMove}
                        disabled={isAiTurn || turns.length === 0}
                        aria-label="Undo move from focus hand dock"
                      >
                        Undo
                      </button>
                    </div>
                  </div>
                )}

                {/* ────────────────────────────────────────────
                    P0-2: Hand Display (RPG or standard)
                    ──────────────────────────────────────────── */}
                {(!isStageFocusRoute || showStageControls) && !showFocusHandDock ? (
                  <div className="grid gap-3">
                    <div className={
                      useMintUi ? "text-xs font-semibold text-mint-text-secondary"
                      : isRpg ? "text-xs font-bold uppercase tracking-wider"
                      : "text-xs font-medium text-slate-600"
                    }
                      style={isRpg ? { fontFamily: "'Cinzel', serif", color: "var(--rpg-text-gold, #E8D48B)" } : undefined}
                    >
                      {currentPlayer === 0 ? "Player A" : "Player B"} Hand
                      {draftCell !== null && <span className={isRpg ? "" : " text-slate-400"}> · placing on cell {draftCell}</span>}
                      {isHandDragging && <span className={isRpg ? "" : " text-cyan-500"}> · drop on board to commit</span>}
                    </div>

                    {useMintUi && currentHandCards.length > 0 ? (
                      /* Mint Hand Display */
                      <HandDisplayMint
                        cards={currentHandCards}
                        owner={currentPlayer}
                        usedIndices={effectiveUsedCardIndices}
                        selectedIndex={draftCardIndex}
                        onSelect={(idx) => { telemetry.recordInteraction(); setDraftCardIndex(idx); }}
                        disabled={turns.length >= 9 || isAiTurn}
                        enableDragDrop={enableHandDragDrop}
                        onCardDragStart={handleHandCardDragStart}
                        onCardDragEnd={handleHandCardDragEnd}
                      />
                    ) : isRpg && currentHandCards.length > 0 ? (
                      /* P0-2: RPG Hand Display */
                      <HandDisplayRPG
                        cards={currentHandCards}
                        owner={currentPlayer}
                        usedIndices={effectiveUsedCardIndices}
                        selectedIndex={draftCardIndex}
                        onSelect={(idx) => setDraftCardIndex(idx)}
                        disabled={turns.length >= 9 || isAiTurn}
                      />
                    ) : (
                      /* Standard card buttons */
                      <div className="flex flex-wrap gap-2">
                        {currentDeckTokens.map((tid, idx) => {
                          const c = cards.get(tid);
                          const usedHere = effectiveUsedCardIndices.has(idx);
                          const selected = draftCardIndex === idx;
                          return (
                            <button
                              key={idx}
                              disabled={usedHere || turns.length >= 9 || isAiTurn}
                              onClick={() => setDraftCardIndex(idx)}
                              aria-label={`Card slot ${idx + 1}${usedHere ? " (used)" : ""}${selected ? " (selected)" : ""}`}
                              className={[
                                "w-[120px] rounded-xl border p-2",
                                selected ? "border-slate-900 ring-2 ring-nyano-400/60" : "border-slate-200",
                                usedHere || isAiTurn ? "bg-slate-50 opacity-50" : "bg-white hover:bg-slate-50",
                              ].join(" ")}
                            >
                              {c ? <CardMini card={c} owner={currentPlayer} subtle={!selected} /> : <div className="text-xs text-slate-500 font-mono">#{tid.toString()}</div>}
                              <div className="mt-1 text-[10px] text-slate-500">idx {idx}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Warning mark + Commit/Undo */}
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="grid gap-1">
                        <div className={isRpg ? "text-[10px] uppercase tracking-wider" : "text-[11px] text-slate-600"}
                          style={isRpg ? { fontFamily: "'Cinzel', serif", color: "var(--rpg-text-dim, #8A7E6B)" } : undefined}
                        >
                          Warning Mark ({currentWarnRemaining} left)
                        </div>
                        <select
                          className={["input", isStageFocusRoute ? "h-10 min-w-[180px]" : ""].join(" ").trim()}
                          value={draftWarningMarkCell === null ? "" : String(draftWarningMarkCell)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDraftWarningMarkCell(v === "" ? null : Number(v));
                          }}
                          disabled={turns.length >= 9 || isAiTurn || currentWarnRemaining <= 0}
                          aria-label="Warning mark cell"
                        >
                          <option value="">None</option>
                          {availableCells
                            .filter((c) => c !== draftCell)
                            .map((c) => (
                              <option key={c} value={String(c)}>cell {c}</option>
                            ))}
                        </select>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className={isRpg ? "rpg-result__btn rpg-result__btn--primary" : ["btn btn-primary", isStageFocusRoute ? "h-10 px-4" : ""].join(" ").trim()}
                          onClick={commitMove}
                          disabled={turns.length >= 9 || isAiTurn || draftCell === null || draftCardIndex === null}
                          aria-label="Commit move"
                        >
                          Commit Move
                        </button>
                        <button
                          className={isRpg ? "rpg-result__btn" : ["btn", isStageFocusRoute ? "h-10 px-4" : ""].join(" ").trim()}
                          onClick={undoMove}
                          disabled={turns.length === 0}
                          aria-label="Undo last move"
                        >
                          Undo
                        </button>
                        {isVsNyanoAi && !aiAutoPlay && isAiTurn ? (
                          <button className={isRpg ? "rpg-result__btn rpg-result__btn--primary" : ["btn btn-primary", isStageFocusRoute ? "h-10 px-4" : ""].join(" ").trim()} onClick={doAiMove} aria-label="Nyano AI move">
                            Nyano Move
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Controls are hidden for board focus.
                    {draftCardIndex !== null || draftCell !== null ? (
                      <span className="ml-1">
                        (selected: card {draftCardIndex !== null ? draftCardIndex + 1 : "-"} to cell {draftCell ?? "-"})
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Error display */}
                {error && cards ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">{error}</div>
                ) : null}
              </div>

              {/* ── Right: Turn Log + Info ── */}
              {/* Mint mode: content lives in slide-out drawer */}
              {useMintUi ? (
                <>
                  <DrawerToggleButton onClick={() => setDrawerOpen(true)} />
                  <MatchDrawerMint open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                    {/* F-2: Density toggle */}
                    <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--mint-surface-dim)" }}>
                      {(["minimal", "standard", "full"] as const).map((d) => (
                        <button
                          key={d}
                          className="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                          style={{
                            background: density === d ? "var(--mint-accent)" : "transparent",
                            color: density === d ? "white" : "var(--mint-text-secondary)",
                          }}
                          onClick={() => handleDensityChange(d)}
                        >
                          {d === "minimal" ? "Simple" : d === "standard" ? "Balanced" : "Full"}
                        </button>
                      ))}
                    </div>

                    {/* TurnLog */}
                    {sim.ok ? (
                      <TurnLog
                        turns={sim.previewTurns}
                        boardHistory={sim.previewHistory}
                        selectedTurnIndex={Math.min(selectedTurnIndex, Math.max(0, sim.previewTurns.length - 1))}
                        onSelect={(i) => setSelectedTurnIndex(i)}
                        annotations={replayAnnotations}
                        boardAdvantages={boardAdvantages}
                      />
                    ) : (
                      <div className="text-xs" style={{ color: "var(--mint-text-hint)" }}>Load cards to see turn log.</div>
                    )}

                    {/* Winner / Match info */}
                    {turns.length === 9 && sim.ok ? (
                      <div className="rounded-xl border p-3 text-xs" style={{ background: "var(--mint-surface-dim)", borderColor: "var(--mint-accent-muted)", color: "var(--mint-text-primary)" }}>
                        <div>winner: <span className="font-medium">{sim.full.winner}</span> (tiles A/B = {sim.full.tiles.A}/{sim.full.tiles.B})</div>
                        <div className="font-mono mt-1 truncate" style={{ color: "var(--mint-text-secondary)" }}>matchId: {sim.full.matchId}</div>
                      </div>
                    ) : (
                      <div className="rounded-xl border px-3 py-2 text-xs" style={{ background: "var(--mint-surface-dim)", borderColor: "var(--mint-accent-muted)", color: "var(--mint-text-secondary)" }}>
                        Winner info appears after all 9 turns.
                      </div>
                    )}

                    {/* Share buttons */}
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button className="btn" onClick={copyTranscriptJson} disabled={!sim.ok}>Copy JSON</button>
                        <button className="btn" onClick={copyShareUrl} disabled={!canFinalize}>Share URL</button>
                        <button className="btn" onClick={openReplay} disabled={!canFinalize}>Replay</button>
                      </div>
                    </div>

                    {/* AI debug notes */}
                    {Object.keys(aiNotes).length > 0 && (
                      <details className="rounded-xl border p-3 text-xs" style={{ background: "var(--mint-surface)", borderColor: "var(--mint-accent-muted)", color: "var(--mint-text-primary)" }}>
                        <summary className="cursor-pointer font-medium">Nyano AI ({Object.keys(aiNotes).length})</summary>
                        <div className="mt-2">
                          <AiNotesList notes={aiNotes} />
                        </div>
                      </details>
                    )}
                  </MatchDrawerMint>
                </>
              ) : (
              <div className={["grid gap-4 content-start", isStageFocusRoute ? "stage-focus-side-column" : ""].filter(Boolean).join(" ")}>
                {/* P0-2: RPG or standard Turn Log */}
                {isRpg ? (
                  <TurnLogRPG entries={rpgLogEntries} />
                ) : (
                  sim.ok ? (
                    <TurnLog
                      turns={sim.previewTurns}
                      boardHistory={sim.previewHistory}
                      selectedTurnIndex={Math.min(selectedTurnIndex, Math.max(0, sim.previewTurns.length - 1))}
                      onSelect={(i) => setSelectedTurnIndex(i)}
                    />
                  ) : (
                    <div className="text-xs text-slate-600">Load cards to see turn log.</div>
                  )
                )}

                {/* Winner / Match info */}
                {turns.length === 9 && sim.ok ? (
                  <div className={
                    isRpg
                      ? "rounded-lg p-3 text-xs"
                      : ["rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700", isStageFocusRoute ? "stage-focus-side-panel" : ""].filter(Boolean).join(" ")
                  }
                  style={isRpg ? { background: "rgba(0,0,0,0.4)", color: "#F5F0E1", border: "1px solid rgba(201,168,76,0.2)" } : undefined}
                  >
                    <div>winner: <span className="font-medium">{sim.full.winner}</span> (tiles A/B = {sim.full.tiles.A}/{sim.full.tiles.B})</div>
                    <div className="font-mono mt-1 truncate">matchId: {sim.full.matchId}</div>
                  </div>
                ) : (
                  <div className={
                    isRpg
                      ? "rounded-lg p-3 text-xs"
                      : ["rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600", isStageFocusRoute ? "stage-focus-side-panel stage-focus-side-panel--muted" : ""].filter(Boolean).join(" ")
                  }
                  style={isRpg ? { background: "rgba(0,0,0,0.3)", color: "var(--rpg-text-dim, #8A7E6B)" } : undefined}
                  >
                    Winner info appears after all 9 turns.
                  </div>
                )}

                {/* Share buttons */}
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button className={isRpg ? "rpg-result__btn" : "btn"} onClick={copyTranscriptJson} disabled={!sim.ok}>
                      Copy JSON
                    </button>
                    <button className={isRpg ? "rpg-result__btn" : "btn"} onClick={copyShareUrl} disabled={!canFinalize}>
                      Share URL
                    </button>
                    <button className={isRpg ? "rpg-result__btn" : "btn"} onClick={openReplay} disabled={!canFinalize}>
                      Replay
                    </button>
                  </div>
                </div>

                {/* Guest mode post-game CTA */}
                {isGuestMode && turns.length >= 9 && (
                  <div className={["grid gap-2 rounded-lg border border-nyano-200 bg-nyano-50 p-3", isStageFocusRoute ? "stage-focus-side-panel" : ""].filter(Boolean).join(" ")}>
                    <div className="text-sm font-medium text-nyano-800">Ready for the real thing?</div>
                    <div className="flex flex-wrap gap-2">
                      <Link className="btn btn-primary no-underline text-xs" to="/decks">Create Your Own Deck</Link>
                      <button className="btn btn-primary text-xs" onClick={handleRematch}>
                        Rematch (same decks)
                      </button>
                      <button className="btn text-xs" onClick={() => { resetMatch(); void loadCardsFromIndex(); }}>
                        New Decks
                      </button>
                      <button
                        className="btn text-xs"
                        onClick={handleSaveGuestDeck}
                        disabled={guestDeckSaved}
                      >
                        {guestDeckSaved ? "Deck Saved" : "Save My Deck"}
                      </button>
                    </div>
                    <div className="grid gap-2 border-t border-nyano-200 pt-2">
                      <div className="flex flex-wrap gap-2">
                        <button className="btn text-xs" onClick={copyShareUrl} disabled={!canFinalize}>
                          Share URL
                        </button>
                        <button className="btn text-xs" onClick={async () => {
                          try {
                            const url = buildReplayUrl(true);
                            if (!url) { toast.warn("Share", "Match not ready"); return; }
                            const msg = `Nyano Triad match!\n${url}`;
                            await copyToClipboard(msg);
                            toast.success("Copied", "share template");
                          } catch (e: unknown) {
                            toast.error("Share failed", errorMessage(e));
                          }
                        }} disabled={!canFinalize}>
                          Share Template
                        </button>
                        <button className="btn text-xs" onClick={openReplay} disabled={!canFinalize}>
                          Replay
                        </button>
                      </div>
                      {canFinalize && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-sky-600 hover:text-sky-700 font-medium">QR Code</summary>
                          <div className="mt-2 flex justify-center">
                            <ShareQrCode sim={sim} event={event} ui={uiParam} />
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                )}

                {/* AI debug notes (collapsed) */}
                {Object.keys(aiNotes).length > 0 && (
                  <details className={
                    isRpg
                      ? "rounded-lg p-2 text-xs"
                      : ["rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700", isStageFocusRoute ? "stage-focus-side-panel" : ""].filter(Boolean).join(" ")
                  }
                  style={isRpg ? { background: "rgba(0,0,0,0.3)", color: "var(--rpg-text-dim, #8A7E6B)" } : undefined}
                  >
                    <summary className="cursor-pointer font-medium">Nyano AI ({Object.keys(aiNotes).length})</summary>
                    <div className="mt-2">
                      <AiNotesList notes={aiNotes} />
                    </div>
                  </details>
                )}
              </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
