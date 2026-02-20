import { describe, expect, it } from "vitest";
import { resolveReplayStageBoardSizing } from "@/features/match/useReplayStageBoardSizing";

describe("features/match/useReplayStageBoardSizing", () => {
  it("resolves deterministic replay stage sizing from viewport", () => {
    const desktop = resolveReplayStageBoardSizing({
      viewportWidthPx: 1366,
      viewportHeightPx: 900,
    });
    const mobile = resolveReplayStageBoardSizing({
      viewportWidthPx: 390,
      viewportHeightPx: 844,
    });

    expect(desktop.maxWidthPx).toBeGreaterThan(mobile.maxWidthPx);
    expect(desktop.minHeightPx).toBeGreaterThan(mobile.minHeightPx);
    expect(desktop.maxWidthPx).toBeGreaterThan(0);
    expect(mobile.minHeightPx).toBeGreaterThan(0);
  });
});
