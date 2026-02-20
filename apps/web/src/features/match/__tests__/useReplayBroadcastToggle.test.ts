import { describe, expect, it } from "vitest";
import { resolveReplayBroadcastToggleMutation } from "@/features/match/useReplayBroadcastToggle";

describe("features/match/useReplayBroadcastToggle", () => {
  it("returns null when broadcast state is unchanged", () => {
    const next = resolveReplayBroadcastToggleMutation({
      searchParams: new URLSearchParams("ui=engine&broadcast=1"),
      nextOn: true,
    });
    expect(next).toBeNull();
  });

  it("adds broadcast=1 while preserving existing params", () => {
    const next = resolveReplayBroadcastToggleMutation({
      searchParams: new URLSearchParams("ui=engine&rk=v2"),
      nextOn: true,
    });
    expect(next).not.toBeNull();
    expect(next?.get("broadcast")).toBe("1");
    expect(next?.get("ui")).toBe("engine");
    expect(next?.get("rk")).toBe("v2");
  });

  it("removes broadcast query when toggled off", () => {
    const next = resolveReplayBroadcastToggleMutation({
      searchParams: new URLSearchParams("ui=engine&broadcast=1&step=3"),
      nextOn: false,
    });
    expect(next).not.toBeNull();
    expect(next?.has("broadcast")).toBe(false);
    expect(next?.get("step")).toBe("3");
  });
});
