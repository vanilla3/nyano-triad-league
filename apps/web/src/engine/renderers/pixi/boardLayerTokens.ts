import type { VfxQuality } from "@/lib/visual/visualSettings";

export type BoardLayerTokens = {
  auraAlpha: number;
  boardShadowAlpha: number;
  detailTopAlpha: number;
  detailBottomAlpha: number;
  gridAlpha: number;
  cornerGlowAlpha: number;
  patternAlpha: number;
  scanlineAlpha: number;
  cellShadowBaseAlpha: number;
  cellShadowSecondaryAlpha: number;
  cellSelectableAuraAlpha: number;
  cellSelectedAuraAlpha: number;
};

/**
 * Shared quality tokens for Pixi board/cell depth layers.
 * Keeps board shadow/frame/detail and cell shadow responses consistent.
 */
export function boardLayerTokensForQuality(quality: VfxQuality): BoardLayerTokens {
  switch (quality) {
    case "high":
      return {
        auraAlpha: 0.2,
        boardShadowAlpha: 0.34,
        detailTopAlpha: 0.16,
        detailBottomAlpha: 0.045,
        gridAlpha: 0.22,
        cornerGlowAlpha: 0.16,
        patternAlpha: 0.07,
        scanlineAlpha: 0.045,
        cellShadowBaseAlpha: 0.24,
        cellShadowSecondaryAlpha: 0.16,
        cellSelectableAuraAlpha: 0.08,
        cellSelectedAuraAlpha: 0.14,
      };
    case "medium":
      return {
        auraAlpha: 0.14,
        boardShadowAlpha: 0.28,
        detailTopAlpha: 0.11,
        detailBottomAlpha: 0.03,
        gridAlpha: 0.18,
        cornerGlowAlpha: 0.11,
        patternAlpha: 0.045,
        scanlineAlpha: 0.03,
        cellShadowBaseAlpha: 0.18,
        cellShadowSecondaryAlpha: 0.11,
        cellSelectableAuraAlpha: 0.06,
        cellSelectedAuraAlpha: 0.1,
      };
    case "low":
    case "off":
      return {
        auraAlpha: 0.09,
        boardShadowAlpha: 0.2,
        detailTopAlpha: 0.11,
        detailBottomAlpha: 0.03,
        gridAlpha: 0.14,
        cornerGlowAlpha: 0.08,
        patternAlpha: 0.045,
        scanlineAlpha: 0.03,
        cellShadowBaseAlpha: 0.13,
        cellShadowSecondaryAlpha: 0.08,
        cellSelectableAuraAlpha: 0.06,
        cellSelectedAuraAlpha: 0.1,
      };
  }
}
