import React from "react";
import {
  resolveMatchStageFocusShortcutAction,
  runMatchStageFocusShortcutAction,
} from "@/features/match/matchStageFocusShortcuts";

type MatchStageFocusShortcutsWindowLike = {
  addEventListener: (type: "keydown", listener: (event: KeyboardEvent) => void) => void;
  removeEventListener: (type: "keydown", listener: (event: KeyboardEvent) => void) => void;
};

function getRuntimeWindow(): MatchStageFocusShortcutsWindowLike | null {
  if (typeof window === "undefined") return null;
  return window;
}

export type MatchStageFocusShortcutCallbacks = {
  exitFocusModeWithFeedback: () => void;
  toggleStageFullscreenWithFeedback: () => void;
  toggleStageControlsWithFeedback: () => void;
  toggleStageAssistWithFeedback: () => void;
  openReplayWithFeedback: () => void;
  commitMove: () => void;
  undoMove: () => void;
};

export function createMatchStageFocusKeydownHandler(input: {
  canFinalize: boolean;
  canCommitFromFocusToolbar: boolean;
  canUndoFromFocusToolbar: boolean;
  callbacks: MatchStageFocusShortcutCallbacks;
}): (event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey" | "target" | "preventDefault">) => void {
  return (event) => {
    const target = event.target as HTMLElement | null;
    const action = resolveMatchStageFocusShortcutAction({
      key: event.key,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      targetTagName: target?.tagName,
      targetIsContentEditable: target?.isContentEditable,
      canFinalize: input.canFinalize,
      canCommitFromFocusToolbar: input.canCommitFromFocusToolbar,
      canUndoFromFocusToolbar: input.canUndoFromFocusToolbar,
    });
    if (!action) return;
    event.preventDefault();
    runMatchStageFocusShortcutAction({
      action,
      ...input.callbacks,
    });
  };
}

export function useMatchStageFocusShortcuts(input: {
  isStageFocusRoute: boolean;
  canFinalize: boolean;
  canCommitFromFocusToolbar: boolean;
  canUndoFromFocusToolbar: boolean;
  exitFocusModeWithFeedback: () => void;
  toggleStageFullscreenWithFeedback: () => void;
  toggleStageControlsWithFeedback: () => void;
  toggleStageAssistWithFeedback: () => void;
  openReplayWithFeedback: () => void;
  commitMove: () => void;
  undoMove: () => void;
  deps?: {
    getWindow?: () => MatchStageFocusShortcutsWindowLike | null;
  };
}): void {
  const getWindow = input.deps?.getWindow ?? getRuntimeWindow;
  const onKeyDown = React.useMemo(
    () =>
      createMatchStageFocusKeydownHandler({
        canFinalize: input.canFinalize,
        canCommitFromFocusToolbar: input.canCommitFromFocusToolbar,
        canUndoFromFocusToolbar: input.canUndoFromFocusToolbar,
        callbacks: {
          exitFocusModeWithFeedback: input.exitFocusModeWithFeedback,
          toggleStageFullscreenWithFeedback: input.toggleStageFullscreenWithFeedback,
          toggleStageControlsWithFeedback: input.toggleStageControlsWithFeedback,
          toggleStageAssistWithFeedback: input.toggleStageAssistWithFeedback,
          openReplayWithFeedback: input.openReplayWithFeedback,
          commitMove: input.commitMove,
          undoMove: input.undoMove,
        },
      }),
    [
      input.canCommitFromFocusToolbar,
      input.canFinalize,
      input.canUndoFromFocusToolbar,
      input.exitFocusModeWithFeedback,
      input.toggleStageFullscreenWithFeedback,
      input.toggleStageControlsWithFeedback,
      input.toggleStageAssistWithFeedback,
      input.openReplayWithFeedback,
      input.commitMove,
      input.undoMove,
    ],
  );

  React.useEffect(() => {
    if (!input.isStageFocusRoute) return;
    const windowLike = getWindow();
    if (!windowLike) return;
    const listener = onKeyDown as (event: KeyboardEvent) => void;
    windowLike.addEventListener("keydown", listener);
    return () => windowLike.removeEventListener("keydown", listener);
  }, [getWindow, input.isStageFocusRoute, onKeyDown]);
}
