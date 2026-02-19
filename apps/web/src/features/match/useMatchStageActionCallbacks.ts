import React from "react";
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

type PushStageActionFeedback = (
  message: string,
  tone?: MatchStageActionFeedbackTone,
) => void;

type MatchStageActionCallbacks = {
  toggleStageControlsWithFeedback: () => void;
  toggleStageAssistWithFeedback: () => void;
  toggleStageFullscreenWithFeedback: () => void;
  exitFocusModeWithFeedback: () => void;
  openReplayWithFeedback: () => void;
  doAiMoveWithFeedback: () => void;
};

type CreateMatchStageActionCallbacksInput = {
  showStageControls: boolean;
  setShowStageAssist: React.Dispatch<React.SetStateAction<boolean>>;
  isStageFocusRoute: boolean;
  isStageFullscreen: boolean;
  pushStageActionFeedback: PushStageActionFeedback;
  playMatchUiSfx: (name: SfxName) => void;
  toggleStageControls: () => void;
  toggleStageFullscreen: () => void | Promise<void>;
  setFocusMode: (next: boolean) => void;
  openReplay: () => void | Promise<void>;
  doAiMove: () => void;
  enterFullscreenMessage?: string;
  exitFullscreenMessage?: string;
};

export function createMatchStageActionCallbacks(
  input: CreateMatchStageActionCallbacksInput,
): MatchStageActionCallbacks {
  return {
    toggleStageControlsWithFeedback: () => {
      runToggleStageControlsWithFeedback({
        showStageControls: input.showStageControls,
        pushStageActionFeedback: input.pushStageActionFeedback,
        playMatchUiSfx: input.playMatchUiSfx,
        toggleStageControls: input.toggleStageControls,
      });
    },
    toggleStageAssistWithFeedback: () => {
      input.setShowStageAssist((prev) => {
        const next = !prev;
        runToggleStageAssistWithFeedback({
          isStageFocusRoute: input.isStageFocusRoute,
          nextShowStageAssist: next,
          pushStageActionFeedback: input.pushStageActionFeedback,
          playMatchUiSfx: input.playMatchUiSfx,
        });
        return next;
      });
    },
    toggleStageFullscreenWithFeedback: () => {
      runToggleStageFullscreenWithFeedback({
        isStageFullscreen: input.isStageFullscreen,
        exitFullscreenMessage: input.exitFullscreenMessage ?? "全画面を終了",
        enterFullscreenMessage: input.enterFullscreenMessage ?? "全画面に切替",
        pushStageActionFeedback: input.pushStageActionFeedback,
        playMatchUiSfx: input.playMatchUiSfx,
        toggleStageFullscreen: input.toggleStageFullscreen,
      });
    },
    exitFocusModeWithFeedback: () => {
      runExitFocusModeWithFeedback({
        pushStageActionFeedback: input.pushStageActionFeedback,
        playMatchUiSfx: input.playMatchUiSfx,
        setFocusMode: input.setFocusMode,
      });
    },
    openReplayWithFeedback: () => {
      runOpenReplayWithFeedback({
        pushStageActionFeedback: input.pushStageActionFeedback,
        playMatchUiSfx: input.playMatchUiSfx,
        openReplay: input.openReplay,
      });
    },
    doAiMoveWithFeedback: () => {
      runDoAiMoveWithFeedback({
        pushStageActionFeedback: input.pushStageActionFeedback,
        playMatchUiSfx: input.playMatchUiSfx,
        doAiMove: input.doAiMove,
      });
    },
  };
}

export function useMatchStageActionCallbacks(
  input: CreateMatchStageActionCallbacksInput,
): MatchStageActionCallbacks {
  const {
    doAiMove,
    enterFullscreenMessage,
    exitFullscreenMessage,
    isStageFocusRoute,
    isStageFullscreen,
    openReplay,
    playMatchUiSfx,
    pushStageActionFeedback,
    setFocusMode,
    setShowStageAssist,
    showStageControls,
    toggleStageControls,
    toggleStageFullscreen,
  } = input;

  return React.useMemo(
    () =>
      createMatchStageActionCallbacks({
        doAiMove,
        enterFullscreenMessage,
        exitFullscreenMessage,
        isStageFocusRoute,
        isStageFullscreen,
        openReplay,
        playMatchUiSfx,
        pushStageActionFeedback,
        setFocusMode,
        setShowStageAssist,
        showStageControls,
        toggleStageControls,
        toggleStageFullscreen,
      }),
    [
      doAiMove,
      enterFullscreenMessage,
      exitFullscreenMessage,
      isStageFocusRoute,
      isStageFullscreen,
      openReplay,
      playMatchUiSfx,
      pushStageActionFeedback,
      setFocusMode,
      setShowStageAssist,
      showStageControls,
      toggleStageControls,
      toggleStageFullscreen,
    ],
  );
}
