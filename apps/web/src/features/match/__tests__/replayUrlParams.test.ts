import { describe, expect, it } from "vitest";
import {
  buildReplayStageUrl,
  parseReplayBoardUi,
  toMatchBoardUi,
  withReplayBoardUi,
  withReplayFocusMode,
  withReplayStepMode,
} from "@/features/match/replayUrlParams";

describe("features/match/replayUrlParams", () => {
  it("parses replay board ui with safe default", () => {
    expect(parseReplayBoardUi("engine")).toBe("engine");
    expect(parseReplayBoardUi("rpg")).toBe("rpg");
    expect(parseReplayBoardUi("classic")).toBe("classic");
    expect(parseReplayBoardUi(null)).toBe("classic");
  });

  it("maps replay board ui to match board ui", () => {
    expect(toMatchBoardUi("classic")).toBe("mint");
    expect(toMatchBoardUi("engine")).toBe("engine");
    expect(toMatchBoardUi("rpg")).toBe("rpg");
  });

  it("builds replay stage URL with engine focus params", () => {
    const params = new URLSearchParams("ui=rpg&focus=0&foo=1");
    const url = buildReplayStageUrl(params);
    expect(url.startsWith("/replay-stage?")).toBe(true);
    expect(url).toContain("ui=engine");
    expect(url).toContain("focus=1");
    expect(url).toContain("foo=1");
  });

  it("updates replay ui while preserving compatibility", () => {
    const params = new URLSearchParams("ui=engine&focus=1&layout=focus&foo=1");
    const classic = withReplayBoardUi(params, "classic");
    expect(classic.get("ui")).toBeNull();
    expect(classic.get("focus")).toBeNull();
    expect(classic.get("layout")).toBeNull();
    expect(classic.get("foo")).toBe("1");
  });

  it("updates replay focus and step/mode params", () => {
    const params = new URLSearchParams("ui=engine&layout=focus");
    const focused = withReplayFocusMode(params, true);
    expect(focused.get("focus")).toBe("1");
    expect(focused.get("layout")).toBeNull();

    const sync = withReplayStepMode(focused, "compare", 7);
    expect(sync.get("mode")).toBe("compare");
    expect(sync.get("step")).toBe("7");
  });
});

