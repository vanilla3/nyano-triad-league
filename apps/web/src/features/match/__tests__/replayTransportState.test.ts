import { describe, expect, it, vi } from "vitest";
import { resolveReplayTransportState } from "@/features/match/replayTransportState";

describe("features/match/replayTransportState", () => {
  it("derives base transport state for non-focus layout", () => {
    const resolveShouldShowStageSecondaryControls = vi.fn(() => true);
    const state = resolveReplayTransportState({
      step: 0,
      stepMax: 9,
      simOk: true,
      isStageFocus: false,
      showStageTransport: true,
      viewportWidth: 390,
      resolveShouldShowStageSecondaryControls,
    });

    expect(state.canStepBack).toBe(false);
    expect(state.canStepForward).toBe(true);
    expect(state.canPlay).toBe(true);
    expect(state.showStageToolbarTransport).toBe(false);
    expect(state.replayTransportButtonClass).toBe("btn btn-sm");
    expect(state.replayTransportPrimaryButtonClass).toBe("btn btn-sm btn-primary");
    expect(state.replaySpeedSelectClass).toBe("rounded-md border border-surface-300 bg-white px-2 py-1 text-xs");
    expect(resolveShouldShowStageSecondaryControls).not.toHaveBeenCalled();
  });

  it("shows stage toolbar transport only when secondary controls should be visible", () => {
    const resolveShouldShowStageSecondaryControls = vi.fn((viewportWidth: number) => viewportWidth >= 900);
    const hidden = resolveReplayTransportState({
      step: 3,
      stepMax: 9,
      simOk: true,
      isStageFocus: true,
      showStageTransport: true,
      viewportWidth: 640,
      resolveShouldShowStageSecondaryControls,
    });
    const shown = resolveReplayTransportState({
      step: 3,
      stepMax: 9,
      simOk: true,
      isStageFocus: true,
      showStageTransport: true,
      viewportWidth: 1280,
      resolveShouldShowStageSecondaryControls,
    });

    expect(hidden.showStageToolbarTransport).toBe(false);
    expect(shown.showStageToolbarTransport).toBe(true);
    expect(hidden.replayTransportButtonClass).toBe("btn h-10 px-4");
    expect(shown.replayTransportPrimaryButtonClass).toBe("btn btn-primary h-10 px-4");
    expect(shown.replaySpeedSelectClass).toBe("rounded-md border border-surface-300 bg-white h-10 px-2 text-sm");
  });

  it("treats null viewport width as visible in stage focus", () => {
    const resolveShouldShowStageSecondaryControls = vi.fn(() => false);
    const state = resolveReplayTransportState({
      step: 9,
      stepMax: 9,
      simOk: true,
      isStageFocus: true,
      showStageTransport: true,
      viewportWidth: null,
      resolveShouldShowStageSecondaryControls,
    });

    expect(state.canStepForward).toBe(false);
    expect(state.showStageToolbarTransport).toBe(true);
    expect(resolveShouldShowStageSecondaryControls).not.toHaveBeenCalled();
  });

  it("disables play when replay is not ready", () => {
    const resolveShouldShowStageSecondaryControls = vi.fn(() => true);
    const state = resolveReplayTransportState({
      step: 0,
      stepMax: 0,
      simOk: false,
      isStageFocus: true,
      showStageTransport: true,
      viewportWidth: 1200,
      resolveShouldShowStageSecondaryControls,
    });

    expect(state.canPlay).toBe(false);
    expect(state.showStageToolbarTransport).toBe(false);
  });
});
