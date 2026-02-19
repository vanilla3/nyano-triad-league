import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import type { RulesetKey } from "@/lib/ruleset_registry";
import { buildMatchReplayShareUrl } from "@/features/match/matchReplayShare";

export type MatchShareQrInput = {
  transcript: TranscriptV1 | null;
  cards: Map<bigint, CardData> | null;
  eventId?: string;
  ui?: string;
  rulesetKey?: RulesetKey;
  classicMask?: string;
};

type ResolveMatchShareQrUrlDeps = {
  buildReplayShareUrl?: typeof buildMatchReplayShareUrl;
};

export function resolveMatchShareQrUrl(
  input: MatchShareQrInput,
  deps?: ResolveMatchShareQrUrlDeps,
): string | null {
  if (!input.transcript) return null;

  const buildReplayShareUrl = deps?.buildReplayShareUrl ?? buildMatchReplayShareUrl;
  return buildReplayShareUrl({
    transcript: input.transcript,
    cards: input.cards,
    step: 9,
    eventId: input.eventId,
    ui: input.ui,
    rulesetKey: input.rulesetKey,
    classicMask: input.classicMask,
    absolute: true,
  });
}

