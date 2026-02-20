import { describe, expect, it, vi } from "vitest";
import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import {
  createReplayCopyWithToast,
  copyReplayValueWithToast,
  resolveReplayVerifySfx,
  resolveReplayVerifyStatus,
  runReplayVerifyAction,
} from "@/features/match/replayUiActions";

function makeTranscript(): TranscriptV1 {
  return {
    header: {
      version: 1,
      rulesetId: "0x01",
      seasonId: 1,
      playerA: "0x0000000000000000000000000000000000000001",
      playerB: "0x0000000000000000000000000000000000000002",
      deckA: [1n, 2n, 3n, 4n, 5n],
      deckB: [6n, 7n, 8n, 9n, 10n],
      firstPlayer: 0,
      deadline: 0,
      salt: "0x00",
    },
    turns: [{ cell: 0, cardIndex: 0 }],
  };
}

function makeCards(): Map<bigint, CardData> {
  return new Map<bigint, CardData>([
    [1n, { tokenId: 1n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 4, trait: "none" }],
  ]);
}

describe("features/match/replayUiActions", () => {
  it("maps verify result to status and sfx tokens", () => {
    expect(resolveReplayVerifyStatus(true)).toBe("ok");
    expect(resolveReplayVerifyStatus(false)).toBe("mismatch");
    expect(resolveReplayVerifySfx(true)).toBe("victory_fanfare");
    expect(resolveReplayVerifySfx(false)).toBe("error_buzz");
  });

  it("returns false and skips effects when payload is missing", () => {
    const setVerifyStatus = vi.fn();
    const playReplaySfx = vi.fn();

    const handled = runReplayVerifyAction({
      payload: null,
      setVerifyStatus,
      playReplaySfx,
    });

    expect(handled).toBe(false);
    expect(setVerifyStatus).not.toHaveBeenCalled();
    expect(playReplaySfx).not.toHaveBeenCalled();
  });

  it("applies verify status+sfx when verification succeeds", () => {
    const setVerifyStatus = vi.fn();
    const playReplaySfx = vi.fn();
    const verifyReplayV1Spy = vi.fn(() => ({ ok: true }));

    const handled = runReplayVerifyAction(
      {
        payload: {
          transcript: makeTranscript(),
          cards: makeCards(),
          matchId: "match-1",
        },
        setVerifyStatus,
        playReplaySfx,
      },
      { verifyReplayV1: verifyReplayV1Spy as never },
    );

    expect(handled).toBe(true);
    expect(verifyReplayV1Spy).toHaveBeenCalledOnce();
    expect(setVerifyStatus).toHaveBeenCalledWith("ok");
    expect(playReplaySfx).toHaveBeenCalledWith("victory_fanfare");
  });

  it("applies mismatch status+sfx when verification fails", () => {
    const setVerifyStatus = vi.fn();
    const playReplaySfx = vi.fn();
    const verifyReplayV1Spy = vi.fn(() => ({ ok: false }));

    runReplayVerifyAction(
      {
        payload: {
          transcript: makeTranscript(),
          cards: makeCards(),
          matchId: "match-1",
        },
        setVerifyStatus,
        playReplaySfx,
      },
      { verifyReplayV1: verifyReplayV1Spy as never },
    );

    expect(setVerifyStatus).toHaveBeenCalledWith("mismatch");
    expect(playReplaySfx).toHaveBeenCalledWith("error_buzz");
  });

  it("copies value and reports success toast", async () => {
    const toast = {
      success: vi.fn(),
      error: vi.fn(),
    };
    const writeClipboardTextSpy = vi.fn().mockResolvedValue("ok");

    await copyReplayValueWithToast(
      {
        label: "共有URL",
        value: "https://example.invalid",
        toast,
      },
      {
        writeClipboardText: writeClipboardTextSpy as never,
      },
    );

    expect(writeClipboardTextSpy).toHaveBeenCalledWith("https://example.invalid");
    expect(toast.success).toHaveBeenCalledWith("コピーしました", "共有URL");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("reports copy failure toast with resolved error message", async () => {
    const toast = {
      success: vi.fn(),
      error: vi.fn(),
    };
    const writeClipboardTextSpy = vi.fn().mockRejectedValue(new Error("boom"));

    await copyReplayValueWithToast(
      {
        label: "共有URL",
        value: "https://example.invalid",
        toast,
      },
      {
        writeClipboardText: writeClipboardTextSpy as never,
        errorMessage: () => "copy failed",
      },
    );

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("コピー失敗", "copy failed");
  });
  it("creates copy helper that forwards label/value/toast", async () => {
    const toast = {
      success: vi.fn(),
      error: vi.fn(),
    };
    const copyReplayValueWithToastSpy = vi.fn().mockResolvedValue(undefined);

    const copyWithToast = createReplayCopyWithToast(
      { toast },
      { copyReplayValueWithToast: copyReplayValueWithToastSpy as never },
    );
    await copyWithToast("label", "value");

    expect(copyReplayValueWithToastSpy).toHaveBeenCalledWith({
      label: "label",
      value: "value",
      toast,
    });
  });
});
