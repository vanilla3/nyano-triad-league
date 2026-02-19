import { describe, expect, it } from "vitest";
import { boardLayerTokensForQuality } from "../renderers/pixi/boardLayerTokens";

describe("boardLayerTokensForQuality", () => {
  it("returns stronger depth values on higher quality tiers", () => {
    const low = boardLayerTokensForQuality("low");
    const medium = boardLayerTokensForQuality("medium");
    const high = boardLayerTokensForQuality("high");

    expect(medium.boardShadowAlpha).toBeGreaterThan(low.boardShadowAlpha);
    expect(high.boardShadowAlpha).toBeGreaterThan(medium.boardShadowAlpha);

    expect(medium.cellShadowBaseAlpha).toBeGreaterThan(low.cellShadowBaseAlpha);
    expect(high.cellShadowBaseAlpha).toBeGreaterThan(medium.cellShadowBaseAlpha);

    expect(medium.gridAlpha).toBeGreaterThan(low.gridAlpha);
    expect(high.gridAlpha).toBeGreaterThan(medium.gridAlpha);
  });

  it("maps off tier to low-tier static tokens", () => {
    expect(boardLayerTokensForQuality("off")).toEqual(boardLayerTokensForQuality("low"));
  });
});
