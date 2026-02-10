/**
 * move_tips.ts
 *
 * Lightweight heuristic move tip generator for spectator display.
 * Produces short, friendly tips explaining why a move was interesting.
 *
 * Phase 1 "Spectator Experience": Viewers see what happened + why it matters.
 *
 * Rules are evaluated in priority order. First match wins.
 */

import type { OverlayStateV1 } from "@/lib/streamer_bus";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type MoveTipKey =
  | "warning_dodge"
  | "warning_triggered"
  | "warning_trap"
  | "big_swing"
  | "chain_combo"
  | "domination_combo"
  | "corner_control"
  | "center_hold"
  | "no_flip";

export type MoveTip = {
  key: MoveTipKey;
  labelJa: string;
  labelEn: string;
  /** Priority (lower = higher priority). Used internally for ordering. */
  priority: number;
  /** Optional narrative explaining WHY this move matters (Phase 1 Explainability). */
  narrativeJa?: string;
};

/* ------------------------------------------------------------------ */
/* Tip definitions                                                     */
/* ------------------------------------------------------------------ */

const TIP_DEFS: Record<MoveTipKey, Omit<MoveTip, "key">> = {
  warning_dodge:     { labelJa: "罠回避！",     labelEn: "Trap dodged!",     priority: 1 },
  warning_triggered: { labelJa: "罠発動！",     labelEn: "Trap triggered!",  priority: 2 },
  warning_trap:      { labelJa: "罠設置！",     labelEn: "Trap set!",        priority: 3 },
  domination_combo:  { labelJa: "支配コンボ！", labelEn: "Domination combo!", priority: 4 },
  big_swing:         { labelJa: "大量奪取！",   labelEn: "Big swing!",       priority: 5 },
  chain_combo:       { labelJa: "連鎖コンボ！", labelEn: "Chain combo!",     priority: 6 },
  corner_control:    { labelJa: "角を確保！",   labelEn: "Corner secured!",  priority: 7 },
  center_hold:       { labelJa: "中央確保",     labelEn: "Center hold",      priority: 8 },
  no_flip:           { labelJa: "奪取なし",     labelEn: "No flip",          priority: 99 },
};

function makeTip(key: MoveTipKey, override?: Partial<Pick<MoveTip, "labelJa" | "labelEn">>): MoveTip {
  const def = TIP_DEFS[key];
  return {
    key,
    labelJa: override?.labelJa ?? def.labelJa,
    labelEn: override?.labelEn ?? def.labelEn,
    priority: def.priority,
  };
}

/* ------------------------------------------------------------------ */
/* Corner / center detection                                           */
/* ------------------------------------------------------------------ */

const CORNER_CELLS = new Set([0, 2, 6, 8]);
const CENTER_CELL = 4;

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

type TurnSummaryLite = NonNullable<OverlayStateV1["lastTurnSummary"]>;
type LastMoveLite = NonNullable<OverlayStateV1["lastMove"]>;

/**
 * Generate the highest-priority applicable move tip for the last move.
 *
 * @param summary  Last turn summary from overlay state.
 * @param lastMove Last move details from overlay state.
 * @returns The best matching tip, or null if nothing noteworthy.
 */
export function generateMoveTip(
  summary: TurnSummaryLite | null,
  lastMove: LastMoveLite | null,
): MoveTip | null {
  if (!lastMove) return null;

  const flipCount = summary?.flipCount ?? 0;
  const hasChain = Array.isArray(summary?.flips) && summary!.flips.some((f) => Boolean(f.isChain));
  const comboEffect = summary?.comboEffect ?? "none";
  const ignoreWarning = Boolean(summary?.ignoreWarningMark);
  const warningTriggered = Boolean(summary?.warningTriggered);
  const warningPlaced = typeof summary?.warningPlaced === "number";
  const cell = lastMove.cell;

  // Priority-ordered checks

  // 1. Warning dodge (ignoreWarningMark bonus used)
  if (ignoreWarning) {
    return makeTip("warning_dodge");
  }

  // 2. Warning triggered (stepped on opponent's trap)
  if (warningTriggered) {
    return makeTip("warning_triggered");
  }

  // 3. Warning trap (placed a warning mark)
  if (warningPlaced) {
    return makeTip("warning_trap");
  }

  // 4. Domination combo
  if (comboEffect === "domination" || comboEffect === "fever") {
    return makeTip("domination_combo");
  }

  // 5. Big swing (3+ flips)
  if (flipCount >= 3) {
    return makeTip("big_swing", {
      labelJa: `大量奪取！(${flipCount}枚)`,
      labelEn: `Big swing! (${flipCount} flips)`,
    });
  }

  // 6. Chain combo
  if (hasChain) {
    return makeTip("chain_combo");
  }

  // 7. Corner control (placed in corner and flipped at least 1)
  if (CORNER_CELLS.has(cell) && flipCount >= 1) {
    return makeTip("corner_control");
  }

  // 8. Center hold (placed in center and flipped at least 1)
  if (cell === CENTER_CELL && flipCount >= 1) {
    return makeTip("center_hold");
  }

  // No noteworthy tip
  return null;
}

/* ------------------------------------------------------------------ */
/* Narrative-enhanced tips — Phase 1 Explainability                    */
/* ------------------------------------------------------------------ */

/** Tile count context for narrative generation. */
export type TipContext = {
  tilesA: number;
  tilesB: number;
};

const NARRATIVE_MAP: Record<MoveTipKey, (ctx: TipContext | null, flipCount: number) => string | undefined> = {
  warning_dodge:     () => "罠を無効化して安全に配置",
  warning_triggered: () => "相手の罠を踏んで辺の値が−1",
  warning_trap:      () => "次にここに置く相手は辺−1のペナルティ",
  domination_combo:  () => "支配コンボでまとめて奪取",
  big_swing:         (ctx, fc) =>
    ctx ? `${fc}枚奪取 → A ${ctx.tilesA}:${ctx.tilesB} B` : `${fc}枚を一度に奪取`,
  chain_combo:       () => "直接フリップから連鎖が発生",
  corner_control:    () => "角は隣接2辺で守りやすく攻めの起点に",
  center_hold:       () => "中央は4方向へ攻撃できる最重要マス",
  no_flip:           () => undefined,
};

/**
 * Generate a move tip with an optional Japanese narrative explaining
 * the strategic context of the move.
 *
 * @param summary  Last turn summary from overlay state.
 * @param lastMove Last move details from overlay state.
 * @param context  Optional tile count context for dynamic narratives.
 * @returns Tip with narrativeJa, or null if nothing noteworthy.
 */
export function generateMoveTipWithNarrative(
  summary: TurnSummaryLite | null,
  lastMove: LastMoveLite | null,
  context: TipContext | null,
): MoveTip | null {
  const tip = generateMoveTip(summary, lastMove);
  if (!tip) return null;

  const flipCount = summary?.flipCount ?? 0;
  const narrativeFn = NARRATIVE_MAP[tip.key];
  const narrativeJa = narrativeFn?.(context, flipCount);

  if (narrativeJa) {
    return { ...tip, narrativeJa };
  }
  return tip;
}
