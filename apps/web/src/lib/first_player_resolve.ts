import {
  buildFirstPlayerChoiceCommitV1,
  buildFirstPlayerRevealCommitV1,
  resolveFirstPlayerV1,
  verifyFirstPlayerRevealCommitV1,
  type PlayerIndex,
} from "@nyano/triad-engine";

export type FirstPlayerResolutionMode =
  | "manual"
  | "mutual"
  | "committed_mutual_choice"
  | "seed"
  | "commit_reveal";

export interface FirstPlayerResolution {
  firstPlayer: PlayerIndex;
  valid: boolean;
  mode: FirstPlayerResolutionMode;
  error?: string;
}

const BYTES32_RE = /^0x[0-9a-fA-F]{64}$/;

export function parseFirstPlayerResolutionMode(v: string | null): FirstPlayerResolutionMode {
  if (v === "mutual") return "mutual";
  if (v === "committed_mutual_choice") return "committed_mutual_choice";
  if (v === "seed") return "seed";
  if (v === "commit_reveal") return "commit_reveal";
  return "manual";
}

export function isBytes32Hex(v: string): v is `0x${string}` {
  return BYTES32_RE.test(v);
}

export function randomBytes32Hex(): `0x${string}` {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return (`0x${Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")}`) as `0x${string}`;
}

export function deriveRevealCommitHex(matchSalt: string, reveal: string): `0x${string}` | null {
  if (!isBytes32Hex(matchSalt) || !isBytes32Hex(reveal)) return null;
  return buildFirstPlayerRevealCommitV1({ matchSalt, reveal });
}

export function deriveChoiceCommitHex(input: {
  matchSalt: string;
  player: string;
  firstPlayer: PlayerIndex;
  nonce: string;
}): `0x${string}` | null {
  if (!isBytes32Hex(input.matchSalt) || !isBytes32Hex(input.nonce)) return null;
  try {
    return buildFirstPlayerChoiceCommitV1({
      matchSalt: input.matchSalt,
      player: input.player as `0x${string}`,
      firstPlayer: input.firstPlayer,
      nonce: input.nonce,
    });
  } catch {
    return null;
  }
}

export interface ResolveFirstPlayerInput {
  mode: FirstPlayerResolutionMode;
  manualFirstPlayer: PlayerIndex;
  mutualChoiceA: PlayerIndex;
  mutualChoiceB: PlayerIndex;
  committedMutualChoice?: {
    matchSalt: string;
    playerA: string;
    playerB: string;
    choiceA: PlayerIndex;
    choiceB: PlayerIndex;
    nonceA: string;
    nonceB: string;
    commitA?: string;
    commitB?: string;
  };
  commitReveal?: {
    matchSalt: string;
    revealA: string;
    revealB: string;
    commitA?: string;
    commitB?: string;
  };
  seedResolution?: {
    matchSalt: string;
    seed: string;
  };
}

