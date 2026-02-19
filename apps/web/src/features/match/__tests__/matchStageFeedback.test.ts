import { describe, expect, it, vi } from "vitest";
import {
  clearStageActionFeedbackTimer,
  pushStageActionFeedbackWithTimeout,
  resetStageActionFeedbackState,
  type StageActionFeedbackTone,
} from "@/features/match/matchStageFeedback";

type TimerStore = {
  callbacks: Map<number, () => void>;
  clearTimeoutSpy: ReturnType<typeof vi.fn>;
  setTimeoutSpy: ReturnType<typeof vi.fn>;
  timerApi: {
    clearTimeoutFn: (timerId: number) => void;
    setTimeoutFn: (handler: () => void, timeoutMs: number) => number;
  };
};

function createTimerStore(): TimerStore {
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
      clearTimeoutFn: (timerId) => clearTimeoutSpy(timerId),
      setTimeoutFn: (handler, timeoutMs) => setTimeoutSpy(handler, timeoutMs),
    },
  };
}

function createFeedbackState() {
  const log: Array<{ message: string; tone: StageActionFeedbackTone }> = [];
  let message = "";
  let tone: StageActionFeedbackTone = "info";
  return {
    get message() {
      return message;
    },
    get tone() {
      return tone;
    },
    log,
    setStageActionFeedback(next: string) {
      message = next;
      log.push({ message, tone });
    },
    setStageActionFeedbackTone(next: StageActionFeedbackTone) {
      tone = next;
      log.push({ message, tone });
    },
  };
}

describe("features/match/matchStageFeedback", () => {
  it("ignores push when not in stage focus route", () => {
    const timer = createTimerStore();
    const state = createFeedbackState();
    const timerRef = { current: null as number | null };
    pushStageActionFeedbackWithTimeout({
      isStageFocusRoute: false,
      message: "hidden",
      tone: "warn",
      timerRef,
      timerApi: timer.timerApi,
      setStageActionFeedback: state.setStageActionFeedback,
      setStageActionFeedbackTone: state.setStageActionFeedbackTone,
    });
    expect(state.message).toBe("");
    expect(state.tone).toBe("info");
    expect(timerRef.current).toBeNull();
    expect(timer.setTimeoutSpy).not.toHaveBeenCalled();
  });

  it("pushes feedback and resets after timeout callback", () => {
    const timer = createTimerStore();
    const state = createFeedbackState();
    const timerRef = { current: null as number | null };
    pushStageActionFeedbackWithTimeout({
      isStageFocusRoute: true,
      message: "Opening replay",
      tone: "warn",
      timerRef,
      timerApi: timer.timerApi,
      setStageActionFeedback: state.setStageActionFeedback,
      setStageActionFeedbackTone: state.setStageActionFeedbackTone,
    });
    expect(state.message).toBe("Opening replay");
    expect(state.tone).toBe("warn");
    expect(timerRef.current).toBe(1);

    timer.callbacks.get(1)?.();
    expect(state.message).toBe("");
    expect(state.tone).toBe("info");
    expect(timerRef.current).toBeNull();
  });

  it("clears previous timeout before scheduling the next feedback", () => {
    const timer = createTimerStore();
    const state = createFeedbackState();
    const timerRef = { current: null as number | null };
    pushStageActionFeedbackWithTimeout({
      isStageFocusRoute: true,
      message: "first",
      timerRef,
      timerApi: timer.timerApi,
      setStageActionFeedback: state.setStageActionFeedback,
      setStageActionFeedbackTone: state.setStageActionFeedbackTone,
    });
    expect(timerRef.current).toBe(1);

    pushStageActionFeedbackWithTimeout({
      isStageFocusRoute: true,
      message: "second",
      timerRef,
      timerApi: timer.timerApi,
      setStageActionFeedback: state.setStageActionFeedback,
      setStageActionFeedbackTone: state.setStageActionFeedbackTone,
    });
    expect(timer.clearTimeoutSpy).toHaveBeenCalledWith(1);
    expect(timerRef.current).toBe(2);
    expect(state.message).toBe("second");
  });

  it("clears timer ref and active timer", () => {
    const timer = createTimerStore();
    const timerRef = { current: 9 };
    clearStageActionFeedbackTimer(timerRef, timer.timerApi);
    expect(timer.clearTimeoutSpy).toHaveBeenCalledWith(9);
    expect(timerRef.current).toBeNull();
  });

  it("resets feedback state to default", () => {
    const state = createFeedbackState();
    state.setStageActionFeedback("status");
    state.setStageActionFeedbackTone("success");
    resetStageActionFeedbackState({
      setStageActionFeedback: state.setStageActionFeedback,
      setStageActionFeedbackTone: state.setStageActionFeedbackTone,
    });
    expect(state.message).toBe("");
    expect(state.tone).toBe("info");
  });
});
