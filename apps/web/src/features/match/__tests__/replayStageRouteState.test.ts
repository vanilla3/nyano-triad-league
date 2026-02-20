import { describe, expect, it } from "vitest";
import {
  isReplayStagePathname,
  resolveIsReplayStageFocusRoute,
  resolveReplayStageRouteState,
} from "@/features/match/replayStageRouteState";

describe("features/match/replayStageRouteState", () => {
  it("detects replay-stage pathname with existing compatibility semantics", () => {
    expect(isReplayStagePathname("/replay-stage")).toBe(true);
    expect(isReplayStagePathname("/replay")).toBe(false);
    expect(isReplayStagePathname("/replay-stage/")).toBe(false);
    expect(isReplayStagePathname("/foo/replay-stage")).toBe(true);
  });

  it("resolves stage-focus route only when both route and engine-focus are enabled", () => {
    expect(
      resolveIsReplayStageFocusRoute({
        pathname: "/replay-stage",
        isEngineFocus: true,
      }),
    ).toBe(true);
    expect(
      resolveIsReplayStageFocusRoute({
        pathname: "/replay-stage",
        isEngineFocus: false,
      }),
    ).toBe(false);
    expect(
      resolveIsReplayStageFocusRoute({
        pathname: "/replay",
        isEngineFocus: true,
      }),
    ).toBe(false);
  });

  it("builds stage route state with stage URL and derived booleans", () => {
    const state = resolveReplayStageRouteState({
      pathname: "/replay-stage",
      searchParams: new URLSearchParams("ui=mint&focus=0&rk=v2"),
      isEngineFocus: true,
    });
    expect(state.isReplayStageRoute).toBe(true);
    expect(state.isStageFocusRoute).toBe(true);
    expect(state.stageReplayUrl.startsWith("/replay-stage?")).toBe(true);
    expect(state.stageReplayUrl).toContain("ui=engine");
    expect(state.stageReplayUrl).toContain("focus=1");
    expect(state.stageReplayUrl).toContain("rk=v2");
  });
});
