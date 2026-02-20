import { describe, expect, it, vi } from "vitest";
import {
  runReplayCopyAction,
  runReplaySaveAttemptAction,
  runReplayShareCopyAction,
} from "@/features/match/replayActionRunners";

describe("features/match/replayActionRunners", () => {
  it("runs share copy success path", async () => {
    const copyWithToast = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();
    const ok = await runReplayShareCopyAction({
      shareLabel: "share-url",
      buildShareLink: () => "https://example.invalid/replay",
      copyWithToast,
      onError,
    });

    expect(ok).toBe(true);
    expect(copyWithToast).toHaveBeenCalledWith("share-url", "https://example.invalid/replay");
    expect(onError).not.toHaveBeenCalled();
  });

  it("uses native share when available and skips clipboard copy", async () => {
    const copyWithToast = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();
    const onShared = vi.fn();

    const ok = await runReplayShareCopyAction({
      shareLabel: "share-url",
      buildShareLink: () => "https://example.invalid/replay",
      copyWithToast,
      onError,
      shareWithNative: vi.fn().mockResolvedValue("shared"),
      onShared,
    });

    expect(ok).toBe(true);
    expect(copyWithToast).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(onShared).toHaveBeenCalledOnce();
  });

  it("returns false when native share is cancelled", async () => {
    const copyWithToast = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();

    const ok = await runReplayShareCopyAction({
      shareLabel: "share-url",
      buildShareLink: () => "https://example.invalid/replay",
      copyWithToast,
      onError,
      shareWithNative: vi.fn().mockResolvedValue("cancelled"),
    });

    expect(ok).toBe(false);
    expect(copyWithToast).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("runs share copy error path", async () => {
    const err = new Error("share failed");
    const copyWithToast = vi.fn().mockRejectedValue(err);
    const onError = vi.fn();

    const ok = await runReplayShareCopyAction({
      shareLabel: "share-url",
      buildShareLink: () => "https://example.invalid/replay",
      copyWithToast,
      onError,
    });

    expect(ok).toBe(false);
    expect(onError).toHaveBeenCalledWith(err);
  });

  it("runs save attempt success path", async () => {
    const saveToMyAttempts = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const ok = await runReplaySaveAttemptAction({
      saveToMyAttempts,
      onSuccess,
      onError,
    });

    expect(ok).toBe(true);
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it("runs save attempt error path", async () => {
    const err = new Error("save failed");
    const saveToMyAttempts = vi.fn().mockRejectedValue(err);
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const ok = await runReplaySaveAttemptAction({
      saveToMyAttempts,
      onSuccess,
      onError,
    });

    expect(ok).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(err);
  });

  it("runs generic copy success path", async () => {
    const copyWithToast = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();

    const ok = await runReplayCopyAction({
      label: "transcript",
      resolveValue: () => "payload",
      copyWithToast,
      onError,
    });

    expect(ok).toBe(true);
    expect(copyWithToast).toHaveBeenCalledWith("transcript", "payload");
    expect(onError).not.toHaveBeenCalled();
  });

  it("runs generic copy error path", async () => {
    const err = new Error("copy failed");
    const copyWithToast = vi.fn().mockRejectedValue(err);
    const onError = vi.fn();

    const ok = await runReplayCopyAction({
      label: "transcript",
      resolveValue: () => "payload",
      copyWithToast,
      onError,
    });

    expect(ok).toBe(false);
    expect(onError).toHaveBeenCalledWith(err);
  });

  it("runs generic copy resolveValue error path", async () => {
    const err = new Error("resolve failed");
    const copyWithToast = vi.fn();
    const onError = vi.fn();

    const ok = await runReplayCopyAction({
      label: "transcript",
      resolveValue: () => {
        throw err;
      },
      copyWithToast,
      onError,
    });

    expect(ok).toBe(false);
    expect(copyWithToast).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(err);
  });
});
