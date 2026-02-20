import { describe, expect, it, vi } from "vitest";
import {
  resolveReplayStageFocusShortcut,
  runReplayStageFocusShortcutAction,
} from "@/features/match/replayStageFocusShortcuts";

function resolveShortcut(
  input: Partial<Parameters<typeof resolveReplayStageFocusShortcut>[0]>,
) {
  return resolveReplayStageFocusShortcut({
    key: "",
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    targetTagName: undefined,
    targetIsContentEditable: false,
    isStageFocus: false,
    canPlay: false,
    ...input,
  });
}

describe("features/match/replayStageFocusShortcuts", () => {
  it("ignores editable targets and modifier keys", () => {
    expect(resolveShortcut({ key: "Escape", targetTagName: "INPUT" })).toBeNull();
    expect(resolveShortcut({ key: "Escape", targetTagName: "textarea" })).toBeNull();
    expect(resolveShortcut({ key: "Escape", targetIsContentEditable: true })).toBeNull();
    expect(resolveShortcut({ key: "Escape", altKey: true })).toBeNull();
    expect(resolveShortcut({ key: "Escape", ctrlKey: true })).toBeNull();
    expect(resolveShortcut({ key: "Escape", metaKey: true })).toBeNull();
  });

  it("resolves stage-focus-only shortcuts", () => {
    expect(resolveShortcut({ key: "Escape", isStageFocus: true })).toEqual({
      action: "exit_focus",
      preventDefault: true,
    });
    expect(resolveShortcut({ key: "f", isStageFocus: true })).toEqual({
      action: "toggle_fullscreen",
      preventDefault: true,
    });
    expect(resolveShortcut({ key: "c", isStageFocus: true })).toEqual({
      action: "toggle_controls",
      preventDefault: true,
    });
    expect(resolveShortcut({ key: "s", isStageFocus: true })).toEqual({
      action: "toggle_setup",
      preventDefault: true,
    });
    expect(resolveShortcut({ key: "d", isStageFocus: true })).toEqual({
      action: "toggle_panels",
      preventDefault: true,
    });
    expect(resolveShortcut({ key: "Escape", isStageFocus: false })).toBeNull();
  });

  it("resolves replay transport/highlight keys and guards play toggle", () => {
    expect(resolveShortcut({ key: "ArrowLeft" })).toEqual({
      action: "prev_step",
      preventDefault: false,
    });
    expect(resolveShortcut({ key: "ArrowRight" })).toEqual({
      action: "next_step",
      preventDefault: false,
    });
    expect(resolveShortcut({ key: "Home" })).toEqual({
      action: "jump_start",
      preventDefault: true,
    });
    expect(resolveShortcut({ key: "End" })).toEqual({
      action: "jump_end",
      preventDefault: true,
    });
    expect(resolveShortcut({ key: "[" })).toEqual({
      action: "prev_highlight",
      preventDefault: true,
    });
    expect(resolveShortcut({ key: "]" })).toEqual({
      action: "next_highlight",
      preventDefault: true,
    });
    expect(resolveShortcut({ key: " ", canPlay: false })).toBeNull();
    expect(resolveShortcut({ key: " ", canPlay: true })).toEqual({
      action: "toggle_play",
      preventDefault: true,
    });
  });

  it("dispatches resolved actions to matching callbacks", () => {
    const callbacks = {
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

    runReplayStageFocusShortcutAction({
      action: "toggle_controls",
      ...callbacks,
    });
    runReplayStageFocusShortcutAction({
      action: "next_step",
      ...callbacks,
    });
    runReplayStageFocusShortcutAction({
      action: "next_highlight",
      ...callbacks,
    });

    expect(callbacks.toggleStageTransportWithFeedback).toHaveBeenCalledTimes(1);
    expect(callbacks.jumpToNextStepWithFeedback).toHaveBeenCalledTimes(1);
    expect(callbacks.jumpToNextHighlightWithFeedback).toHaveBeenCalledTimes(1);
    expect(callbacks.exitFocusModeWithFeedback).not.toHaveBeenCalled();
  });
});
