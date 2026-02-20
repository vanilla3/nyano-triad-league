import { describe, expect, it, vi } from "vitest";
import type { SfxName } from "@/lib/sfx";
import {
  runReplayExitFocusModeWithFeedback,
  runReplayToggleStageFullscreenWithFeedback,
  runReplayToggleStagePanelsWithFeedback,
  runReplayToggleStageSetupWithFeedback,
  runReplayToggleStageTransportWithFeedback,
  type ReplayStageActionFeedbackTone,
} from "@/features/match/replayStageActionCallbacks";

function createDeps() {
  const events: Array<{ type: string; value: string; tone?: ReplayStageActionFeedbackTone }> = [];
  const pushStageActionFeedback = (message: string, tone?: ReplayStageActionFeedbackTone) => {
    events.push({ type: "feedback", value: message, tone });
  };
  const playReplaySfx = (name: SfxName) => {
    events.push({ type: "sfx", value: name });
  };
  return { events, pushStageActionFeedback, playReplaySfx };
}

describe("features/match/replayStageActionCallbacks", () => {
  it("runs fullscreen feedback + sfx + action", () => {
    const { events, pushStageActionFeedback, playReplaySfx } = createDeps();
    const toggleStageFullscreen = vi.fn();
    runReplayToggleStageFullscreenWithFeedback({
      isStageFullscreen: true,
      exitFullscreenMessage: "exit fullscreen",
      enterFullscreenMessage: "enter fullscreen",
      pushStageActionFeedback,
      playReplaySfx,
      toggleStageFullscreen,
    });
    expect(events).toEqual([
      { type: "feedback", value: "exit fullscreen", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);
    expect(toggleStageFullscreen).toHaveBeenCalledTimes(1);
  });

  it("runs transport feedback + sfx + toggle", () => {
    const { events, pushStageActionFeedback, playReplaySfx } = createDeps();
    const toggleStageTransport = vi.fn();
    runReplayToggleStageTransportWithFeedback({
      showStageTransport: true,
      hideControlsMessage: "hide controls",
      showControlsMessage: "show controls",
      pushStageActionFeedback,
      playReplaySfx,
      toggleStageTransport,
    });
    expect(events).toEqual([
      { type: "feedback", value: "hide controls", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);
    expect(toggleStageTransport).toHaveBeenCalledTimes(1);
  });

  it("runs setup/panels feedback only on focus route", () => {
    const focusSetup = createDeps();
    runReplayToggleStageSetupWithFeedback({
      isStageFocus: true,
      nextShowStageSetup: false,
      setupShownMessage: "setup shown",
      setupHiddenMessage: "setup hidden",
      pushStageActionFeedback: focusSetup.pushStageActionFeedback,
      playReplaySfx: focusSetup.playReplaySfx,
    });
    expect(focusSetup.events).toEqual([
      { type: "feedback", value: "setup hidden", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);

    const nonFocusPanels = createDeps();
    runReplayToggleStagePanelsWithFeedback({
      isStageFocus: false,
      nextShowStagePanels: true,
      panelsShownMessage: "panels shown",
      panelsHiddenMessage: "panels hidden",
      pushStageActionFeedback: nonFocusPanels.pushStageActionFeedback,
      playReplaySfx: nonFocusPanels.playReplaySfx,
    });
    expect(nonFocusPanels.events).toEqual([]);
  });

  it("runs exit focus warning and disables focus mode", () => {
    const { events, pushStageActionFeedback } = createDeps();
    const setFocusMode = vi.fn();
    runReplayExitFocusModeWithFeedback({
      exitFocusMessage: "exit focus",
      pushStageActionFeedback,
      setFocusMode,
    });
    expect(events).toEqual([
      { type: "feedback", value: "exit focus", tone: "warn" },
    ]);
    expect(setFocusMode).toHaveBeenCalledWith(false);
  });
});
