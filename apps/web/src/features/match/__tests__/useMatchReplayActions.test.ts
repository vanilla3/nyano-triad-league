import { describe, expect, it, vi } from "vitest";
import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import { createMatchReplayActions } from "@/features/match/useMatchReplayActions";

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

function makeCard(tokenId: bigint): CardData {
  return {
    tokenId,
    edges: { up: 1, right: 2, down: 3, left: 4 },
    jankenHand: 0,
    combatStatSum: 10,
    trait: "none",
  };
}

function createDeps() {
  const calls: Array<{ type: "warn" | "success" | "error"; title: string; message: string }> = [];
  const copyToClipboard = vi.fn(async (_text: string) => {});
  const setError = vi.fn((_next: string | null) => {});
  const setStatus = vi.fn((_next: string | null) => {});
  const navigate = vi.fn((_nextUrl: string) => {});
  return {
    calls,
    copyToClipboard,
    setError,
    setStatus,
    navigate,
    toast: {
      warn: (title: string, message: string) => calls.push({ type: "warn", title, message }),
      success: (title: string, message: string) => calls.push({ type: "success", title, message }),
      error: (title: string, message: string) => calls.push({ type: "error", title, message }),
    },
  };
}

describe("features/match/useMatchReplayActions", () => {
  it("builds replay URL with forwarded params", () => {
    let captured: Record<string, unknown> | null = null;
    const deps = createDeps();
    const actions = createMatchReplayActions(
      {
        transcript: makeTranscript(),
        cards: new Map<bigint, CardData>([[1n, makeCard(1n)]]),
        eventId: "evt_1",
        ui: "mint",
        rulesetKey: "classic_custom",
        classicMask: "1z",
        setError: deps.setError,
        setStatus: deps.setStatus,
        navigate: deps.navigate,
        toast: deps.toast,
        copyToClipboard: deps.copyToClipboard,
        resolveErrorMessage: () => "failed",
      },
      {
        buildReplayLink: (input) => {
          captured = input as unknown as Record<string, unknown>;
          return "https://example.invalid/replay";
        },
      },
    );

    const url = actions.buildReplayUrl(true);
    expect(url).toBe("https://example.invalid/replay");
    expect(captured).toMatchObject({
      eventId: "evt_1",
      ui: "mint",
      rulesetKey: "classic_custom",
      classicMask: "1z",
      absolute: true,
    });
  });

  it("copies share URL and emits success toast", async () => {
    const deps = createDeps();
    const actions = createMatchReplayActions(
      {
        transcript: makeTranscript(),
        cards: null,
        setError: deps.setError,
        setStatus: deps.setStatus,
        navigate: deps.navigate,
        toast: deps.toast,
        copyToClipboard: deps.copyToClipboard,
        resolveErrorMessage: () => "failed",
      },
      { buildReplayLink: () => "https://example.invalid/replay" },
    );

    await actions.copyShareUrl();
    expect(deps.setError).toHaveBeenCalledWith(null);
    expect(deps.copyToClipboard).toHaveBeenCalledWith("https://example.invalid/replay");
    expect(deps.calls).toEqual([
      {
        type: "success",
        title: "コピーしました",
        message: "Share URL をクリップボードへコピーしました。",
      },
    ]);
  });

  it("warns when share URL is unavailable", async () => {
    const deps = createDeps();
    const actions = createMatchReplayActions(
      {
        transcript: null,
        cards: null,
        setError: deps.setError,
        setStatus: deps.setStatus,
        navigate: deps.navigate,
        toast: deps.toast,
        copyToClipboard: deps.copyToClipboard,
        resolveErrorMessage: () => "failed",
      },
      { buildReplayLink: () => null },
    );

    await actions.copyShareUrl();
    expect(deps.copyToClipboard).not.toHaveBeenCalled();
    expect(deps.calls).toEqual([
      {
        type: "warn",
        title: "共有",
        message: "Match が未完了です。9手まで進めてください。",
      },
    ]);
  });

  it("opens replay with status reset and navigation", async () => {
    const deps = createDeps();
    const actions = createMatchReplayActions(
      {
        transcript: makeTranscript(),
        cards: null,
        setError: deps.setError,
        setStatus: deps.setStatus,
        navigate: deps.navigate,
        toast: deps.toast,
        copyToClipboard: deps.copyToClipboard,
        resolveErrorMessage: () => "failed",
      },
      { buildReplayLink: () => "/replay?t=1" },
    );

    await actions.openReplay();
    expect(deps.setError).toHaveBeenCalledWith(null);
    expect(deps.setStatus).toHaveBeenCalledWith(null);
    expect(deps.navigate).toHaveBeenCalledWith("/replay?t=1");
    expect(deps.calls).toEqual([]);
  });

  it("copies share template from replay URL", async () => {
    const deps = createDeps();
    const actions = createMatchReplayActions(
      {
        transcript: makeTranscript(),
        cards: null,
        setError: deps.setError,
        setStatus: deps.setStatus,
        navigate: deps.navigate,
        toast: deps.toast,
        copyToClipboard: deps.copyToClipboard,
        resolveErrorMessage: () => "failed",
      },
      {
        buildReplayLink: () => "https://example.invalid/replay",
        buildShareTemplateMessage: (url) => `share:${url}`,
      },
    );

    await actions.copyShareTemplate();
    expect(deps.copyToClipboard).toHaveBeenCalledWith("share:https://example.invalid/replay");
    expect(deps.calls).toEqual([
      { type: "success", title: "コピーしました", message: "共有テンプレート" },
    ]);
  });
});
