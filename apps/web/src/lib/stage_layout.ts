export type StageLayoutKind = "battle" | "replay";

export const STAGE_SECONDARY_CONTROLS_BREAKPOINT_PX = 768;

export interface StageBoardSizingInput {
  viewportWidthPx: number;
  viewportHeightPx: number;
  kind: StageLayoutKind;
}

export interface StageBoardSizing {
  maxWidthPx: number;
  minHeightPx: number;
}

/**
 * Stage routes hide secondary control groups on narrow screens by default,
 * while keeping them visible on desktop widths.
 */
export function shouldShowStageSecondaryControls(viewportWidthPx: number): boolean {
  const safeWidth = Number.isFinite(viewportWidthPx) ? viewportWidthPx : 1280;
  return safeWidth > STAGE_SECONDARY_CONTROLS_BREAKPOINT_PX;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, value)));
}

function reserveHeightPx(kind: StageLayoutKind, viewportWidthPx: number): number {
  if (viewportWidthPx >= 1200) return kind === "battle" ? 380 : 300;
  if (viewportWidthPx >= 768) return kind === "battle" ? 286 : 280;
  return kind === "battle" ? 248 : 248;
}

function sideGutterPx(viewportWidthPx: number): number {
  if (viewportWidthPx >= 1200) return 92;
  if (viewportWidthPx >= 768) return 56;
  return 24;
}

export function computeStageBoardSizing({
  viewportWidthPx,
  viewportHeightPx,
  kind,
}: StageBoardSizingInput): StageBoardSizing {
  const safeW = Math.max(280, Number.isFinite(viewportWidthPx) ? viewportWidthPx : 1280);
  const safeH = Math.max(420, Number.isFinite(viewportHeightPx) ? viewportHeightPx : 720);

  const cap = kind === "battle" ? 1120 : 1180;
  const availableByWidth = safeW - sideGutterPx(safeW);
  const availableByHeight = safeH - reserveHeightPx(kind, safeW);
  const edge = clampInt(Math.min(cap, availableByWidth, availableByHeight), 260, cap);
  const minHeight = clampInt(edge * (kind === "battle" ? 0.82 : 0.82), 220, edge);

  return {
    maxWidthPx: edge,
    minHeightPx: minHeight,
  };
}
