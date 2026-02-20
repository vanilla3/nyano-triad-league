import {
  resolveClassicOpenCardIndices,
  resolveClassicSwapIndices,
  type RulesetConfig,
  type TranscriptV1,
} from "@nyano/triad-engine";

type ReplayClassicSwap = ReturnType<typeof resolveClassicSwapIndices>;
type ReplayClassicOpen = ReturnType<typeof resolveClassicOpenCardIndices>;

export type ReplayClassicState = {
  replayClassicSwap: ReplayClassicSwap | null;
  replayClassicOpen: ReplayClassicOpen | null;
  replayOpenVisibleA: Set<number> | null;
  replayOpenVisibleB: Set<number> | null;
  shouldMaskReplayDeckSlots: boolean;
};

export function formatClassicOpenSlots(indices: readonly number[]): string {
  return indices.map((idx) => String(idx + 1)).join(", ");
}

export function resolveReplayClassicState(input: {
  simOk: boolean;
  ruleset: RulesetConfig | null;
  header: TranscriptV1["header"] | null;
  replayRevealHiddenSlots: boolean;
  resolveClassicSwapIndicesFn?: typeof resolveClassicSwapIndices;
  resolveClassicOpenCardIndicesFn?: typeof resolveClassicOpenCardIndices;
}): ReplayClassicState {
  if (!input.simOk || !input.ruleset || !input.header) {
    return {
      replayClassicSwap: null,
      replayClassicOpen: null,
      replayOpenVisibleA: null,
      replayOpenVisibleB: null,
      shouldMaskReplayDeckSlots: false,
    };
  }

  const resolveClassicSwapIndicesFn = input.resolveClassicSwapIndicesFn ?? resolveClassicSwapIndices;
  const resolveClassicOpenCardIndicesFn = input.resolveClassicOpenCardIndicesFn ?? resolveClassicOpenCardIndices;
  const replayClassicSwap = resolveClassicSwapIndicesFn({
    ruleset: input.ruleset,
    header: input.header,
  });
  const replayClassicOpen = resolveClassicOpenCardIndicesFn({
    ruleset: input.ruleset,
    header: input.header,
  });
  const replayOpenVisibleA = replayClassicOpen ? new Set<number>(replayClassicOpen.playerA) : null;
  const replayOpenVisibleB = replayClassicOpen ? new Set<number>(replayClassicOpen.playerB) : null;
  const shouldMaskReplayDeckSlots = replayClassicOpen?.mode === "three_open" && !input.replayRevealHiddenSlots;

  return {
    replayClassicSwap,
    replayClassicOpen,
    replayOpenVisibleA,
    replayOpenVisibleB,
    shouldMaskReplayDeckSlots,
  };
}
