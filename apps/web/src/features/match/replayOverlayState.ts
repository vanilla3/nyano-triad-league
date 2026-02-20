import type { MatchResultWithHistory, TranscriptV1 } from "@nyano/triad-engine";
import type { OverlayStateV1 } from "@/lib/streamer_bus";

type OverlayLastMove = OverlayStateV1["lastMove"];
type OverlayLastTurnSummary = OverlayStateV1["lastTurnSummary"];

export function buildReplayOverlayErrorState(input: {
  updatedAtMs: number;
  eventId?: string;
  eventTitle?: string;
  error: string;
}): OverlayStateV1 {
  return {
    version: 1,
    updatedAtMs: input.updatedAtMs,
    mode: "replay",
    eventId: input.eventId,
    eventTitle: input.eventTitle,
    error: input.error,
  };
}

export function buildReplayOverlayProtocolV1(input: {
  transcript: TranscriptV1;
  step: number;
}): NonNullable<OverlayStateV1["protocolV1"]> {
  return {
    header: {
      version: Number(input.transcript.header.version),
      rulesetId: String(input.transcript.header.rulesetId),
      seasonId: Number(input.transcript.header.seasonId),
      playerA: String(input.transcript.header.playerA),
      playerB: String(input.transcript.header.playerB),
      deckA: input.transcript.header.deckA.map((x) => x.toString()),
      deckB: input.transcript.header.deckB.map((x) => x.toString()),
      firstPlayer: input.transcript.header.firstPlayer as 0 | 1,
      deadline: Number(input.transcript.header.deadline),
      salt: String(input.transcript.header.salt),
    },
    turns: input.transcript.turns.slice(0, input.step).map((t) => ({
      cell: Number(t.cell),
      cardIndex: Number(t.cardIndex),
      ...(typeof t.warningMarkCell === "number" ? { warningMarkCell: Number(t.warningMarkCell) } : {}),
    })),
  };
}

export function buildReplayOverlayState(input: {
  updatedAtMs: number;
  eventId?: string;
  eventTitle?: string;
  step: number;
  transcript: TranscriptV1;
  result: MatchResultWithHistory;
  lastMove: OverlayLastMove;
  lastTurnSummary: OverlayLastTurnSummary;
}): OverlayStateV1 {
  return {
    version: 1,
    updatedAtMs: input.updatedAtMs,
    mode: "replay",
    eventId: input.eventId,
    eventTitle: input.eventTitle,
    turn: input.step,
    firstPlayer: input.transcript.header.firstPlayer as 0 | 1,
    playerA: input.transcript.header.playerA,
    playerB: input.transcript.header.playerB,
    rulesetId: input.transcript.header.rulesetId,
    seasonId: input.transcript.header.seasonId,
    deckA: input.transcript.header.deckA.map((x) => x.toString()),
    deckB: input.transcript.header.deckB.map((x) => x.toString()),
    protocolV1: buildReplayOverlayProtocolV1({
      transcript: input.transcript,
      step: input.step,
    }),
    board: input.result.boardHistory[input.step],
    lastMove: input.lastMove,
    lastTurnSummary: input.lastTurnSummary,
    status: {
      finished: input.step >= 9,
      winner: input.result.winner === "draw" ? "draw" : input.result.winner === 0 ? "A" : "B",
      tilesA: Number(input.result.tiles.A),
      tilesB: Number(input.result.tiles.B),
      matchId: input.result.matchId,
    },
  };
}
