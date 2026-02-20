import type { TranscriptV1 } from "@nyano/triad-engine";
import { buildReplayShareUrl, type ReplayMode as ReplayShareMode, type ReplayShareDataParam } from "@/lib/appUrl";
import { stringifyWithBigInt } from "@/lib/json";
import { buildReplayShareDataPayload } from "@/features/match/matchReplayShare";

export function resolveReplayShareJson(input: {
  text: string;
  transcript: TranscriptV1 | null;
  emptyError: string;
}): string {
  const trimmed = input.text.trim();
  if (trimmed) return trimmed;
  if (input.transcript) return stringifyWithBigInt(input.transcript);
  throw new Error(input.emptyError);
}

export function buildReplayShareLink(input: {
  text: string;
  transcript: TranscriptV1 | null;
  emptyError: string;
  eventId?: string;
  pointsDeltaA?: number | null;
  mode?: ReplayShareMode;
  ui?: string;
  rulesetKey?: string;
  classicMask?: string;
  step?: number;
  absolute?: boolean;
}, deps?: {
  buildReplayShareDataPayload?: (json: string) => ReplayShareDataParam;
  buildReplayShareUrl?: typeof buildReplayShareUrl;
}): string {
  const json = resolveReplayShareJson({
    text: input.text,
    transcript: input.transcript,
    emptyError: input.emptyError,
  });
  const data = (deps?.buildReplayShareDataPayload ?? buildReplayShareDataPayload)(json);
  return (deps?.buildReplayShareUrl ?? buildReplayShareUrl)({
    data,
    eventId: input.eventId,
    pointsDeltaA: input.pointsDeltaA ?? undefined,
    mode: input.mode,
    ui: input.ui,
    rulesetKey: input.rulesetKey,
    classicMask: input.classicMask,
    step: input.step,
    absolute: input.absolute,
  });
}
