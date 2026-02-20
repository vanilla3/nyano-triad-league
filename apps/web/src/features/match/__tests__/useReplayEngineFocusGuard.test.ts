import { describe, expect, it } from "vitest";
import { resolveReplayEngineFocusGuardMutation } from "@/features/match/useReplayEngineFocusGuard";

describe("features/match/useReplayEngineFocusGuard", () => {
  it("returns null when board ui is engine", () => {
    const next = resolveReplayEngineFocusGuardMutation({
      searchParams: new URLSearchParams("ui=engine&focus=1"),
      isEngine: true,
      isFocusMode: true,
    });
    expect(next).toBeNull();
  });

  it("returns null when focus mode is disabled", () => {
    const next = resolveReplayEngineFocusGuardMutation({
      searchParams: new URLSearchParams("ui=classic"),
      isEngine: false,
      isFocusMode: false,
    });
    expect(next).toBeNull();
  });

  it("returns mutation that clears focus params in non-engine ui", () => {
    const next = resolveReplayEngineFocusGuardMutation({
      searchParams: new URLSearchParams("ui=rpg&focus=1&layout=1"),
      isEngine: false,
      isFocusMode: true,
    });
    expect(next).not.toBeNull();
    expect(next?.has("focus")).toBe(false);
    expect(next?.has("layout")).toBe(false);
    expect(next?.get("ui")).toBe("rpg");
  });
});
