import { describe, it, expect } from "vitest";
import { buildFirstPlayerChoiceCommitV1, buildFirstPlayerRevealCommitV1 } from "@nyano/triad-engine";
import {
  deriveChoiceCommitHex,
  deriveRevealCommitHex,
  isBytes32Hex,
  parseFirstPlayerResolutionMode,
  resolveFirstPlayer,
} from "../first_player_resolve";

describe("parseFirstPlayerResolutionMode", () => {
  it("defaults to manual", () => {
    expect(parseFirstPlayerResolutionMode(null)).toBe("manual");
    expect(parseFirstPlayerResolutionMode("unknown")).toBe("manual");
  });

  it("parses supported values", () => {
    expect(parseFirstPlayerResolutionMode("manual")).toBe("manual");
    expect(parseFirstPlayerResolutionMode("mutual")).toBe("mutual");
    expect(parseFirstPlayerResolutionMode("committed_mutual_choice")).toBe("committed_mutual_choice");
    expect(parseFirstPlayerResolutionMode("seed")).toBe("seed");
    expect(parseFirstPlayerResolutionMode("commit_reveal")).toBe("commit_reveal");
  });
});

describe("isBytes32Hex", () => {
  it("accepts 0x-prefixed 32-byte hex", () => {
    expect(isBytes32Hex(`0x${"ab".repeat(32)}`)).toBe(true);
  });

  it("rejects malformed values", () => {
    expect(isBytes32Hex("0x1234")).toBe(false);
    expect(isBytes32Hex(`0x${"zz".repeat(32)}`)).toBe(false);
    expect(isBytes32Hex("")).toBe(false);
  });
});

