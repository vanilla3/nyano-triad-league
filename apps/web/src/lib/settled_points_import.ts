import type { LadderMatchSettledEventV1 } from "@nyano/triad-engine";
import { validateLadderMatchSettledEventV1 } from "@nyano/triad-engine";
import type { EventAttemptV1 } from "./event_attempts";

export type SettledPointsImportIssueCode =
  | "json_parse_failed"
  | "schema_unsupported"
  | "settled_invalid"
  | "duplicate_conflict"
  | "no_local_attempt"
  | "winner_mismatch"
  | "tiles_mismatch"
  | "draw_not_supported";

export type SettledPointsImportIssue = {
  code: SettledPointsImportIssueCode;
  message: string;
  index?: number;
  matchId?: string;
};

export type SettledPointsWinner = 0 | 1 | "draw";

export type NormalizedSettledPointsEvent = {
  matchId: string;
  pointsDeltaA: number;
  winner: SettledPointsWinner;
  tilesA: number;
  tilesB: number;
};

export type SettledPointsParseResult = {
  events: NormalizedSettledPointsEvent[];
  issues: SettledPointsImportIssue[];
  inputCount: number;
};

export type ApplySettledPointsResult = {
  attempts: EventAttemptV1[];
  updatedMatchIds: string[];
  matchedCount: number;
  updatedCount: number;
  unchangedCount: number;
  noLocalAttemptCount: number;
  mismatchCount: number;
  issues: SettledPointsImportIssue[];
};

function isObjectRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function hasSettledField(v: unknown): v is { settled: unknown } {
  return isObjectRecord(v) && "settled" in v;
}

function pickSettledCandidates(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) {
    return payload.map((x) => (hasSettledField(x) ? x.settled : x));
  }
  if (!isObjectRecord(payload)) return null;

  if (Array.isArray(payload.settledEvents)) {
    return payload.settledEvents;
  }
  if (Array.isArray(payload.records)) {
    return payload.records.map((x) => (hasSettledField(x) ? x.settled : x));
  }
  if ("settled" in payload) {
    return [payload.settled];
  }
  if ("matchId" in payload && "pointsDeltaA" in payload && "source" in payload) {
    return [payload];
  }
  return null;
}

function normalizeWinnerFromSettled(input: LadderMatchSettledEventV1): SettledPointsWinner {
  const winner = input.winner.toLowerCase();
  const playerA = input.playerA.toLowerCase();
  const playerB = input.playerB.toLowerCase();
  if (winner === playerA) return 0;
  if (winner === playerB) return 1;
  return "draw";
}

function normalizeSettledEvent(input: LadderMatchSettledEventV1): NormalizedSettledPointsEvent {
  validateLadderMatchSettledEventV1(input);
  return {
    matchId: input.matchId.toLowerCase(),
    pointsDeltaA: input.pointsDeltaA,
    winner: normalizeWinnerFromSettled(input),
    tilesA: input.tilesA,
    tilesB: input.tilesB,
  };
}

function sameSettledEvent(a: NormalizedSettledPointsEvent, b: NormalizedSettledPointsEvent): boolean {
  return a.pointsDeltaA === b.pointsDeltaA &&
    a.winner === b.winner &&
    a.tilesA === b.tilesA &&
    a.tilesB === b.tilesB;
}

export function parseSettledPointsImportJson(text: string): SettledPointsParseResult {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch (error: unknown) {
    return {
      events: [],
      inputCount: 0,
      issues: [{
        code: "json_parse_failed",
        message: error instanceof Error ? error.message : "Invalid JSON input",
      }],
    };
  }

  const candidates = pickSettledCandidates(payload);
  if (candidates === null) {
    return {
      events: [],
      inputCount: 0,
      issues: [{
        code: "schema_unsupported",
        message: "Unsupported schema. Use settledEvents[], records[].settled, or settled event array.",
      }],
    };
  }

  const issues: SettledPointsImportIssue[] = [];
  const uniqueByMatchId = new Map<string, NormalizedSettledPointsEvent>();

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    try {
      const normalized = normalizeSettledEvent(candidate as LadderMatchSettledEventV1);
      const existing = uniqueByMatchId.get(normalized.matchId);
      if (!existing) {
        uniqueByMatchId.set(normalized.matchId, normalized);
        continue;
      }
      if (!sameSettledEvent(existing, normalized)) {
        issues.push({
          code: "duplicate_conflict",
          message: "Conflicting duplicate settled event for matchId.",
          index: i,
          matchId: normalized.matchId,
        });
      }
    } catch (error: unknown) {
      issues.push({
        code: "settled_invalid",
        message: error instanceof Error ? error.message : "Invalid settled event",
        index: i,
      });
    }
  }

  return {
    inputCount: candidates.length,
    events: Array.from(uniqueByMatchId.values()),
    issues,
  };
}

export function applySettledPointsToAttempts(
  attempts: EventAttemptV1[],
  settledEvents: NormalizedSettledPointsEvent[],
): ApplySettledPointsResult {
  const issues: SettledPointsImportIssue[] = [];
  const attemptByMatchId = new Map<string, EventAttemptV1>();
  for (const attempt of attempts) {
    attemptByMatchId.set(attempt.matchId.toLowerCase(), attempt);
  }

  const nextByMatchId = new Map<string, EventAttemptV1>();
  const updatedMatchIds = new Set<string>();

  let matchedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let noLocalAttemptCount = 0;
  let mismatchCount = 0;

  for (const settled of settledEvents) {
    const key = settled.matchId.toLowerCase();
    const current = attemptByMatchId.get(key);
    if (!current) {
      noLocalAttemptCount++;
      issues.push({
        code: "no_local_attempt",
        matchId: key,
        message: "No local event attempt found for this matchId.",
      });
      continue;
    }

    matchedCount++;

    if (settled.winner === "draw") {
      mismatchCount++;
      issues.push({
        code: "draw_not_supported",
        matchId: key,
        message: "Draw settled event cannot map to local event attempt winner.",
      });
      continue;
    }
    if (current.winner !== settled.winner) {
      mismatchCount++;
      issues.push({
        code: "winner_mismatch",
        matchId: key,
        message: "Winner mismatch between settled event and local attempt.",
      });
      continue;
    }
    if (current.tilesA !== settled.tilesA || current.tilesB !== settled.tilesB) {
      mismatchCount++;
      issues.push({
        code: "tiles_mismatch",
        matchId: key,
        message: "Tile count mismatch between settled event and local attempt.",
      });
      continue;
    }

    if (current.pointsDeltaA === settled.pointsDeltaA && current.pointsDeltaSource === "settled_attested") {
      unchangedCount++;
      continue;
    }

    const nextAttempt: EventAttemptV1 = {
      ...current,
      pointsDeltaA: settled.pointsDeltaA,
      pointsDeltaSource: "settled_attested",
    };
    nextByMatchId.set(key, nextAttempt);
    updatedMatchIds.add(key);
    updatedCount++;
  }

  const nextAttempts = attempts.map((attempt) => nextByMatchId.get(attempt.matchId.toLowerCase()) ?? attempt);

  return {
    attempts: nextAttempts,
    updatedMatchIds: Array.from(updatedMatchIds),
    matchedCount,
    updatedCount,
    unchangedCount,
    noLocalAttemptCount,
    mismatchCount,
    issues,
  };
}
