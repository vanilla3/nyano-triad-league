import React from "react";
import {
  clearStageActionFeedbackTimer,
  pushStageActionFeedbackWithTimeout,
  resetStageActionFeedbackState,
  type StageActionFeedbackTone,
} from "@/features/match/matchStageFeedback";

export function createPushStageActionFeedback(input: {
  isStageFocusRoute: boolean;
  timerRef: React.MutableRefObject<number | null>;
  setStageActionFeedback: (next: string) => void;
  setStageActionFeedbackTone: (next: StageActionFeedbackTone) => void;
  timerApi?: {
    setTimeoutFn: (handler: () => void, timeoutMs: number) => number;
    clearTimeoutFn: (timerId: number) => void;
  };
}): (message: string, tone?: StageActionFeedbackTone) => void {
  return (message, tone = "info") => {
    pushStageActionFeedbackWithTimeout({
      isStageFocusRoute: input.isStageFocusRoute,
      message,
      tone,
      timerRef: input.timerRef,
      timerApi: input.timerApi,
      setStageActionFeedback: input.setStageActionFeedback,
      setStageActionFeedbackTone: input.setStageActionFeedbackTone,
    });
  };
}

export function useMatchStageActionFeedback(input: {
  isStageFocusRoute: boolean;
}): {
  stageActionFeedback: string;
  stageActionFeedbackTone: StageActionFeedbackTone;
  pushStageActionFeedback: (message: string, tone?: StageActionFeedbackTone) => void;
} {
  const timerRef = React.useRef<number | null>(null);
  const [stageActionFeedback, setStageActionFeedback] = React.useState("");
  const [stageActionFeedbackTone, setStageActionFeedbackTone] = React.useState<StageActionFeedbackTone>("info");

  const pushStageActionFeedback = React.useMemo(
    () =>
      createPushStageActionFeedback({
        isStageFocusRoute: input.isStageFocusRoute,
        timerRef,
        setStageActionFeedback,
        setStageActionFeedbackTone,
      }),
    [input.isStageFocusRoute],
  );

  React.useEffect(() => {
    if (input.isStageFocusRoute) return;
    resetStageActionFeedbackState({
      setStageActionFeedback,
      setStageActionFeedbackTone,
    });
    clearStageActionFeedbackTimer(timerRef);
  }, [input.isStageFocusRoute]);

  React.useEffect(() => () => {
    clearStageActionFeedbackTimer(timerRef);
  }, []);

  return {
    stageActionFeedback,
    stageActionFeedbackTone,
    pushStageActionFeedback,
  };
}
