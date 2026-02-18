import React from "react";
import { useToast } from "@/components/Toast";
import { Disclosure } from "@/components/Disclosure";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintPageGuide } from "@/components/mint/MintPageGuide";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintIcon, type MintIconName } from "@/components/mint/icons/MintIcon";

import type { BoardCell, CardData, MatchResultWithHistory, RulesetConfig, TranscriptV1, TurnSummary } from "@nyano/triad-engine";
import {
  computeRulesetId,
  DEFAULT_RULESET_CONFIG_V2,
  resolveClassicOpenCardIndices,
  resolveClassicSwapIndices,
  simulateMatchV1WithHistory,
  verifyReplayV1,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
} from "@nyano/triad-engine";

import OFFICIAL from "@root/rulesets/official_onchain_rulesets.json";

import { BoardView } from "@/components/BoardView";
import { BoardViewMint } from "@/components/BoardViewMint";
import { BoardViewRPG } from "@/components/BoardViewRPG";
import { DuelStageMint } from "@/components/DuelStageMint";
import { ScoreBar } from "@/components/ScoreBar";
import { BattleHudMint } from "@/components/BattleHudMint";
import { CardMini } from "@/components/CardMini";
import { HiddenDeckPreviewCard } from "@/components/HiddenDeckPreviewCard";
import { TurnLog } from "@/components/TurnLog";
import { GameResultBanner } from "@/components/GameResultOverlay";
import {
  pickReactionKind,
  resolveReactionCutInImpact,
  type NyanoReactionInput,
} from "@/components/NyanoReaction";
import { NyanoReactionSlot } from "@/components/NyanoReactionSlot";
import { NyanoAvatar } from "@/components/NyanoAvatar";
import { BattleStageEngine } from "@/engine/components/BattleStageEngine";
import { reactionToExpression } from "@/lib/expression_map";
import {
  base64UrlEncodeUtf8,
  tryGzipCompressUtf8ToBase64Url,
} from "@/lib/base64url";
import { errorMessage } from "@/lib/errorMessage";
import { stringifyWithBigInt } from "@/lib/json";
import { formatEventPeriod, getEventById, getEventStatus } from "@/lib/events";
import { hasEventAttempt, upsertEventAttempt, type EventAttemptV1 } from "@/lib/event_attempts";
import { resolveCards } from "@/lib/resolveCards";
import { publishOverlayState } from "@/lib/streamer_bus";
import { parseReplayPayload } from "@/lib/replay_bundle";
import { annotateReplayMoves } from "@/lib/ai/replay_annotations";
import { assessBoardAdvantage, type BoardAdvantage } from "@/lib/ai/board_advantage";
import { AdvantageBadge } from "@/components/AdvantageBadge";
import { resolveRuleset, resolveRulesetById } from "@/lib/ruleset_registry";
import { writeClipboardText } from "@/lib/clipboard";
import { appAbsoluteUrl, appPath, buildReplayShareUrl } from "@/lib/appUrl";
import { computeStageBoardSizing, shouldShowStageSecondaryControls } from "@/lib/stage_layout";
import { createSfxEngine, type SfxEngine, type SfxName } from "@/lib/sfx";
import { readVfxQuality, writeVfxQuality, type VfxPreference } from "@/lib/local_settings";
import { applyVfxQualityToDocument, resolveVfxQuality, type VfxQuality } from "@/lib/visual/visualSettings";
import { decodeReplaySharePayload, hasReplaySharePayload, stripReplayShareParams } from "@/lib/replay_share_params";
import {
  detectReplayHighlights,
  formatReplayWinnerLabel,
  replayHighlightKindLabel,
  summarizeReplayHighlights,
  type ReplayHighlightKind,
} from "@/lib/replay_highlights";
import {
  REPLAY_PLAYBACK_SPEED_OPTIONS,
  nextReplayAutoplayStep,
  normalizeReplayPlaybackSpeed,
  replayPhaseInfo,
  replayStepProgress,
  replayStepStatusText,
  type ReplayPhaseInfo,
} from "@/lib/replay_timeline";
import { MINT_PAGE_GUIDES } from "@/lib/mint_page_guides";
import { appendThemeToPath, resolveAppTheme } from "@/lib/theme";
import { decodeClassicRulesMask, listClassicRuleTags, normalizeClassicRulesConfig } from "@/lib/classic_rules_param";

type Mode = "auto" | "v1" | "v2" | "compare";

type SimState =
  | { ok: false; error: string }
  | {
      ok: true;
      transcript: TranscriptV1;
      cards: Map<bigint, CardData>;
      owners: Map<bigint, `0x${string}`>;
      currentRulesetLabel: string;
      resolvedRuleset: RulesetConfig | null;
      rulesetIdMismatchWarning: string | null;
      current: MatchResultWithHistory;
      v1: MatchResultWithHistory;
      v2: MatchResultWithHistory;
    };

