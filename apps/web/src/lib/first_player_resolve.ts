import {
  buildFirstPlayerRevealCommitV1,
  deriveFirstPlayerFromCommitRevealV1,
  resolveFirstPlayerByMutualChoiceV1,
  verifyFirstPlayerRevealCommitV1,
  type PlayerIndex,
} from "@nyano/triad-engine";

export type FirstPlayerResolutionMode = "manual" | "mutual" | "commit_reveal";

export interface FirstPlayerResolution {
  firstPlayer: PlayerIndex;
  valid: boolean;
  mode: FirstPlayerResolutionMode;
  error?: string;
}

const BYTES32_RE = /^0x[0-9a-fA-F]{64}$/;

export function parseFirstPlayerResolutionMode(v: string | null): FirstPlayerResolutionMode {
  if (v === "mutual") return "mutual";
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

export interface ResolveFirstPlayerInput {
  mode: FirstPlayerResolutionMode;
  manualFirstPlayer: PlayerIndex;
  mutualChoiceA: PlayerIndex;
  mutualChoiceB: PlayerIndex;
  commitReveal?: {
    matchSalt: string;
    revealA: string;
    revealB: string;
    commitA?: string;
    commitB?: string;
  };
}

export function resolveFirstPlayer(input: ResolveFirstPlayerInput): FirstPlayerResolution {
  if (input.mode === "manual") {
    return { firstPlayer: input.manualFirstPlayer, valid: true, mode: "manual" };
  }

  if (input.mode === "mutual") {
    try {
      const fp = resolveFirstPlayerByMutualChoiceV1(input.mutualChoiceA, input.mutualChoiceB);
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
  if (commitA.length > 0) {
    if (!isBytes32Hex(commitA)) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "commit_reveal",
        error: "Commit A must be bytes32 hex.",
      };
    }
    const ok = verifyFirstPlayerRevealCommitV1(commitA, {
      matchSalt: cr.matchSalt,
      reveal: cr.revealA,
    });
    if (!ok) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "commit_reveal",
        error: "Commit A does not match Reveal A.",
      };
    }
  }

  const commitB = cr.commitB?.trim() ?? "";
  if (commitB.length > 0) {
    if (!isBytes32Hex(commitB)) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "commit_reveal",
        error: "Commit B must be bytes32 hex.",
      };
    }
    const ok = verifyFirstPlayerRevealCommitV1(commitB, {
      matchSalt: cr.matchSalt,
      reveal: cr.revealB,
    });
    if (!ok) {
      return {
        firstPlayer: input.manualFirstPlayer,
        valid: false,
        mode: "commit_reveal",
        error: "Commit B does not match Reveal B.",
      };
    }
  }

  const fp = deriveFirstPlayerFromCommitRevealV1({
    matchSalt: cr.matchSalt,
    revealA: cr.revealA,
    revealB: cr.revealB,
  });
  return { firstPlayer: fp, valid: true, mode: "commit_reveal" };
}
