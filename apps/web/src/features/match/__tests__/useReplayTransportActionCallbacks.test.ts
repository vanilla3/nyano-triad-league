import type React from "react";
import { describe, expect, it } from "vitest";
import {
  createReplayTransportActionCallbacks,
} from "@/features/match/useReplayTransportActionCallbacks";
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

function createStateSetter<T>(initial: T) {
  let value = initial;
  const setState: React.Dispatch<React.SetStateAction<T>> = (next) => {
    value = typeof next === "function" ? (next as (prev: T) => T)(value) : next;
  };
  return {
    get value() {
      return value;
    },
    setState,
  };
}

const messages = {
  jumpedToStartMessage: "jumped to start",
  stepBackMessage: "step back",
  playStartMessage: "play start",
  playStopMessage: "play stop",
  stepForwardMessage: "step forward",
  jumpToEndMessage: "jump to end",
  prevHighlightMessage: "prev highlight",
  nextHighlightMessage: "next highlight",
};

describe("features/match/useReplayTransportActionCallbacks", () => {
  it("runs start/step/end controls with stage-focus feedback", () => {
    const feedback = createFeedbackDeps();
    const playingState = createStateSetter(true);
    const stepState = createStateSetter(3);
    const callbacks = createReplayTransportActionCallbacks({
      canPlay: true,
      isPlaying: false,
      isStageFocus: true,
      stepMax: 9,
      highlightsCount: 2,
      setIsPlaying: playingState.setState,
      setStep: stepState.setState,
      jumpToPrevHighlight: () => undefined,
      jumpToNextHighlight: () => undefined,
      playReplaySfx: feedback.playReplaySfx,
      pushStageActionFeedback: feedback.pushStageActionFeedback,
      ...messages,
    });

    callbacks.jumpToStartWithFeedback();
    expect(playingState.value).toBe(false);
    expect(stepState.value).toBe(0);

    callbacks.jumpToPrevStepWithFeedback();
    expect(stepState.value).toBe(0);

    callbacks.jumpToNextStepWithFeedback();
    expect(stepState.value).toBe(1);

    callbacks.jumpToEndWithFeedback();
    expect(stepState.value).toBe(9);

    expect(feedback.events).toEqual([
      { type: "sfx", value: "card_place" },
      { type: "feedback", value: "jumped to start", tone: "success" },
      { type: "sfx", value: "flip" },
      { type: "feedback", value: "step back", tone: undefined },
      { type: "sfx", value: "flip" },
      { type: "feedback", value: "step forward", tone: undefined },
      { type: "sfx", value: "card_place" },
      { type: "feedback", value: "jump to end", tone: undefined },
    ]);
  });

  it("toggles play only when canPlay and emits matching feedback tone", () => {
    const feedback = createFeedbackDeps();
    const playingState = createStateSetter(false);
    const stepState = createStateSetter(0);
    const cannotPlay = createReplayTransportActionCallbacks({
      canPlay: false,
      isPlaying: false,
      isStageFocus: true,
      stepMax: 9,
      highlightsCount: 0,
      setIsPlaying: playingState.setState,
      setStep: stepState.setState,
      jumpToPrevHighlight: () => undefined,
      jumpToNextHighlight: () => undefined,
      playReplaySfx: feedback.playReplaySfx,
      pushStageActionFeedback: feedback.pushStageActionFeedback,
      ...messages,
    });
    cannotPlay.toggleReplayPlayWithFeedback();
    expect(playingState.value).toBe(false);
    expect(feedback.events).toEqual([]);

    const canPlayStart = createReplayTransportActionCallbacks({
      canPlay: true,
      isPlaying: false,
      isStageFocus: true,
      stepMax: 9,
      highlightsCount: 0,
      setIsPlaying: playingState.setState,
      setStep: stepState.setState,
      jumpToPrevHighlight: () => undefined,
      jumpToNextHighlight: () => undefined,
      playReplaySfx: feedback.playReplaySfx,
      pushStageActionFeedback: feedback.pushStageActionFeedback,
      ...messages,
    });
    canPlayStart.toggleReplayPlayWithFeedback();
    expect(playingState.value).toBe(true);

    const canPlayStop = createReplayTransportActionCallbacks({
      canPlay: true,
      isPlaying: true,
      isStageFocus: true,
      stepMax: 9,
      highlightsCount: 0,
      setIsPlaying: playingState.setState,
      setStep: stepState.setState,
      jumpToPrevHighlight: () => undefined,
      jumpToNextHighlight: () => undefined,
      playReplaySfx: feedback.playReplaySfx,
      pushStageActionFeedback: feedback.pushStageActionFeedback,
      ...messages,
    });
    canPlayStop.toggleReplayPlayWithFeedback();
    expect(playingState.value).toBe(false);

    expect(feedback.events).toEqual([
      { type: "sfx", value: "card_place" },
      { type: "feedback", value: "play start", tone: "success" },
      { type: "sfx", value: "flip" },
      { type: "feedback", value: "play stop", tone: "info" },
    ]);
  });

  it("runs highlight jump callbacks only when highlights exist", () => {
    const feedback = createFeedbackDeps();
    const playingState = createStateSetter(false);
    const stepState = createStateSetter(0);
    const calls = { prev: 0, next: 0 };

    const noHighlights = createReplayTransportActionCallbacks({
      canPlay: true,
      isPlaying: false,
      isStageFocus: true,
      stepMax: 9,
      highlightsCount: 0,
      setIsPlaying: playingState.setState,
      setStep: stepState.setState,
      jumpToPrevHighlight: () => {
        calls.prev += 1;
      },
      jumpToNextHighlight: () => {
        calls.next += 1;
      },
      playReplaySfx: feedback.playReplaySfx,
      pushStageActionFeedback: feedback.pushStageActionFeedback,
      ...messages,
    });
    noHighlights.jumpToPrevHighlightWithFeedback();
    noHighlights.jumpToNextHighlightWithFeedback();
    expect(calls).toEqual({ prev: 0, next: 0 });
    expect(feedback.events).toEqual([]);

    const withHighlights = createReplayTransportActionCallbacks({
      canPlay: true,
      isPlaying: false,
      isStageFocus: true,
      stepMax: 9,
      highlightsCount: 2,
      setIsPlaying: playingState.setState,
      setStep: stepState.setState,
      jumpToPrevHighlight: () => {
        calls.prev += 1;
      },
      jumpToNextHighlight: () => {
        calls.next += 1;
      },
      playReplaySfx: feedback.playReplaySfx,
      pushStageActionFeedback: feedback.pushStageActionFeedback,
      ...messages,
    });
    withHighlights.jumpToPrevHighlightWithFeedback();
    withHighlights.jumpToNextHighlightWithFeedback();

    expect(calls).toEqual({ prev: 1, next: 1 });
    expect(feedback.events).toEqual([
      { type: "sfx", value: "chain_flip" },
      { type: "feedback", value: "prev highlight", tone: "success" },
      { type: "sfx", value: "chain_flip" },
      { type: "feedback", value: "next highlight", tone: "success" },
    ]);
  });
});