function clampInt(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function parseInt32Param(v: string | null): number | null {
  if (!v) return null;
  if (!/^-?\d+$/.test(v)) return null;
  const n = Number(v);
  if (!Number.isInteger(n)) return null;
  if (n < -2147483648 || n > 2147483647) return null;
  return n;
}


function turnPlayer(firstPlayer: 0 | 1, turnIndex: number): 0 | 1 {
  return ((firstPlayer + (turnIndex % 2)) % 2) as 0 | 1;
}


function parseMode(v: string | null): Mode {
  if (v === "auto" || v === "v1" || v === "v2" || v === "compare") return v;
  return "auto";
}

type ReplayBoardUi = "classic" | "rpg" | "engine";
type MatchBoardUi = "mint" | "rpg" | "engine";
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

function parseReplayBoardUi(v: string | null): ReplayBoardUi {
  if (v === "rpg") return "rpg";
  if (v === "engine") return "engine";
  return "classic";
}

function parseFocusMode(v: string | null): boolean {
  if (!v) return false;
  const normalized = v.toLowerCase();
  return normalized === "1" || normalized === "focus";
}

function toMatchBoardUi(v: ReplayBoardUi): MatchBoardUi {
  if (v === "classic") return "mint";
  return v;
}

function boardEquals(a: ReadonlyArray<BoardCell | null>, b: ReadonlyArray<BoardCell | null>): boolean {
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

function computeDelta(boardPrev: ReadonlyArray<BoardCell | null>, boardNow: ReadonlyArray<BoardCell | null>): { placedCell: number | null; flippedCells: number[] } {
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

function buildNyanoReactionInput(res: MatchResultWithHistory, step: number): NyanoReactionInput | null {
  // Nyano reaction is based on the *last executed turn* at the given step.
  // step: 0 = initial, 1 = after turn 1, ... 9 = finished
  if (step <= 0) return null;
  if (!res.turns || res.turns.length === 0) return null;

  const lastIdx = Math.min(step - 1, res.turns.length - 1);
  const last = res.turns[lastIdx];
  const boardNow = res.boardHistory?.[step] ?? res.board;

  // Count current tiles
  let tilesA = 0;
  let tilesB = 0;
  for (const cell of boardNow) {
    if (!cell) continue;
    if (cell.owner === 0) tilesA++;
    else tilesB++;
  }

  return {
    flipCount: Number(last.flipCount ?? 0),
    hasChain: Boolean(last.flipTraces?.some((t) => t.isChain)),
    comboEffect: last.comboEffect ?? "none",
    warningTriggered: Boolean(last.warningTriggered),
    tilesA,
    tilesB,
    // Replay is a spectator experience: keep neutral perspective.
    perspective: null,
    finished: step >= 9,
    winner: step >= 9 ? res.winner : null,
  };
}

function rulesetLabelFromConfig(cfg: RulesetConfig): string {
  if (cfg === ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2) return "engine v2（shadow: warning無視）";
  return "engine v1（core+tactics）";
}

function rulesetLabelFromRegistryConfig(cfg: RulesetConfig): string {
  if (cfg.version === 2) {
    const tags = listClassicRuleTags(cfg.classic);
    if (tags.length > 0) return `rulesetId登録（classic: ${tags.join(", ")}）`;
    return "rulesetId登録（v2）";
  }
  return "rulesetId登録（v1）";
}

function rulesetLabelFromUrlFallback(cfg: RulesetConfig): string {
  if (cfg.version !== 2) return "URL fallback（v1）";
  const tags = listClassicRuleTags(cfg.classic);
  if (tags.length === 0) return "URL fallback（classic custom: なし）";
  return `URL fallback（classic: ${tags.join(", ")}）`;
}

function resolveReplayRulesetFromParams(rulesetKeyParam: string | null, classicMaskParam: string | null): RulesetConfig | null {
  if (!rulesetKeyParam) return null;
  if (rulesetKeyParam === "classic_custom") {
    const classic = normalizeClassicRulesConfig(decodeClassicRulesMask(classicMaskParam));
    return {
      ...DEFAULT_RULESET_CONFIG_V2,
      classic: { ...classic },
    };
  }
  return resolveRuleset(rulesetKeyParam);
}

function pickDefaultMode(rulesetId: string): Mode {
  try {
    const rulesets = (OFFICIAL as { rulesets: Array<{ rulesetId: string; engineId: number }> }).rulesets;
    const hit = rulesets.find((r) => r.rulesetId.toLowerCase() === rulesetId.toLowerCase());
    if (!hit) return "compare";
    return hit.engineId === 2 ? "v2" : "v1";
  } catch {
    return "compare";
  }
}

function shouldAutoCompareByRulesetId(rulesetId: string): boolean {
  if (resolveRulesetById(rulesetId)) return false;
  return pickDefaultMode(rulesetId) === "compare";
}

function formatClassicOpenSlots(indices: readonly number[]): string {
  return indices.map((idx) => String(idx + 1)).join(", ");
}

const HIGHLIGHT_KIND_ORDER: ReplayHighlightKind[] = ["big_flip", "chain", "combo", "warning"];

export function ReplayPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const appTheme = resolveAppTheme(searchParams);
  const isMintTheme = appTheme === "mint";
  const themed = React.useCallback((path: string) => appendThemeToPath(path, appTheme), [appTheme]);
  const uiMode = parseReplayBoardUi((searchParams.get("ui") || "").toLowerCase());
  const uiParam = uiMode === "classic" ? undefined : uiMode;
  const matchUi = toMatchBoardUi(uiMode);
  const isEngine = uiMode === "engine";
  const isRpg = uiMode === "rpg";
  const focusParam = searchParams.get("focus") ?? searchParams.get("layout");
  const isFocusMode = parseFocusMode(focusParam);
  const isEngineFocus = isEngine && isFocusMode;
  const stageReplayUrl = React.useMemo(() => {
    const next = new URLSearchParams(searchParams);
    next.set("ui", "engine");
    next.set("focus", "1");
    next.delete("layout");
    const query = next.toString();
    return query ? `/replay-stage?${query}` : "/replay-stage";
  }, [searchParams]);
  const replayQuickActions = React.useMemo<Array<{ to: string; label: string; subtitle: string; icon: MintIconName }>>(
    () => [
      { to: themed("/match?ui=mint"), label: "対戦", subtitle: "新しい対戦を開始", icon: "match" },
      { to: themed("/events"), label: "イベント", subtitle: "シーズン挑戦", icon: "events" },
      { to: themed("/stream"), label: "配信", subtitle: "配信ツール", icon: "stream" },
      { to: themed(stageReplayUrl), label: "Pixiステージ", subtitle: "集中表示", icon: "replay" },
    ],
    [stageReplayUrl, themed],
  );
  const isReplayStageRoute = /\/replay-stage$/.test(location.pathname);
  const isStageFocus = isEngineFocus && isReplayStageRoute;
  const stageViewportRef = React.useRef<HTMLDivElement>(null);
  const [stageBoardSizing, setStageBoardSizing] = React.useState(() =>
    computeStageBoardSizing({
      viewportWidthPx: typeof window === "undefined" ? 1366 : window.innerWidth,
      viewportHeightPx: typeof window === "undefined" ? 900 : window.innerHeight,
      kind: "replay",
    })
  );
  const engineBoardMaxWidthPx = isReplayStageRoute ? stageBoardSizing.maxWidthPx : undefined;
  const engineBoardMinHeightPx = isReplayStageRoute ? stageBoardSizing.minHeightPx : undefined;

  React.useEffect(() => {
    if (!isReplayStageRoute) return;

    const updateSizing = () => {
      setStageBoardSizing(
        computeStageBoardSizing({
          viewportWidthPx: window.innerWidth,
          viewportHeightPx: window.innerHeight,
          kind: "replay",
        })
      );
    };

    updateSizing();
    window.addEventListener("resize", updateSizing);
    return () => window.removeEventListener("resize", updateSizing);
  }, [isReplayStageRoute]);

  const eventId = searchParams.get("event") ?? "";
  const event = React.useMemo(() => (eventId ? getEventById(eventId) : null), [eventId]);
  const eventStatus = event ? getEventStatus(event) : null;
  const pointsDeltaA = React.useMemo(() => parseInt32Param(searchParams.get("pda")), [searchParams]);


  // Initial values from shareable URL
  const initialT = searchParams.get("t");
  const initialZ = searchParams.get("z");

  const initialSharePayload = React.useMemo(() => {
    const params = new URLSearchParams();
    if (initialZ) params.set("z", initialZ);
    if (initialT) params.set("t", initialT);
    return decodeReplaySharePayload(params);
  }, [initialT, initialZ]);
  const initialTextFromT = initialSharePayload.kind === "ok" && initialSharePayload.param === "t"
    ? initialSharePayload.text
    : "";
  const hasSharePayload = hasReplaySharePayload(searchParams);

  const initialMode = parseMode(searchParams.get("mode"));
  const initialStep = clampInt(Number(searchParams.get("step") ?? "0"), 0, 9);

  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [text, setText] = React.useState<string>(initialZ ? "" : initialTextFromT);

  const [loading, setLoading] = React.useState(false);
  const [sim, setSim] = React.useState<SimState>({
    ok: false,
    error: "対局ログJSONを貼り付けて読み込んでください。",
  });

  const [step, setStep] = React.useState<number>(initialStep);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [replayRevealHiddenSlots, setReplayRevealHiddenSlots] = React.useState(false);
  const [playbackSpeed, setPlaybackSpeed] = React.useState<number>(1);
  const toast = useToast();
  const [engineRendererFailed, setEngineRendererFailed] = React.useState(false);
  const [engineRendererError, setEngineRendererError] = React.useState<string | null>(null);
  const useEngineRenderer = isEngine && !engineRendererFailed;
  const initialBroadcast = searchParams.get("broadcast") === "1";
  const [broadcastOverlay, setBroadcastOverlay] = React.useState<boolean>(initialBroadcast);
  const sfx = React.useMemo<SfxEngine | null>(() => (isEngine ? createSfxEngine() : null), [isEngine]);
  const [sfxMuted, setSfxMuted] = React.useState(() => sfx?.isMuted() ?? false);

  React.useEffect(() => {
    return () => {
      sfx?.dispose();
    };
  }, [sfx]);

  const handleSfxToggle = React.useCallback(() => {
    if (!sfx) return;
    const next = !sfx.isMuted();
    sfx.setMuted(next);
    setSfxMuted(next);
  }, [sfx]);

  const playReplaySfx = React.useCallback((name: SfxName) => {
    sfx?.play(name);
  }, [sfx]);

  const [verifyStatus, setVerifyStatus] = React.useState<"idle" | "ok" | "mismatch">("idle");
  const [showStagePanels, setShowStagePanels] = React.useState(() => !isStageFocus);
  const [showStageSetup, setShowStageSetup] = React.useState(() => !isStageFocus);
  const stageTransportManualOverrideRef = React.useRef(false);
  const stageActionFeedbackTimerRef = React.useRef<number | null>(null);
  const [stageActionFeedback, setStageActionFeedback] = React.useState("");
  const [stageActionFeedbackTone, setStageActionFeedbackTone] = React.useState<"info" | "success" | "warn">("info");
  const [vfxPreference, setVfxPreference] = React.useState<VfxPreference>(() => readVfxQuality("auto"));
  const [resolvedVfxQuality, setResolvedVfxQuality] = React.useState<VfxQuality>(() => resolveVfxQuality());
  const [showStageTransport, setShowStageTransport] = React.useState(() => {
    if (!isStageFocus) return true;
    if (typeof window === "undefined") return true;
    return shouldShowStageSecondaryControls(window.innerWidth);
  });
  const [isStageFullscreen, setIsStageFullscreen] = React.useState(
    () => typeof document !== "undefined" && Boolean(document.fullscreenElement),
  );

  React.useEffect(() => {
    if (!isStageFocus) {
      setShowStagePanels(true);
      return;
    }
    setShowStagePanels(false);
  }, [isStageFocus]);

  React.useEffect(() => {
    if (isEngine) return;
    setEngineRendererFailed(false);
    setEngineRendererError(null);
  }, [isEngine]);

  const handleEngineRendererInitError = React.useCallback((message: string) => {
    setEngineRendererFailed(true);
    setEngineRendererError(message);
    toast.warn("Pixiレンダラーを初期化できませんでした", "Mint盤面に切り替えました");
  }, [toast]);

  const handleRetryEngineRenderer = React.useCallback(() => {
    setEngineRendererFailed(false);
    setEngineRendererError(null);
  }, []);

  React.useEffect(() => {
    if (!isStageFocus) {
      setShowStageSetup(true);
      return;
    }
    setShowStageSetup(false);
  }, [isStageFocus]);

  React.useEffect(() => {
    stageTransportManualOverrideRef.current = false;
    if (!isStageFocus) {
      setShowStageTransport(true);
      return;
    }
    if (typeof window === "undefined") {
      setShowStageTransport(true);
      return;
    }
    setShowStageTransport(shouldShowStageSecondaryControls(window.innerWidth));
  }, [isStageFocus]);

  React.useEffect(() => {
    if (!isStageFocus || typeof window === "undefined") return;
    const handleResize = () => {
      if (stageTransportManualOverrideRef.current) return;
      setShowStageTransport(shouldShowStageSecondaryControls(window.innerWidth));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isStageFocus]);

  const toggleStageTransport = React.useCallback(() => {
    stageTransportManualOverrideRef.current = true;
    setShowStageTransport((prev) => !prev);
  }, []);

  const pushStageActionFeedback = React.useCallback((message: string, tone: "info" | "success" | "warn" = "info") => {
    if (!isStageFocus) return;
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
  }, [isStageFocus]);

  React.useEffect(() => {
    if (isStageFocus) return;
    setStageActionFeedback("");
    setStageActionFeedbackTone("info");
    if (typeof window !== "undefined" && stageActionFeedbackTimerRef.current !== null) {
      window.clearTimeout(stageActionFeedbackTimerRef.current);
      stageActionFeedbackTimerRef.current = null;
    }
  }, [isStageFocus]);

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
    playReplaySfx("card_place");
    pushStageActionFeedback(`VFX ${formatStageVfxLabel(nextPreference, nextResolved)}`, "info");
  }, [playReplaySfx, pushStageActionFeedback]);

  React.useEffect(() => {
    const handleFullscreenChange = () => setIsStageFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleVerify = React.useCallback(() => {
    if (!sim.ok) return;
    const result = verifyReplayV1(sim.transcript, sim.cards, sim.current.matchId);
    setVerifyStatus(result.ok ? "ok" : "mismatch");
    playReplaySfx(result.ok ? "victory_fanfare" : "error_buzz");
  }, [playReplaySfx, sim]);

  const copy = async (v: string) => {
    await writeClipboardText(v);
  };

  const copyWithToast = async (label: string, v: string) => {
    try {
      await copy(v);
      toast.success("コピーしました", label);
    } catch (e: unknown) {
      toast.error("コピー失敗", errorMessage(e));
    }
  };

  const toggleStageFullscreen = React.useCallback(async () => {
    if (!isStageFocus) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      const target = stageViewportRef.current;
      if (!target) return;
      await target.requestFullscreen();
    } catch (e: unknown) {
      toast.warn("全画面表示", errorMessage(e));
    }
  }, [isStageFocus, toast]);

  const setReplayBoardUi = React.useCallback((nextUi: ReplayBoardUi) => {
    const next = new URLSearchParams(searchParams);
    if (nextUi === "classic") next.delete("ui");
    else next.set("ui", nextUi);
    if (nextUi !== "engine") {
      next.delete("focus");
      next.delete("layout");
    }
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const setFocusMode = React.useCallback((enabled: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (enabled) next.set("focus", "1");
    else next.delete("focus");
    next.delete("layout");
    if (!enabled && isReplayStageRoute) {
      const query = next.toString();
      navigate(query ? `/replay?${query}` : "/replay", { replace: true });
      return;
    }
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, isReplayStageRoute, navigate]);

  const toggleStageFullscreenWithFeedback = React.useCallback(() => {
    pushStageActionFeedback(isStageFullscreen ? "全画面を終了" : "全画面を開始");
    playReplaySfx("card_place");
    void toggleStageFullscreen();
  }, [isStageFullscreen, playReplaySfx, pushStageActionFeedback, toggleStageFullscreen]);

  const toggleStageTransportWithFeedback = React.useCallback(() => {
    pushStageActionFeedback(showStageTransport ? "操作を隠しました" : "操作を表示しました");
    playReplaySfx("card_place");
    toggleStageTransport();
  }, [playReplaySfx, pushStageActionFeedback, showStageTransport, toggleStageTransport]);

  const toggleStageSetupWithFeedback = React.useCallback(() => {
    setShowStageSetup((prev) => {
      const next = !prev;
      if (isStageFocus) {
        pushStageActionFeedback(next ? "設定を表示しました" : "設定を隠しました");
        playReplaySfx("card_place");
      }
      return next;
    });
  }, [isStageFocus, playReplaySfx, pushStageActionFeedback]);

  const toggleStagePanelsWithFeedback = React.useCallback(() => {
    setShowStagePanels((prev) => {
      const next = !prev;
      if (isStageFocus) {
        pushStageActionFeedback(next ? "タイムラインを表示" : "タイムラインを非表示");
        playReplaySfx("card_place");
      }
      return next;
    });
  }, [isStageFocus, playReplaySfx, pushStageActionFeedback]);

  const exitFocusModeWithFeedback = React.useCallback(() => {
    pushStageActionFeedback("フォーカスを終了します", "warn");
    setFocusMode(false);
  }, [pushStageActionFeedback, setFocusMode]);

  React.useEffect(() => {
    if (isEngine || !isFocusMode) return;
    const next = new URLSearchParams(searchParams);
    next.delete("focus");
    next.delete("layout");
    setSearchParams(next, { replace: true });
  }, [isEngine, isFocusMode, searchParams, setSearchParams]);

  const overlayUrl = React.useMemo(() => appAbsoluteUrl("overlay?controls=0"), []);
  const overlayPath = React.useMemo(() => appPath("overlay"), []);
  const replayBroadcastPath = React.useMemo(() => appPath("replay?broadcast=1"), []);

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
            error: sim.error || "リプレイが未読込です",
          });
          if (!opts?.silent) toast.warn("オーバーレイ (Overlay)", "リプレイが未準備です");
          return;
        }

        const res = sim.current;
        const transcript = sim.transcript;

        const lastIndex = step - 1;
        const last: TurnSummary | null = lastIndex >= 0 ? (res.turns[lastIndex] ?? null) : null;

        const lastMove =
          last && typeof last.cell === "number"
            ? {
                turnIndex: lastIndex,
                by: turnPlayer(transcript.header.firstPlayer as 0 | 1, lastIndex),
                cell: last.cell,
                cardIndex: last.cardIndex,
                warningMarkCell: typeof last.warningPlaced === "number" ? last.warningPlaced : null,
              }
            : undefined;

const lastTurnSummary =
  last
    ? {
        flipCount: last.flipCount,
        comboCount: last.comboCount,
        comboEffect: last.comboEffect ?? "none",
        triadPlus: last.appliedBonus?.triadPlus ?? 0,
        ignoreWarningMark: Boolean(last.appliedBonus?.ignoreWarningMark),
        warningTriggered: Boolean(last.warningTriggered),
        warningPlaced: typeof last.warningPlaced === "number" ? last.warningPlaced : null,
        flips: last.flipTraces
          ? last.flipTraces.map((f) => ({
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
protocolV1: {
  header: {
    version: Number(transcript.header.version),
    rulesetId: String(transcript.header.rulesetId),
    seasonId: Number(transcript.header.seasonId),
    playerA: String(transcript.header.playerA),
    playerB: String(transcript.header.playerB),
    deckA: transcript.header.deckA.map((x) => x.toString()),
    deckB: transcript.header.deckB.map((x) => x.toString()),
    firstPlayer: transcript.header.firstPlayer as 0 | 1,
    deadline: Number(transcript.header.deadline),
    salt: String(transcript.header.salt),
  },
  turns: transcript.turns.slice(0, step).map((t) => ({
    cell: Number(t.cell),
    cardIndex: Number(t.cardIndex),
    ...(typeof t.warningMarkCell === "number" ? { warningMarkCell: Number(t.warningMarkCell) } : {}),
  })),
},
          board: res.boardHistory[step],
          lastMove,
          lastTurnSummary,
          status: {
            finished: step >= 9,
            winner: res.winner === "draw" ? "draw" : res.winner === 0 ? "A" : "B",
            tilesA: Number(res.tiles.A),
            tilesB: Number(res.tiles.B),
            matchId: res.matchId,
          },
        });

        if (!opts?.silent) toast.success("オーバーレイ (Overlay)", "OBSオーバーレイへ送信しました。");
      } catch (e: unknown) {
        publishOverlayState({
          version: 1,
          updatedAtMs,
          mode: "replay",
          eventId: event?.id ?? (eventId || undefined),
          eventTitle: event?.title,
          error: errorMessage(e),
        });
        if (!opts?.silent) toast.error("オーバーレイ (Overlay)", errorMessage(e));
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
    setVerifyStatus("idle");
    try {
      const inputText = (override?.text ?? text).trim();
      if (!inputText) throw new Error("対局ログJSONが空です");

      const parsed = parseReplayPayload(inputText);
      const transcript = parsed.transcript;

      // Determine preferred mode from rulesetId if mode=auto.
      const mode0 = override?.mode ?? mode;
      const fallbackRulesetFromParams = resolveReplayRulesetFromParams(
        searchParams.get("rk"),
        searchParams.get("cr"),
      );
      const rulesetById = resolveRulesetById(transcript.header.rulesetId);
      const resolvedReplayRuleset = rulesetById ?? fallbackRulesetFromParams;
      const useResolvedRuleset = mode0 === "auto" && resolvedReplayRuleset !== null;
      const effectiveMode: Mode = mode0 === "auto" ? pickDefaultMode(transcript.header.rulesetId) : mode0;
      const rulesetIdMismatchWarning = !rulesetById && fallbackRulesetFromParams
        && computeRulesetId(fallbackRulesetFromParams).toLowerCase() !== transcript.header.rulesetId.toLowerCase()
        ? "URL の classic 設定が transcript rulesetId と一致しません。URL fallback ルールで再生しています。"
        : null;

      // v2: use embedded card data (no network calls needed)
      // v1: resolve via game index first (fast/cached), RPC fallback for missing
      let cards: Map<bigint, CardData>;
      let owners: Map<bigint, `0x${string}`>;
      if (parsed.version === 2) {
        cards = parsed.cards;
        owners = new Map();
      } else {
        const tokenIds = [...transcript.header.deckA, ...transcript.header.deckB];
        const resolved = await resolveCards(tokenIds);
        cards = resolved.cards;
        owners = resolved.owners;

        // Verify all cards were resolved — resolveCards silently swallows
        // RPC errors and returns an incomplete map. Surface the failure here
        // so the user sees a clear error instead of a broken replay.
        const unique = new Set(tokenIds.map((t) => t.toString()));
        if (cards.size < unique.size) {
          const missing = [...unique].filter((id) => !cards.has(BigInt(id)));
          throw new Error(
            `${missing.length}枚のカードを解決できませんでした: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}。ネットワーク接続を確認してください。`,
          );
        }
      }

      // Always compute both (cheap compared to RPC reads)
      const v1 = simulateMatchV1WithHistory(transcript, cards, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
      const v2 = simulateMatchV1WithHistory(transcript, cards, ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2);
      const byResolvedRuleset = resolvedReplayRuleset
        ? simulateMatchV1WithHistory(transcript, cards, resolvedReplayRuleset)
        : null;

      let current: MatchResultWithHistory = v1;
      let label = rulesetLabelFromConfig(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);

      if (useResolvedRuleset && byResolvedRuleset && resolvedReplayRuleset) {
        current = byResolvedRuleset;
        label = rulesetById
          ? rulesetLabelFromRegistryConfig(rulesetById)
          : rulesetLabelFromUrlFallback(resolvedReplayRuleset);
      } else if (effectiveMode === "v2") {
        current = v2;
        label = rulesetLabelFromConfig(ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2);
      } else if (effectiveMode === "compare") {
        // pick one as "current" for right-side panels; keep label explicit
        current = v1;
        label = "比較表示 v1 vs v2";
      } else if (effectiveMode === "v1") {
        current = v1;
        label = rulesetLabelFromConfig(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
      }

      setSim({
        ok: true,
        transcript,
        cards,
        owners,
        currentRulesetLabel: label,
        resolvedRuleset: resolvedReplayRuleset,
        rulesetIdMismatchWarning,
        current,
        v1,
        v2,
      });

      const stepMax = current.boardHistory.length - 1;
      const startStep = clampInt(override?.step ?? 0, 0, stepMax);
      setStep(startStep);
    } catch (e: unknown) {
      setSim({ ok: false, error: errorMessage(e) });
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
      if (initialSharePayload.kind === "none") return;
      if (initialSharePayload.kind === "error") {
        setSim({ ok: false, error: initialSharePayload.error });
        return;
      }
      setText(initialSharePayload.text);
      await load({ text: initialSharePayload.text, mode: initialMode, step: initialStep });
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
    if (!hasReplaySharePayload(searchParams)) return;

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

  const highlights = React.useMemo(
    () => (sim.ok ? detectReplayHighlights(sim.current) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sim.ok, sim.ok ? sim.current : null],
  );
  const highlightSummary = React.useMemo(() => summarizeReplayHighlights(highlights), [highlights]);
  const activeHighlights = React.useMemo(
    () => highlights.filter((highlight) => highlight.step === step),
    [highlights, step],
  );
  const stepProgress = replayStepProgress(step, stepMax);
  const canStepBack = step > 0;
  const canStepForward = step < stepMax;
  const canPlay = sim.ok && stepMax > 0;
  const showStageToolbarTransport = isStageFocus
    && sim.ok
    && showStageTransport
    && (typeof window === "undefined" || shouldShowStageSecondaryControls(window.innerWidth));
  const phaseInfo: ReplayPhaseInfo = React.useMemo(() => replayPhaseInfo(step, stepMax), [step, stepMax]);
  const stepStatusText = replayStepStatusText(step);
  const replayClassicSwap = React.useMemo(() => {
    if (!sim.ok) return null;
    const ruleset = sim.resolvedRuleset;
    if (!ruleset) return null;
    return resolveClassicSwapIndices({
      ruleset,
      header: sim.transcript.header,
    });
  }, [sim]);
  const replayClassicOpen = React.useMemo(() => {
    if (!sim.ok) return null;
    const ruleset = sim.resolvedRuleset;
    if (!ruleset) return null;
    return resolveClassicOpenCardIndices({
      ruleset,
      header: sim.transcript.header,
    });
  }, [sim]);
  const replayOpenVisibleA = React.useMemo(() => {
    if (!replayClassicOpen) return null;
    return new Set<number>(replayClassicOpen.playerA);
  }, [replayClassicOpen]);
  const replayOpenVisibleB = React.useMemo(() => {
    if (!replayClassicOpen) return null;
    return new Set<number>(replayClassicOpen.playerB);
  }, [replayClassicOpen]);
  const shouldMaskReplayDeckSlots = replayClassicOpen?.mode === "three_open" && !replayRevealHiddenSlots;
  const replayTransportButtonClass = isStageFocus ? "btn h-10 px-4" : "btn btn-sm";
  const replayTransportPrimaryButtonClass = isStageFocus ? "btn btn-primary h-10 px-4" : "btn btn-sm btn-primary";
  const replaySpeedSelectClass = isStageFocus
    ? "rounded-md border border-surface-300 bg-white h-10 px-2 text-sm"
    : "rounded-md border border-surface-300 bg-white px-2 py-1 text-xs";

  React.useEffect(() => {
    if (canPlay || !isPlaying) return;
    setIsPlaying(false);
  }, [canPlay, isPlaying]);

  // Highlight jump helpers
  const jumpToNextHighlight = React.useCallback(() => {
    if (highlights.length === 0) return;
    const next = highlights.find((h) => h.step > step);
    setIsPlaying(false);
    setStep(next ? next.step : highlights[0].step);
  }, [highlights, step]);

  const jumpToPrevHighlight = React.useCallback(() => {
    if (highlights.length === 0) return;
    const prev = [...highlights].reverse().find((h) => h.step < step);
    setIsPlaying(false);
    setStep(prev ? prev.step : highlights[highlights.length - 1].step);
  }, [highlights, step]);

  const currentHighlightIdx = React.useMemo(() => {
    if (highlights.length === 0) return -1;
    return highlights.findIndex((h) => h.step === step);
  }, [highlights, step]);
  const focusToolbarHighlightStatus = React.useMemo(() => {
    if (highlights.length === 0) return "見どころ 0件";
    if (currentHighlightIdx >= 0) return `見どころ ${currentHighlightIdx + 1}/${highlights.length}`;
    return `見どころ ${highlights.length}件`;
  }, [highlights.length, currentHighlightIdx]);

  const jumpToStartWithFeedback = React.useCallback(() => {
    setIsPlaying(false);
    setStep(0);
    playReplaySfx("card_place");
    if (isStageFocus) {
      pushStageActionFeedback("先頭へ移動しました", "success");
    }
  }, [isStageFocus, playReplaySfx, pushStageActionFeedback]);

  const jumpToPrevStepWithFeedback = React.useCallback(() => {
    setIsPlaying(false);
    setStep((s) => Math.max(0, s - 1));
    playReplaySfx("flip");
    if (isStageFocus) {
      pushStageActionFeedback("1手戻る");
    }
  }, [isStageFocus, playReplaySfx, pushStageActionFeedback]);

  const toggleReplayPlayWithFeedback = React.useCallback(() => {
    if (!canPlay) return;
    const nextIsPlaying = !isPlaying;
    setIsPlaying(nextIsPlaying);
    playReplaySfx(nextIsPlaying ? "card_place" : "flip");
    if (isStageFocus) {
      pushStageActionFeedback(nextIsPlaying ? "再生開始" : "再生停止", nextIsPlaying ? "success" : "info");
    }
  }, [canPlay, isPlaying, isStageFocus, playReplaySfx, pushStageActionFeedback]);

  const jumpToNextStepWithFeedback = React.useCallback(() => {
    setIsPlaying(false);
    setStep((s) => Math.min(stepMax, s + 1));
    playReplaySfx("flip");
    if (isStageFocus) {
      pushStageActionFeedback("1手進む");
    }
  }, [isStageFocus, playReplaySfx, pushStageActionFeedback, stepMax]);

  const jumpToEndWithFeedback = React.useCallback(() => {
    setIsPlaying(false);
    setStep(stepMax);
    playReplaySfx("card_place");
    if (isStageFocus) {
      pushStageActionFeedback("末尾へ移動");
    }
  }, [isStageFocus, playReplaySfx, pushStageActionFeedback, stepMax]);

  const jumpToPrevHighlightWithFeedback = React.useCallback(() => {
    if (highlights.length === 0) return;
    jumpToPrevHighlight();
    playReplaySfx("chain_flip");
    if (isStageFocus) {
      pushStageActionFeedback("前の見どころへ移動", "success");
    }
  }, [highlights.length, isStageFocus, jumpToPrevHighlight, playReplaySfx, pushStageActionFeedback]);

  const jumpToNextHighlightWithFeedback = React.useCallback(() => {
    if (highlights.length === 0) return;
    jumpToNextHighlight();
    playReplaySfx("chain_flip");
    if (isStageFocus) {
      pushStageActionFeedback("次の見どころへ移動", "success");
    }
  }, [highlights.length, isStageFocus, jumpToNextHighlight, playReplaySfx, pushStageActionFeedback]);

  // keyboard
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || target?.isContentEditable) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const lower = e.key.toLowerCase();
      if (isStageFocus && e.key === "Escape") {
        e.preventDefault();
        exitFocusModeWithFeedback();
        return;
      }

      if (isStageFocus && lower === "f") {
        e.preventDefault();
        toggleStageFullscreenWithFeedback();
        return;
      }
      if (isStageFocus && lower === "c") {
        e.preventDefault();
        toggleStageTransportWithFeedback();
        return;
      }
      if (isStageFocus && lower === "s") {
        e.preventDefault();
        toggleStageSetupWithFeedback();
        return;
      }
      if (isStageFocus && lower === "d") {
        e.preventDefault();
        toggleStagePanelsWithFeedback();
        return;
      }

      if (e.key === "ArrowLeft") {
        jumpToPrevStepWithFeedback();
      }
      if (e.key === "ArrowRight") {
        jumpToNextStepWithFeedback();
      }
      if (e.key === " ") {
        if (!canPlay) return;
        e.preventDefault();
        toggleReplayPlayWithFeedback();
      }
      if (e.key === "Home") {
        e.preventDefault();
        jumpToStartWithFeedback();
      }
      if (e.key === "End") {
        e.preventDefault();
        jumpToEndWithFeedback();
      }
      if (e.key === "[") {
        e.preventDefault();
        jumpToPrevHighlightWithFeedback();
      }
      if (e.key === "]") {
        e.preventDefault();
        jumpToNextHighlightWithFeedback();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    canPlay,
    isStageFocus,
    exitFocusModeWithFeedback,
    toggleStageFullscreenWithFeedback,
    toggleStageTransportWithFeedback,
    toggleStageSetupWithFeedback,
    toggleStagePanelsWithFeedback,
    jumpToPrevStepWithFeedback,
    jumpToNextStepWithFeedback,
    toggleReplayPlayWithFeedback,
    jumpToStartWithFeedback,
    jumpToEndWithFeedback,
    jumpToPrevHighlightWithFeedback,
    jumpToNextHighlightWithFeedback,
  ]);

  // Autoplay timer
  React.useEffect(() => {
    if (!isPlaying || !sim.ok || !canPlay) return;
    const ms = 1000 / normalizeReplayPlaybackSpeed(playbackSpeed);
    const timer = window.setInterval(() => {
      setStep((s) => {
        const next = nextReplayAutoplayStep(s, stepMax);
        if (next === null) {
          setIsPlaying(false);
          return s;
        }
        return next;
      });
    }, ms);
    return () => window.clearInterval(timer);
  }, [isPlaying, playbackSpeed, stepMax, sim.ok, canPlay]);

  const compare = sim.ok && (
    mode === "compare"
    || (mode === "auto"
      && sim.resolvedRuleset === null
      && shouldAutoCompareByRulesetId(sim.transcript.header.rulesetId))
  );
  const diverged = sim.ok ? !boardEquals(sim.v1.boardHistory[step], sim.v2.boardHistory[step]) : false;
  const replayNyanoReactionInput = React.useMemo(
    () => (sim.ok ? buildNyanoReactionInput(sim.current, step) : null),
    [sim, step],
  );
  const replayNyanoReactionImpact = React.useMemo(() => {
    if (!replayNyanoReactionInput) return "low" as const;
    return resolveReactionCutInImpact(pickReactionKind(replayNyanoReactionInput));
  }, [replayNyanoReactionInput]);
  const [replayStageImpactBurst, setReplayStageImpactBurst] = React.useState(false);

  React.useEffect(() => {
    if (!isEngineFocus || !isEngine || compare || !replayNyanoReactionInput) {
      setReplayStageImpactBurst(false);
      return;
    }
    if (replayNyanoReactionImpact === "low") {
      setReplayStageImpactBurst(false);
      return;
    }
    setReplayStageImpactBurst(true);
    const burstMs = replayNyanoReactionImpact === "high" ? 960 : 760;
    const timer = window.setTimeout(() => setReplayStageImpactBurst(false), burstMs);
    return () => window.clearTimeout(timer);
  }, [isEngineFocus, isEngine, compare, replayNyanoReactionInput, replayNyanoReactionImpact, step]);

  const annotations = React.useMemo(
    () => sim.ok ? annotateReplayMoves(sim.current, sim.transcript.header.firstPlayer as 0 | 1) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sim.ok, sim.ok ? sim.current : null, sim.ok ? sim.transcript : null],
  );

  const boardAdvantages: BoardAdvantage[] = React.useMemo(
    () => {
      if (!sim.ok) return [];
      return sim.current.boardHistory.map((b) => assessBoardAdvantage(b));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sim.ok, sim.ok ? sim.current : null],
  );

  const replayPreloadTokenIds = React.useMemo(() => {
    if (!sim.ok) return [] as bigint[];
    const out: bigint[] = [];
    const seen = new Set<string>();
    for (const tid of [...sim.transcript.header.deckA, ...sim.transcript.header.deckB]) {
      const key = tid.toString();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(tid);
    }
    return out;
  }, [sim]);
  const replayFirstPlayer: 0 | 1 = sim.ok ? (sim.transcript.header.firstPlayer as 0 | 1) : 0;

  const renderReplay = (label: string, res: MatchResultWithHistory) => {
    const boardNow = res.boardHistory[step];
    const boardPrev = step === 0 ? res.boardHistory[0] : res.boardHistory[step - 1];
    const { placedCell, flippedCells } = step === 0 ? { placedCell: null, flippedCells: [] } : computeDelta(boardPrev, boardNow);
    const nyanoReactionInput = buildNyanoReactionInput(res, step);
    const focusCell = focusTurnIndex !== null ? (res.turns[focusTurnIndex]?.cell ?? null) : null;
    const replayCurrentPlayer = turnPlayer(replayFirstPlayer, Math.min(step, 8));
    const isPrimaryReplay = sim.ok && res === sim.current;
    const stageImpact = isPrimaryReplay ? replayNyanoReactionImpact : "low";
    const stageImpactBurst = isPrimaryReplay ? replayStageImpactBurst : false;

    return (
      <div className={["grid gap-3", isStageFocus ? "stage-focus-replay-column" : ""].filter(Boolean).join(" ")}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-slate-500">
            勝者: {formatReplayWinnerLabel(res.winner)}
          </div>
        </div>

        <div className="mt-2 grid gap-2">
          {isEngine ? (
            <BattleHudMint
              board={boardNow}
              turnCount={step}
              maxTurns={9}
              currentPlayer={replayCurrentPlayer}
              gamePhase={step >= 9 ? "game_over" : "select_cell"}
              tone="pixi"
            />
          ) : (
            <div className="flex items-center gap-3">
              <NyanoAvatar
                size={48}
                expression={nyanoReactionInput
                  ? reactionToExpression(pickReactionKind(nyanoReactionInput))
                  : "calm"}
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <ScoreBar board={boardNow} moveCount={step} maxMoves={9} winner={res.winner} />
                {boardAdvantages[step] && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">盤面評価</span>
                    <AdvantageBadge advantage={boardAdvantages[step]} size="sm" showScore />
                  </div>
                )}
              </div>
            </div>
          )}
          <NyanoReactionSlot
            input={nyanoReactionInput}
            turnIndex={step}
            rpg={isRpg}
            mint={isEngine}
            tone={isEngine ? "pixi" : "mint"}
            stageFocus={isStageFocus}
          />
        </div>

        {isEngine && !compare && engineRendererFailed ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span title={engineRendererError ?? undefined}>
              Pixi renderer が利用できないため、Mint fallback board を表示しています。Pixi renderer is unavailable.
            </span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleRetryEngineRenderer}
              aria-label="Retry Pixi renderer in replay"
            >
              Pixi 再試行
            </button>
          </div>
        ) : null}

        <div className={isStageFocus ? "stage-focus-board-shell stage-focus-board-shell--replay" : ""}>
          {isEngine && !compare && useEngineRenderer ? (
            <DuelStageMint impact={stageImpact} impactBurst={stageImpactBurst}>
              <BattleStageEngine
                board={boardNow}
                selectedCell={null}
                currentPlayer={0}
                boardMaxWidthPx={engineBoardMaxWidthPx}
                boardMinHeightPx={engineBoardMinHeightPx}
                preloadTokenIds={replayPreloadTokenIds}
                placedCell={placedCell}
                flippedCells={flippedCells}
                vfxQuality={resolvedVfxQuality}
                onInitError={handleEngineRendererInitError}
              />
            </DuelStageMint>
          ) : isEngine && !compare ? (
            <DuelStageMint impact={stageImpact} impactBurst={stageImpactBurst}>
              <BoardViewMint
                board={boardNow}
                selectedCell={null}
                placedCell={placedCell}
                flippedCells={flippedCells}
                currentPlayer={replayCurrentPlayer}
                showCoordinates
                showActionPrompt
                className="mint-board-view mint-board-view--replay"
                gamePhase={step >= 9 ? "game_over" : "select_cell"}
              />
            </DuelStageMint>
          ) : isRpg ? (
            <BoardViewRPG
              board={boardNow}
              focusCell={focusCell}
              placedCell={placedCell}
              flippedCells={flippedCells}
              showCoordinates
              showCandles
              showParticles
            />
          ) : isMintTheme ? (
            <BoardViewMint
              board={boardNow}
              selectedCell={focusCell}
              placedCell={placedCell}
              flippedCells={flippedCells}
              currentPlayer={replayCurrentPlayer}
              showCoordinates
              showActionPrompt
              className="mint-board-view mint-board-view--replay"
              gamePhase={step >= 9 ? "game_over" : "select_cell"}
            />
          ) : (
            <BoardView
              board={boardNow}
              focusCell={focusCell}
              placedCell={placedCell}
              flippedCells={flippedCells}
            />
          )}
        </div>

        {step > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5">配置: {placedCell !== null ? placedCell : "-"}</span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5">反転: {flippedCells.length}</span>
          </div>
        ) : (
          <div className="text-xs text-slate-500">初期盤面</div>
        )}
      </div>
    );
  };

  
  const buildCanonicalReplayLink = (): string => {
    const trimmed = text.trim() || (sim.ok ? stringifyWithBigInt(sim.transcript) : "");
    if (!trimmed) throw new Error("対局ログJSONが空です");

    const z = tryGzipCompressUtf8ToBase64Url(trimmed);
    return buildReplayShareUrl({
      data: z ? { key: "z", value: z } : { key: "t", value: base64UrlEncodeUtf8(trimmed) },
      eventId: eventId || undefined,
      pointsDeltaA: pointsDeltaA ?? undefined,
      mode: "auto",
      ui: uiParam,
      rulesetKey: searchParams.get("rk") ?? undefined,
      classicMask: searchParams.get("cr") ?? undefined,
      step: 9,
      absolute: true,
    });
  };

  const saveToMyAttempts = async () => {
    if (!eventId) throw new Error("eventId がありません");
    if (!sim.ok) throw new Error("replay が未準備です");
    if (sim.current.winner !== 0 && sim.current.winner !== 1) {
      throw new Error("引き分けは event attempts の対象外です");
    }

    const replayUrl = buildCanonicalReplayLink();

    const a: EventAttemptV1 = {
      id: sim.current.matchId,
      createdAt: new Date().toISOString(),
      eventId,
      replayUrl,
      matchId: sim.current.matchId,
      winner: sim.current.winner,
      tilesA: Number(sim.current.tiles.A),
      tilesB: Number(sim.current.tiles.B),
      rulesetLabel: sim.currentRulesetLabel,
      deckA: sim.transcript.header.deckA.map((x) => x.toString()),
      deckB: sim.transcript.header.deckB.map((x) => x.toString()),
      ...(pointsDeltaA !== null
        ? {
            pointsDeltaA,
            pointsDeltaSource: "settled_attested" as const,
          }
        : {}),
    };

    upsertEventAttempt(a);
  };

  const buildShareLink = (): string => {
    // Use sim transcript when text state is empty (e.g., loaded via ?z= share link)
    const trimmed = text.trim() || (sim.ok ? stringifyWithBigInt(sim.transcript) : "");
    if (!trimmed) throw new Error("対局ログJSONが空です。先に対局ログを貼り付けるか、共有リンクを読み込んでください。");

    const z = tryGzipCompressUtf8ToBase64Url(trimmed);
    return buildReplayShareUrl({
      data: z ? { key: "z", value: z } : { key: "t", value: base64UrlEncodeUtf8(trimmed) },
      eventId: eventId || undefined,
      pointsDeltaA: pointsDeltaA ?? undefined,
      mode,
      ui: uiParam,
      rulesetKey: searchParams.get("rk") ?? undefined,
      classicMask: searchParams.get("cr") ?? undefined,
      step,
      absolute: true,
    });
  };
  const showReplaySetupPanel = !isStageFocus || !sim.ok || showStageSetup;
  const replayPageClassName = [
    "replay-page",
    isStageFocus
      ? "stage-focus-root replay-page--stage-focus"
      : isEngineFocus
        ? "grid gap-4 replay-page--focus"
        : "grid gap-6 replay-page--standard",
  ].join(" ");

  return (
    <div
      ref={stageViewportRef}
      className={replayPageClassName}
    >
      {isMintTheme && !isStageFocus ? (
        <section className="mint-replay-quicknav" aria-label="Replay quick navigation">
          {replayQuickActions.map((action) => (
            <GlassPanel key={action.label} variant="card" className="mint-replay-quicknav__card">
              <MintPressable to={action.to} className="mint-replay-quicknav__action" fullWidth>
                <MintIcon name={action.icon} size={18} />
                <span className="mint-replay-quicknav__label">{action.label}</span>
                <span className="mint-replay-quicknav__sub">{action.subtitle}</span>
              </MintPressable>
            </GlassPanel>
          ))}
        </section>
      ) : null}
      {isMintTheme && !isStageFocus ? (
        <section className="mint-replay-summary" aria-label="Replay overview">
          <GlassPanel variant="pill" className="mint-replay-summary__item">
            <span className="mint-replay-summary__label">状態</span>
            <span className="mint-replay-summary__value">{sim.ok ? "読み込み済み" : "リプレイ待機"}</span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-replay-summary__item">
            <span className="mint-replay-summary__label">進行</span>
            <span className="mint-replay-summary__value">{step}/{stepMax}</span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-replay-summary__item">
            <span className="mint-replay-summary__label">見どころ</span>
            <span className="mint-replay-summary__value">{highlights.length}</span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-replay-summary__item">
            <span className="mint-replay-summary__label">検証</span>
            <span className="mint-replay-summary__value">
              {verifyStatus === "ok" ? "検証OK" : verifyStatus === "mismatch" ? "不一致" : "未検証"}
            </span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-replay-summary__item mint-replay-summary__item--wide">
            <span className="mint-replay-summary__label">モード</span>
            <span className="mint-replay-summary__value">{mode} | {phaseInfo.label} | {isPlaying ? "再生中" : "停止中"}</span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-replay-summary__item mint-replay-summary__item--wide">
            <span className="mint-replay-summary__label">手順状態</span>
            <span className="mint-replay-summary__value">{stepStatusText}</span>
          </GlassPanel>
        </section>
      ) : null}
      {isMintTheme && !isStageFocus ? (
        <MintPageGuide spec={MINT_PAGE_GUIDES.replay} className="mint-replay-guide" />
      ) : null}

      {isEngineFocus ? (
        <section
          className={[
            "replay-page__focus-toolbar",
            "rounded-2xl border px-3 py-2",
            isStageFocus ? "stage-focus-toolbar" : "",
          ].filter(Boolean).join(" ")}
          aria-label={isStageFocus ? "Replay focus toolbar" : "Engine replay toolbar"}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="replay-page__focus-label text-xs font-semibold">
              Pixiフォーカス · 手順 {step}/{stepMax}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {showStageToolbarTransport ? (
                <div className="stage-focus-toolbar-actions stage-focus-toolbar-actions--replay">
                  <span className="stage-focus-toolbar-status">{stepStatusText} · {phaseInfo.label}</span>
                  <span className="stage-focus-toolbar-hint" aria-label="Replay focus toolbar hint">
                    キー操作: ← → space [ ] · F/C/S/D/Esc
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={jumpToStartWithFeedback}
                    disabled={!canStepBack}
                    aria-label="Replay start from focus toolbar"
                  >
                    先頭
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={jumpToPrevStepWithFeedback}
                    disabled={!canStepBack}
                    aria-label="Replay previous from focus toolbar"
                  >
                    前へ
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={toggleReplayPlayWithFeedback}
                    disabled={!canPlay}
                    aria-label={isPlaying ? "Pause replay from focus toolbar" : "Play replay from focus toolbar"}
                  >
                    {isPlaying ? "停止" : "再生"}
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={jumpToNextStepWithFeedback}
                    disabled={!canStepForward}
                    aria-label="Replay next from focus toolbar"
                  >
                    次へ
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={jumpToEndWithFeedback}
                    disabled={!canStepForward}
                    aria-label="Replay end from focus toolbar"
                  >
                    末尾
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={jumpToPrevHighlightWithFeedback}
                    disabled={highlights.length === 0}
                    aria-label="Previous highlight from focus toolbar"
                  >
                    前の見どころ
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={jumpToNextHighlightWithFeedback}
                    disabled={highlights.length === 0}
                    aria-label="Next highlight from focus toolbar"
                  >
                    次の見どころ
                  </button>
                  <span className="stage-focus-toolbar-hint" aria-label="Replay highlight status in focus toolbar">
                    {focusToolbarHighlightStatus}
                  </span>
                  <label className="stage-focus-toolbar-speed">
                    速度
                    <select
                      className="stage-focus-toolbar-speed-select"
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(normalizeReplayPlaybackSpeed(Number(e.target.value)))}
                      disabled={!canPlay}
                      aria-label="Replay speed from focus toolbar"
                    >
                      {REPLAY_PLAYBACK_SPEED_OPTIONS.map((speedOption) => (
                        <option key={speedOption} value={speedOption}>
                          {speedOption}x
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
              {isStageFocus ? (
                <span
                  className={[
                    "stage-focus-toolbar-feedback",
                    `stage-focus-toolbar-feedback--${stageActionFeedbackTone}`,
                  ].join(" ")}
                  role="status"
                  aria-live="polite"
                  aria-label="Replay focus action feedback"
                >
                  {stageActionFeedback || "操作を選択してください"}
                </span>
              ) : null}
              {isStageFocus ? (
                <>
                  <label className="stage-focus-toolbar-speed">
                    vfx
                    <select
                      className="stage-focus-toolbar-speed-select"
                      value={vfxPreference}
                      onChange={(e) => handleStageVfxChange(e.target.value as VfxPreference)}
                      aria-label="Replay VFX quality from focus toolbar"
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
                      title={sfxMuted ? "サウンド ON" : "サウンド OFF"}
                      aria-label={sfxMuted ? "Unmute replay sound effects" : "Mute replay sound effects"}
                    >
                      {sfxMuted ? "🔇" : "🔊"}
                    </button>
                  ) : null}
                  <button className="btn btn-sm" onClick={toggleStageFullscreenWithFeedback}>
                    {isStageFullscreen ? "全画面解除" : "全画面"}
                  </button>
                  <button className="btn btn-sm" onClick={toggleStageTransportWithFeedback}>
                    {showStageTransport ? "操作を隠す" : "操作を表示"}
                  </button>
                  <button className="btn btn-sm" onClick={toggleStageSetupWithFeedback}>
                    {showStageSetup ? "設定を隠す" : "設定を表示"}
                  </button>
                </>
              ) : null}
              <button className="btn btn-sm" onClick={exitFocusModeWithFeedback}>
                フォーカス終了
              </button>
              {sim.ok ? (
                <button className="btn btn-sm" onClick={() => copyWithToast("共有URL", buildShareLink())}>
                  共有URLコピー
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {!isEngineFocus && eventId ? (
        <section className="card replay-page__event-card">
          <div className="card-hd flex flex-wrap items-center justify-between gap-2">
            <div className="grid gap-1">
              <div className="text-base font-semibold">イベントリプレイ</div>
              <div className="text-xs text-slate-500">
                {event ? (
                  <>
                    <span className="font-medium">{event.title}</span> | 状態: <span className="font-medium">{eventStatus}</span> | {formatEventPeriod(event)}
                  </>
                ) : (
                  <>
                    eventId: <span className="font-mono">{eventId}</span>（不明）
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link className="btn no-underline" to="/events">
                イベント一覧
              </Link>
              {event ? (
                <Link className="btn btn-primary no-underline" to={`/match?event=${encodeURIComponent(event.id)}&ui=${matchUi}`}>
                  再挑戦
                </Link>
              ) : null}
            </div>
          </div>

          {event ? (
            <div className="card-bd grid gap-2 text-sm text-slate-700">
              <p>{event.description}</p>
              {pointsDeltaA !== null ? (
                <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                  URL から確定 pointsDeltaA を検出: <span className="font-mono">{pointsDeltaA}</span>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  pointsDeltaA は未設定です。このリプレイはローカルの仮シーズンポイントで集計されます。
                </div>
              )}
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                Nyanoデッキ tokenIds: <span className="font-mono">{event.nyanoDeckTokenIds.join(", ")}</span>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {showReplaySetupPanel && (
      <section className="card replay-page__setup-card">
        <div className="card-hd">
          <div className="text-base font-semibold">リプレイ読込</div>
          <div className="text-xs text-slate-500">
            対局ログJSONを貼り付けると、オンチェーンカード情報（読み取り専用）でリプレイできます。共有リンク <span className="font-mono">?z=...</span> / <span className="font-mono">?t=...</span> も利用でき、盤面UIは <span className="font-mono">?ui=engine</span> / <span className="font-mono">?ui=rpg</span> で切り替えられます。
          </div>
        </div>

        <div className="card-bd grid gap-4">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-medium text-slate-600">対局ログJSON</div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span>モード</span>
                <select className="select w-48" value={mode} onChange={(e) => setMode(parseMode(e.target.value))}>
                  <option value="auto">自動（rulesetId登録/公式）</option>
                  <option value="v1">engine v1</option>
                  <option value="v2">engine v2</option>
                  <option value="compare">比較</option>
                </select>
                <span>盤面UI</span>
                <select
                  className="select w-40"
                  value={uiMode}
                  onChange={(e) => setReplayBoardUi(parseReplayBoardUi(e.target.value))}
                >
                  <option value="classic">classic</option>
                  <option value="rpg">rpg</option>
                  <option value="engine">engine（pixi）</option>
                </select>
                {isEngine && compare ? (
                  <span className="text-[11px] text-slate-500">比較モードでは classic 盤面を表示します。</span>
                ) : null}
                {isEngine && !isEngineFocus ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button className="btn btn-sm" onClick={() => setFocusMode(true)}>
                      Pixiフォーカスへ
                    </button>
                    <Link className="btn btn-sm no-underline" to={stageReplayUrl}>
                      ステージページを開く
                    </Link>
                  </div>
                ) : null}

                <button className="btn btn-primary" onClick={() => load()} disabled={loading}>
                  {loading ? "読み込み中..." : "リプレイを読み込む"}
                </button>

                <button
                  className="btn"
                  onClick={() => {
                    void (async () => {
                      try {
                        const link = buildShareLink();
                        await copyWithToast("共有URL", link);
                      } catch (e: unknown) {
                        setSim({ ok: false, error: errorMessage(e) });
                      }
                    })();
                  }}
                >
                  共有URLをコピー
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
                              toast.success("保存しました", "マイ対戦履歴に追加しました");
                            } catch (e: unknown) {
                              setSim({ ok: false, error: errorMessage(e) });
                            }
                          })();
                        }}
                      >
                        {saved ? "保存済み" : "保存"}
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
              placeholder="プレイグラウンドの対局ログJSONを貼り付けるか、共有リンクを開いてください。"
            />

            <div className="mt-3">
              <Disclosure title={<span>配信連携ツール</span>}>
                <div className="grid grid-cols-1 gap-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-mono">{overlayPath}</span> を開くと、リプレイの <span className="font-mono">手順</span> 移動とオーバーレイスナップショットが同期されます。
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={broadcastOverlay}
                        onChange={(e) => setBroadcastOverlayWithUrl(e.target.checked)}
                      />
                      オーバーレイへ送信（手順同期）
                    </label>

                    <button className="btn btn-sm" onClick={() => pushOverlay()}>
                      スナップショット送信
                    </button>

                    <a
                      className="btn btn-sm no-underline"
                      href={overlayUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      オーバーレイを開く
                    </a>

                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        void copyWithToast("オーバーレイURL", overlayUrl);
                      }}
                    >
                      オーバーレイURLをコピー
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    ヒント: <span className="font-mono">{replayBroadcastPath}</span> を開くと手順同期ONで開始できます。
                  </div>
                </div>
              </Disclosure>
            </div>



            {!sim.ok && sim.error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <div className="font-medium">エラー: {sim.error}</div>
                <div className="mt-1 text-xs text-rose-700">
                  {hasSharePayload
                    ? "共有リンクが無効または不完全の可能性があります。再読込するか、共有パラメータを消して対局ログJSONを貼り付けてください。"
                    : "対局ログJSONを確認して再読込してください。"}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      void (async () => {
                        const decoded = decodeReplaySharePayload(searchParams);
                        if (decoded.kind === "error") {
                          setSim({ ok: false, error: decoded.error });
                          return;
                        }
                        if (decoded.kind === "ok") {
                          setText(decoded.text);
                          await load({ text: decoded.text, mode, step });
                          return;
                        }
                        await load();
                      })();
                    }}
                    disabled={loading}
                  >
                    {loading ? "再試行中..." : "再読込する"}
                  </button>
                  {hasSharePayload ? (
                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        const next = stripReplayShareParams(searchParams);
                        setSearchParams(next, { replace: true });
                        setSim({ ok: false, error: "対局ログJSONを貼り付けて読み込んでください。" });
                      }}
                    >
                      共有パラメータをクリア
                    </button>
                  ) : null}
                  <Link className="btn btn-sm no-underline" to="/">
                    ホーム
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="kbd">Left</span>/<span className="kbd">Right</span> 手順移動
              <span className="kbd">Space</span> 再生/停止
              <span className="kbd">Home</span>/<span className="kbd">End</span> 先頭/末尾
            </div>
          </div>
        </div>
      </section>
      )}

      {isEngineFocus && !sim.ok ? (
        <section className="replay-page__focus-empty rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>Pixiフォーカスはリプレイ読込後に利用できます。先に対局ログを読み込むか、フォーカスを終了してください。</div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn btn-sm" onClick={() => setFocusMode(false)}>フォーカス終了</button>
              <button className="btn btn-sm btn-primary" onClick={() => load()} disabled={loading}>
                {loading ? "読み込み中..." : "再読込"}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {sim.ok ? (
        <>
          {step >= 9 ? (
            <section className="animate-banner-enter replay-page__result-banner">
              <div className="relative overflow-hidden rounded-2xl border-2 border-surface-200 bg-white shadow-soft">
                {sim.current.winner !== null ? (
                  <div
                    className={[
                      "absolute inset-0 opacity-20 result-banner-shimmer",
                      sim.current.winner === 0 ? "bg-gradient-to-r from-player-a-200 via-player-a-100 to-player-a-200" : "bg-gradient-to-r from-player-b-200 via-player-b-100 to-player-b-200",
                    ].join(" ")}
                  />
                ) : null}
                <div className="relative">
                  <GameResultBanner
                    result={{
                      winner: sim.current.winner === null ? "draw" : sim.current.winner,
                      tilesA: Number(sim.current.tiles.A),
                      tilesB: Number(sim.current.tiles.B),
                      matchId: sim.current.matchId,
                    }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-100 bg-surface-50/80 px-4 py-3">
                    <div className="text-xs text-slate-600">
                      <span className="font-medium">再生位置</span> | {step}/{stepMax} 手
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="btn btn-sm"
                        onClick={() => copyWithToast("対戦ID", sim.current.matchId)}
                      >
                        対戦IDをコピー
                      </button>
                      <button
                        className={`btn btn-sm ${verifyStatus === "ok" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : verifyStatus === "mismatch" ? "btn-danger" : ""}`}
                        onClick={handleVerify}
                      >
                        {verifyStatus === "ok" ? "検証OK" : verifyStatus === "mismatch" ? "不一致!" : "検証"}
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => copyWithToast("対局ログJSON", stringifyWithBigInt(sim.transcript))}
                      >
                        対局ログをコピー
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          void (async () => {
                            try {
                              const link = buildShareLink();
                              await copyWithToast("共有URL", link);
                            } catch (e: unknown) {
                              toast.error("共有失敗", errorMessage(e));
                            }
                          })();
                        }}
                      >
                        共有
                      </button>
                      {eventId ? (
                        <button
                          className="btn btn-sm"
                          disabled={hasEventAttempt(eventId, sim.current.matchId)}
                          onClick={() => {
                            (async () => {
                              try {
                                await saveToMyAttempts();
                                toast.success("保存しました", "マイ対戦履歴に追加しました");
                              } catch (e: unknown) {
                                setSim({ ok: false, error: errorMessage(e) });
                              }
                            })();
                          }}
                        >
                          {hasEventAttempt(eventId, sim.current.matchId) ? "保存済み" : "保存"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section
            className={[
              "replay-page__main",
              isEngineFocus ? "grid gap-4" : "grid gap-6 lg:grid-cols-2",
            ].join(" ")}
          >
            <div className="card replay-page__board-card">
              <div className="card-hd replay-header-grid">
                  <div className="flex items-center gap-3">
                    <div className="text-base font-semibold">リプレイ</div>
                    <div className="text-xs text-slate-500">{sim.currentRulesetLabel}</div>
                    <div className="text-xs text-slate-500">
                      手順 {step}/{stepMax}
                    </div>
                  {compare ? (
                    <span
                      className={[
                        "rounded-md border px-2 py-0.5 text-xs",
                        diverged ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600",
                      ].join(" ")}
                    >
                      {diverged ? "差分あり" : "一致"}
                    </span>
                  ) : null}
                </div>
                {(!isStageFocus || showStageTransport) ? (
                  <div className="replay-transport">
                    <button
                      className={replayTransportButtonClass}
                      onClick={() => {
                        setIsPlaying(false);
                        setStep(0);
                      }}
                      disabled={!canStepBack}
                      title="先頭へ移動"
                    >
                      先頭
                    </button>
                    <button
                      className={replayTransportButtonClass}
                      onClick={() => {
                        setIsPlaying(false);
                        setStep((s) => Math.max(0, s - 1));
                      }}
                      disabled={!canStepBack}
                      aria-label="Previous step"
                    >
                      前へ
                    </button>

                    <button
                      className={replayTransportPrimaryButtonClass}
                      onClick={() => setIsPlaying((p) => !p)}
                      disabled={!canPlay}
                      title="自動再生"
                      aria-label={isPlaying ? "Pause replay" : "Play replay"}
                    >
                      {isPlaying ? "停止" : "再生"}
                    </button>

                    <button
                      className={replayTransportButtonClass}
                      onClick={() => {
                        setIsPlaying(false);
                        setStep((s) => Math.min(stepMax, s + 1));
                      }}
                      disabled={!canStepForward}
                      aria-label="Next step"
                    >
                      次へ
                    </button>

                    <button
                      className={replayTransportButtonClass}
                      onClick={() => {
                        setIsPlaying(false);
                        setStep(stepMax);
                      }}
                      disabled={!canStepForward}
                      title="末尾へ移動"
                    >
                      末尾
                    </button>

                    <label className="replay-speed">
                      速度
                      <select
                        className={replaySpeedSelectClass}
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(normalizeReplayPlaybackSpeed(Number(e.target.value)))}
                        disabled={!canPlay}
                        aria-label="Replay speed"
                      >
                        {REPLAY_PLAYBACK_SPEED_OPTIONS.map((speedOption) => (
                          <option key={speedOption} value={speedOption}>
                            {speedOption}x
                          </option>
                        ))}
                      </select>
                    </label>

                  </div>
                ) : (
                  <div
                    className={[
                      "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600",
                      isStageFocus ? "stage-focus-side-panel stage-focus-side-panel--muted" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    盤面フォーカス中はリプレイ操作を非表示にしています。
                  </div>
                )}
              </div>

              <div className={["card-bd grid gap-4", isStageFocus ? "stage-focus-arena-inner stage-focus-replay-shell" : ""].filter(Boolean).join(" ")}>
                <div className="sr-only" aria-live="polite">
                  {`${stepStatusText}。${phaseInfo.label}フェーズ。進行率 ${stepProgress} パーセント。`}
                </div>
                {compare ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {renderReplay("engine v1", sim.v1)}
                    {renderReplay("engine v2", sim.v2)}
                  </div>
                ) : (
                  renderReplay(sim.currentRulesetLabel, sim.current)
                )}

                {isStageFocus ? (
                  <div className="flex justify-end">
                    <button className={replayTransportButtonClass} onClick={toggleStagePanelsWithFeedback}>
                      {showStagePanels ? "タイムライン/詳細を隠す" : "タイムライン/詳細を表示"}
                    </button>
                  </div>
                ) : null}

                {(!isStageFocus || showStagePanels) && (
                  <>
                    <div className={["replay-timeline-shell", isStageFocus ? "stage-focus-side-panel stage-focus-side-panel--timeline" : ""].filter(Boolean).join(" ")}>
                      <div className="replay-timeline-head">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="replay-step-pill">{step === 0 ? "初期盤面" : `${step}手目の後`}</span>
                          <span className={`replay-phase replay-phase--${phaseInfo.tone}`}>{phaseInfo.label}</span>
                          <span className="text-xs text-slate-500">
                            {step}/{stepMax} | {stepProgress}%
                          </span>
                        </div>
                        {highlights.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              className={replayTransportButtonClass}
                              onClick={jumpToPrevHighlight}
                              disabled={highlights.length === 0}
                              title="前の見どころ ([)"
                            >
                              前
                            </button>
                            <span className="replay-highlight-index">
                              {currentHighlightIdx >= 0
                                ? `${currentHighlightIdx + 1}/${highlights.length}`
                                : `${highlights.length}件の見どころ`}
                            </span>
                            <button
                              className={replayTransportButtonClass}
                              onClick={jumpToNextHighlight}
                              disabled={highlights.length === 0}
                              title="次の見どころ (])"
                            >
                              次
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <div className="replay-progress" aria-hidden="true">
                        <div className="replay-progress__bar" style={{ width: `${stepProgress}%` }} />
                      </div>

                      <div className="replay-range-wrap">
                        <input
                          type="range"
                          min={0}
                          max={stepMax}
                          value={step}
                          onChange={(e) => { setIsPlaying(false); setStep(Number(e.target.value)); }}
                          className="replay-range w-full"
                          aria-label="Replay step"
                          aria-valuetext={stepStatusText}
                        />
                        {stepMax > 0 && highlights.map((highlight, i) => (
                          <button
                            key={`${highlight.kind}-${highlight.step}-${i}`}
                            className="replay-highlight-marker"
                            data-kind={highlight.kind}
                            style={{ left: `${(highlight.step / stepMax) * 100}%` }}
                            title={`${highlight.step}手目: ${highlight.label}`}
                            aria-label={`${highlight.step}手目へ移動 (${replayHighlightKindLabel(highlight.kind)})`}
                            onClick={() => { setIsPlaying(false); setStep(highlight.step); }}
                          />
                        ))}
                      </div>

                      {highlights.length > 0 ? (
                        <div className="replay-highlight-summary">
                          {HIGHLIGHT_KIND_ORDER.map((kind) => {
                            const count = highlightSummary[kind];
                            if (count <= 0) return null;
                            const isActive = activeHighlights.some((highlight) => highlight.kind === kind);
                            return (
                              <span
                                key={kind}
                                className={`replay-highlight-chip${isActive ? " replay-highlight-chip--active" : ""}`}
                                data-kind={kind}
                              >
                                {replayHighlightKindLabel(kind)} {count}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">まだ戦術ハイライトはありません。</div>
                      )}
                      <div className="text-[11px] text-slate-500">
                        キー操作: <span className="font-mono">[</span>/<span className="font-mono">]</span> で見どころ移動、<span className="font-mono">Space</span> で再生/停止。
                      </div>

                      {activeHighlights.length > 0 ? (
                        <div className="replay-highlight-callout">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">現在の注目ポイント</div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {activeHighlights.map((highlight, i) => (
                              <span
                                key={`${highlight.kind}-${highlight.step}-${i}`}
                                className="replay-highlight-chip replay-highlight-chip--active"
                                data-kind={highlight.kind}
                              >
                                {replayHighlightKindLabel(highlight.kind)}: {highlight.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className={["rounded-lg border border-slate-200 bg-white p-3 text-sm", isStageFocus ? "stage-focus-side-panel" : ""].filter(Boolean).join(" ")}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium">
                          現在の勝者: {formatReplayWinnerLabel(sim.current.winner)} | タイル A:{sim.current.tiles.A} / B:{sim.current.tiles.B}
                        </div>
                        <div className="text-xs text-slate-500">タイブレーク: {sim.current.tieBreak}</div>
                      </div>

                      <div className="mt-2 grid min-w-0 gap-2 text-xs text-slate-600">
                        <div className="min-w-0">
                          <span className="font-medium">rulesetId</span>: <code className="font-mono break-all">{sim.transcript.header.rulesetId}</code>
                        </div>
                        {sim.rulesetIdMismatchWarning ? (
                          <div className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                            {sim.rulesetIdMismatchWarning}
                          </div>
                        ) : null}
                        {replayClassicSwap ? (
                          <div>
                            <span className="font-medium">classic 入替</span>: A{replayClassicSwap.aIndex + 1} ↔ B{replayClassicSwap.bIndex + 1}
                          </div>
                        ) : null}
                        {replayClassicOpen ? (
                          <div>
                            <span className="font-medium">classic 公開</span>: {replayClassicOpen.mode === "all_open"
                              ? "全カード公開"
                              : `A[${formatClassicOpenSlots(replayClassicOpen.playerA)}] / B[${formatClassicOpenSlots(replayClassicOpen.playerB)}]`}
                          </div>
                        ) : null}
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="font-medium">対戦ID</span>: <code className="font-mono break-all">{sim.current.matchId}</code>
                          {verifyStatus === "ok" && <span className="text-emerald-600 font-semibold" title="リプレイ検証OK">検証OK</span>}
                          {verifyStatus === "mismatch" && <span className="text-red-600 font-semibold" title="リプレイ不一致">不一致</span>}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button className="btn" onClick={() => copyWithToast("対局ログJSON", stringifyWithBigInt(sim.transcript))}>
                          対局ログJSONをコピー
                        </button>
                        <button className="btn" onClick={() => copyWithToast("結果JSON", stringifyWithBigInt(sim.current))}>
                          結果JSONをコピー
                        </button>
                        <button
                          className={`btn ${verifyStatus === "ok" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : verifyStatus === "mismatch" ? "btn-danger" : ""}`}
                          onClick={handleVerify}
                        >
                          {verifyStatus === "ok" ? "検証OK" : verifyStatus === "mismatch" ? "不一致!" : "リプレイ検証"}
                        </button>
                      </div>

                      <div className="mt-3">
                        <Disclosure title={<span>詳細JSONを表示</span>}>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-slate-600">対局ログ</div>
                              <pre className="mt-1 w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white/70 p-3 text-xs">
                                {stringifyWithBigInt(sim.transcript)}
                              </pre>
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-slate-600">結果</div>
                              <pre className="mt-1 w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white/70 p-3 text-xs">
                                {stringifyWithBigInt(sim.current)}
                              </pre>
                            </div>
                          </div>
                        </Disclosure>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isEngineFocus && (
            <div className="card replay-page__turnlog-card">
              <div className="card-hd">
                <div className="text-base font-semibold">ターンログ</div>
                <div className="text-xs text-slate-500">ターンをクリックすると、その手順へ移動します。</div>
              </div>
              <div className="card-bd replay-turnlog-body">
                <TurnLog
                  turns={sim.current.turns}
                  boardHistory={sim.current.boardHistory}
                  selectedTurnIndex={focusTurnIndex ?? -1}
                  onSelect={(t) => setStep(t + 1)}
                  annotations={annotations}
                  boardAdvantages={boardAdvantages}
                />
              </div>
            </div>
            )}
          </section>

          {!isEngineFocus && (
          <section className="card replay-page__deck-card">
            <div className="card-hd">
              <div className="text-base font-semibold">デッキ確認</div>
              <div className="text-xs text-slate-500">オンチェーンデータから読み込んだ読み取り専用デッキです。</div>
              {replayClassicOpen?.mode === "three_open" ? (
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={replayRevealHiddenSlots}
                    onChange={(e) => setReplayRevealHiddenSlots(e.target.checked)}
                  />
                  非公開スロットを表示（対戦後分析）
                </label>
              ) : null}
            </div>

            <div className="card-bd grid gap-6 md:grid-cols-2">
              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">プレイヤーA デッキ</div>
                {replayClassicOpen ? (
                  <div className="text-[11px] text-slate-500">
                    {replayClassicOpen.mode === "all_open"
                      ? "公開ルール: 全カード公開"
                      : `公開ルール: スロット ${formatClassicOpenSlots(replayClassicOpen.playerA)} を公開`}
                  </div>
                ) : null}
                <div className="deck-preview-grid grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {sim.transcript.header.deckA.map((tid, idx) => {
                    const card = sim.cards.get(tid);
                    if (!card) return null;
                    if (!shouldMaskReplayDeckSlots || !replayOpenVisibleA || replayOpenVisibleA.has(idx)) {
                      return <CardMini key={tid.toString()} card={card} owner={0} subtle />;
                    }
                    return <HiddenDeckPreviewCard key={`${tid.toString()}-hidden-a`} slotIndex={idx} />;
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">プレイヤーB デッキ</div>
                {replayClassicOpen ? (
                  <div className="text-[11px] text-slate-500">
                    {replayClassicOpen.mode === "all_open"
                      ? "公開ルール: 全カード公開"
                      : `公開ルール: スロット ${formatClassicOpenSlots(replayClassicOpen.playerB)} を公開`}
                  </div>
                ) : null}
                <div className="deck-preview-grid grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {sim.transcript.header.deckB.map((tid, idx) => {
                    const card = sim.cards.get(tid);
                    if (!card) return null;
                    if (!shouldMaskReplayDeckSlots || !replayOpenVisibleB || replayOpenVisibleB.has(idx)) {
                      return <CardMini key={tid.toString()} card={card} owner={1} subtle />;
                    }
                    return <HiddenDeckPreviewCard key={`${tid.toString()}-hidden-b`} slotIndex={idx} />;
                  })}
                </div>
              </div>

              <div className="md:col-span-2 grid gap-2 text-xs text-slate-600">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="font-medium text-slate-700">所有者一覧（読み取り専用）</div>
                  {shouldMaskReplayDeckSlots ? (
                    <div className="mt-2 text-[11px] text-slate-500">
                      3枚公開ルールにより非表示です。「非公開スロットを表示」をONにすると所有者対応を確認できます。
                    </div>
                  ) : (
                    <div className="mt-2 grid max-h-56 gap-1 overflow-auto font-mono">
                      {Array.from(sim.owners.entries()).map(([tid, o]) => (
                        <div key={tid.toString()}>
                          #{tid.toString()} {"->"} {o}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
          )}
        </>
      ) : null}
    </div>
  );
}
