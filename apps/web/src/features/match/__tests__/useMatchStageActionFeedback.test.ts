import { describe, expect, it, vi } from "vitest";
import { createPushStageActionFeedback } from "@/features/match/useMatchStageActionFeedback";
import type { StageActionFeedbackTone } from "@/features/match/matchStageFeedback";

function createTimerStore() {
  let nextId = 1;
  const callbacks = new Map<number, () => void>();
  const clearTimeoutSpy = vi.fn((id: number) => {
    callbacks.delete(id);
  });
  const setTimeoutSpy = vi.fn((handler: () => void, _timeoutMs: number) => {
    const id = nextId++;
    callbacks.set(id, handler);
    return id;
  });
  return {
    callbacks,
    clearTimeoutSpy,
    setTimeoutSpy,
    timerApi: {
      clearTimeoutFn: (id: number) => clearTimeoutSpy(id),
      setTimeoutFn: (handler: () => void, timeoutMs: number) => setTimeoutSpy(handler, timeoutMs),
    },
  };
}

function createFeedbackState() {
  let message = "";
  let tone: StageActionFeedbackTone = "info";
  return {
    get message() {
      return message;
    },
    get tone() {
      return tone;
    },
    setStageActionFeedback(next: string) {
      message = next;
    },
    setStageActionFeedbackTone(next: StageActionFeedbackTone) {
      tone = next;
    },
  };
}

describe("features/match/useMatchStageActionFeedback", () => {
  it("does not push feedback outside stage-focus route", () => {
    const timer = createTimerStore();
    const state = createFeedbackState();
    const timerRef = { current: null as number | null };
    const push = createPushStageActionFeedback({
      isStageFocusRoute: false,
      timerRef,
      timerApi: timer.timerApi,
      setStageActionFeedback: state.setStageActionFeedback,
      setStageActionFeedbackTone: state.setStageActionFeedbackTone,
    });

    push("hidden", "warn");
    expect(state.message).toBe("");
    expect(state.tone).toBe("info");
    expect(timerRef.current).toBeNull();
    expect(timer.setTimeoutSpy).not.toHaveBeenCalled();
  });

  it("pushes feedback with default tone and clears after timeout", () => {
    const timer = createTimerStore();
    const state = createFeedbackState();
    const timerRef = { current: null as number | null };
    const push = createPushStageActionFeedback({
      isStageFocusRoute: true,
      timerRef,
      timerApi: timer.timerApi,
      setStageActionFeedback: state.setStageActionFeedback,
      setStageActionFeedbackTone: state.setStageActionFeedbackTone,
    });

    push("Opening replay");
    expect(state.message).toBe("Opening replay");
    expect(state.tone).toBe("info");
    expect(timerRef.current).toBe(1);

    timer.callbacks.get(1)?.();
    expect(state.message).toBe("");
    expect(state.tone).toBe("info");
    expect(timerRef.current).toBeNull();
  });
});
