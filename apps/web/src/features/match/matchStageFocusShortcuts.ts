export type MatchStageFocusShortcutAction =
  | "exit_focus"
  | "toggle_fullscreen"
  | "toggle_controls"
  | "toggle_assist"
  | "open_replay"
  | "commit_move"
  | "undo_move";

export function resolveMatchStageFocusShortcutAction(input: {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  targetTagName?: string;
  targetIsContentEditable?: boolean;
  canFinalize: boolean;
  canCommitFromFocusToolbar: boolean;
  canUndoFromFocusToolbar: boolean;
}): MatchStageFocusShortcutAction | null {
  const tag = input.targetTagName?.toUpperCase();
  if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || input.targetIsContentEditable) return null;
  if (input.altKey || input.ctrlKey || input.metaKey) return null;

  const lower = input.key.toLowerCase();
  if (input.key === "Escape") return "exit_focus";
  if (lower === "f") return "toggle_fullscreen";
  if (lower === "c") return "toggle_controls";
  if (lower === "h") return "toggle_assist";
  if (lower === "r" && input.canFinalize) return "open_replay";
  if (input.key === "Enter" && input.canCommitFromFocusToolbar) return "commit_move";
  if (input.key === "Backspace" && input.canUndoFromFocusToolbar) return "undo_move";
  return null;
}

export function runMatchStageFocusShortcutAction(input: {
  action: MatchStageFocusShortcutAction;
  exitFocusModeWithFeedback: () => void;
  toggleStageFullscreenWithFeedback: () => void;
  toggleStageControlsWithFeedback: () => void;
  toggleStageAssistWithFeedback: () => void;
  openReplayWithFeedback: () => void;
  commitMove: () => void;
  undoMove: () => void;
}): void {
  switch (input.action) {
    case "exit_focus":
      input.exitFocusModeWithFeedback();
      return;
    case "toggle_fullscreen":
      input.toggleStageFullscreenWithFeedback();
      return;
    case "toggle_controls":
      input.toggleStageControlsWithFeedback();
      return;
    case "toggle_assist":
      input.toggleStageAssistWithFeedback();
      return;
    case "open_replay":
      input.openReplayWithFeedback();
      return;
    case "commit_move":
      input.commitMove();
      return;
    case "undo_move":
      input.undoMove();
      return;
  }
}
