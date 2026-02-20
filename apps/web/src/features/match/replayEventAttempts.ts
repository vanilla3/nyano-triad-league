import type { EventAttemptV1 } from "@/lib/event_attempts";

export function assertReplayAttemptCanBeSaved(input: {
  eventId: string;
  replayReady: boolean;
  winner: number | string;
}): void {
  if (!input.eventId) throw new Error("eventId がありません");
  if (!input.replayReady) throw new Error("replay が未準備です");
  if (input.winner !== 0 && input.winner !== 1) {
    throw new Error("引き分けは event attempts の対象外です");
  }
}

export function buildReplayEventAttempt(input: {
  createdAtIso: string;
  eventId: string;
  replayUrl: string;
  matchId: string;
  winner: 0 | 1;
  tilesA: number;
  tilesB: number;
  rulesetLabel: string;
  deckA: readonly bigint[];
  deckB: readonly bigint[];
  pointsDeltaA: number | null;
}): EventAttemptV1 {
  return {
    id: input.matchId,
    createdAt: input.createdAtIso,
    eventId: input.eventId,
    replayUrl: input.replayUrl,
    matchId: input.matchId,
    winner: input.winner,
    tilesA: input.tilesA,
    tilesB: input.tilesB,
    rulesetLabel: input.rulesetLabel,
    deckA: input.deckA.map((tokenId) => tokenId.toString()),
    deckB: input.deckB.map((tokenId) => tokenId.toString()),
    ...(input.pointsDeltaA !== null
      ? {
          pointsDeltaA: input.pointsDeltaA,
          pointsDeltaSource: "settled_attested" as const,
        }
      : {}),
  };
}
