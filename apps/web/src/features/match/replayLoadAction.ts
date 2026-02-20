import type { CardData, MatchResultWithHistory, RulesetConfig, TranscriptV1 } from "@nyano/triad-engine";
import type { ParsedReplay } from "@/lib/replay_bundle";
import { parseReplayPayload } from "@/lib/replay_bundle";
import { resolveRulesetById } from "@/lib/ruleset_registry";
import { resolveReplayRulesetFromParams } from "@/features/match/replayRulesetParams";
import type { ReplayMode } from "@/features/match/replayModeParams";
import { resolveReplayCardsFromPayload } from "@/features/match/replayCardLoaders";
import { resolveReplaySimulationState } from "@/features/match/replaySimulationState";
import { clampInt } from "@/features/match/replayUiHelpers";

type ReplayLoadDeps = {
  parseReplayPayload: typeof parseReplayPayload;
  resolveReplayRulesetFromParams: typeof resolveReplayRulesetFromParams;
  resolveRulesetById: typeof resolveRulesetById;
  resolveReplayCardsFromPayload: typeof resolveReplayCardsFromPayload;
  resolveReplaySimulationState: typeof resolveReplaySimulationState;
  clampInt: typeof clampInt;
};

const DEFAULT_DEPS: ReplayLoadDeps = {
  parseReplayPayload,
  resolveReplayRulesetFromParams,
  resolveRulesetById,
  resolveReplayCardsFromPayload,
  resolveReplaySimulationState,
  clampInt,
};

export type ReplayLoadActionResult = {
  transcript: TranscriptV1;
  cards: Map<bigint, CardData>;
  owners: Map<bigint, `0x${string}`>;
  currentRulesetLabel: string;
  resolvedRuleset: RulesetConfig | null;
  rulesetIdMismatchWarning: string | null;
  current: MatchResultWithHistory;
  v1: MatchResultWithHistory;
  v2: MatchResultWithHistory;
  startStep: number;
};

export async function runReplayLoadAction(
  input: {
    text: string;
    mode: ReplayMode;
    searchParams: URLSearchParams;
    override?: { text?: string; mode?: ReplayMode; step?: number };
  },
  depsPartial?: Partial<ReplayLoadDeps>,
): Promise<ReplayLoadActionResult> {
  const deps: ReplayLoadDeps = { ...DEFAULT_DEPS, ...(depsPartial ?? {}) };
  const inputText = (input.override?.text ?? input.text).trim();
  if (!inputText) throw new Error("transcript JSON が空です");

  const parsed = deps.parseReplayPayload(inputText);
  const transcript = parsed.transcript;
  const mode0 = input.override?.mode ?? input.mode;
  const fallbackRulesetFromParams = deps.resolveReplayRulesetFromParams(
    input.searchParams.get("rk"),
    input.searchParams.get("cr"),
  );
  const rulesetById = deps.resolveRulesetById(transcript.header.rulesetId);
  const {
    cards,
    owners,
  } = await deps.resolveReplayCardsFromPayload({ parsed: parsed as ParsedReplay });
  const {
    currentRulesetLabel,
    resolvedRuleset,
    rulesetIdMismatchWarning,
    current,
    v1,
    v2,
  } = deps.resolveReplaySimulationState({
    transcript,
    cards,
    mode: mode0,
    rulesetById,
    fallbackRulesetFromParams,
  });
  const stepMax = current.boardHistory.length - 1;
  const startStep = deps.clampInt(input.override?.step ?? 0, 0, stepMax);

  return {
    transcript,
    cards,
    owners,
    currentRulesetLabel,
    resolvedRuleset,
    rulesetIdMismatchWarning,
    current,
    v1,
    v2,
    startStep,
  };
}
