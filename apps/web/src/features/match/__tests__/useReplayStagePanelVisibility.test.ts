import type React from "react";
import { describe, expect, it } from "vitest";
import {
  resolveReplayStagePanelVisibility,
  syncReplayStagePanelVisibility,
} from "@/features/match/useReplayStagePanelVisibility";

function createStateSetter(initial: boolean) {
  let value = initial;
  const setState: React.Dispatch<React.SetStateAction<boolean>> = (next) => {
    value = typeof next === "function" ? next(value) : next;
  };
  return {
    get value() {
      return value;
    },
    setState,
  };
}

describe("features/match/useReplayStagePanelVisibility", () => {
  it("resolves panel visibility from stage focus route", () => {
    expect(resolveReplayStagePanelVisibility(false)).toBe(true);
    expect(resolveReplayStagePanelVisibility(true)).toBe(false);
  });

  it("syncs both panel states visible when not in stage focus route", () => {
    const panelsState = createStateSetter(false);
    const setupState = createStateSetter(false);

    syncReplayStagePanelVisibility({
      isStageFocusRoute: false,
      setShowStagePanels: panelsState.setState,
      setShowStageSetup: setupState.setState,
    });

    expect(panelsState.value).toBe(true);
    expect(setupState.value).toBe(true);
  });

  it("syncs both panel states hidden when in stage focus route", () => {
    const panelsState = createStateSetter(true);
    const setupState = createStateSetter(true);

    syncReplayStagePanelVisibility({
      isStageFocusRoute: true,
      setShowStagePanels: panelsState.setState,
      setShowStageSetup: setupState.setState,
    });

    expect(panelsState.value).toBe(false);
    expect(setupState.value).toBe(false);
  });
});
