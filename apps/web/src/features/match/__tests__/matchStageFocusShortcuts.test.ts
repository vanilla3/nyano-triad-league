import { describe, expect, it, vi } from "vitest";
import {
  resolveMatchStageFocusShortcutAction,
  runMatchStageFocusShortcutAction,
  type MatchStageFocusShortcutAction,
} from "@/features/match/matchStageFocusShortcuts";

function resolveAction(
  input: Partial<Parameters<typeof resolveMatchStageFocusShortcutAction>[0]>,
): MatchStageFocusShortcutAction | null {
  return resolveMatchStageFocusShortcutAction({
    key: "",
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    targetTagName: undefined,
    targetIsContentEditable: false,
    canFinalize: false,
    canCommitFromFocusToolbar: false,
    canUndoFromFocusToolbar: false,
    ...input,
  });
}

describe("features/match/matchStageFocusShortcuts", () => {
  it("ignores shortcuts for editable targets or modifier keys", () => {
    expect(resolveAction({ key: "Escape", targetTagName: "INPUT" })).toBeNull();
    expect(resolveAction({ key: "Escape", targetTagName: "textarea" })).toBeNull();
    expect(resolveAction({ key: "Escape", targetIsContentEditable: true })).toBeNull();
    expect(resolveAction({ key: "Escape", altKey: true })).toBeNull();
    expect(resolveAction({ key: "Escape", ctrlKey: true })).toBeNull();
    expect(resolveAction({ key: "Escape", metaKey: true })).toBeNull();
  });

  it("resolves base stage-focus shortcuts", () => {
    expect(resolveAction({ key: "Escape" })).toBe("exit_focus");
    expect(resolveAction({ key: "f" })).toBe("toggle_fullscreen");
    expect(resolveAction({ key: "C" })).toBe("toggle_controls");
    expect(resolveAction({ key: "H" })).toBe("toggle_assist");
  });

  it("resolves guarded shortcuts only when conditions are met", () => {
    expect(resolveAction({ key: "r", canFinalize: false })).toBeNull();
    expect(resolveAction({ key: "r", canFinalize: true })).toBe("open_replay");
    expect(resolveAction({ key: "Enter", canCommitFromFocusToolbar: false })).toBeNull();
    expect(resolveAction({ key: "Enter", canCommitFromFocusToolbar: true })).toBe("commit_move");
    expect(resolveAction({ key: "Backspace", canUndoFromFocusToolbar: false })).toBeNull();
    expect(resolveAction({ key: "Backspace", canUndoFromFocusToolbar: true })).toBe("undo_move");
  });

  it("dispatches resolved actions to matching callbacks", () => {
    const exitFocusModeWithFeedback = vi.fn();
    const toggleStageFullscreenWithFeedback = vi.fn();
    const toggleStageControlsWithFeedback = vi.fn();
    const toggleStageAssistWithFeedback = vi.fn();
    const openReplayWithFeedback = vi.fn();
    const commitMove = vi.fn();
    const undoMove = vi.fn();

    runMatchStageFocusShortcutAction({
      action: "toggle_controls",
      exitFocusModeWithFeedback,
      toggleStageFullscreenWithFeedback,
      toggleStageControlsWithFeedback,
      toggleStageAssistWithFeedback,
      openReplayWithFeedback,
      commitMove,
      undoMove,
    });
    expect(toggleStageControlsWithFeedback).toHaveBeenCalledTimes(1);

    runMatchStageFocusShortcutAction({
      action: "open_replay",
      exitFocusModeWithFeedback,
      toggleStageFullscreenWithFeedback,
      toggleStageControlsWithFeedback,
      toggleStageAssistWithFeedback,
      openReplayWithFeedback,
      commitMove,
      undoMove,
    });
    expect(openReplayWithFeedback).toHaveBeenCalledTimes(1);

    runMatchStageFocusShortcutAction({
      action: "undo_move",
      exitFocusModeWithFeedback,
      toggleStageFullscreenWithFeedback,
      toggleStageControlsWithFeedback,
      toggleStageAssistWithFeedback,
      openReplayWithFeedback,
      commitMove,
      undoMove,
    });
    expect(undoMove).toHaveBeenCalledTimes(1);
    expect(exitFocusModeWithFeedback).not.toHaveBeenCalled();
    expect(toggleStageFullscreenWithFeedback).not.toHaveBeenCalled();
    expect(toggleStageAssistWithFeedback).not.toHaveBeenCalled();
    expect(commitMove).not.toHaveBeenCalled();
  });
});
