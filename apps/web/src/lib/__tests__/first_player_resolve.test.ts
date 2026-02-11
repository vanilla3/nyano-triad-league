import { describe, it, expect } from "vitest";
import { buildFirstPlayerRevealCommitV1 } from "@nyano/triad-engine";
import {
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

describe("resolveFirstPlayer", () => {
  const bytes32A = `0x${"11".repeat(32)}` as `0x${string}`;
  const bytes32B = `0x${"22".repeat(32)}` as `0x${string}`;
  const bytes32C = `0x${"33".repeat(32)}` as `0x${string}`;

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
    });

    expect(r.valid).toBe(true);
  });

  it("commit_reveal mode rejects mismatched reveal commit", () => {
    const badCommitA = buildFirstPlayerRevealCommitV1({ matchSalt: bytes32A, reveal: bytes32C });

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
      },
    });

    expect(r.valid).toBe(false);
    expect(r.firstPlayer).toBe(1);
    expect(r.error).toContain("does not match");
  });
});
