export type ReplayStageFocusShortcutAction =
  | "exit_focus"
  | "toggle_fullscreen"
  | "toggle_controls"
  | "toggle_setup"
  | "toggle_panels"
  | "prev_step"
  | "next_step"
  | "toggle_play"
  | "jump_start"
  | "jump_end"
  | "prev_highlight"
  | "next_highlight";

export type ReplayStageFocusShortcutResolution = {
  action: ReplayStageFocusShortcutAction;
  preventDefault: boolean;
};

export function resolveReplayStageFocusShortcut(input: {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  targetTagName?: string;
  targetIsContentEditable?: boolean;
  isStageFocus: boolean;
  canPlay: boolean;
}): ReplayStageFocusShortcutResolution | null {
  const tag = input.targetTagName?.toUpperCase();
  if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || input.targetIsContentEditable) return null;
  if (input.altKey || input.ctrlKey || input.metaKey) return null;

  const lower = input.key.toLowerCase();
  if (input.isStageFocus && input.key === "Escape") return { action: "exit_focus", preventDefault: true };
  if (input.isStageFocus && lower === "f") return { action: "toggle_fullscreen", preventDefault: true };
  if (input.isStageFocus && lower === "c") return { action: "toggle_controls", preventDefault: true };
  if (input.isStageFocus && lower === "s") return { action: "toggle_setup", preventDefault: true };
  if (input.isStageFocus && lower === "d") return { action: "toggle_panels", preventDefault: true };

  if (input.key === "ArrowLeft") return { action: "prev_step", preventDefault: false };
  if (input.key === "ArrowRight") return { action: "next_step", preventDefault: false };
  if (input.key === " ") {
    if (!input.canPlay) return null;
    return { action: "toggle_play", preventDefault: true };
  }
  if (input.key === "Home") return { action: "jump_start", preventDefault: true };
  if (input.key === "End") return { action: "jump_end", preventDefault: true };
  if (input.key === "[") return { action: "prev_highlight", preventDefault: true };
  if (input.key === "]") return { action: "next_highlight", preventDefault: true };
  return null;
}

export function runReplayStageFocusShortcutAction(input: {
  action: ReplayStageFocusShortcutAction;
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
}): void {
  switch (input.action) {
    case "exit_focus":
      input.exitFocusModeWithFeedback();
      return;
    case "toggle_fullscreen":
      input.toggleStageFullscreenWithFeedback();
      return;
    case "toggle_controls":
      input.toggleStageTransportWithFeedback();
      return;
    case "toggle_setup":
      input.toggleStageSetupWithFeedback();
      return;
    case "toggle_panels":
      input.toggleStagePanelsWithFeedback();
      return;
    case "prev_step":
      input.jumpToPrevStepWithFeedback();
      return;
    case "next_step":
      input.jumpToNextStepWithFeedback();
      return;
    case "toggle_play":
      input.toggleReplayPlayWithFeedback();
      return;
    case "jump_start":
      input.jumpToStartWithFeedback();
      return;
    case "jump_end":
      input.jumpToEndWithFeedback();
      return;
    case "prev_highlight":
      input.jumpToPrevHighlightWithFeedback();
      return;
    case "next_highlight":
      input.jumpToNextHighlightWithFeedback();
      return;
  }
}
