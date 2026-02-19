import { describe, expect, it } from "vitest";
import {
  isBattleStagePathname,
  resolveIsStageFocusRoute,
  resolveMatchStageRouteState,
} from "@/features/match/matchStageRouteState";

describe("features/match/matchStageRouteState", () => {
  it("detects battle-stage pathname with existing compatibility semantics", () => {
    expect(isBattleStagePathname("/battle-stage")).toBe(true);
    expect(isBattleStagePathname("/match")).toBe(false);
    expect(isBattleStagePathname("/battle-stage/")).toBe(false);
    expect(isBattleStagePathname("/foo/battle-stage")).toBe(true);
  });

  it("resolves stage-focus route only when both route and engine-focus are enabled", () => {
    expect(
      resolveIsStageFocusRoute({
        pathname: "/battle-stage",
        isEngineFocus: true,
      }),
    ).toBe(true);
    expect(
      resolveIsStageFocusRoute({
        pathname: "/battle-stage",
        isEngineFocus: false,
      }),
    ).toBe(false);
    expect(
      resolveIsStageFocusRoute({
        pathname: "/match",
        isEngineFocus: true,
      }),
    ).toBe(false);
  });

  it("builds stage route state with stage URL and derived booleans", () => {
    const state = resolveMatchStageRouteState({
      pathname: "/battle-stage",
      searchParams: new URLSearchParams("ui=mint&focus=0&rk=v2"),
      isEngineFocus: true,
    });
    expect(state.isBattleStageRoute).toBe(true);
    expect(state.isStageFocusRoute).toBe(true);
    expect(state.stageMatchUrl.startsWith("/battle-stage?")).toBe(true);
    expect(state.stageMatchUrl).toContain("ui=engine");
    expect(state.stageMatchUrl).toContain("focus=1");
    expect(state.stageMatchUrl).toContain("rk=v2");
  });
});
