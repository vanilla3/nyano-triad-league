import { describe, expect, it } from "vitest";
import { resolveReplayStepModeSyncMutation } from "@/features/match/useReplayStepModeUrlSync";

describe("features/match/useReplayStepModeUrlSync", () => {
  it("returns null when replay URL has no share payload", () => {
    const next = resolveReplayStepModeSyncMutation({
      searchParams: new URLSearchParams("ui=engine"),
      mode: "v2",
      step: 3,
    });
    expect(next).toBeNull();
  });

  it("returns null when mode and step are already synced", () => {
    const next = resolveReplayStepModeSyncMutation({
      searchParams: new URLSearchParams("t=abc&mode=compare&step=4"),
      mode: "compare",
      step: 4,
    });
    expect(next).toBeNull();
  });

  it("returns updated URL params when mode/step differ", () => {
    const next = resolveReplayStepModeSyncMutation({
      searchParams: new URLSearchParams("z=abc&mode=auto&step=0&rk=v2"),
      mode: "v2",
      step: 5,
    });
    expect(next).not.toBeNull();
    expect(next?.get("mode")).toBe("v2");
    expect(next?.get("step")).toBe("5");
    expect(next?.get("rk")).toBe("v2");
  });
});
