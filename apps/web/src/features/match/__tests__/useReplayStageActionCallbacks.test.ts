import type React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  createReplayStageActionCallbacks,
} from "@/features/match/useReplayStageActionCallbacks";
import type { ReplayStageActionFeedbackTone } from "@/features/match/replayStageActionCallbacks";

function createFeedbackDeps() {
  const events: Array<{ type: string; value: string; tone?: ReplayStageActionFeedbackTone }> = [];
  const pushStageActionFeedback = (message: string, tone?: ReplayStageActionFeedbackTone) => {
    events.push({ type: "feedback", value: message, tone });
  };
  const playReplaySfx = (name: string) => {
    events.push({ type: "sfx", value: name });
  };
  return { events, pushStageActionFeedback, playReplaySfx };
}

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

describe("features/match/useReplayStageActionCallbacks", () => {
  it("runs fullscreen/transport callbacks with feedback", () => {
    const feedback = createFeedbackDeps();
    const setupState = createStateSetter(true);
    const panelsState = createStateSetter(false);
    const toggleStageFullscreen = vi.fn();
    const toggleStageTransport = vi.fn();
    const callbacks = createReplayStageActionCallbacks({
      isStageFocus: true,
      isStageFullscreen: false,
      showStageTransport: false,
      pushStageActionFeedback: feedback.pushStageActionFeedback,
      playReplaySfx: feedback.playReplaySfx,
      toggleStageFullscreen,
      toggleStageTransport,
      setShowStageSetup: setupState.setState,
      setShowStagePanels: panelsState.setState,
      setFocusMode: vi.fn(),
      enterFullscreenMessage: "enter fullscreen",
      exitFullscreenMessage: "exit fullscreen",
      hideControlsMessage: "hide controls",
      showControlsMessage: "show controls",
      setupShownMessage: "setup shown",
      setupHiddenMessage: "setup hidden",
      panelsShownMessage: "panels shown",
      panelsHiddenMessage: "panels hidden",
      exitFocusMessage: "exit focus",
    });

    callbacks.toggleStageFullscreenWithFeedback();
    callbacks.toggleStageTransportWithFeedback();
    expect(feedback.events).toEqual([
      { type: "feedback", value: "enter fullscreen", tone: undefined },
      { type: "sfx", value: "card_place" },
      { type: "feedback", value: "show controls", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);
    expect(toggleStageFullscreen).toHaveBeenCalledTimes(1);
    expect(toggleStageTransport).toHaveBeenCalledTimes(1);
  });

  it("toggles setup/panels state and dispatches focus-only feedback", () => {
    const feedback = createFeedbackDeps();
    const setupState = createStateSetter(false);
    const panelsState = createStateSetter(true);
    const callbacks = createReplayStageActionCallbacks({
      isStageFocus: true,
      isStageFullscreen: false,
      showStageTransport: true,
      pushStageActionFeedback: feedback.pushStageActionFeedback,
      playReplaySfx: feedback.playReplaySfx,
      toggleStageFullscreen: vi.fn(),
      toggleStageTransport: vi.fn(),
      setShowStageSetup: setupState.setState,
      setShowStagePanels: panelsState.setState,
      setFocusMode: vi.fn(),
      enterFullscreenMessage: "enter fullscreen",
      exitFullscreenMessage: "exit fullscreen",
      hideControlsMessage: "hide controls",
      showControlsMessage: "show controls",
      setupShownMessage: "setup shown",
      setupHiddenMessage: "setup hidden",
      panelsShownMessage: "panels shown",
      panelsHiddenMessage: "panels hidden",
      exitFocusMessage: "exit focus",
    });

    callbacks.toggleStageSetupWithFeedback();
    callbacks.toggleStagePanelsWithFeedback();
    expect(setupState.value).toBe(true);
    expect(panelsState.value).toBe(false);
    expect(feedback.events).toEqual([
      { type: "feedback", value: "setup shown", tone: undefined },
      { type: "sfx", value: "card_place" },
      { type: "feedback", value: "panels hidden", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);
  });

  it("runs exit focus callback with warn feedback", () => {
    const feedback = createFeedbackDeps();
    const setupState = createStateSetter(false);
    const panelsState = createStateSetter(false);
    const setFocusMode = vi.fn();
    const callbacks = createReplayStageActionCallbacks({
      isStageFocus: true,
      isStageFullscreen: false,
      showStageTransport: true,
      pushStageActionFeedback: feedback.pushStageActionFeedback,
      playReplaySfx: feedback.playReplaySfx,
      toggleStageFullscreen: vi.fn(),
      toggleStageTransport: vi.fn(),
      setShowStageSetup: setupState.setState,
      setShowStagePanels: panelsState.setState,
      setFocusMode,
      enterFullscreenMessage: "enter fullscreen",
      exitFullscreenMessage: "exit fullscreen",
      hideControlsMessage: "hide controls",
      showControlsMessage: "show controls",
      setupShownMessage: "setup shown",
      setupHiddenMessage: "setup hidden",
      panelsShownMessage: "panels shown",
      panelsHiddenMessage: "panels hidden",
      exitFocusMessage: "exit focus",
    });

    callbacks.exitFocusModeWithFeedback();
    expect(feedback.events).toEqual([
      { type: "feedback", value: "exit focus", tone: "warn" },
    ]);
    expect(setFocusMode).toHaveBeenCalledWith(false);
  });
});
