import React from "react";
import type { SfxName } from "@/lib/sfx";
import {
  runReplayExitFocusModeWithFeedback,
  runReplayToggleStageFullscreenWithFeedback,
  runReplayToggleStagePanelsWithFeedback,
  runReplayToggleStageSetupWithFeedback,
  runReplayToggleStageTransportWithFeedback,
  type ReplayStageActionFeedbackTone,
} from "@/features/match/replayStageActionCallbacks";

type PushStageActionFeedback = (
  message: string,
  tone?: ReplayStageActionFeedbackTone,
) => void;

export type ReplayStageActionCallbacks = {
  toggleStageFullscreenWithFeedback: () => void;
  toggleStageTransportWithFeedback: () => void;
  toggleStageSetupWithFeedback: () => void;
  toggleStagePanelsWithFeedback: () => void;
  exitFocusModeWithFeedback: () => void;
};

type CreateReplayStageActionCallbacksInput = {
  isStageFocus: boolean;
  isStageFullscreen: boolean;
  showStageTransport: boolean;
  pushStageActionFeedback: PushStageActionFeedback;
  playReplaySfx: (name: SfxName) => void;
  toggleStageFullscreen: () => void | Promise<void>;
  toggleStageTransport: () => void;
  setShowStageSetup: React.Dispatch<React.SetStateAction<boolean>>;
  setShowStagePanels: React.Dispatch<React.SetStateAction<boolean>>;
  setFocusMode: (next: boolean) => void;
  enterFullscreenMessage: string;
  exitFullscreenMessage: string;
  hideControlsMessage: string;
  showControlsMessage: string;
  setupShownMessage: string;
  setupHiddenMessage: string;
  panelsShownMessage: string;
  panelsHiddenMessage: string;
  exitFocusMessage: string;
};

export function createReplayStageActionCallbacks(
  input: CreateReplayStageActionCallbacksInput,
): ReplayStageActionCallbacks {
  return {
    toggleStageFullscreenWithFeedback: () => {
      runReplayToggleStageFullscreenWithFeedback({
        isStageFullscreen: input.isStageFullscreen,
        exitFullscreenMessage: input.exitFullscreenMessage,
        enterFullscreenMessage: input.enterFullscreenMessage,
        pushStageActionFeedback: input.pushStageActionFeedback,
        playReplaySfx: input.playReplaySfx,
        toggleStageFullscreen: input.toggleStageFullscreen,
      });
    },
    toggleStageTransportWithFeedback: () => {
      runReplayToggleStageTransportWithFeedback({
        showStageTransport: input.showStageTransport,
        hideControlsMessage: input.hideControlsMessage,
        showControlsMessage: input.showControlsMessage,
        pushStageActionFeedback: input.pushStageActionFeedback,
        playReplaySfx: input.playReplaySfx,
        toggleStageTransport: input.toggleStageTransport,
      });
    },
    toggleStageSetupWithFeedback: () => {
      input.setShowStageSetup((prev) => {
        const next = !prev;
        runReplayToggleStageSetupWithFeedback({
          isStageFocus: input.isStageFocus,
          nextShowStageSetup: next,
          setupShownMessage: input.setupShownMessage,
          setupHiddenMessage: input.setupHiddenMessage,
          pushStageActionFeedback: input.pushStageActionFeedback,
          playReplaySfx: input.playReplaySfx,
        });
        return next;
      });
    },
    toggleStagePanelsWithFeedback: () => {
      input.setShowStagePanels((prev) => {
        const next = !prev;
        runReplayToggleStagePanelsWithFeedback({
          isStageFocus: input.isStageFocus,
          nextShowStagePanels: next,
          panelsShownMessage: input.panelsShownMessage,
          panelsHiddenMessage: input.panelsHiddenMessage,
          pushStageActionFeedback: input.pushStageActionFeedback,
          playReplaySfx: input.playReplaySfx,
        });
        return next;
      });
    },
    exitFocusModeWithFeedback: () => {
      runReplayExitFocusModeWithFeedback({
        exitFocusMessage: input.exitFocusMessage,
        pushStageActionFeedback: input.pushStageActionFeedback,
        setFocusMode: input.setFocusMode,
      });
    },
  };
}

export function useReplayStageActionCallbacks(
  input: CreateReplayStageActionCallbacksInput,
): ReplayStageActionCallbacks {
  const {
    enterFullscreenMessage,
    exitFocusMessage,
    exitFullscreenMessage,
    hideControlsMessage,
    isStageFocus,
    isStageFullscreen,
    panelsHiddenMessage,
    panelsShownMessage,
    playReplaySfx,
    pushStageActionFeedback,
    setFocusMode,
    setShowStagePanels,
    setShowStageSetup,
    setupHiddenMessage,
    setupShownMessage,
    showControlsMessage,
    showStageTransport,
    toggleStageFullscreen,
    toggleStageTransport,
  } = input;

  return React.useMemo(
    () =>
      createReplayStageActionCallbacks({
        enterFullscreenMessage,
        exitFocusMessage,
        exitFullscreenMessage,
        hideControlsMessage,
        isStageFocus,
        isStageFullscreen,
        panelsHiddenMessage,
        panelsShownMessage,
        playReplaySfx,
        pushStageActionFeedback,
        setFocusMode,
        setShowStagePanels,
        setShowStageSetup,
        setupHiddenMessage,
        setupShownMessage,
        showControlsMessage,
        showStageTransport,
        toggleStageFullscreen,
        toggleStageTransport,
      }),
    [
      enterFullscreenMessage,
      exitFocusMessage,
      exitFullscreenMessage,
      hideControlsMessage,
      isStageFocus,
      isStageFullscreen,
      panelsHiddenMessage,
      panelsShownMessage,
      playReplaySfx,
      pushStageActionFeedback,
      setFocusMode,
      setShowStagePanels,
      setShowStageSetup,
      setupHiddenMessage,
      setupShownMessage,
      showControlsMessage,
      showStageTransport,
      toggleStageFullscreen,
      toggleStageTransport,
    ],
  );
}
