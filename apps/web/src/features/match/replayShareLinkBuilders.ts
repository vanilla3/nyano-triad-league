import type { TranscriptV1 } from "@nyano/triad-engine";
import { buildReplayShareLink } from "@/features/match/replayShareLinks";
import type { ReplayMode as ReplayShareMode } from "@/lib/appUrl";

export type ReplayShareLinkBaseInput = {
  text: string;
  transcript: TranscriptV1 | null;
  emptyError: string;
  eventId?: string;
  pointsDeltaA?: number | null;
  ui?: string;
  rulesetKey?: string;
  classicMask?: string;
  absolute?: boolean;
};

type ReplayShareLinkBuilderDeps = {
  buildReplayShareLink: typeof buildReplayShareLink;
};

const DEFAULT_DEPS: ReplayShareLinkBuilderDeps = {
  buildReplayShareLink,
};

export function buildReplayCanonicalShareLink(
  input: ReplayShareLinkBaseInput,
  depsPartial?: Partial<ReplayShareLinkBuilderDeps>,
): string {
  const deps: ReplayShareLinkBuilderDeps = { ...DEFAULT_DEPS, ...(depsPartial ?? {}) };
  return deps.buildReplayShareLink({
    ...input,
    mode: "auto",
    step: 9,
  });
}

export function buildReplayCurrentShareLink(
  input: ReplayShareLinkBaseInput & {
    mode?: ReplayShareMode;
    step?: number;
  },
  depsPartial?: Partial<ReplayShareLinkBuilderDeps>,
): string {
  const deps: ReplayShareLinkBuilderDeps = { ...DEFAULT_DEPS, ...(depsPartial ?? {}) };
  return deps.buildReplayShareLink({
    ...input,
    mode: input.mode,
    step: input.step,
  });
}
