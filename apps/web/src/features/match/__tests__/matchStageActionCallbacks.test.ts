import { describe, expect, it, vi } from "vitest";
import type { SfxName } from "@/lib/sfx";
import {
  runDoAiMoveWithFeedback,
  runExitFocusModeWithFeedback,
  runOpenReplayWithFeedback,
  runToggleStageAssistWithFeedback,
  runToggleStageControlsWithFeedback,
  runToggleStageFullscreenWithFeedback,
  type MatchStageActionFeedbackTone,
} from "@/features/match/matchStageActionCallbacks";

function createDeps() {
  const events: Array<{ type: string; value: string; tone?: MatchStageActionFeedbackTone }> = [];
  const pushStageActionFeedback = (message: string, tone?: MatchStageActionFeedbackTone) => {
    events.push({ type: "feedback", value: message, tone });
  };
  const playMatchUiSfx = (name: SfxName) => {
    events.push({ type: "sfx", value: name });
  };
  return { events, pushStageActionFeedback, playMatchUiSfx };
}

describe("features/match/matchStageActionCallbacks", () => {
  it("runs controls toggle feedback and action", () => {
    const { events, pushStageActionFeedback, playMatchUiSfx } = createDeps();
    const toggleStageControls = vi.fn();
    runToggleStageControlsWithFeedback({
      showStageControls: true,
      pushStageActionFeedback,
      playMatchUiSfx,
      toggleStageControls,
    });
    expect(events).toEqual([
      { type: "feedback", value: "Controls hidden", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);
    expect(toggleStageControls).toHaveBeenCalledTimes(1);
  });

  it("runs assist feedback only on focus route", () => {
    const focus = createDeps();
    runToggleStageAssistWithFeedback({
      isStageFocusRoute: true,
      nextShowStageAssist: false,
      pushStageActionFeedback: focus.pushStageActionFeedback,
      playMatchUiSfx: focus.playMatchUiSfx,
    });
    expect(focus.events).toEqual([
      { type: "feedback", value: "HUD hidden", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);

    const nonFocus = createDeps();
    runToggleStageAssistWithFeedback({
      isStageFocusRoute: false,
      nextShowStageAssist: true,
      pushStageActionFeedback: nonFocus.pushStageActionFeedback,
      playMatchUiSfx: nonFocus.playMatchUiSfx,
    });
    expect(nonFocus.events).toEqual([]);
  });

  it("runs fullscreen feedback with route-specific message and toggle", () => {
    const { events, pushStageActionFeedback, playMatchUiSfx } = createDeps();
    const toggleStageFullscreen = vi.fn();
    runToggleStageFullscreenWithFeedback({
      isStageFullscreen: true,
      exitFullscreenMessage: "全画面を終了",
      enterFullscreenMessage: "全画面に切替",
      pushStageActionFeedback,
      playMatchUiSfx,
      toggleStageFullscreen,
    });
    expect(events).toEqual([
      { type: "feedback", value: "全画面を終了", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);
    expect(toggleStageFullscreen).toHaveBeenCalledTimes(1);
  });

  it("runs exit focus feedback and disables focus mode", () => {
    const { events, pushStageActionFeedback, playMatchUiSfx } = createDeps();
    const setFocusMode = vi.fn();
    runExitFocusModeWithFeedback({
      pushStageActionFeedback,
      playMatchUiSfx,
      setFocusMode,
    });
    expect(events).toEqual([
      { type: "feedback", value: "Exiting focus mode", tone: "warn" },
      { type: "sfx", value: "flip" },
    ]);
    expect(setFocusMode).toHaveBeenCalledWith(false);
  });

  it("runs open replay feedback and action", () => {
    const { events, pushStageActionFeedback, playMatchUiSfx } = createDeps();
    const openReplay = vi.fn();
    runOpenReplayWithFeedback({
      pushStageActionFeedback,
      playMatchUiSfx,
      openReplay,
    });
    expect(events).toEqual([
      { type: "feedback", value: "Opening replay", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);
    expect(openReplay).toHaveBeenCalledTimes(1);
  });

  it("runs Nyano move feedback and action", () => {
    const { events, pushStageActionFeedback, playMatchUiSfx } = createDeps();
    const doAiMove = vi.fn();
    runDoAiMoveWithFeedback({
      pushStageActionFeedback,
      playMatchUiSfx,
      doAiMove,
    });
    expect(events).toEqual([
      { type: "feedback", value: "Nyano move requested", tone: undefined },
      { type: "sfx", value: "card_place" },
    ]);
    expect(doAiMove).toHaveBeenCalledTimes(1);
  });
});
