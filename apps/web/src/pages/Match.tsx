import React from "react";
import { useToast } from "@/components/Toast";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import type { BoardState, CardData, MatchResultWithHistory, PlayerIndex, RulesetConfig, TranscriptV1, Turn, TurnSummary } from "@nyano/triad-engine";
import {
  computeRulesetId,
  resolveClassicForcedCardIndex,
  resolveClassicOpenCardIndices,
  resolveClassicSwapIndices,
  simulateMatchV1WithHistory,
} from "@nyano/triad-engine";
import { type RulesetKey } from "@/lib/ruleset_registry";

import { BoardView } from "@/components/BoardView";
import { BoardViewRPG, GameResultOverlayRPG } from "@/components/BoardViewRPG";
import { BoardViewMint } from "@/components/BoardViewMint";
import { DuelStageMint } from "@/components/DuelStageMint";
import { BattleHudMint } from "@/components/BattleHudMint";
import { BattleTopHudMint } from "@/components/BattleTopHudMint";
import { GameResultOverlayMint } from "@/components/GameResultOverlayMint";
import { PlayerSidePanelMint } from "@/components/PlayerSidePanelMint";
import { ClassicRulesRibbonMint } from "@/components/ClassicRulesRibbonMint";
import { ClassicOpenHandMiniMint } from "@/components/ClassicOpenHandMiniMint";
import { ScoreBar } from "@/components/ScoreBar";
import { useBoardFlipAnimation } from "@/components/BoardFlipAnimator";
import { CardFlight } from "@/components/CardFlight";
import { useCardFlight } from "@/hooks/useCardFlight";
import { useIdle } from "@/hooks/useIdle";
import { NyanoImage } from "@/components/NyanoImage";
import { CardMini } from "@/components/CardMini";
import { HiddenDeckPreviewCard } from "@/components/HiddenDeckPreviewCard";
import { GameResultOverlay, type GameResult } from "@/components/GameResultOverlay";
import {
  type NyanoReactionInput,
} from "@/components/NyanoReaction";
import { NyanoReactionSlot } from "@/components/NyanoReactionSlot";
import { getDeck, listDecks, upsertDeck } from "@/lib/deck_store";
import { getEventById, getEventStatus, type EventV1 } from "@/lib/events";
import { publishOverlayState, subscribeStreamCommand, type StreamCommandV1 } from "@/lib/streamer_bus";
import { pickAiMove as pickAiMoveNew, type AiDifficulty, type AiReasonCode } from "@/lib/ai/nyano_ai";
import { computeAiAutoMoveDelayMs } from "@/lib/ai/turn_timing";
import { generateMoveTip } from "@/lib/ai/move_tips";
import { assessBoardAdvantage } from "@/lib/ai/board_advantage";
import { annotateReplayMoves } from "@/lib/ai/replay_annotations";
import { errorMessage } from "@/lib/errorMessage";
import { AiNotesList } from "@/components/AiReasonDisplay";
import { MiniTutorial } from "@/components/MiniTutorial";
import { markOnboardingStepDone } from "@/lib/onboarding";
import { createTelemetryTracker } from "@/lib/telemetry";
import { createSfxEngine, type SfxEngine, type SfxName } from "@/lib/sfx";
import { readUiDensity, writeUiDensity, type UiDensity, type VfxPreference } from "@/lib/local_settings";
import type { FlipTraceArrow } from "@/components/FlipArrowOverlay";
import { MatchSetupPanelMint } from "@/components/match/MatchSetupPanelMint";
import { getClassicOpenModeLabel, getPlayerDisplayLabel } from "@/components/match/classicRulesUi";
import { writeClipboardText } from "@/lib/clipboard";
import { appAbsoluteUrl } from "@/lib/appUrl";
import { BattleStageEngine } from "@/engine/components/BattleStageEngine";
import { MAX_CHAIN_CAP_PER_TURN } from "@/lib/ruleset_meta";
import {
  decodeClassicRulesMask,
  encodeClassicRulesMask,
} from "@/lib/classic_rules_param";
import {
  type FirstPlayerResolutionMode,
} from "@/lib/first_player_resolve";
import {
  applySearchParamPatch,
} from "@/lib/first_player_params";
import {
  parseMatchSearchParams,
  resolveClassicMaskParamPatch,
  type MatchBoardUi,
  type MatchDataMode,
  type OpponentMode,
} from "@/features/match/urlParams";
import { useMatchSearchMutators } from "@/features/match/useMatchSearchMutators";
import {
  withMatchBoardUi,
  withMatchFocusMode,
  withoutMatchEvent,
} from "@/features/match/matchUrlParams";
import {
  resolveEffectiveFirstPlayer,
  resolveMatchFirstPlayer,
} from "@/features/match/matchFirstPlayerParams";
import {
  buildRandomizeCommitRevealPatch,
  buildRandomizeCommittedMutualChoicePatch,
  buildRandomizeSeedResolutionPatch,
  deriveCommitRevealCommits,
  deriveCommittedMutualChoiceCommits,
} from "@/features/match/matchFirstPlayerMutations";
import {
  resolveActiveClassicMask,
  resolveActiveClassicRuleTags,
  resolveBaseMatchRuleset,
  resolveClassicCustomConfig,
  resolveClassicForcedRuleLabel,
  resolveMatchRuleset,
} from "@/features/match/matchRulesetParams";
import {
  computeUsed,
  countWarningMarks,
  fillTurns,
  parseDeckTokenIds,
  turnPlayer,
} from "@/features/match/matchTurnUtils";
import {
  formatClassicOpenSlots,
  resolveAvailableCells,
  resolveClassicOpenLabel,
  resolveClassicOpenPresentation,
  resolveClassicSwapLabel,
  resolveCurrentWarnRemaining,
  resolveEffectiveUsedCardIndices,
  resolveGuestOpponentVisibleCardIndices,
  resolveSelectableCells,
} from "@/features/match/matchBoardDerived";
import { MatchShareQrCode } from "@/features/match/MatchShareQrCode";
import { resolveStreamCommitTurnFromCommand } from "@/features/match/matchStreamCommands";
import {
  buildClassicMaskChangeParamPatch,
  buildFirstPlayerModeChangeParamPatch,
  buildRulesetKeyChangeParamPatch,
} from "@/features/match/matchSetupParamPatches";
import {
  useMatchStageActionFeedback,
} from "@/features/match/useMatchStageActionFeedback";
import { useMatchStageActionCallbacks } from "@/features/match/useMatchStageActionCallbacks";
import { useMatchReplayActions } from "@/features/match/useMatchReplayActions";
import { useMatchStageSfxEffects } from "@/features/match/useMatchStageSfxEffects";
import { useMatchShareClipboardActions } from "@/features/match/useMatchShareClipboardActions";
import {
  resolveMatchLastFlipSummaryText,
  resolveMatchLastFlipTraces,
  resolveMatchRpgLogEntries,
} from "@/features/match/matchTurnLogDerived";
import { useEngineRendererFallback } from "@/features/match/useEngineRendererFallback";
import {
  resolveBoardImpactBurstDurationMs,
  resolveBoardImpactBurstState,
  resolveMatchNyanoReactionImpact,
  resolveMatchNyanoReactionInput,
  resolveStageImpactBurstDurationMs,
  shouldTriggerStageImpactBurst,
} from "@/features/match/matchStageReaction";
import { resolveMatchStageEngineBoardSizing } from "@/features/match/matchStageEngineBoardSizing";
import {
  useMatchStageFocusShortcuts,
} from "@/features/match/useMatchStageFocusShortcuts";
import { resolveMatchStagePresentationState } from "@/features/match/matchStagePresentationState";
import { resolveMatchStageLayoutClasses } from "@/features/match/matchStageLayoutClasses";
import { useMatchStageUi } from "@/features/match/useMatchStageUi";
import { useMatchStageFullscreen } from "@/features/match/useMatchStageFullscreen";
import { useMatchStageBoardSizing } from "@/features/match/useMatchStageBoardSizing";
import { useMatchStageRouteState } from "@/features/match/matchStageRouteState";
import { useMatchCardLoadActions } from "@/features/match/useMatchCardLoadActions";
import { useMatchGuestAutoLoad } from "@/features/match/useMatchGuestAutoLoad";
import {
  resolveCanLoadCards,
  resolveMatchCardLoadEmptyState,
} from "@/features/match/matchCardLoadUiState";
import { resolveMatchCardLoadSetupState } from "@/features/match/matchCardLoadSetupState";
import { MatchCardLoadEmptyStatePanel } from "@/features/match/MatchCardLoadEmptyStatePanel";
import { MatchEventPanel } from "@/features/match/MatchEventPanel";
import { MatchGuestModeIntro } from "@/features/match/MatchGuestModeIntro";
import { MatchFocusHandDock } from "@/features/match/MatchFocusHandDock";
import { MatchQuickCommitBar } from "@/features/match/MatchQuickCommitBar";
import { MatchErrorPanel } from "@/features/match/MatchErrorPanel";
import { MatchHandInteractionArea } from "@/features/match/MatchHandInteractionArea";
import { MatchBoardFeedbackPanels } from "@/features/match/MatchBoardFeedbackPanels";
import { MatchInfoColumn } from "@/features/match/MatchInfoColumn";
import { resolveStageVfxOptionLabel, STAGE_VFX_OPTIONS } from "@/features/match/stageVfxUi";
import { useStageVfxPreference } from "@/features/match/useStageVfxPreference";

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

