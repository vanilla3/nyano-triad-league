import { describe, expect, it } from "vitest";
import {
  buildMatchStageUrl,
  withMatchBoardUi,
  withMatchFocusMode,
  withoutMatchEvent,
} from "@/features/match/matchUrlParams";

describe("features/match/matchUrlParams", () => {
  it("builds battle-stage URL with engine focus params", () => {
    const params = new URLSearchParams("ui=rpg&focus=0&foo=1");
    const url = buildMatchStageUrl(params);
    expect(url.startsWith("/battle-stage?")).toBe(true);
    expect(url).toContain("ui=engine");
    expect(url).toContain("focus=1");
    expect(url).toContain("foo=1");
  });

  it("updates board ui and clears focus/layout when leaving engine", () => {
    const params = new URLSearchParams("ui=engine&focus=1&layout=focus&foo=1");
    const mint = withMatchBoardUi(params, "mint");
    expect(mint.get("ui")).toBe("mint");
    expect(mint.get("focus")).toBeNull();
    expect(mint.get("layout")).toBeNull();
    expect(mint.get("foo")).toBe("1");

    const engine = withMatchBoardUi(params, "engine");
    expect(engine.get("ui")).toBe("engine");
    expect(engine.get("focus")).toBe("1");
  });

  it("updates focus mode and removes legacy layout param", () => {
    const params = new URLSearchParams("ui=engine&layout=focus");
    const focused = withMatchFocusMode(params, true);
    expect(focused.get("focus")).toBe("1");
    expect(focused.get("layout")).toBeNull();

    const plain = withMatchFocusMode(focused, false);
    expect(plain.get("focus")).toBeNull();
    expect(plain.get("layout")).toBeNull();
  });

  it("removes event param only", () => {
    const params = new URLSearchParams("event=s1&ui=mint&rk=v2");
    const next = withoutMatchEvent(params);
    expect(next.get("event")).toBeNull();
    expect(next.get("ui")).toBe("mint");
    expect(next.get("rk")).toBe("v2");
  });
});
