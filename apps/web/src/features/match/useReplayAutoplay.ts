import React from "react";
import { nextReplayAutoplayStep, normalizeReplayPlaybackSpeed } from "@/lib/replay_timeline";

export function resolveReplayAutoplayIntervalMs(playbackSpeed: number): number {
  return 1000 / normalizeReplayPlaybackSpeed(playbackSpeed);
}

export function resolveReplayAutoplayAdvance(input: {
  currentStep: number;
  stepMax: number;
}): {
  nextStep: number;
  shouldStopPlaying: boolean;
} {
  const next = nextReplayAutoplayStep(input.currentStep, input.stepMax);
  if (next === null) {
    return { nextStep: input.currentStep, shouldStopPlaying: true };
  }
  return { nextStep: next, shouldStopPlaying: false };
}

export function useReplayAutoplay(input: {
  isPlaying: boolean;
  simOk: boolean;
  canPlay: boolean;
  playbackSpeed: number;
  stepMax: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { isPlaying, simOk, canPlay, playbackSpeed, stepMax, setStep, setIsPlaying } = input;

  React.useEffect(() => {
    if (!isPlaying || !simOk || !canPlay) return;
    const timer = window.setInterval(() => {
      setStep((currentStep) => {
        const next = resolveReplayAutoplayAdvance({
          currentStep,
          stepMax,
        });
        if (next.shouldStopPlaying) {
          setIsPlaying(false);
        }
        return next.nextStep;
      });
    }, resolveReplayAutoplayIntervalMs(playbackSpeed));
    return () => window.clearInterval(timer);
  }, [isPlaying, playbackSpeed, stepMax, simOk, canPlay, setStep, setIsPlaying]);
}
