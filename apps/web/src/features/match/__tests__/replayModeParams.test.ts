import { describe, expect, it } from "vitest";
import {
  parseReplayMode,
  parseReplayStepParam,
  parseSignedInt32Param,
  replayModeDisplay,
} from "@/features/match/replayModeParams";

describe("features/match/replayModeParams", () => {
  it("parses replay mode with safe fallback", () => {
    expect(parseReplayMode("auto")).toBe("auto");
    expect(parseReplayMode("v1")).toBe("v1");
    expect(parseReplayMode("v2")).toBe("v2");
    expect(parseReplayMode("compare")).toBe("compare");
    expect(parseReplayMode("other")).toBe("auto");
    expect(parseReplayMode(null)).toBe("auto");
  });

  it("parses signed int32 URL param safely", () => {
    expect(parseSignedInt32Param("0")).toBe(0);
    expect(parseSignedInt32Param("-10")).toBe(-10);
    expect(parseSignedInt32Param("2147483647")).toBe(2147483647);
    expect(parseSignedInt32Param("-2147483648")).toBe(-2147483648);
    expect(parseSignedInt32Param("2147483648")).toBeNull();
    expect(parseSignedInt32Param("3.14")).toBeNull();
    expect(parseSignedInt32Param("abc")).toBeNull();
    expect(parseSignedInt32Param(null)).toBeNull();
  });

  it("parses replay step param as clamped integer", () => {
    expect(parseReplayStepParam("0")).toBe(0);
    expect(parseReplayStepParam("3")).toBe(3);
    expect(parseReplayStepParam("9")).toBe(9);
    expect(parseReplayStepParam("-1")).toBe(0);
    expect(parseReplayStepParam("11")).toBe(9);
    expect(parseReplayStepParam("4.9")).toBe(4);
    expect(parseReplayStepParam("NaN")).toBe(0);
    expect(parseReplayStepParam(null)).toBe(0);
  });

  it("returns display labels for each mode", () => {
    expect(replayModeDisplay("auto")).toMatch(/auto/);
    expect(replayModeDisplay("v1")).toMatch(/v1/);
    expect(replayModeDisplay("v2")).toMatch(/v2/);
    expect(replayModeDisplay("compare")).toMatch(/compare/);
  });
});
