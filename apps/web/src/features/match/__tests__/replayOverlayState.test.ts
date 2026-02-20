import { describe, expect, it } from "vitest";
import type { MatchResultWithHistory, TranscriptV1 } from "@nyano/triad-engine";
import {
  buildReplayOverlayErrorState,
  buildReplayOverlayProtocolV1,
  buildReplayOverlayState,
} from "@/features/match/replayOverlayState";

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
  boardHistory: [Array.from({ length: 9 }, () => null), Array.from({ length: 9 }, () => null)],
} as unknown as MatchResultWithHistory;

describe("features/match/replayOverlayState", () => {
  it("builds overlay error state shape", () => {
    expect(buildReplayOverlayErrorState({
      updatedAtMs: 100,
      eventId: "ev1",
      eventTitle: "Event",
      error: "decode failed",
    })).toEqual({
      version: 1,
      updatedAtMs: 100,
      mode: "replay",
      eventId: "ev1",
      eventTitle: "Event",
      error: "decode failed",
    });
  });

  it("builds protocol snapshot with stringified ids and sliced turns", () => {
    const protocol = buildReplayOverlayProtocolV1({
      transcript: transcriptStub,
      step: 1,
    });

    expect(protocol.header.deckA).toEqual(["1", "2", "3", "4", "5"]);
    expect(protocol.header.deckB).toEqual(["6", "7", "8", "9", "10"]);
    expect(protocol.turns).toEqual([{ cell: 0, cardIndex: 1 }]);
  });

  it("builds replay overlay state with status and protocol", () => {
    const state = buildReplayOverlayState({
      updatedAtMs: 200,
      eventId: "ev1",
      eventTitle: "Event",
      step: 1,
      transcript: transcriptStub,
      result: resultStub,
      lastMove: {
        turnIndex: 0,
        by: 0,
        cell: 0,
        cardIndex: 1,
        warningMarkCell: null,
      },
      lastTurnSummary: {
        flipCount: 1,
        comboCount: 0,
        comboEffect: "none",
        triadPlus: 0,
        ignoreWarningMark: false,
        warningTriggered: false,
        warningPlaced: null,
      },
    });

    expect(state.mode).toBe("replay");
    expect(state.deckA).toEqual(["1", "2", "3", "4", "5"]);
    expect(state.status).toMatchObject({
      finished: false,
      winner: "A",
      tilesA: 6,
      tilesB: 3,
      matchId: "match-1",
    });
    expect(state.protocolV1?.turns).toEqual([{ cell: 0, cardIndex: 1 }]);
  });
});
