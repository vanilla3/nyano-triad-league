import { describe, expect, it, vi } from "vitest";
import type { MatchResultWithHistory, TranscriptV1 } from "@nyano/triad-engine";
import { runReplayOverlayPublishAction } from "@/features/match/replayOverlayActions";

const transcriptStub = {
  header: {
    version: 1,
    rulesetId: "0x01",
    seasonId: 7,
    playerA: "0x0000000000000000000000000000000000000001",
    playerB: "0x0000000000000000000000000000000000000002",
    deckA: [1n, 2n, 3n, 4n, 5n],
    deckB: [6n, 7n, 8n, 9n, 10n],
    firstPlayer: 0,
    deadline: 123,
    salt: "0xbeef",
  },
  turns: [
    { cell: 0, cardIndex: 1 },
    { cell: 4, cardIndex: 2, warningMarkCell: 8 },
  ],
} as unknown as TranscriptV1;

const resultStub = {
  winner: 0,
  tiles: { A: 6, B: 3 },
  matchId: "match-1",
  turns: [
    { cell: 0, cardIndex: 1 },
    { cell: 4, cardIndex: 2, warningMarkCell: 8 },
  ],
  boardHistory: [Array.from({ length: 9 }, () => null), Array.from({ length: 9 }, () => null)],
} as unknown as MatchResultWithHistory;

function createNotifySpies() {
  return {
    success: vi.fn<(message: string) => void>(),
    warn: vi.fn<(message: string) => void>(),
    error: vi.fn<(message: string) => void>(),
  };
}

describe("features/match/replayOverlayActions", () => {
  it("publishes error-state overlay and warns when replay is not loaded", () => {
    const notify = createNotifySpies();
    const publishOverlayStateSpy = vi.fn();

    runReplayOverlayPublishAction(
      {
        sim: { ok: false, error: "" },
        step: 3,
        eventId: "ev1",
        eventTitle: "Event",
        notify,
      },
      {
        now: () => 100,
        publishOverlayState: publishOverlayStateSpy as never,
      },
    );

    expect(publishOverlayStateSpy).toHaveBeenCalledTimes(1);
    expect(publishOverlayStateSpy).toHaveBeenCalledWith(expect.objectContaining({
      mode: "replay",
      eventId: "ev1",
      eventTitle: "Event",
      error: "リプレイが未読込です",
    }));
    expect(notify.warn).toHaveBeenCalledWith("リプレイが未読込状態です");
    expect(notify.success).not.toHaveBeenCalled();
    expect(notify.error).not.toHaveBeenCalled();
  });

  it("publishes replay overlay state and success message", () => {
    const notify = createNotifySpies();
    const publishOverlayStateSpy = vi.fn();

    runReplayOverlayPublishAction(
      {
        sim: { ok: true, transcript: transcriptStub, current: resultStub },
        step: 1,
        eventId: "ev1",
        eventTitle: "Event",
        notify,
      },
      {
        now: () => 200,
        publishOverlayState: publishOverlayStateSpy as never,
      },
    );

    expect(publishOverlayStateSpy).toHaveBeenCalledTimes(1);
    const payload = publishOverlayStateSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload["mode"]).toBe("replay");
    expect(payload["eventId"]).toBe("ev1");
    expect(payload["protocolV1"]).toBeTruthy();
    expect(notify.success).toHaveBeenCalledWith("OBS overlay へ送信しました");
    expect(notify.warn).not.toHaveBeenCalled();
    expect(notify.error).not.toHaveBeenCalled();
  });

  it("suppresses all notifier messages in silent mode", () => {
    const notify = createNotifySpies();
    const publishOverlayStateSpy = vi.fn();

    runReplayOverlayPublishAction(
      {
        sim: { ok: true, transcript: transcriptStub, current: resultStub },
        step: 0,
        silent: true,
        notify,
      },
      {
        now: () => 200,
        publishOverlayState: publishOverlayStateSpy as never,
      },
    );

    expect(publishOverlayStateSpy).toHaveBeenCalledTimes(1);
    expect(notify.success).not.toHaveBeenCalled();
    expect(notify.warn).not.toHaveBeenCalled();
    expect(notify.error).not.toHaveBeenCalled();
  });

  it("publishes error-state payload and reports message when publish path throws", () => {
    const notify = createNotifySpies();
    const publishOverlayStateSpy = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("publish failed");
      })
      .mockImplementationOnce(() => undefined);

    runReplayOverlayPublishAction(
      {
        sim: { ok: true, transcript: transcriptStub, current: resultStub },
        step: 1,
        eventId: "ev1",
        eventTitle: "Event",
        notify,
      },
      {
        now: () => 300,
        publishOverlayState: publishOverlayStateSpy as never,
        errorMessage: (error) => (error instanceof Error ? error.message : "unknown"),
      },
    );

    expect(publishOverlayStateSpy).toHaveBeenCalledTimes(2);
    expect(publishOverlayStateSpy.mock.calls[1]?.[0]).toEqual(expect.objectContaining({
      mode: "replay",
      eventId: "ev1",
      eventTitle: "Event",
      error: "publish failed",
    }));
    expect(notify.error).toHaveBeenCalledWith("publish failed");
  });
});
