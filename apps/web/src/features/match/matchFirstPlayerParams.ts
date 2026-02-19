import type { PlayerIndex } from "@nyano/triad-engine";
import {
  resolveFirstPlayer,
  type FirstPlayerResolution,
  type FirstPlayerResolutionMode,
} from "@/lib/first_player_resolve";

export type ResolveMatchFirstPlayerInput = {
  mode: FirstPlayerResolutionMode;
  manualFirstPlayerParam: PlayerIndex;
  mutualChoiceAParam: PlayerIndex;
  mutualChoiceBParam: PlayerIndex;
  commitRevealSaltParam: string;
  seedResolutionParam: string;
  committedMutualPlayerAParam: string;
  committedMutualPlayerBParam: string;
  committedMutualNonceAParam: string;
  committedMutualNonceBParam: string;
  committedMutualCommitAParam: string;
  committedMutualCommitBParam: string;
  commitRevealAParam: string;
  commitRevealBParam: string;
  commitRevealCommitAParam: string;
  commitRevealCommitBParam: string;
};

export function resolveMatchFirstPlayer(
  input: ResolveMatchFirstPlayerInput,
): FirstPlayerResolution {
  return resolveFirstPlayer({
    mode: input.mode,
    manualFirstPlayer: input.manualFirstPlayerParam,
    mutualChoiceA: input.mutualChoiceAParam,
    mutualChoiceB: input.mutualChoiceBParam,
    committedMutualChoice: {
      matchSalt: input.commitRevealSaltParam,
      playerA: input.committedMutualPlayerAParam,
      playerB: input.committedMutualPlayerBParam,
      choiceA: input.mutualChoiceAParam,
      choiceB: input.mutualChoiceBParam,
      nonceA: input.committedMutualNonceAParam,
      nonceB: input.committedMutualNonceBParam,
      commitA: input.committedMutualCommitAParam,
      commitB: input.committedMutualCommitBParam,
    },
    commitReveal: {
      matchSalt: input.commitRevealSaltParam,
      revealA: input.commitRevealAParam,
      revealB: input.commitRevealBParam,
      commitA: input.commitRevealCommitAParam,
      commitB: input.commitRevealCommitBParam,
    },
    seedResolution: {
      matchSalt: input.commitRevealSaltParam,
      seed: input.seedResolutionParam,
    },
  });
}

export function resolveEffectiveFirstPlayer(input: {
  isEvent: boolean;
  eventFirstPlayer: PlayerIndex | null;
  firstPlayerResolution: FirstPlayerResolution;
}): PlayerIndex {
  if (input.isEvent && input.eventFirstPlayer !== null) {
    return input.eventFirstPlayer;
  }
  return input.firstPlayerResolution.firstPlayer;
}
