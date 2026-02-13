import { describe, expect, it } from "vitest";
import { normalizeStageFocusParams } from "../stage_focus_params";

describe("normalizeStageFocusParams", () => {
  it("fills missing focus/ui and keeps other params", () => {
    const current = new URLSearchParams("mode=guest&opp=vs_nyano_ai");
    const { next, changed } = normalizeStageFocusParams(current);

    expect(changed).toBe(true);
    expect(next.get("mode")).toBe("guest");
    expect(next.get("opp")).toBe("vs_nyano_ai");
    expect(next.get("ui")).toBe("engine");
    expect(next.get("focus")).toBe("1");
  });

  it("converts legacy layout=focus to canonical focus=1 and removes layout", () => {
    const current = new URLSearchParams("ui=mint&layout=focus");
    const { next, changed } = normalizeStageFocusParams(current);

    expect(changed).toBe(true);
    expect(next.get("ui")).toBe("engine");
    expect(next.get("focus")).toBe("1");
    expect(next.has("layout")).toBe(false);
  });

  it("canonicalizes focus=focus into focus=1", () => {
    const current = new URLSearchParams("ui=engine&focus=focus");
    const { next, changed } = normalizeStageFocusParams(current);

    expect(changed).toBe(true);
    expect(next.get("focus")).toBe("1");
  });

  it("returns changed=false for already canonical params", () => {
    const current = new URLSearchParams("mode=guest&ui=engine&focus=1");
    const { next, changed } = normalizeStageFocusParams(current);

    expect(changed).toBe(false);
    expect(next.toString()).toBe("mode=guest&ui=engine&focus=1");
  });
});
