import type { CardData, MatchResultWithHistory, RulesetConfig, TranscriptV1 } from "@nyano/triad-engine";

export type ReplaySimState =
  | { ok: false; error: string }
  | {
      ok: true;
      transcript: TranscriptV1;
      cards: Map<bigint, CardData>;
      owners: Map<bigint, `0x${string}`>;
      currentRulesetLabel: string;
      resolvedRuleset: RulesetConfig | null;
      rulesetIdMismatchWarning: string | null;
      current: MatchResultWithHistory;
      v1: MatchResultWithHistory;
      v2: MatchResultWithHistory;
    };

export const REPLAY_INPUT_PROMPT_ERROR = "transcript JSON を貼り付けて読み込んでください。";

export function buildReplaySimErrorState(error: string): ReplaySimState {
  return { ok: false, error };
}

export function buildReplaySimSuccessState(input: {
  transcript: TranscriptV1;
  cards: Map<bigint, CardData>;
  owners: Map<bigint, `0x${string}`>;
  currentRulesetLabel: string;
  resolvedRuleset: RulesetConfig | null;
  rulesetIdMismatchWarning: string | null;
  current: MatchResultWithHistory;
  v1: MatchResultWithHistory;
  v2: MatchResultWithHistory;
}): ReplaySimState {
  return {
    ok: true,
    transcript: input.transcript,
    cards: input.cards,
    owners: input.owners,
    currentRulesetLabel: input.currentRulesetLabel,
    resolvedRuleset: input.resolvedRuleset,
    rulesetIdMismatchWarning: input.rulesetIdMismatchWarning,
    current: input.current,
    v1: input.v1,
    v2: input.v2,
  };
}
