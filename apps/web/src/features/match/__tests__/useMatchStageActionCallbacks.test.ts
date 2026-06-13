import type React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  createMatchStageActionCallbacks,
} from "@/features/match/useMatchStageActionCallbacks";
import type { MatchStageActionFeedbackTone } from "@/features/match/matchStageActionCallbacks";

function createFeedbackDeps() {
  const events: Array<{ type: string; value: string; tone?: MatchStageActionFeedbackTone }> = [];
  const pushStageActionFeedback = (message: string, tone?: MatchStageActionFeedbackTone) => {
    events.push({ type: "feedback", value: message, tone });
  };
  const playMatchUiSfx = (name: string) => {
    events.push({ type: "sfx", value: name });
  };
  return { events, pushStageActionFeedback, playMatchUiSfx };
}

function createSetShowStageAssistState(initial: boolean) {
  let value = initial;
  const setShowStageAssist: React.Dispatch<React.SetStateAction<boolean>> = (next) => {
    value = typeof next === "function" ? next(value) : next;
  };
  return {
    get value() {
      return value;
    },
    setShowStageAssist,
  };
}

describe("features/match/useMatchStageActionCallbacks", () => {
  it("toggles stage controls with feedback + sfx", () => {
    const feedback = createFeedbackDeps();
    const stageAssistState = createSetShowStageAssistState(false);
    const toggleStageControls = vi.fn();
    const callbacks = createMatchStageActionCallbacks({
      showStageControls: true,
      setShowStageAssist: stageAssistState.setShowStageAssist,
      isStageFocusRoute: true,
      isStageFullscreen: false,
      pushStageActionFeedback: feedback.pushStageActionFeedback,
      playMatchUiSfx: feedback.playMatchUiSfx,
      toggleStageControls,
      toggleStageFullscreen: vi.fn(),
      setFocusMode: vi.fn(),
      openReplay: vi.fn(),
      doAiMove: vi.fn(),
    });

    callbacks.toggleStageControlsWithFeedback();
    expect(feedback.events).toEqual([
      { type: "feedback", value: "Controls hidden", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);
    expect(toggleStageControls).toHaveBeenCalledTimes(1);
  });

  it("toggles stage assist state and emits feedback only on focus route", () => {
    const focusFeedback = createFeedbackDeps();
    const focusState = createSetShowStageAssistState(false);
    const focusCallbacks = createMatchStageActionCallbacks({
      showStageControls: false,
      setShowStageAssist: focusState.setShowStageAssist,
      isStageFocusRoute: true,
      isStageFullscreen: false,
      pushStageActionFeedback: focusFeedback.pushStageActionFeedback,
      playMatchUiSfx: focusFeedback.playMatchUiSfx,
      toggleStageControls: vi.fn(),
      toggleStageFullscreen: vi.fn(),
      setFocusMode: vi.fn(),
      openReplay: vi.fn(),
      doAiMove: vi.fn(),
    });

    focusCallbacks.toggleStageAssistWithFeedback();
    expect(focusState.value).toBe(true);
    expect(focusFeedback.events).toEqual([
      { type: "feedback", value: "HUD shown", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);

    const nonFocusFeedback = createFeedbackDeps();
    const nonFocusState = createSetShowStageAssistState(true);
    const nonFocusCallbacks = createMatchStageActionCallbacks({
      showStageControls: false,
      setShowStageAssist: nonFocusState.setShowStageAssist,
      isStageFocusRoute: false,
      isStageFullscreen: false,
      pushStageActionFeedback: nonFocusFeedback.pushStageActionFeedback,
      playMatchUiSfx: nonFocusFeedback.playMatchUiSfx,
      toggleStageControls: vi.fn(),
      toggleStageFullscreen: vi.fn(),
      setFocusMode: vi.fn(),
      openReplay: vi.fn(),
      doAiMove: vi.fn(),
    });

    nonFocusCallbacks.toggleStageAssistWithFeedback();
    expect(nonFocusState.value).toBe(false);
    expect(nonFocusFeedback.events).toEqual([]);
  });

  it("runs fullscreen/replay/focus-exit/ai callbacks with feedback side effects", () => {
    const feedback = createFeedbackDeps();
    const stageAssistState = createSetShowStageAssistState(false);
    const toggleStageFullscreen = vi.fn();
    const setFocusMode = vi.fn();
    const openReplay = vi.fn();
    const doAiMove = vi.fn();
    const callbacks = createMatchStageActionCallbacks({
      showStageControls: false,
      setShowStageAssist: stageAssistState.setShowStageAssist,
      isStageFocusRoute: true,
      isStageFullscreen: false,
      pushStageActionFeedback: feedback.pushStageActionFeedback,
      playMatchUiSfx: feedback.playMatchUiSfx,
      toggleStageControls: vi.fn(),
      toggleStageFullscreen,
      setFocusMode,
      openReplay,
      doAiMove,
    });

    callbacks.toggleStageFullscreenWithFeedback();
    callbacks.openReplayWithFeedback();
    callbacks.exitFocusModeWithFeedback();
    callbacks.doAiMoveWithFeedback();

    expect(feedback.events).toEqual([
      { type: "feedback", value: "全画面に切替", tone: undefined },
      { type: "sfx", value: "card_place" },
      { type: "feedback", value: "Opening replay", tone: undefined },
      { type: "sfx", value: "card_place" },
      { type: "feedback", value: "Exiting focus mode", tone: "warn" },
      { type: "sfx", value: "flip" },
      { type: "feedback", value: "Nyano move requested", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);
    expect(toggleStageFullscreen).toHaveBeenCalledTimes(1);
    expect(openReplay).toHaveBeenCalledTimes(1);
    expect(setFocusMode).toHaveBeenCalledWith(false);
    expect(doAiMove).toHaveBeenCalledTimes(1);
  });
});
