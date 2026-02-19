export type StageActionFeedbackTone = "info" | "success" | "warn";

export type StageActionFeedbackTimerRef = { current: number | null };

type StageActionFeedbackTimerApi = {
  clearTimeoutFn: (timerId: number) => void;
  setTimeoutFn: (handler: () => void, timeoutMs: number) => number;
};

type StageActionFeedbackSetters = {
  setStageActionFeedback: (message: string) => void;
  setStageActionFeedbackTone: (tone: StageActionFeedbackTone) => void;
};

const DEFAULT_STAGE_ACTION_FEEDBACK_TIMEOUT_MS = 1800;

function resolveStageActionFeedbackTimerApi(
  timerApi?: StageActionFeedbackTimerApi,
): StageActionFeedbackTimerApi | null {
  if (timerApi) return timerApi;
  if (typeof window === "undefined") return null;
  return {
    clearTimeoutFn: (timerId) => window.clearTimeout(timerId),
    setTimeoutFn: (handler, timeoutMs) => window.setTimeout(handler, timeoutMs),
  };
}

export function clearStageActionFeedbackTimer(
  timerRef: StageActionFeedbackTimerRef,
  timerApi?: StageActionFeedbackTimerApi,
): void {
  const api = resolveStageActionFeedbackTimerApi(timerApi);
  if (!api) {
    timerRef.current = null;
    return;
  }
  if (timerRef.current === null) return;
  api.clearTimeoutFn(timerRef.current);
  timerRef.current = null;
}

export function resetStageActionFeedbackState(
  setters: StageActionFeedbackSetters,
): void {
  setters.setStageActionFeedback("");
  setters.setStageActionFeedbackTone("info");
}

export function pushStageActionFeedbackWithTimeout(input: {
  isStageFocusRoute: boolean;
  message: string;
  tone?: StageActionFeedbackTone;
  timerRef: StageActionFeedbackTimerRef;
  timeoutMs?: number;
  timerApi?: StageActionFeedbackTimerApi;
} & StageActionFeedbackSetters): void {
  if (!input.isStageFocusRoute) return;
  const tone = input.tone ?? "info";
  input.setStageActionFeedback(input.message);
  input.setStageActionFeedbackTone(tone);

  const api = resolveStageActionFeedbackTimerApi(input.timerApi);
  if (!api) return;

  clearStageActionFeedbackTimer(input.timerRef, api);
  input.timerRef.current = api.setTimeoutFn(() => {
    input.timerRef.current = null;
    resetStageActionFeedbackState(input);
  }, input.timeoutMs ?? DEFAULT_STAGE_ACTION_FEEDBACK_TIMEOUT_MS);
}
