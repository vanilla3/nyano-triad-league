import { describe, expect, it, vi } from "vitest";
import { createMatchStageFocusKeydownHandler } from "@/features/match/useMatchStageFocusShortcuts";

function createCallbacks() {
  return {
    exitFocusModeWithFeedback: vi.fn(),
    toggleStageFullscreenWithFeedback: vi.fn(),
    toggleStageControlsWithFeedback: vi.fn(),
    toggleStageAssistWithFeedback: vi.fn(),
    openReplayWithFeedback: vi.fn(),
    commitMove: vi.fn(),
    undoMove: vi.fn(),
  };
}

function createEvent(input: Partial<{
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  target: EventTarget | null;
}> = {}) {
  return {
    key: input.key ?? "",
    altKey: input.altKey ?? false,
    ctrlKey: input.ctrlKey ?? false,
    metaKey: input.metaKey ?? false,
    target: input.target ?? null,
    preventDefault: vi.fn(),
  };
}

describe("features/match/useMatchStageFocusShortcuts", () => {
  it("dispatches fullscreen toggle and prevents default on focus shortcut", () => {
    const callbacks = createCallbacks();
    const onKeyDown = createMatchStageFocusKeydownHandler({
      canFinalize: false,
      canCommitFromFocusToolbar: false,
      canUndoFromFocusToolbar: false,
      callbacks,
    });
    const event = createEvent({ key: "f" });
    onKeyDown(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(callbacks.toggleStageFullscreenWithFeedback).toHaveBeenCalledTimes(1);
  });

  it("respects replay guard and does not fire when finalize is unavailable", () => {
    const callbacks = createCallbacks();
    const onKeyDown = createMatchStageFocusKeydownHandler({
      canFinalize: false,
      canCommitFromFocusToolbar: false,
      canUndoFromFocusToolbar: false,
      callbacks,
    });
    const event = createEvent({ key: "r" });
    onKeyDown(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(callbacks.openReplayWithFeedback).not.toHaveBeenCalled();
  });

  it("ignores editable targets", () => {
    const callbacks = createCallbacks();
    const onKeyDown = createMatchStageFocusKeydownHandler({
      canFinalize: true,
      canCommitFromFocusToolbar: true,
      canUndoFromFocusToolbar: true,
      callbacks,
    });
    const event = createEvent({
      key: "Enter",
      target: { tagName: "INPUT", isContentEditable: false } as unknown as EventTarget,
    });
    onKeyDown(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(callbacks.commitMove).not.toHaveBeenCalled();
  });

  it("dispatches commit and undo shortcuts only when enabled", () => {
    const callbacks = createCallbacks();
    const onKeyDown = createMatchStageFocusKeydownHandler({
      canFinalize: true,
      canCommitFromFocusToolbar: true,
      canUndoFromFocusToolbar: true,
      callbacks,
    });

    const commitEvent = createEvent({ key: "Enter" });
    onKeyDown(commitEvent);
    expect(commitEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(callbacks.commitMove).toHaveBeenCalledTimes(1);

    const undoEvent = createEvent({ key: "Backspace" });
    onKeyDown(undoEvent);
    expect(undoEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(callbacks.undoMove).toHaveBeenCalledTimes(1);
  });
});
