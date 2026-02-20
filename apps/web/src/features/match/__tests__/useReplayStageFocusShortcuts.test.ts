import { describe, expect, it, vi } from "vitest";
import { createReplayStageFocusKeydownHandler } from "@/features/match/useReplayStageFocusShortcuts";

function createCallbacks() {
  return {
    exitFocusModeWithFeedback: vi.fn(),
    toggleStageFullscreenWithFeedback: vi.fn(),
    toggleStageTransportWithFeedback: vi.fn(),
    toggleStageSetupWithFeedback: vi.fn(),
    toggleStagePanelsWithFeedback: vi.fn(),
    jumpToPrevStepWithFeedback: vi.fn(),
    jumpToNextStepWithFeedback: vi.fn(),
    toggleReplayPlayWithFeedback: vi.fn(),
    jumpToStartWithFeedback: vi.fn(),
    jumpToEndWithFeedback: vi.fn(),
    jumpToPrevHighlightWithFeedback: vi.fn(),
    jumpToNextHighlightWithFeedback: vi.fn(),
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

describe("features/match/useReplayStageFocusShortcuts", () => {
  it("dispatches stage-focus fullscreen shortcut and prevents default", () => {
    const callbacks = createCallbacks();
    const onKeyDown = createReplayStageFocusKeydownHandler({
      isStageFocus: true,
      canPlay: true,
      callbacks,
    });
    const event = createEvent({ key: "f" });
    onKeyDown(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(callbacks.toggleStageFullscreenWithFeedback).toHaveBeenCalledTimes(1);
  });

  it("does not prevent default for Arrow keys while still dispatching", () => {
    const callbacks = createCallbacks();
    const onKeyDown = createReplayStageFocusKeydownHandler({
      isStageFocus: false,
      canPlay: false,
      callbacks,
    });
    const event = createEvent({ key: "ArrowRight" });
    onKeyDown(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(callbacks.jumpToNextStepWithFeedback).toHaveBeenCalledTimes(1);
  });

  it("guards play shortcut when replay cannot play", () => {
    const callbacks = createCallbacks();
    const onKeyDown = createReplayStageFocusKeydownHandler({
      isStageFocus: true,
      canPlay: false,
      callbacks,
    });
    const event = createEvent({ key: " " });
    onKeyDown(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(callbacks.toggleReplayPlayWithFeedback).not.toHaveBeenCalled();
  });

  it("ignores editable targets", () => {
    const callbacks = createCallbacks();
    const onKeyDown = createReplayStageFocusKeydownHandler({
      isStageFocus: true,
      canPlay: true,
      callbacks,
    });
    const event = createEvent({
      key: "Escape",
      target: { tagName: "INPUT", isContentEditable: false } as unknown as EventTarget,
    });
    onKeyDown(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(callbacks.exitFocusModeWithFeedback).not.toHaveBeenCalled();
  });
});