describe("deriveRevealCommitHex", () => {
  const salt = `0x${"11".repeat(32)}`;
  const reveal = `0x${"22".repeat(32)}`;

  it("returns commit hex for valid inputs", () => {
    const commit = deriveRevealCommitHex(salt, reveal);
    expect(commit).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("returns null for invalid inputs", () => {
    expect(deriveRevealCommitHex("0x1234", reveal)).toBeNull();
    expect(deriveRevealCommitHex(salt, "not-hex")).toBeNull();
  });
});

describe("deriveChoiceCommitHex", () => {
  const salt = `0x${"11".repeat(32)}`;
  const nonce = `0x${"22".repeat(32)}`;
  const player = "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa";

  it("returns commit hex for valid inputs", () => {
    const commit = deriveChoiceCommitHex({
      matchSalt: salt,
      player,
      firstPlayer: 0,
      nonce,
    });
    expect(commit).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("returns null for invalid inputs", () => {
    expect(
      deriveChoiceCommitHex({
        matchSalt: "0x1234",
        player,
        firstPlayer: 0,
        nonce,
      }),
    ).toBeNull();
    expect(
      deriveChoiceCommitHex({
        matchSalt: salt,
        player: "not-an-address",
        firstPlayer: 1,
        nonce,
      }),
    ).toBeNull();
  });
});

describe("resolveFirstPlayer", () => {
  const bytes32A = `0x${"11".repeat(32)}` as `0x${string}`;
  const bytes32B = `0x${"22".repeat(32)}` as `0x${string}`;
  const bytes32C = `0x${"33".repeat(32)}` as `0x${string}`;
  const bytes32D = `0x${"44".repeat(32)}` as `0x${string}`;
  const playerA = "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa";
  const playerB = "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB";

  it("manual mode uses manual firstPlayer", () => {
    const r = resolveFirstPlayer({
      mode: "manual",
      manualFirstPlayer: 1,
      mutualChoiceA: 0,
      mutualChoiceB: 0,
    });
    expect(r.valid).toBe(true);
    expect(r.firstPlayer).toBe(1);
  });

  it("mutual mode succeeds when both choices match", () => {
    const r = resolveFirstPlayer({
      mode: "mutual",
      manualFirstPlayer: 0,
      mutualChoiceA: 1,
      mutualChoiceB: 1,
    });
    expect(r.valid).toBe(true);
    expect(r.firstPlayer).toBe(1);
  });

  it("mutual mode falls back when choices mismatch", () => {
    const r = resolveFirstPlayer({
      mode: "mutual",
      manualFirstPlayer: 0,
      mutualChoiceA: 0,
      mutualChoiceB: 1,
    });
    expect(r.valid).toBe(false);
    expect(r.firstPlayer).toBe(0);
    expect(r.error).toContain("mismatch");
  });

  it("seed mode resolves deterministically", () => {
    const a = resolveFirstPlayer({
      mode: "seed",
      manualFirstPlayer: 0,
      mutualChoiceA: 0,
      mutualChoiceB: 0,
      seedResolution: {
        matchSalt: bytes32A,
        seed: bytes32B,
      },
    });
    const b = resolveFirstPlayer({
      mode: "seed",
      manualFirstPlayer: 1,
      mutualChoiceA: 1,
      mutualChoiceB: 1,
      seedResolution: {
        matchSalt: bytes32A,
        seed: bytes32B,
      },
    });
    expect(a.valid).toBe(true);
    expect(b.valid).toBe(true);
    expect(a.firstPlayer).toBe(b.firstPlayer);
  });

  it("seed mode falls back on invalid bytes32", () => {
    const r = resolveFirstPlayer({
      mode: "seed",
      manualFirstPlayer: 1,
      mutualChoiceA: 0,
      mutualChoiceB: 0,
      seedResolution: {
        matchSalt: bytes32A,
        seed: "0x1234",
      },
    });
    expect(r.valid).toBe(false);
    expect(r.firstPlayer).toBe(1);
    expect(r.error).toContain("Seed must be bytes32");
  });

  it("committed_mutual_choice mode resolves after commit checks", () => {
    const commitA = buildFirstPlayerChoiceCommitV1({
      matchSalt: bytes32A,
      player: playerA,
      firstPlayer: 0,
      nonce: bytes32B,
    });
    const commitB = buildFirstPlayerChoiceCommitV1({
      matchSalt: bytes32A,
      player: playerB,
      firstPlayer: 0,
      nonce: bytes32C,
    });

    const r = resolveFirstPlayer({
      mode: "committed_mutual_choice",
      manualFirstPlayer: 1,
      mutualChoiceA: 1,
      mutualChoiceB: 1,
      committedMutualChoice: {
        matchSalt: bytes32A,
        playerA,
        playerB,
        choiceA: 0,
        choiceB: 0,
        nonceA: bytes32B,
        nonceB: bytes32C,
        commitA,
        commitB,
      },
    });

    expect(r.valid).toBe(true);
    expect(r.firstPlayer).toBe(0);
  });

  it("committed_mutual_choice mode falls back on missing commits", () => {
    const r = resolveFirstPlayer({
      mode: "committed_mutual_choice",
      manualFirstPlayer: 1,
      mutualChoiceA: 0,
      mutualChoiceB: 0,
      committedMutualChoice: {
        matchSalt: bytes32A,
        playerA,
        playerB,
        choiceA: 0,
        choiceB: 0,
        nonceA: bytes32B,
        nonceB: bytes32C,
      },
    });

    expect(r.valid).toBe(false);
    expect(r.firstPlayer).toBe(1);
    expect(r.error).toContain("required");
  });

  it("committed_mutual_choice mode rejects mismatched commit", () => {
    const commitA = buildFirstPlayerChoiceCommitV1({
      matchSalt: bytes32A,
      player: playerA,
      firstPlayer: 0,
      nonce: bytes32B,
    });
    const wrongCommitB = buildFirstPlayerChoiceCommitV1({
      matchSalt: bytes32A,
      player: playerB,
      firstPlayer: 1,
      nonce: bytes32D,
    });

    const r = resolveFirstPlayer({
      mode: "committed_mutual_choice",
      manualFirstPlayer: 1,
      mutualChoiceA: 0,
      mutualChoiceB: 0,
      committedMutualChoice: {
        matchSalt: bytes32A,
        playerA,
        playerB,
        choiceA: 0,
        choiceB: 0,
        nonceA: bytes32B,
        nonceB: bytes32C,
        commitA,
        commitB: wrongCommitB,
      },
    });

    expect(r.valid).toBe(false);
    expect(r.firstPlayer).toBe(1);
    expect(r.error).toContain("mismatch");
  });

  it("commit_reveal mode resolves deterministically", () => {
    const a = resolveFirstPlayer({
      mode: "commit_reveal",
      manualFirstPlayer: 0,
      mutualChoiceA: 0,
      mutualChoiceB: 0,
      commitReveal: {
        matchSalt: bytes32A,
        revealA: bytes32B,
        revealB: bytes32C,
      },
      seedResolution: {
        matchSalt: bytes32A,
        seed: bytes32B,
      },
    });
    const b = resolveFirstPlayer({
      mode: "commit_reveal",
      manualFirstPlayer: 0,
      mutualChoiceA: 0,
      mutualChoiceB: 0,
      commitReveal: {
        matchSalt: bytes32A,
        revealA: bytes32B,
        revealB: bytes32C,
      },
      seedResolution: {
        matchSalt: bytes32A,
        seed: bytes32B,
      },
    });
    expect(a.valid).toBe(true);
    expect(a.firstPlayer).toBe(b.firstPlayer);
  });

  it("commit_reveal mode falls back on invalid bytes32", () => {
    const r = resolveFirstPlayer({
      mode: "commit_reveal",
      manualFirstPlayer: 1,
      mutualChoiceA: 0,
      mutualChoiceB: 0,
      commitReveal: {
        matchSalt: "0x1234",
        revealA: bytes32B,
        revealB: bytes32C,
      },
      seedResolution: {
        matchSalt: bytes32A,
        seed: bytes32B,
      },
    });
    expect(r.valid).toBe(false);
    expect(r.firstPlayer).toBe(1);
    expect(r.error).toContain("bytes32");
  });

  it("commit_reveal mode accepts valid reveal commits", () => {
    const commitA = buildFirstPlayerRevealCommitV1({ matchSalt: bytes32A, reveal: bytes32B });
    const commitB = buildFirstPlayerRevealCommitV1({ matchSalt: bytes32A, reveal: bytes32C });

    const r = resolveFirstPlayer({
      mode: "commit_reveal",
      manualFirstPlayer: 0,
      mutualChoiceA: 0,
      mutualChoiceB: 0,
      commitReveal: {
        matchSalt: bytes32A,
        revealA: bytes32B,
        revealB: bytes32C,
        commitA,
        commitB,
      },
      seedResolution: {
        matchSalt: bytes32A,
        seed: bytes32B,
      },
    });

    expect(r.valid).toBe(true);
  });

  it("commit_reveal mode rejects mismatched reveal commit", () => {
    const badCommitA = buildFirstPlayerRevealCommitV1({ matchSalt: bytes32A, reveal: bytes32C });
    const commitB = buildFirstPlayerRevealCommitV1({ matchSalt: bytes32A, reveal: bytes32C });

    const r = resolveFirstPlayer({
      mode: "commit_reveal",
      manualFirstPlayer: 1,
      mutualChoiceA: 0,
      mutualChoiceB: 0,
      commitReveal: {
        matchSalt: bytes32A,
        revealA: bytes32B,
        revealB: bytes32C,
        commitA: badCommitA,
        commitB,
      },
      seedResolution: {
        matchSalt: bytes32A,
        seed: bytes32B,
      },
    });

    expect(r.valid).toBe(false);
    expect(r.firstPlayer).toBe(1);
    expect(r.error).toContain("does not match");
  });

  it("commit_reveal mode rejects one-sided commit input", () => {
    const commitA = buildFirstPlayerRevealCommitV1({ matchSalt: bytes32A, reveal: bytes32B });

    const r = resolveFirstPlayer({
      mode: "commit_reveal",
      manualFirstPlayer: 1,
      mutualChoiceA: 0,
      mutualChoiceB: 0,
      commitReveal: {
        matchSalt: bytes32A,
        revealA: bytes32B,
        revealB: bytes32C,
        commitA,
      },
      seedResolution: {
        matchSalt: bytes32A,
        seed: bytes32B,
      },
    });

    expect(r.valid).toBe(false);
    expect(r.firstPlayer).toBe(1);
    expect(r.error).toContain("provided together");
  });
});
