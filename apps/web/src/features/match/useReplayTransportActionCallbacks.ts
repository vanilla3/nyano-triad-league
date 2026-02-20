import React from "react";
import type { SfxName } from "@/lib/sfx";
import type { ReplayStageActionFeedbackTone } from "@/features/match/replayStageActionCallbacks";

type PushStageActionFeedback = (
  message: string,
  tone?: ReplayStageActionFeedbackTone,
) => void;

export type ReplayTransportActionCallbacks = {
  jumpToStartWithFeedback: () => void;
  jumpToPrevStepWithFeedback: () => void;
  toggleReplayPlayWithFeedback: () => void;
  jumpToNextStepWithFeedback: () => void;
  jumpToEndWithFeedback: () => void;
  jumpToPrevHighlightWithFeedback: () => void;
  jumpToNextHighlightWithFeedback: () => void;
};

type CreateReplayTransportActionCallbacksInput = {
  canPlay: boolean;
  isPlaying: boolean;
  isStageFocus: boolean;
  stepMax: number;
  highlightsCount: number;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  jumpToPrevHighlight: () => void;
  jumpToNextHighlight: () => void;
  playReplaySfx: (name: SfxName) => void;
  pushStageActionFeedback: PushStageActionFeedback;
  jumpedToStartMessage: string;
  stepBackMessage: string;
  playStartMessage: string;
  playStopMessage: string;
  stepForwardMessage: string;
  jumpToEndMessage: string;
  prevHighlightMessage: string;
  nextHighlightMessage: string;
};

export function createReplayTransportActionCallbacks(
  input: CreateReplayTransportActionCallbacksInput,
): ReplayTransportActionCallbacks {
  return {
    jumpToStartWithFeedback: () => {
      input.setIsPlaying(false);
      input.setStep(0);
      input.playReplaySfx("card_place");
      if (input.isStageFocus) {
        input.pushStageActionFeedback(input.jumpedToStartMessage, "success");
      }
    },
    jumpToPrevStepWithFeedback: () => {
      input.setIsPlaying(false);
      input.setStep((s) => Math.max(0, s - 1));
      input.playReplaySfx("flip");
      if (input.isStageFocus) {
        input.pushStageActionFeedback(input.stepBackMessage);
      }
    },
    toggleReplayPlayWithFeedback: () => {
      if (!input.canPlay) return;
      const nextIsPlaying = !input.isPlaying;
      input.setIsPlaying(nextIsPlaying);
      input.playReplaySfx(nextIsPlaying ? "card_place" : "flip");
      if (input.isStageFocus) {
        input.pushStageActionFeedback(
          nextIsPlaying ? input.playStartMessage : input.playStopMessage,
          nextIsPlaying ? "success" : "info",
        );
      }
    },
    jumpToNextStepWithFeedback: () => {
      input.setIsPlaying(false);
      input.setStep((s) => Math.min(input.stepMax, s + 1));
      input.playReplaySfx("flip");
      if (input.isStageFocus) {
        input.pushStageActionFeedback(input.stepForwardMessage);
      }
    },
    jumpToEndWithFeedback: () => {
      input.setIsPlaying(false);
      input.setStep(input.stepMax);
      input.playReplaySfx("card_place");
      if (input.isStageFocus) {
        input.pushStageActionFeedback(input.jumpToEndMessage);
      }
    },
    jumpToPrevHighlightWithFeedback: () => {
      if (input.highlightsCount === 0) return;
      input.jumpToPrevHighlight();
      input.playReplaySfx("chain_flip");
      if (input.isStageFocus) {
        input.pushStageActionFeedback(input.prevHighlightMessage, "success");
      }
    },
    jumpToNextHighlightWithFeedback: () => {
      if (input.highlightsCount === 0) return;
      input.jumpToNextHighlight();
      input.playReplaySfx("chain_flip");
      if (input.isStageFocus) {
        input.pushStageActionFeedback(input.nextHighlightMessage, "success");
      }
    },
  };
}

export function useReplayTransportActionCallbacks(
  input: CreateReplayTransportActionCallbacksInput,
): ReplayTransportActionCallbacks {
  const {
    canPlay,
    isPlaying,
    isStageFocus,
    stepMax,
    highlightsCount,
    setIsPlaying,
    setStep,
    jumpToPrevHighlight,
    jumpToNextHighlight,
    playReplaySfx,
    pushStageActionFeedback,
    jumpedToStartMessage,
    stepBackMessage,
    playStartMessage,
    playStopMessage,
    stepForwardMessage,
    jumpToEndMessage,
    prevHighlightMessage,
    nextHighlightMessage,
  } = input;

  return React.useMemo(
    () =>
      createReplayTransportActionCallbacks({
        canPlay,
        isPlaying,
        isStageFocus,
        stepMax,
        highlightsCount,
        setIsPlaying,
        setStep,
        jumpToPrevHighlight,
        jumpToNextHighlight,
        playReplaySfx,
        pushStageActionFeedback,
        jumpedToStartMessage,
        stepBackMessage,
        playStartMessage,
        playStopMessage,
        stepForwardMessage,
        jumpToEndMessage,
        prevHighlightMessage,
        nextHighlightMessage,
      }),
    [
      canPlay,
      isPlaying,
      isStageFocus,
      stepMax,
      highlightsCount,
      setIsPlaying,
      setStep,
      jumpToPrevHighlight,
      jumpToNextHighlight,
      playReplaySfx,
      pushStageActionFeedback,
      jumpedToStartMessage,
      stepBackMessage,
      playStartMessage,
      playStopMessage,
      stepForwardMessage,
      jumpToEndMessage,
      prevHighlightMessage,
      nextHighlightMessage,
    ],
  );
}