export function resolveFirstPlayer(input: ResolveFirstPlayerInput): FirstPlayerResolution {
  if (input.mode === "manual") {
    return { firstPlayer: input.manualFirstPlayer, valid: true, mode: "manual" };
  }

  if (input.mode === "mutual") {
    try {
      const fp = resolveFirstPlayerV1({
        mode: "mutual_choice",
        choiceA: input.mutualChoiceA,
        choiceB: input.mutualChoiceB,
      });
      return { firstPlayer: fp, valid: true, mode: "mutual" };
    } catch {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "mutual",
        error: "Mutual choice mismatch (A/B must match).",
      };
    }
  }

  if (input.mode === "seed") {
    const sr = input.seedResolution;
    if (!sr) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "seed",
        error: "Seed inputs are missing.",
      };
    }

    if (!isBytes32Hex(sr.matchSalt)) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "seed",
        error: "Match salt must be bytes32 hex.",
      };
    }

    if (!isBytes32Hex(sr.seed)) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "seed",
        error: "Seed must be bytes32 hex.",
      };
    }

    const fp = resolveFirstPlayerV1({
      mode: "seed",
      matchSalt: sr.matchSalt,
      seed: sr.seed,
    });
    return { firstPlayer: fp, valid: true, mode: "seed" };
  }

  if (input.mode === "committed_mutual_choice") {
    const cmc = input.committedMutualChoice;
    if (!cmc) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "committed_mutual_choice",
        error: "Committed mutual-choice inputs are missing.",
      };
    }

    if (!isBytes32Hex(cmc.matchSalt)) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "committed_mutual_choice",
        error: "Match salt must be bytes32 hex.",
      };
    }
    if (!isBytes32Hex(cmc.nonceA) || !isBytes32Hex(cmc.nonceB)) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "committed_mutual_choice",
        error: "Nonce A/B must be bytes32 hex.",
      };
    }

    const commitA = cmc.commitA?.trim() ?? "";
    const commitB = cmc.commitB?.trim() ?? "";
    if (commitA.length === 0 || commitB.length === 0) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "committed_mutual_choice",
        error: "Commit A and Commit B are required.",
      };
    }
    if (!isBytes32Hex(commitA) || !isBytes32Hex(commitB)) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "committed_mutual_choice",
        error: "Commit A/B must be bytes32 hex.",
      };
    }

    try {
      const fp = resolveFirstPlayerV1({
        mode: "committed_mutual_choice",
        commitA,
        commitB,
        revealA: {
          matchSalt: cmc.matchSalt,
          player: cmc.playerA as `0x${string}`,
          firstPlayer: cmc.choiceA,
          nonce: cmc.nonceA,
        },
        revealB: {
          matchSalt: cmc.matchSalt,
          player: cmc.playerB as `0x${string}`,
          firstPlayer: cmc.choiceB,
          nonce: cmc.nonceB,
        },
      });
      return { firstPlayer: fp, valid: true, mode: "committed_mutual_choice" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Committed mutual-choice resolve failed.";
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "committed_mutual_choice",
        error: message,
      };
    }
  }

  const cr = input.commitReveal;
  if (!cr) {
    return {
      firstPlayer: input.manualFirstPlayer,
      valid: false,
      mode: "commit_reveal",
      error: "Commit-reveal inputs are missing.",
    };
  }

  if (!isBytes32Hex(cr.matchSalt)) {
    return {
      firstPlayer: input.manualFirstPlayer,
      valid: false,
      mode: "commit_reveal",
      error: "Match salt must be bytes32 hex.",
    };
  }
  if (!isBytes32Hex(cr.revealA)) {
    return {
      firstPlayer: input.manualFirstPlayer,
      valid: false,
      mode: "commit_reveal",
      error: "Reveal A must be bytes32 hex.",
    };
  }
  if (!isBytes32Hex(cr.revealB)) {
    return {
      firstPlayer: input.manualFirstPlayer,
      valid: false,
      mode: "commit_reveal",
      error: "Reveal B must be bytes32 hex.",
    };
  }

  const commitA = cr.commitA?.trim() ?? "";
  const commitB = cr.commitB?.trim() ?? "";
  if (commitA.length > 0 || commitB.length > 0) {
    if (commitA.length === 0 || commitB.length === 0) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "commit_reveal",
        error: "Commit A and Commit B must be provided together.",
      };
    }

    if (!isBytes32Hex(commitA)) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "commit_reveal",
        error: "Commit A must be bytes32 hex.",
      };
    }
    if (!isBytes32Hex(commitB)) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "commit_reveal",
        error: "Commit B must be bytes32 hex.",
      };
    }
    const okA = verifyFirstPlayerRevealCommitV1(commitA, {
      matchSalt: cr.matchSalt,
      reveal: cr.revealA,
    });
    if (!okA) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "commit_reveal",
        error: "Commit A does not match Reveal A.",
      };
    }
    const okB = verifyFirstPlayerRevealCommitV1(commitB, {
      matchSalt: cr.matchSalt,
      reveal: cr.revealB,
    });
    if (!okB) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "commit_reveal",
        error: "Commit B does not match Reveal B.",
      };
    }
  }

  const commitPair =
    commitA.length > 0 && commitB.length > 0
      ? {
          commitA: commitA as `0x${string}`,
          commitB: commitB as `0x${string}`,
        }
      : undefined;

  const fp = resolveFirstPlayerV1({
    mode: "commit_reveal",
    matchSalt: cr.matchSalt,
    revealA: cr.revealA,
    revealB: cr.revealB,
    ...(commitPair ?? {}),
  });
  return { firstPlayer: fp, valid: true, mode: "commit_reveal" };
}
