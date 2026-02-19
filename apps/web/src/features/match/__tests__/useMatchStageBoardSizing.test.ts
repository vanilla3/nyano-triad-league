import { describe, expect, it } from "vitest";
import { computeStageBoardSizing } from "@/lib/stage_layout";
import {
  resolveMatchStageBoardSizing,
} from "@/features/match/useMatchStageBoardSizing";

describe("features/match/useMatchStageBoardSizing", () => {
  it("uses default viewport sizing when viewport is unavailable", () => {
    const sizing = resolveMatchStageBoardSizing(null);
    expect(sizing).toEqual(
      computeStageBoardSizing({
        viewportWidthPx: 1366,
        viewportHeightPx: 900,
        kind: "battle",
      }),
    );
  });

  it("computes sizing from provided viewport dimensions", () => {
    const sizing = resolveMatchStageBoardSizing({
      width: 640,
      height: 780,
    });
    expect(sizing).toEqual(
      computeStageBoardSizing({
        viewportWidthPx: 640,
        viewportHeightPx: 780,
        kind: "battle",
      }),
    );
  });

  it("keeps battle kind sizing profile", () => {
    const sizing = resolveMatchStageBoardSizing({
      width: 1024,
      height: 768,
    });
    const battle = computeStageBoardSizing({
      viewportWidthPx: 1024,
      viewportHeightPx: 768,
      kind: "battle",
    });
    const replay = computeStageBoardSizing({
      viewportWidthPx: 1024,
      viewportHeightPx: 768,
      kind: "replay",
    });
    expect(sizing).toEqual(battle);
    expect(sizing).not.toEqual(replay);
  });
});
