import React from "react";
import {
  resolveReplayStageFocusShortcut,
  runReplayStageFocusShortcutAction,
} from "@/features/match/replayStageFocusShortcuts";

type ReplayStageFocusShortcutsWindowLike = {
  addEventListener: (type: "keydown", listener: (event: KeyboardEvent) => void) => void;
  removeEventListener: (type: "keydown", listener: (event: KeyboardEvent) => void) => void;
};

function getRuntimeWindow(): ReplayStageFocusShortcutsWindowLike | null {
  if (typeof window === "undefined") return null;
  return window;
}

export type ReplayStageFocusShortcutCallbacks = {
  exitFocusModeWithFeedback: () => void;
  toggleStageFullscreenWithFeedback: () => void;
  toggleStageTransportWithFeedback: () => void;
  toggleStageSetupWithFeedback: () => void;
  toggleStagePanelsWithFeedback: () => void;
  jumpToPrevStepWithFeedback: () => void;
  jumpToNextStepWithFeedback: () => void;
  toggleReplayPlayWithFeedback: () => void;
  jumpToStartWithFeedback: () => void;
  jumpToEndWithFeedback: () => void;
  jumpToPrevHighlightWithFeedback: () => void;
  jumpToNextHighlightWithFeedback: () => void;
};

export function createReplayStageFocusKeydownHandler(input: {
  isStageFocus: boolean;
  canPlay: boolean;
  callbacks: ReplayStageFocusShortcutCallbacks;
}): (event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey" | "target" | "preventDefault">) => void {
  return (event) => {
    const target = event.target as HTMLElement | null;
    const resolution = resolveReplayStageFocusShortcut({
      key: event.key,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      targetTagName: target?.tagName,
      targetIsContentEditable: target?.isContentEditable,
      isStageFocus: input.isStageFocus,
      canPlay: input.canPlay,
    });
    if (!resolution) return;
    if (resolution.preventDefault) {
      event.preventDefault();
    }
    runReplayStageFocusShortcutAction({
      action: resolution.action,
      ...input.callbacks,
    });
  };
}

export function useReplayStageFocusShortcuts(input: {
  isStageFocus: boolean;
  canPlay: boolean;
  exitFocusModeWithFeedback: () => void;
  toggleStageFullscreenWithFeedback: () => void;
  toggleStageTransportWithFeedback: () => void;
  toggleStageSetupWithFeedback: () => void;
  toggleStagePanelsWithFeedback: () => void;
  jumpToPrevStepWithFeedback: () => void;
  jumpToNextStepWithFeedback: () => void;
  toggleReplayPlayWithFeedback: () => void;
  jumpToStartWithFeedback: () => void;
  jumpToEndWithFeedback: () => void;
  jumpToPrevHighlightWithFeedback: () => void;
  jumpToNextHighlightWithFeedback: () => void;
  deps?: {
    getWindow?: () => ReplayStageFocusShortcutsWindowLike | null;
  };
}): void {
  const getWindow = input.deps?.getWindow ?? getRuntimeWindow;
  const onKeyDown = React.useMemo(
    () =>
      createReplayStageFocusKeydownHandler({
        isStageFocus: input.isStageFocus,
        canPlay: input.canPlay,
        callbacks: {
          exitFocusModeWithFeedback: input.exitFocusModeWithFeedback,
          toggleStageFullscreenWithFeedback: input.toggleStageFullscreenWithFeedback,
          toggleStageTransportWithFeedback: input.toggleStageTransportWithFeedback,
          toggleStageSetupWithFeedback: input.toggleStageSetupWithFeedback,
          toggleStagePanelsWithFeedback: input.toggleStagePanelsWithFeedback,
          jumpToPrevStepWithFeedback: input.jumpToPrevStepWithFeedback,
          jumpToNextStepWithFeedback: input.jumpToNextStepWithFeedback,
          toggleReplayPlayWithFeedback: input.toggleReplayPlayWithFeedback,
          jumpToStartWithFeedback: input.jumpToStartWithFeedback,
          jumpToEndWithFeedback: input.jumpToEndWithFeedback,
          jumpToPrevHighlightWithFeedback: input.jumpToPrevHighlightWithFeedback,
          jumpToNextHighlightWithFeedback: input.jumpToNextHighlightWithFeedback,
        },
      }),
    [
      input.canPlay,
      input.isStageFocus,
      input.exitFocusModeWithFeedback,
      input.toggleStageFullscreenWithFeedback,
      input.toggleStageTransportWithFeedback,
      input.toggleStageSetupWithFeedback,
      input.toggleStagePanelsWithFeedback,
      input.jumpToPrevStepWithFeedback,
      input.jumpToNextStepWithFeedback,
      input.toggleReplayPlayWithFeedback,
      input.jumpToStartWithFeedback,
      input.jumpToEndWithFeedback,
      input.jumpToPrevHighlightWithFeedback,
      input.jumpToNextHighlightWithFeedback,
    ],
  );

  React.useEffect(() => {
    const windowLike = getWindow();
    if (!windowLike) return;
    const listener = onKeyDown as (event: KeyboardEvent) => void;
    windowLike.addEventListener("keydown", listener);
    return () => windowLike.removeEventListener("keydown", listener);
  }, [getWindow, onKeyDown]);
}
