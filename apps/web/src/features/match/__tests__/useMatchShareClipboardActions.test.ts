import { describe, expect, it, vi } from "vitest";
import type { TranscriptV1 } from "@nyano/triad-engine";
import {
  createMatchShareClipboardActions,
} from "@/features/match/useMatchShareClipboardActions";

function makeTranscript(): TranscriptV1 {
  return {
    header: {
      version: 1,
      rulesetId: `0x${"11".repeat(32)}` as `0x${string}`,
      seasonId: 1,
      playerA: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      playerB: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      deckA: [1n, 2n, 3n, 4n, 5n],
      deckB: [6n, 7n, 8n, 9n, 10n],
      firstPlayer: 0,
      deadline: 9999,
      salt: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    },
    turns: [{ cell: 4, cardIndex: 0 }],
  };
}

function createDeps() {
  const calls: Array<{ type: "success" | "warn" | "error"; title: string; message: string }> = [];
  const setError = vi.fn((_next: string | null) => {});
  const copyToClipboard = vi.fn(async (_text: string) => {});
  const writeSetupClipboardText = vi.fn(async (_text: string) => true);
  const resolveErrorMessage = vi.fn((_error: unknown) => "failed");
  return {
    calls,
    setError,
    copyToClipboard,
    writeSetupClipboardText,
    resolveErrorMessage,
    toast: {
      success: (title: string, message: string) => calls.push({ type: "success", title, message }),
      warn: (title: string, message: string) => calls.push({ type: "warn", title, message }),
      error: (title: string, message: string) => calls.push({ type: "error", title, message }),
    },
  };
}

describe("features/match/useMatchShareClipboardActions", () => {
  it("copies setup share URL and emits success toast", async () => {
    const deps = createDeps();
    const actions = createMatchShareClipboardActions(
      {
        pathname: "/match",
        search: new URLSearchParams("ui=mint"),
        simOk: true,
        simError: "",
        transcript: makeTranscript(),
        setError: deps.setError,
        toast: deps.toast,
        copyToClipboard: deps.copyToClipboard,
        writeSetupClipboardText: deps.writeSetupClipboardText,
        resolveErrorMessage: deps.resolveErrorMessage,
      },
      {
        buildSetupShareUrl: () => "https://example.invalid/match?ui=mint",
      },
    );

    await actions.handleCopySetupLink();
    expect(deps.writeSetupClipboardText).toHaveBeenCalledWith("https://example.invalid/match?ui=mint");
    expect(deps.calls).toEqual([
      { type: "success", title: "コピーしました", message: "セットアップURLをコピーしました。" },
    ]);
  });

  it("warns when setup URL copy fails", async () => {
    const deps = createDeps();
    deps.writeSetupClipboardText.mockResolvedValue(false);
    const actions = createMatchShareClipboardActions({
      pathname: "/match",
      search: new URLSearchParams(),
      simOk: true,
      simError: "",
      transcript: makeTranscript(),
      setError: deps.setError,
      toast: deps.toast,
      copyToClipboard: deps.copyToClipboard,
      writeSetupClipboardText: deps.writeSetupClipboardText,
      resolveErrorMessage: deps.resolveErrorMessage,
    });

    await actions.handleCopySetupLink();
    expect(deps.calls).toEqual([
      { type: "warn", title: "コピー失敗", message: "URLを手動でコピーしてください。" },
    ]);
  });

  it("sets simulation error when transcript is unavailable", async () => {
    const deps = createDeps();
    const actions = createMatchShareClipboardActions({
      pathname: "/match",
      search: new URLSearchParams(),
      simOk: false,
      simError: "sim-error",
      transcript: null,
      setError: deps.setError,
      toast: deps.toast,
      copyToClipboard: deps.copyToClipboard,
      writeSetupClipboardText: deps.writeSetupClipboardText,
      resolveErrorMessage: deps.resolveErrorMessage,
    });

    await actions.copyTranscriptJson();
    expect(deps.setError).toHaveBeenNthCalledWith(1, null);
    expect(deps.setError).toHaveBeenNthCalledWith(2, "sim-error");
    expect(deps.copyToClipboard).not.toHaveBeenCalled();
  });

  it("copies transcript json and emits success toast", async () => {
    const deps = createDeps();
    const actions = createMatchShareClipboardActions(
      {
        pathname: "/match",
        search: new URLSearchParams(),
        simOk: true,
        simError: "",
        transcript: makeTranscript(),
        setError: deps.setError,
        toast: deps.toast,
        copyToClipboard: deps.copyToClipboard,
        writeSetupClipboardText: deps.writeSetupClipboardText,
        resolveErrorMessage: deps.resolveErrorMessage,
      },
      { stringifyTranscript: () => "{\"ok\":true}" },
    );

    await actions.copyTranscriptJson();
    expect(deps.copyToClipboard).toHaveBeenCalledWith("{\"ok\":true}");
    expect(deps.calls).toEqual([
      { type: "success", title: "コピーしました", message: "transcript JSON" },
    ]);
  });

  it("reports copy failure with resolved error message", async () => {
    const deps = createDeps();
    deps.copyToClipboard.mockRejectedValue(new Error("no clipboard"));
    const actions = createMatchShareClipboardActions(
      {
        pathname: "/match",
        search: new URLSearchParams(),
        simOk: true,
        simError: "",
        transcript: makeTranscript(),
        setError: deps.setError,
        toast: deps.toast,
        copyToClipboard: deps.copyToClipboard,
        writeSetupClipboardText: deps.writeSetupClipboardText,
        resolveErrorMessage: deps.resolveErrorMessage,
      },
      { stringifyTranscript: () => "{\"ok\":true}" },
    );

    await actions.copyTranscriptJson();
    expect(deps.calls).toEqual([
      { type: "error", title: "コピーに失敗しました", message: "failed" },
    ]);
  });
});