async function copyToClipboard(text: string): Promise<void> {
  await writeClipboardText(text);
}

// AI logic has been extracted to @/lib/ai/nyano_ai.ts

/* ==========================================================================
   MATCH PAGE
   ========================================================================== */

export function MatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedSearchParams = React.useMemo(
    () => parseMatchSearchParams(searchParams),
    [searchParams],
  );
  const {
    ui,
    isFocusMode,
    isGuestMode,
    dataModeParam,
    eventId,
    deckAId,
    deckBId,
    opponentModeParam,
    aiDifficultyParam,
    aiAutoPlay,
    streamMode,
    streamCtrlParam,
    streamControlledSide,
    rulesetKeyParam,
    classicMaskParam,
    chainCapRawParam,
    chainCapPerTurnParam,
    seasonIdParam,
    firstPlayerModeParam,
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
  } = parsedSearchParams;
  const isRpg = ui === "rpg";
  const isMint = ui === "mint";
  const isEngine = ui === "engine";
  const toast = useToast();
  const {
    engineRendererFailed,
    engineRendererError,
    useEngineRenderer,
    handleEngineRendererInitError,
    handleRetryEngineRenderer,
  } = useEngineRendererFallback({
    isEngine,
    onWarn: toast.warn,
  });
  const useMintUi = isMint || isEngine;
  const isEngineFocus = isEngine && isFocusMode;
  const {
    stageMatchUrl,
    isBattleStageRoute,
    isStageFocusRoute,
  } = useMatchStageRouteState({
    pathname: location.pathname,
    searchParams,
    isEngineFocus,
  });
  const stageViewportRef = React.useRef<HTMLDivElement>(null);
  const stageBoardSizing = useMatchStageBoardSizing({
    isBattleStageRoute,
  });
  const stageEngineBoardMaxWidthPxBase = isBattleStageRoute ? stageBoardSizing.maxWidthPx : undefined;
  const stageEngineBoardMinHeightPxBase = isBattleStageRoute ? stageBoardSizing.minHeightPx : undefined;
  const decks = React.useMemo(() => listDecks(), []);

  // Telemetry (NIN-UX-003)
  const telemetry = React.useMemo(() => createTelemetryTracker(), []);
  React.useEffect(() => {
    return () => { telemetry.flush(); };
  }, [telemetry]);

  // SFX Engine (NIN-UX-031)
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

  const [dataMode, setDataMode] = React.useState<MatchDataMode>(isGuestMode ? "fast" : dataModeParam);

  const event: EventV1 | null = React.useMemo(() => (eventId ? getEventById(eventId) : null), [eventId]);
  const eventStatus = event ? getEventStatus(event) : null;

  const [eventNyanoDeckOverride, setEventNyanoDeckOverride] = React.useState<bigint[] | null>(null);
  React.useEffect(() => {
    setEventNyanoDeckOverride(null);
  }, [eventId]);

  const deckA = React.useMemo(() => (deckAId ? getDeck(deckAId) : null), [deckAId]);
  const deckB = React.useMemo(() => (deckBId ? getDeck(deckBId) : null), [deckBId]);
  const uiParam: MatchBoardUi = ui;

  const classicCustomConfigParam = React.useMemo(
    () => decodeClassicRulesMask(classicMaskParam),
    [classicMaskParam],
  );
  const classicCustomMaskParam = React.useMemo(
    () => encodeClassicRulesMask(classicCustomConfigParam),
    [classicCustomConfigParam],
  );

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
      resolveMatchFirstPlayer({
        mode: firstPlayerMode,
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
  const firstPlayer: PlayerIndex = resolveEffectiveFirstPlayer({
    isEvent,
    eventFirstPlayer: event ? (event.firstPlayer as PlayerIndex) : null,
    firstPlayerResolution,
  });

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
  const overlayUrl = React.useMemo(() => appAbsoluteUrl("overlay?controls=0"), []);
  const lastStreamCmdIdRef = React.useRef<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const { isStageFullscreen, toggleStageFullscreen } = useMatchStageFullscreen({
    isStageFocusRoute,
    stageViewportRef,
    onWarn: toast.warn,
  });

  // RPC status tracking for overlay propagation (Phase 0 stability)
  const rpcStatusRef = React.useRef<{ ok: boolean; message?: string; timestampMs: number } | undefined>(undefined);

  type AiNoteEntry = { reason: string; reasonCode: AiReasonCode };
  const [aiNotes, setAiNotes] = React.useState<Record<number, AiNoteEntry>>({});
  const [aiAutoMoveDueAtMs, setAiAutoMoveDueAtMs] = React.useState<number | null>(null);
  const [aiCountdownMs, setAiCountdownMs] = React.useState<number | null>(null);
  const [guestDeckSaved, setGuestDeckSaved] = React.useState(false);

  // F-1: Mint drawer state
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const drawerToggleBlockedUntilRef = React.useRef(0);
  const closeDrawer = React.useCallback(() => {
    drawerToggleBlockedUntilRef.current = Date.now() + 260;
    setDrawerOpen(false);
  }, []);
  const openDrawer = React.useCallback(() => {
    if (Date.now() < drawerToggleBlockedUntilRef.current) return;
    setDrawerOpen(true);
  }, []);

  // F-2: UI Density toggle (minimal/standard/full)
  const [density, setDensity] = React.useState<UiDensity>(() =>
    useMintUi ? readUiDensity("minimal") : "full"
  );
  const handleDensityChange = React.useCallback((d: UiDensity) => {
    setDensity(d);
    writeUiDensity(d);
  }, []);
  const {
    showStageAssist,
    setShowStageAssist,
    showStageAssistUi,
    showStageControls,
    toggleStageControls,
  } = useMatchStageUi({
    isStageFocusRoute,
  });
  const {
    stageActionFeedback,
    stageActionFeedbackTone,
    pushStageActionFeedback,
  } = useMatchStageActionFeedback({
    isStageFocusRoute,
  });
  const {
    vfxPreference,
    resolvedVfxQuality,
    handleStageVfxChange,
  } = useStageVfxPreference({
    playVfxChangeSfx: () => playMatchUiSfx("card_place"),
    pushStageActionFeedback,
  });

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
    toast.success("Deck saved", "Saved to Decks page.");
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
    const patch = buildFirstPlayerModeChangeParamPatch(firstPlayerModeParam, searchParams);
    const { next, changed } = applySearchParamPatch(searchParams, patch);
    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [isEvent, firstPlayerModeParam, searchParams, setSearchParams]);

  React.useEffect(() => {
    const patch = resolveClassicMaskParamPatch({
      isEvent,
      rulesetKeyParam,
      classicMaskParam,
      classicCustomMaskParam,
    });
    if (!patch) return;
    const { next, changed } = applySearchParamPatch(searchParams, patch);
    if (changed) setSearchParams(next, { replace: true });
  }, [
    isEvent,
    rulesetKeyParam,
    classicMaskParam,
    classicCustomMaskParam,
    searchParams,
    setSearchParams,
  ]);

  const { setParam, setParams, setFocusMode } = useMatchSearchMutators({
    searchParams,
    setSearchParams,
    navigate,
    isBattleStageRoute,
  });

  const handleBoardUiChange = React.useCallback((nextUi: MatchBoardUi) => {
    const next = withMatchBoardUi(searchParams, nextUi);
    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleRulesetKeyChange = React.useCallback((nextKey: RulesetKey) => {
    setParams(buildRulesetKeyChangeParamPatch(nextKey, classicCustomMaskParam));
  }, [setParams, classicCustomMaskParam]);

  const handleClassicMaskChange = React.useCallback((nextMask: string) => {
    setParams(buildClassicMaskChangeParamPatch(nextMask));
  }, [setParams]);

  const handleFirstPlayerModeChange = (nextMode: FirstPlayerResolutionMode) => {
    setParams(buildFirstPlayerModeChangeParamPatch(nextMode, searchParams));
  };

  React.useEffect(() => {
    if (isEngine || !isFocusMode) return;
    const next = withMatchFocusMode(searchParams, false);
    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [isEngine, isFocusMode, searchParams, setSearchParams]);

  const clearEvent = () => {
    const next = withoutMatchEvent(searchParams);
    if (next.toString() === searchParams.toString()) return;
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

  const classicCustomConfig = React.useMemo(
    () => resolveClassicCustomConfig(classicCustomConfigParam),
    [classicCustomConfigParam],
  );
  const baseRuleset = React.useMemo(() => {
    return resolveBaseMatchRuleset(rulesetKey, classicCustomConfig);
  }, [rulesetKey, classicCustomConfig]);
  const ruleset: RulesetConfig = React.useMemo(() => {
    return resolveMatchRuleset(baseRuleset, chainCapPerTurnParam);
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
    return resolveGuestOpponentVisibleCardIndices(classicOpenCardIndices);
  }, [classicOpenCardIndices]);
  const effectiveUsedCardIndices = React.useMemo(() => {
    return resolveEffectiveUsedCardIndices(currentUsed, classicForcedCardIndex);
  }, [currentUsed, classicForcedCardIndex]);
  const currentWarnRemaining = resolveCurrentWarnRemaining(currentPlayer, warnUsed);
  const currentHandCards: CardData[] = React.useMemo(() => {
    if (!cards) return [];
    return currentDeckTokens.map((tid) => cards.get(tid)).filter(Boolean) as CardData[];
  }, [cards, currentDeckTokens]);
  const deckACards: (CardData | null)[] = React.useMemo(() => {
    if (!cards) return effectiveDeckATokens.map(() => null);
    return effectiveDeckATokens.map((tid) => cards.get(tid) ?? null);
  }, [cards, effectiveDeckATokens]);
  const deckBCards: (CardData | null)[] = React.useMemo(() => {
    if (!cards) return effectiveDeckBTokens.map(() => null);
    return effectiveDeckBTokens.map((tid) => cards.get(tid) ?? null);
  }, [cards, effectiveDeckBTokens]);

  const availableCells = React.useMemo(() => {
    return resolveAvailableCells(used.cells);
  }, [used.cells]);

  // P0-1: selectableCells for BoardView (only empty cells when it's not AI turn and game isn't over)
  const selectableCells = React.useMemo(() => {
    return resolveSelectableCells({
      hasCards: Boolean(cards),
      turnCount: turns.length,
      isAiTurn,
      availableCells,
    });
  }, [cards, turns.length, isAiTurn, availableCells]);
  const matchBoardPhase = React.useMemo<"game_over" | "ai_turn" | "select_cell" | "select_card">(() => {
    if (turns.length >= 9) return "game_over";
    if (isAiTurn) return "ai_turn";
    if (draftCardIndex !== null) return "select_cell";
    return "select_card";
  }, [turns.length, isAiTurn, draftCardIndex]);
  const isIdleGuidanceActive = useIdle({
    timeoutMs: 4200,
    disabled: !(useMintUi && !isAiTurn && turns.length < 9),
  });
  const idleGuideTarget = React.useMemo<"none" | "select_card" | "select_cell">(() => {
    if (!isIdleGuidanceActive) return "none";
    if (matchBoardPhase === "select_card") return "select_card";
    if (matchBoardPhase === "select_cell") return "select_cell";
    return "none";
  }, [isIdleGuidanceActive, matchBoardPhase]);

  const _availableCardIndexes = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < 5; i++) if (!effectiveUsedCardIndices.has(i)) out.push(i);
    return out;
  }, [effectiveUsedCardIndices]);

  React.useEffect(() => {
    if (classicForcedCardIndex === null) return;
    setDraftCardIndex(classicForcedCardIndex);
  }, [classicForcedCardIndex]);

  const canLoad = resolveCanLoadCards({
    isGuestMode,
    hasDeckA: Boolean(deckA),
    deckATokensCount: deckATokens.length,
    deckBTokensCount: deckBTokens.length,
  });
  const cardLoadEmptyState = resolveMatchCardLoadEmptyState({
    isLoading: loading,
    isGuestMode,
  });
  const cardLoadSetupState = resolveMatchCardLoadSetupState({
    hasCards: Boolean(cards),
    error,
  });

  const classicSwapLabel = resolveClassicSwapLabel(classicSwapIndices);
  const classicOpenLabel = resolveClassicOpenLabel(classicOpenCardIndices);
  const classicOpenPresentation = React.useMemo(() => {
    return resolveClassicOpenPresentation({
      classicOpenCardIndices,
      deckACards,
      deckBCards,
      usedA: used.usedA,
      usedB: used.usedB,
    });
  }, [classicOpenCardIndices, deckACards, deckBCards, used.usedA, used.usedB]);
  const classicOpenModeLabel = React.useMemo(
    () => (classicOpenPresentation ? getClassicOpenModeLabel(classicOpenPresentation.mode) : ""),
    [classicOpenPresentation],
  );
  const activeClassicRuleTags = React.useMemo(() => {
    return resolveActiveClassicRuleTags(ruleset);
  }, [ruleset]);
  const classicForcedRuleLabel = React.useMemo(() => {
    return resolveClassicForcedRuleLabel(activeClassicRuleTags, classicForcedCardIndex);
  }, [activeClassicRuleTags, classicForcedCardIndex]);
  const activeClassicMask = React.useMemo(() => {
    return resolveActiveClassicMask(rulesetKey, classicCustomConfig);
  }, [rulesetKey, classicCustomConfig]);

  const handleRandomizeCommitReveal = React.useCallback(() => {
    setParams(buildRandomizeCommitRevealPatch());
  }, [setParams]);

  const handleDeriveCommitRevealCommits = React.useCallback(() => {
    const commits = deriveCommitRevealCommits({
      matchSalt: commitRevealSaltParam,
      revealA: commitRevealAParam,
      revealB: commitRevealBParam,
    });
    if (!commits) {
      toast.warn("Commit input error", "matchSalt/revealA/revealB must be bytes32 hex.");
      return;
    }
    setParams(commits);
    toast.success("Commit generated", "Derived commitA/commitB from reveal values.");
  }, [
    commitRevealAParam,
    commitRevealBParam,
    commitRevealSaltParam,
    setParams,
    toast,
  ]);

  const handleRandomizeCommittedMutualChoice = React.useCallback(() => {
    setParams(buildRandomizeCommittedMutualChoicePatch());
  }, [setParams]);

  const handleDeriveCommittedMutualChoiceCommits = React.useCallback(() => {
    const commits = deriveCommittedMutualChoiceCommits({
      matchSalt: commitRevealSaltParam,
      playerA: committedMutualPlayerAParam,
      playerB: committedMutualPlayerBParam,
      firstPlayerA: mutualChoiceAParam,
      firstPlayerB: mutualChoiceBParam,
      nonceA: committedMutualNonceAParam,
      nonceB: committedMutualNonceBParam,
    });
    if (!commits) {
      toast.warn("Commit input error", "Provide matchSalt/player/choice/nonce.");
      return;
    }
    setParams(commits);
    toast.success("Commit generated", "Derived commit values for committed mutual choice.");
  }, [
    commitRevealSaltParam,
    committedMutualNonceAParam,
    committedMutualNonceBParam,
    committedMutualPlayerAParam,
    committedMutualPlayerBParam,
    mutualChoiceAParam,
    mutualChoiceBParam,
    setParams,
    toast,
  ]);

  const handleRandomizeSeedResolution = React.useCallback(() => {
    setParams(buildRandomizeSeedResolutionPatch());
  }, [setParams]);

  const {
    loadCardsFromIndex,
    loadCards,
  } = useMatchCardLoadActions({
    isGuestMode,
    dataMode,
    hasDeckA: Boolean(deckA),
    deckATokens,
    deckBTokens,
    event,
    eventNyanoDeckOverride,
    playerA,
    playerB,
    setLoading,
    setError,
    setStatus,
    setCards,
    setOwners,
    setPlayerA,
    setPlayerB,
    setGuestDeckATokens,
    setGuestDeckBTokens,
    setEventNyanoDeckOverride,
    rpcStatusRef,
    toast,
  });

  useMatchGuestAutoLoad({
    isGuestMode,
    hasCards: Boolean(cards),
    isLoading: loading,
    loadCardsFromIndex,
  });

  const sim: SimState = React.useMemo(() => {
    if (!cards) return { ok: false, error: "Cards are not loaded. Please load cards first." };
    if (effectiveDeckATokens.length !== 5 || effectiveDeckBTokens.length !== 5) return { ok: false, error: "Deck A/B must each contain 5 cards." };

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
  const matchResultSummary = turns.length === 9 && sim.ok
    ? {
      winner: sim.full.winner,
      tilesA: sim.full.tiles.A,
      tilesB: sim.full.tiles.B,
      matchId: sim.full.matchId,
    }
    : null;

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
        setError("No more moves available. The board already has 9 turns.");
        telemetry.recordInvalidAction();
        return;
      }

      if (next.cell < 0 || next.cell > 8) {
        setError("Cell must be in range 0..8.");
        telemetry.recordInvalidAction();
        return;
      }
      if (used.cells.has(next.cell)) {
        setError(`Cell ${next.cell} is already occupied.`);
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
        setError(`Card slot ${next.cardIndex + 1} is already used.`);
        telemetry.recordInvalidAction();
        return;
      }

      if (next.warningMarkCell !== undefined) {
        if (currentWarnRemaining <= 0) {
          setError("No warning mark remaining.");
          telemetry.recordInvalidAction();
          return;
        }
        if (next.warningMarkCell === next.cell) {
          setError("warningMarkCell cannot be the same as cell.");
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
      setError("Select a target cell first.");
      telemetry.recordInvalidAction();
      return;
    }
    if (draftCardIndex === null) {
      setError("Select a card first.");
      telemetry.recordInvalidAction();
      return;
    }

    commitMoveWithSelection(draftCell, draftCardIndex);
  }, [commitMoveWithSelection, draftCardIndex, draftCell, isAiTurn, telemetry]);

  const selectDraftCard = React.useCallback((idx: number) => {
    if (classicForcedCardIndex !== null && idx !== classicForcedCardIndex) return;
    setDraftCardIndex(idx);
    playMatchUiSfx("tap_soft");
  }, [classicForcedCardIndex, playMatchUiSfx]);

  const handleHandCardDragStart = React.useCallback((idx: number) => {
    if (!enableHandDragDrop) return;
    if (classicForcedCardIndex !== null && idx !== classicForcedCardIndex) return;
    telemetry.recordInteraction();
    selectDraftCard(idx);
    setDragCardIndex(idx);
    setIsHandDragging(true);
  }, [enableHandDragDrop, telemetry, classicForcedCardIndex, selectDraftCard]);

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
      setError("Select a card first.");
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

        const resolved = resolveStreamCommitTurnFromCommand({
          cmd,
          turnCount: turns.length,
          streamControlledSide,
          isVsNyanoAi,
          currentPlayer,
          aiPlayer,
          classicForcedCardIndex,
        });
        if (!resolved) return;

        commitTurn(resolved.turn);
        const resolvedCardIndex = resolved.resolvedCardIndex;

        toast.success("Applied stream move", `Cell ${cmd.move.cell} | Card ${resolvedCardIndex + 1}`);
      } catch {
        // ignore
      }
    });
  }, [streamMode, streamControlledSide, turns.length, currentPlayer, isVsNyanoAi, aiPlayer, commitTurn, toast, classicForcedCardIndex]);

  const canFinalize = turns.length === 9 && sim.ok;

  const {
    handleCopySetupLink,
    copyTranscriptJson,
  } = useMatchShareClipboardActions({
    pathname: location.pathname,
    search: searchParams,
    simOk: sim.ok,
    simError: sim.ok ? "" : sim.error,
    transcript: sim.ok ? sim.transcript : null,
    setError,
    toast,
    copyToClipboard,
    writeSetupClipboardText: writeClipboardText,
    resolveErrorMessage: errorMessage,
  });

  const {
    copyShareUrl,
    openReplay,
    copyShareTemplate,
  } = useMatchReplayActions({
    transcript: sim.ok ? sim.transcript : null,
    cards,
    eventId: event?.id,
    ui: uiParam,
    rulesetKey,
    classicMask: activeClassicMask,
    setError,
    setStatus,
    navigate,
    toast,
    copyToClipboard,
    resolveErrorMessage: errorMessage,
  });

  const {
    toggleStageControlsWithFeedback,
    toggleStageAssistWithFeedback,
    toggleStageFullscreenWithFeedback,
    exitFocusModeWithFeedback,
    openReplayWithFeedback,
    doAiMoveWithFeedback,
  } = useMatchStageActionCallbacks({
    showStageControls,
    setShowStageAssist,
    isStageFocusRoute,
    isStageFullscreen,
    pushStageActionFeedback,
    playMatchUiSfx,
    toggleStageControls,
    toggleStageFullscreen,
    setFocusMode,
    openReplay,
    doAiMove,
  });

  // P0-1: Cell select handler for BoardView / BoardViewRPG
  const handleCellSelect = React.useCallback(
    (cell: number) => {
      if (isAiTurn || turns.length >= 9) return;
      setDraftCell(cell);
      playMatchUiSfx("tap_soft");
    },
    [isAiTurn, turns.length, playMatchUiSfx],
  );

  // P1-2: Build NyanoReaction input from last turn
  const nyanoReactionInput: NyanoReactionInput | null = React.useMemo(() => {
    return resolveMatchNyanoReactionInput({
      simOk: sim.ok,
      previewTurns: sim.ok ? sim.previewTurns : [],
      winner: sim.ok ? sim.full.winner : null,
      turnCount: turns.length,
      boardNow,
      perspective: 0 as PlayerIndex,
    });
  }, [sim, turns.length, boardNow]);
  const currentAiReasonCode = React.useMemo(
    () => (turns.length > 0 ? aiNotes[turns.length - 1]?.reasonCode : undefined),
    [aiNotes, turns.length],
  );
  const nyanoReactionImpact = React.useMemo(() => {
    return resolveMatchNyanoReactionImpact({
      nyanoReactionInput,
      currentAiReasonCode,
    });
  }, [nyanoReactionInput, currentAiReasonCode]);
  const [stageImpactBurst, setStageImpactBurst] = React.useState(false);
  const [boardImpactBurst, setBoardImpactBurst] = React.useState(false);
  const lastBoardImpactAtRef = React.useRef(0);
  const stageImpactBurstLevel = React.useMemo<"soft" | "medium" | "hard" | "win" | null>(() => {
    if (sim.ok && turns.length >= 9 && sim.full.winner !== "draw") return "win";
    if (stageImpactBurst) return nyanoReactionImpact === "high" ? "hard" : "medium";
    if (!boardImpactBurst) return null;
    return boardAnim.flippedCells.length >= 4 ? "hard" : "soft";
  }, [
    sim,
    turns.length,
    stageImpactBurst,
    boardImpactBurst,
    nyanoReactionImpact,
    boardAnim.flippedCells.length,
  ]);
  const stageImpactBurstActive = stageImpactBurst || boardImpactBurst || stageImpactBurstLevel === "win";

  React.useEffect(() => {
    if (!shouldTriggerStageImpactBurst({
      isEngineFocus,
      nyanoReactionInput,
      nyanoReactionImpact,
    })) {
      setStageImpactBurst(false);
      return;
    }
    setStageImpactBurst(true);
    const burstMs = resolveStageImpactBurstDurationMs(nyanoReactionImpact);
    const timer = window.setTimeout(() => setStageImpactBurst(false), burstMs);
    return () => window.clearTimeout(timer);
  }, [isEngineFocus, nyanoReactionInput, nyanoReactionImpact, turns.length]);

  React.useEffect(() => {
    const burstState = resolveBoardImpactBurstState({
      useMintUi,
      boardAnimIsAnimating: boardAnim.isAnimating,
      flippedCellCount: boardAnim.flippedCells.length,
      nowMs: Date.now(),
      lastBoardImpactAtMs: lastBoardImpactAtRef.current,
    });
    if (!burstState.trigger) return;
    lastBoardImpactAtRef.current = burstState.nextLastBoardImpactAtMs;
    setBoardImpactBurst(true);
    const timer = window.setTimeout(
      () => setBoardImpactBurst(false),
      resolveBoardImpactBurstDurationMs(),
    );
    return () => window.clearTimeout(timer);
  }, [useMintUi, boardAnim.isAnimating, boardAnim.flippedCells.length, turns.length]);

  // P1-1: flipTraces summary for last turn
  const lastFlipSummaryText: string | null = React.useMemo(() => {
    return resolveMatchLastFlipSummaryText({
      simOk: sim.ok,
      previewTurns: sim.ok ? sim.previewTurns : [],
      turnCount: turns.length,
    });
  }, [sim, turns.length]);

  // D-1/D-2: Extract FlipTraceArrow[] for Mint arrow overlay
  const lastFlipTraces: readonly FlipTraceArrow[] | null = React.useMemo(() => {
    return resolveMatchLastFlipTraces({
      useMintUi,
      simOk: sim.ok,
      previewTurns: sim.ok ? sim.previewTurns : [],
      turnCount: turns.length,
    });
  }, [useMintUi, sim, turns.length]);

  useMatchStageSfxEffects({
    sfx,
    boardAnimIsAnimating: boardAnim.isAnimating,
    boardAnimPlacedCell: boardAnim.placedCell,
    boardAnimFlippedCellCount: boardAnim.flippedCells.length,
    hasChainFlipTrace: lastFlipTraces?.some((trace) => trace.isChain) ?? false,
    turnCount: turns.length,
    simOk: sim.ok,
    winner: sim.ok ? sim.full.winner : null,
    error,
  });

  // P0-2: Build TurnLogRPG entries from sim
  const rpgLogEntries = React.useMemo(() => {
    return resolveMatchRpgLogEntries({
      simOk: sim.ok,
      previewTurns: sim.ok ? sim.previewTurns : [],
      cards,
    });
  }, [sim, cards]);

  const useMintPixiParity = isMint && !isRpg;
  const usePixiPresentation = isEngine || useMintPixiParity;
  const mintHudTone: "mint" | "pixi" = usePixiPresentation ? "pixi" : "mint";
  const {
    showFocusHandDock,
    showMintTopHud,
    showMintDetailHud,
    showMintPlayerPanels,
    showDesktopQuickCommit,
    showStageFocusHandDock,
    showFocusToolbarActions,
    showMintStatusSummarySlot,
    showLegacyStatusSummary,
    canCommitFromFocusToolbar,
    canUndoFromFocusToolbar,
    canManualAiMoveFromFocusToolbar,
  } = resolveMatchStagePresentationState({
    useMintUi,
    isRpg,
    turnCount: turns.length,
    currentDeckTokenCount: currentDeckTokens.length,
    isMint,
    showStageAssistUi,
    simOk: sim.ok,
    useMintPixiParity,
    usePixiPresentation,
    density,
    isStageFocusRoute,
    isAiTurn,
    draftCardIndex,
    draftCell,
    showStageControls,
    lastFlipSummaryText,
    isVsNyanoAi,
    aiAutoPlay,
  });
  const stageLayoutClasses = resolveMatchStageLayoutClasses({
    isStageFocusRoute,
    showStageFocusHandDock,
    isEngineFocus,
    isRpg,
    useMintUi,
    showMintPlayerPanels,
  });
  const {
    engineBoardMaxWidthPx,
    engineBoardMinHeightPx,
  } = resolveMatchStageEngineBoardSizing({
    isStageFocusRoute,
    showStageFocusHandDock,
    stageBoardMinHeightPx: stageBoardSizing.minHeightPx,
    stageEngineBoardMaxWidthPxBase,
    stageEngineBoardMinHeightPxBase,
  });

  useMatchStageFocusShortcuts({
    isStageFocusRoute,
    canFinalize,
    canCommitFromFocusToolbar,
    canUndoFromFocusToolbar,
    exitFocusModeWithFeedback,
    toggleStageFullscreenWithFeedback,
    toggleStageControlsWithFeedback,
    toggleStageAssistWithFeedback,
    openReplayWithFeedback,
    commitMove,
    undoMove,
  });

  /* ======================================================================
     RENDER
     ====================================================================== */

  return (
    <div
      ref={stageViewportRef}
      className={stageLayoutClasses.rootClassName}
    >
      {/* Result Overlay */}
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
          className={stageLayoutClasses.focusToolbarClassName}
          aria-label={stageLayoutClasses.focusToolbarAriaLabel}
          style={{ background: "var(--mint-surface, #fff)", borderColor: "var(--mint-accent-muted, #A7F3D0)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold" style={{ color: "var(--mint-text-secondary, #4B5563)" }}>
              Pixi focus mode | Turn {currentTurnIndex}/9 | Warning marks left {currentWarnRemaining}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {showFocusToolbarActions ? (
                <div className="stage-focus-toolbar-actions">
                  <span className="stage-focus-toolbar-status">
                    {draftCardIndex !== null ? `Card ${draftCardIndex + 1}` : "Card not selected"} | {draftCell !== null ? `Cell ${draftCell}` : "Cell not selected"}
                  </span>
                  <span className="stage-focus-toolbar-hint" aria-label="Battle focus toolbar hint">
                    Select card/cell to commit | Enter/Backspace | F/C/H/R/Esc
                  </span>
                  <label className="stage-focus-toolbar-speed">
                    Warning mark
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
                      <option value="">None</option>
                      {availableCells
                        .filter((c) => c !== draftCell)
                        .map((c) => (
                          <option key={`focus-toolbar-w-${c}`} value={String(c)}>Cell {c}</option>
                        ))}
                    </select>
                  </label>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={commitMove}
                    disabled={!canCommitFromFocusToolbar}
                    aria-label="Commit move from focus toolbar"
                  >
                    Commit</button>
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
                          {resolveStageVfxOptionLabel(option, resolvedVfxQuality)}
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
                      {sfxMuted ? "SFX OFF" : "SFX ON"}
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
                Exit Focus</button>
              <button
                className="btn btn-sm"
                onClick={openReplayWithFeedback}
                disabled={!canFinalize}
                aria-label="Open replay"
                title="Open replay"
              >
                Open replay
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Hero */}
      {!isEngineFocus && (<section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col items-start gap-4 p-4 md:flex-row md:items-center md:p-6">
          <NyanoImage size={96} className="shadow-sm" alt="Nyano" />
          <div className="min-w-0">
            <div className="text-xl font-semibold">Nyano Triad League</div>
            <div className="mt-1 text-sm text-slate-600">
              Use Nyano NFT cards for quick matches, replays, and share-ready battle logs.</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">ETH on-chain</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Replay Share</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Action log + replay</span>
            </div>
          </div>
        </div>
      </section>)}

      {/* Event */}
      <MatchEventPanel
        isVisible={!isEngineFocus && Boolean(event)}
        title={event?.title ?? ""}
        description={event?.description ?? ""}
        status={eventStatus ?? ""}
        rulesetKey={event?.rulesetKey ?? ""}
        aiDifficulty={event?.aiDifficulty ?? ""}
        nyanoDeckTokenIds={event?.nyanoDeckTokenIds ?? []}
        onClearEvent={clearEvent}
      />

      {/* Guest mode intro */}
      <MatchGuestModeIntro
        isVisible={!isEngineFocus && isGuestMode}
        tutorial={<MiniTutorial />}
      />

            {/* Match Setup */}
      {!isEngineFocus && !isGuestMode ? (
        <MatchSetupPanelMint
          defaultOpen={cardLoadSetupState.defaultOpen}
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
          classicCustomMaskParam={classicCustomMaskParam}
          classicCustomConfig={classicCustomConfig}
          classicRuleTags={activeClassicRuleTags}
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
          error={cardLoadSetupState.error}
          showRpcSettingsCta={cardLoadSetupState.showRpcSettingsCta}
          overlayUrl={overlayUrl}
          onSetParam={setParam}
          onSetFocusMode={setFocusMode}
          onRulesetKeyChange={handleRulesetKeyChange}
          onSetClassicMask={handleClassicMaskChange}
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
        className={stageLayoutClasses.arenaSectionClassName}
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
              Match in progress | Turn {currentTurnIndex}/9{isAiTurn ? " | Nyano AI" : ` | Player ${currentPlayer === 0 ? "A" : "B"}`}
            </div>
            <div className="text-xs text-slate-500">
              Warning marks left: {currentWarnRemaining}
              {streamMode ? " | Stream mode" : ""}
              {isGuestMode ? " | guest" : ""}
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
                  Open Pixi focus
                </button>
                <Link className="btn btn-sm no-underline" to={stageMatchUrl}>
                  Open Stage page                </Link>
              </div>
            ) : null}
          </div>
        )}

        <div
          className={stageLayoutClasses.arenaInnerClassName}
        >
          {!cards ? (
            <MatchCardLoadEmptyStatePanel
              state={cardLoadEmptyState}
              onLoadGuestCards={() => {
                void loadCardsFromIndex();
              }}
            />
            ) : (
            <div
              className={stageLayoutClasses.arenaGridClassName}
            >
              {/* Left: Board + Hand */}
              <div
                className={stageLayoutClasses.mainColumnClassName}
              >
                {/* Guest deck preview */}
                {!isEngineFocus && isGuestMode && cards && (
                  <details open={turns.length === 0} className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-surface-700">
                      Deck Preview
                    </summary>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-medium text-player-a-600 mb-1">Your deck (A)</div>
                        <div className="deck-preview-grid grid grid-cols-5 gap-2">
                          {guestDeckATokens.map((tid, i) => {
                            const c = cards.get(tid);
                            return c ? <CardMini key={i} card={c} owner={0} /> : null;
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-player-b-600 mb-1">Nyano deck (B)</div>
                        {classicOpenCardIndices ? (
                          <div className="mb-1 text-[11px] text-slate-500">
                            {classicOpenCardIndices.mode === "all_open"
                              ? "Open slots: all"
                              : `Open slots: ${formatClassicOpenSlots(classicOpenCardIndices.playerB)}`}
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
                              {sfxMuted ? "SFX OFF" : "SFX ON"}
                            </button>
                          )}
                        </div>
                      )}

                      {activeClassicRuleTags.length > 0 && (
                        <ClassicRulesRibbonMint
                          ruleTags={activeClassicRuleTags}
                          openLabel={classicOpenLabel}
                          swapLabel={classicSwapLabel}
                          forcedCardIndex={classicForcedCardIndex}
                          forcedRuleLabel={classicForcedRuleLabel}
                        />
                      )}

                      {classicOpenPresentation && !showMintPlayerPanels && (
                        <div className="mint-openhand-inline">
                          <ClassicOpenHandMiniMint
                            sideLabel={getPlayerDisplayLabel(0)}
                            cards={classicOpenPresentation.playerA.cards}
                            openCardIndices={classicOpenPresentation.playerA.openCardIndices}
                            usedCardIndices={classicOpenPresentation.playerA.usedCardIndices}
                            modeLabel={classicOpenModeLabel}
                          />
                          <ClassicOpenHandMiniMint
                            sideLabel={getPlayerDisplayLabel(1)}
                            cards={classicOpenPresentation.playerB.cards}
                            openCardIndices={classicOpenPresentation.playerB.openCardIndices}
                            usedCardIndices={classicOpenPresentation.playerB.usedCardIndices}
                            modeLabel={classicOpenModeLabel}
                          />
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
                              tone={mintHudTone}
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
                              {sfxMuted ? "SFX OFF" : "SFX ON"}
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

                {/* AI turn notice (mint: fixed slot to avoid board jump) */}
                {showStageAssistUi && useMintUi ? (
                  <div className={["mint-ai-notice-slot", !isAiTurn && "mint-ai-notice-slot--idle"].filter(Boolean).join(" ")}>
                    {isAiTurn ? (
                      <div className="mint-ai-notice" role="status" aria-live="polite">
                        {aiAutoPlay ? (
                          <span>
                            <span className="font-semibold animate-pulse">Nyano is thinking...</span>
                            {aiCountdownMs !== null ? ` ${Math.max(0.1, aiCountdownMs / 1000).toFixed(1)}s` : ""}
                          </span>
                        ) : (
                          "Nyano turn. Press \"Nyano Move\"."
                        )}
                      </div>
                    ) : (
                      <div className="mint-ai-notice mint-ai-notice--placeholder" aria-hidden="true">
                        Nyano is thinking...
                      </div>
                    )}
                  </div>
                ) : showStageAssistUi && isAiTurn ? (
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
                ) : null}

                {useMintUi && (showStageAssistUi || isStageFocusRoute) && (
                  <div className={stageLayoutClasses.announcerStackClassName}>
                    {/* Fixed status slot: always reserved to prevent layout shift */}
                    {showMintStatusSummarySlot ? (
                      <div className={["mint-status-summary-slot", !lastFlipSummaryText && "mint-status-summary-slot--idle"].filter(Boolean).join(" ")}>
                        {lastFlipSummaryText ? (
                          <div className="mint-status-summary" role="status" aria-live="polite">
                            <span className="mint-status-summary__text">Battle: {lastFlipSummaryText}</span>
                          </div>
                        ) : (
                          <div className="mint-status-summary mint-status-summary--placeholder" aria-hidden="true">
                            <span className="mint-status-summary__text">Battle status</span>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Fixed Nyano slot: always reserved via NyanoReactionSlot */}
                    <NyanoReactionSlot
                      input={nyanoReactionInput}
                      turnIndex={turns.length}
                      rpg={isRpg}
                      mint={useMintUi}
                      tone={mintHudTone}
                      aiReasonCode={currentAiReasonCode}
                      stageFocus={isStageFocusRoute}
                    />
                  </div>
                )}

                {isEngine && engineRendererFailed && (
                  <div className={stageLayoutClasses.engineFallbackBannerClassName}>
                    <span title={engineRendererError ?? undefined}>
                      Pixi renderer is unavailable. Showing fallback board UI.                    </span>
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

                {/* ------------------------------------------------------------------------
                    P0-1: Interactive Board (unified input)
                    
                    BoardView / BoardViewRPG with:
                    - selectableCells = empty cells (when it's your turn)
                    - selectedCell = draftCell
                    - onCellSelect = handleCellSelect
                    ------------------------------------------------------------------------ */}
                <div
                  className={stageLayoutClasses.boardShellClassName}
                >
                  {showMintPlayerPanels && (
                    <PlayerSidePanelMint
                      side="left"
                      playerIndex={0}
                      isActive={currentPlayer === 0}
                      remainingCards={remainingCardsA}
                      openHand={classicOpenPresentation
                        ? {
                            cards: classicOpenPresentation.playerA.cards,
                            openCardIndices: classicOpenPresentation.playerA.openCardIndices,
                            usedCardIndices: classicOpenPresentation.playerA.usedCardIndices,
                            modeLabel: classicOpenModeLabel,
                          }
                        : null}
                    />
                  )}

                  <div
                    className={stageLayoutClasses.boardCenterClassName}
                  >
                    {sim.ok ? (
                      isMint || (isEngine && engineRendererFailed) ? (
                        <DuelStageMint
                          impact={nyanoReactionImpact}
                          impactBurst={stageImpactBurstActive}
                          impactBurstLevel={stageImpactBurstLevel}
                        >
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
                            className={[
                              "mint-board-view mint-board-view--match",
                              idleGuideTarget === "select_cell" && "mint-board-view--idle-guide",
                            ].filter(Boolean).join(" ")}
                            gamePhase={matchBoardPhase}
                            inlineError={error}
                            onDismissError={() => setError(null)}
                            flipTraces={showStageAssistUi && density !== "minimal" ? lastFlipTraces : null}
                            isFlipAnimating={boardAnim.isAnimating}
                            dragDropEnabled={enableHandDragDrop && isHandDragging}
                            onCellDrop={handleBoardDrop}
                            onCellDragHover={handleBoardDragHover}
                            idleGuideSelectables={idleGuideTarget === "select_cell"}
                            selectedCardPreview={
                              draftCardIndex !== null && cards
                                ? cards.get(currentDeckTokens[draftCardIndex]) ?? null
                                : null
                            }
                          />
                        </DuelStageMint>
                      ) : useEngineRenderer ? (
                        <DuelStageMint
                          impact={nyanoReactionImpact}
                          impactBurst={stageImpactBurstActive}
                          impactBurstLevel={stageImpactBurstLevel}
                        >
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
                            gamePhase={matchBoardPhase}
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
                      <MatchErrorPanel>
                        Engine error: {!sim.ok ? sim.error : "unknown"}
                      </MatchErrorPanel>
                    )}
                  </div>

                  {showMintPlayerPanels && (
                    <PlayerSidePanelMint
                      side="right"
                      playerIndex={1}
                      isActive={currentPlayer === 1}
                      remainingCards={remainingCardsB}
                      openHand={classicOpenPresentation
                        ? {
                            cards: classicOpenPresentation.playerB.cards,
                            openCardIndices: classicOpenPresentation.playerB.openCardIndices,
                            usedCardIndices: classicOpenPresentation.playerB.usedCardIndices,
                            modeLabel: classicOpenModeLabel,
                          }
                        : null}
                    />
                  )}
                </div>

                {showDesktopQuickCommit ? (
                  <MatchQuickCommitBar
                    draftCardIndex={draftCardIndex}
                    draftCell={draftCell}
                    draftWarningMarkCell={draftWarningMarkCell}
                    onChangeDraftWarningMarkCell={setDraftWarningMarkCell}
                    isBoardFull={turns.length >= 9}
                    isAiTurn={isAiTurn}
                    currentWarnRemaining={currentWarnRemaining}
                    availableCells={availableCells}
                    canCommit={!(turns.length >= 9 || isAiTurn || draftCell === null || draftCardIndex === null)}
                    canUndo={turns.length > 0}
                    onCommitMove={commitMove}
                    onUndoMove={undoMove}
                  />
                ) : null}

                {/* FLIGHT-0100: Card flight animation portal */}
                {cardFlight.state && <CardFlight {...cardFlight.state} />}

                <MatchBoardFeedbackPanels
                  isAnimating={boardAnim.isAnimating}
                  placedCell={boardAnim.placedCell}
                  flippedCells={boardAnim.flippedCells}
                  turnPlayerLabel={turns.length > 0 ? (turnPlayer(firstPlayer, turns.length - 1) === 0 ? "A" : "B") : "A"}
                  isStageFocusRoute={isStageFocusRoute}
                  showLegacyStatusSummary={showLegacyStatusSummary}
                  isRpg={isRpg}
                  lastFlipSummaryText={lastFlipSummaryText}
                />

                {showFocusHandDock && (
                  <MatchFocusHandDock
                    isStageFocusRoute={isStageFocusRoute}
                    headerLabel="Hand Dock"
                    isAiTurn={isAiTurn}
                    draftCardIndex={draftCardIndex}
                    draftCell={draftCell}
                    forcedCardIndex={classicForcedCardIndex}
                    forcedRuleLabel={classicForcedRuleLabel}
                    currentDeckTokens={currentDeckTokens}
                    cardMap={cards}
                    usedCardIndices={effectiveUsedCardIndices}
                    isBoardFull={turns.length >= 9}
                    enableHandDragDrop={enableHandDragDrop}
                    currentPlayer={currentPlayer}
                    onRecordInteraction={telemetry.recordInteraction}
                    onSelectDraftCard={selectDraftCard}
                    onHandCardDragStart={handleHandCardDragStart}
                    onHandCardDragEnd={handleHandCardDragEnd}
                    draftWarningMarkCell={draftWarningMarkCell}
                    onChangeDraftWarningMarkCell={setDraftWarningMarkCell}
                    currentWarnRemaining={currentWarnRemaining}
                    availableCells={availableCells}
                    canCommit={!(isAiTurn || draftCell === null || draftCardIndex === null)}
                    canUndo={!(isAiTurn || turns.length === 0)}
                    onCommitMove={commitMove}
                    onUndoMove={undoMove}
                  />
                )}

                {/* ------------------------------------------------------------------------
                    P0-2: Hand Display (RPG or standard)
                    ------------------------------------------------------------------------ */}
                <MatchHandInteractionArea
                  isStageFocusRoute={isStageFocusRoute}
                  showStageControls={showStageControls}
                  showFocusHandDock={showFocusHandDock}
                  isMintUi={useMintUi}
                  isRpg={isRpg}
                  currentPlayer={currentPlayer}
                  draftCell={draftCell}
                  isHandDragging={isHandDragging}
                  classicForcedCardIndex={classicForcedCardIndex}
                  classicForcedRuleLabel={classicForcedRuleLabel}
                  currentHandCards={currentHandCards}
                  usedCardIndices={effectiveUsedCardIndices}
                  draftCardIndex={draftCardIndex}
                  deckTokenIds={currentDeckTokens}
                  cardMap={cards}
                  isAiTurn={isAiTurn}
                  isBoardFull={turns.length >= 9}
                  turnsCount={turns.length}
                  enableHandDragDrop={enableHandDragDrop}
                  onRecordInteraction={telemetry.recordInteraction}
                  onSelectDraftCard={selectDraftCard}
                  onHandCardDragStart={handleHandCardDragStart}
                  onHandCardDragEnd={handleHandCardDragEnd}
                  currentWarnRemaining={currentWarnRemaining}
                  availableCells={availableCells}
                  draftWarningMarkCell={draftWarningMarkCell}
                  isVsNyanoAi={isVsNyanoAi}
                  aiAutoPlay={aiAutoPlay}
                  idleGuideHand={idleGuideTarget === "select_card"}
                  onChangeDraftWarningMarkCell={setDraftWarningMarkCell}
                  onCommitMove={commitMove}
                  onUndoMove={undoMove}
                  onAiMove={doAiMove}
                />

                {/* Error display */}
                {error && cards ? (
                  <MatchErrorPanel>{error}</MatchErrorPanel>
                ) : null}
              </div>

              {/* Right: Turn Log + Info */}
              {/* Mint mode: content lives in slide-out drawer */}
              <MatchInfoColumn
                isMintUi={useMintUi}
                drawerOpen={drawerOpen}
                onOpenDrawer={openDrawer}
                onCloseDrawer={closeDrawer}
                density={density}
                onChangeDensity={handleDensityChange}
                simOk={sim.ok}
                previewTurns={sim.ok ? sim.previewTurns : []}
                previewHistory={sim.ok ? sim.previewHistory : []}
                selectedTurnIndex={selectedTurnIndex}
                onSelectTurn={setSelectedTurnIndex}
                annotations={replayAnnotations}
                boardAdvantages={boardAdvantages}
                resultSummary={matchResultSummary}
                pendingMessage="Result is shown after turn 9."
                canFinalize={canFinalize}
                onCopyTranscriptJson={copyTranscriptJson}
                onCopyShareUrl={copyShareUrl}
                onOpenReplay={openReplay}
                aiNoteCount={Object.keys(aiNotes).length}
                aiNotesContent={<AiNotesList notes={aiNotes} />}
                sideColumnClassName={stageLayoutClasses.nonMintSideColumnClassName}
                isRpg={isRpg}
                isStageFocusRoute={isStageFocusRoute}
                rpgLogEntries={rpgLogEntries}
                isGuestPostGameVisible={isGuestMode && turns.length >= 9}
                guestDeckSaved={guestDeckSaved}
                onRematch={handleRematch}
                onLoadNewGuestDeck={() => {
                  resetMatch();
                  void loadCardsFromIndex();
                }}
                onSaveGuestDeck={handleSaveGuestDeck}
                onCopyShareTemplate={copyShareTemplate}
                guestQrCode={(
                  <MatchShareQrCode
                    transcript={sim.ok ? sim.transcript : null}
                    cards={cards}
                    eventId={event?.id}
                    ui={uiParam}
                    rulesetKey={rulesetKey}
                    classicMask={activeClassicMask}
                  />
                )}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
