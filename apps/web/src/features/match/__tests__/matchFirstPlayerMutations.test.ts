import { describe, expect, it } from "vitest";
import {
  buildRandomizeCommitRevealPatch,
  buildRandomizeCommittedMutualChoicePatch,
  buildRandomizeSeedResolutionPatch,
  deriveCommitRevealCommits,
  deriveCommittedMutualChoiceCommits,
} from "@/features/match/matchFirstPlayerMutations";

const BYTES32_HEX = /^0x[0-9a-f]{64}$/i;

describe("features/match/matchFirstPlayerMutations", () => {
  it("builds randomize patches with expected keys and bytes32 values", () => {
    const commitReveal = buildRandomizeCommitRevealPatch();
    expect(commitReveal.fps).toMatch(BYTES32_HEX);
    expect(commitReveal.fra).toMatch(BYTES32_HEX);
    expect(commitReveal.frb).toMatch(BYTES32_HEX);
    expect(commitReveal.fca).toBe("");
    expect(commitReveal.fcb).toBe("");

    const committedMutual = buildRandomizeCommittedMutualChoicePatch();
    expect(committedMutual.fps).toMatch(BYTES32_HEX);
    expect(committedMutual.fpna).toMatch(BYTES32_HEX);
    expect(committedMutual.fpnb).toMatch(BYTES32_HEX);
    expect(committedMutual.fcoa).toBe("");
    expect(committedMutual.fcob).toBe("");

    const seed = buildRandomizeSeedResolutionPatch();
    expect(seed.fps).toMatch(BYTES32_HEX);
    expect(seed.fpsd).toMatch(BYTES32_HEX);
  });

  it("derives commit-reveal commits from valid bytes32 inputs", () => {
    const derived = deriveCommitRevealCommits({
      matchSalt: `0x${"11".repeat(32)}`,
      revealA: `0x${"22".repeat(32)}`,
      revealB: `0x${"33".repeat(32)}`,
    });
    expect(derived).not.toBeNull();
    expect(derived?.fca).toMatch(BYTES32_HEX);
    expect(derived?.fcb).toMatch(BYTES32_HEX);
  });

  it("returns null for invalid commit-reveal inputs", () => {
    const invalid = deriveCommitRevealCommits({
      matchSalt: "0x1234",
      revealA: `0x${"22".repeat(32)}`,
      revealB: `0x${"33".repeat(32)}`,
    });
    expect(invalid).toBeNull();
  });

  it("derives committed mutual-choice commits from valid inputs", () => {
    const derived = deriveCommittedMutualChoiceCommits({
      matchSalt: `0x${"44".repeat(32)}`,
      playerA: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
      playerB: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
      firstPlayerA: 0,
      firstPlayerB: 1,
      nonceA: `0x${"55".repeat(32)}`,
      nonceB: `0x${"66".repeat(32)}`,
    });
    expect(derived).not.toBeNull();
    expect(derived?.fcoa).toMatch(BYTES32_HEX);
    expect(derived?.fcob).toMatch(BYTES32_HEX);
  });

  it("returns null for invalid committed mutual-choice inputs", () => {
    const invalid = deriveCommittedMutualChoiceCommits({
      matchSalt: `0x${"44".repeat(32)}`,
      playerA: "not-an-address",
      playerB: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
      firstPlayerA: 0,
      firstPlayerB: 1,
      nonceA: `0x${"55".repeat(32)}`,
      nonceB: `0x${"66".repeat(32)}`,
    });
    expect(invalid).toBeNull();
  });
});
