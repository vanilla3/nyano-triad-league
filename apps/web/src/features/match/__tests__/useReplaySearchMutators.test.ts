import { describe, expect, it } from "vitest";
import {
  resolveReplayBoardUiMutation,
  resolveReplayFocusModeMutation,
} from "@/features/match/useReplaySearchMutators";

describe("features/match/useReplaySearchMutators", () => {
  it("returns null when replay board UI mutation does not change params", () => {
    const next = resolveReplayBoardUiMutation({
      searchParams: new URLSearchParams(""),
      nextUi: "classic",
    });
    expect(next).toBeNull();
  });

  it("updates replay board UI and clears focus flags when leaving engine mode", () => {
    const next = resolveReplayBoardUiMutation({
      searchParams: new URLSearchParams("ui=engine&focus=1&layout=1"),
      nextUi: "rpg",
    });
    expect(next).not.toBeNull();
    expect(next?.get("ui")).toBe("rpg");
    expect(next?.has("focus")).toBe(false);
    expect(next?.has("layout")).toBe(false);
  });

  it("returns navigation mutation when disabling focus on replay-stage route", () => {
    const mutation = resolveReplayFocusModeMutation({
      searchParams: new URLSearchParams("ui=engine&focus=1&rk=v2"),
      enabled: false,
      isReplayStageRoute: true,
    });
    expect(mutation.kind).toBe("navigate");
    if (mutation.kind !== "navigate") return;
    expect(mutation.to).toBe("/replay?ui=engine&rk=v2");
  });

  it("returns search mutation when enabling focus in replay page", () => {
    const mutation = resolveReplayFocusModeMutation({
      searchParams: new URLSearchParams("ui=engine"),
      enabled: true,
      isReplayStageRoute: false,
    });
    expect(mutation.kind).toBe("search");
    if (mutation.kind !== "search") return;
    expect(mutation.next.get("focus")).toBe("1");
  });

  it("returns noop when focus mutation is unchanged", () => {
    const mutation = resolveReplayFocusModeMutation({
      searchParams: new URLSearchParams("ui=engine&focus=1"),
      enabled: true,
      isReplayStageRoute: false,
    });
    expect(mutation.kind).toBe("noop");
  });
});
