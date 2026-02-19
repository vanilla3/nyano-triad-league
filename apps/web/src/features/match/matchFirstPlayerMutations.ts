import type { PlayerIndex } from "@nyano/triad-engine";
import {
  deriveChoiceCommitHex,
  deriveRevealCommitHex,
  randomBytes32Hex,
} from "@/lib/first_player_resolve";

export type CommitRevealRandomizePatch = {
  fps: `0x${string}`;
  fra: `0x${string}`;
  frb: `0x${string}`;
  fca: "";
  fcb: "";
};

export function buildRandomizeCommitRevealPatch(): CommitRevealRandomizePatch {
  return {
    fps: randomBytes32Hex(),
    fra: randomBytes32Hex(),
    frb: randomBytes32Hex(),
    fca: "",
    fcb: "",
  };
}

export type DeriveCommitRevealCommitsInput = {
  matchSalt: string;
  revealA: string;
  revealB: string;
};

export function deriveCommitRevealCommits(
  input: DeriveCommitRevealCommitsInput,
): { fca: `0x${string}`; fcb: `0x${string}` } | null {
  const commitA = deriveRevealCommitHex(input.matchSalt, input.revealA);
  const commitB = deriveRevealCommitHex(input.matchSalt, input.revealB);
  if (!commitA || !commitB) return null;
  return { fca: commitA, fcb: commitB };
}

export type CommittedMutualChoiceRandomizePatch = {
  fps: `0x${string}`;
  fpna: `0x${string}`;
  fpnb: `0x${string}`;
  fcoa: "";
  fcob: "";
};

export function buildRandomizeCommittedMutualChoicePatch(): CommittedMutualChoiceRandomizePatch {
  return {
    fps: randomBytes32Hex(),
    fpna: randomBytes32Hex(),
    fpnb: randomBytes32Hex(),
    fcoa: "",
    fcob: "",
  };
}

export type DeriveCommittedMutualChoiceCommitsInput = {
  matchSalt: string;
  playerA: string;
  playerB: string;
  firstPlayerA: PlayerIndex;
  firstPlayerB: PlayerIndex;
  nonceA: string;
  nonceB: string;
};

export function deriveCommittedMutualChoiceCommits(
  input: DeriveCommittedMutualChoiceCommitsInput,
): { fcoa: `0x${string}`; fcob: `0x${string}` } | null {
  const commitA = deriveChoiceCommitHex({
    matchSalt: input.matchSalt,
    player: input.playerA,
    firstPlayer: input.firstPlayerA,
    nonce: input.nonceA,
  });
  const commitB = deriveChoiceCommitHex({
    matchSalt: input.matchSalt,
    player: input.playerB,
    firstPlayer: input.firstPlayerB,
    nonce: input.nonceB,
  });
  if (!commitA || !commitB) return null;
  return { fcoa: commitA, fcob: commitB };
}

export type SeedResolutionRandomizePatch = {
  fps: `0x${string}`;
  fpsd: `0x${string}`;
};

export function buildRandomizeSeedResolutionPatch(): SeedResolutionRandomizePatch {
  return {
    fps: randomBytes32Hex(),
    fpsd: randomBytes32Hex(),
  };
}
