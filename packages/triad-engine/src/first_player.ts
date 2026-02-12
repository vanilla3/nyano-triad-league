import { AbiCoder, getAddress, keccak256 } from "ethers";
import type { PlayerIndex } from "./types.js";

const coder = AbiCoder.defaultAbiCoder();
const HEX_32_RE = /^0x[0-9a-fA-F]{64}$/;

/**
 * Input for "a player commits their first-player choice" flow.
 *
 * Commit hash is deterministic and Solidity-compatible:
 *   keccak256(abi.encode(matchSalt, player, firstPlayer, nonce))
 */
export interface FirstPlayerChoiceCommitV1Input {
  /** Match salt / setup id (bytes32) used as anti-replay domain separator. */
  matchSalt: `0x${string}`;
  /** Committer address. */
  player: `0x${string}`;
  /** Chosen first player: 0=playerA, 1=playerB. */
  firstPlayer: PlayerIndex;
  /** 32-byte secret nonce. */
  nonce: `0x${string}`;
}

/**
 * Input for "two-secret commit-reveal coin toss" flow.
 *
 * First player is derived as:
 *   keccak256(abi.encode(matchSalt, revealA, revealB)) & 1
 */
export interface FirstPlayerCommitRevealV1Input {
  /** Match salt / setup id (bytes32). */
  matchSalt: `0x${string}`;
  /** Revealed 32-byte secret from playerA. */
  revealA: `0x${string}`;
  /** Revealed 32-byte secret from playerB. */
  revealB: `0x${string}`;
}

/**
 * Input for "commit-reveal with optional commit verification" flow.
 *
 * If commitA/commitB are provided, both are verified against revealA/revealB.
 */
export interface FirstPlayerCommitRevealResolutionV1Input extends FirstPlayerCommitRevealV1Input {
  /** Optional reveal-commit hash from playerA. Must be provided together with commitB. */
  commitA?: `0x${string}`;
  /** Optional reveal-commit hash from playerB. Must be provided together with commitA. */
  commitB?: `0x${string}`;
}

/**
 * Input for "shared seed decides first player" flow.
 *
 * First player is derived as:
 *   keccak256(abi.encode(matchSalt, seed)) & 1
 */
export interface FirstPlayerSeedV1Input {
  /** Match salt / setup id (bytes32) used as anti-replay domain separator. */
  matchSalt: `0x${string}`;
  /** Shared seed (e.g. agreed nonce / randomness beacon output). */
  seed: `0x${string}`;
}

/**
 * Input for "commit hash for a reveal secret" flow.
 *
 * Commit hash is deterministic and Solidity-compatible:
 *   keccak256(abi.encode(matchSalt, reveal))
 */
export interface FirstPlayerRevealCommitV1Input {
  /** Match salt / setup id (bytes32) used as anti-replay domain separator. */
  matchSalt: `0x${string}`;
  /** 32-byte secret reveal value. */
  reveal: `0x${string}`;
}

function assertBytes32(value: `0x${string}`, field: string): void {
  if (!HEX_32_RE.test(value)) {
    throw new Error(`${field} must be bytes32`);
  }
}

function assertPlayerIndex(value: number, field: string): asserts value is PlayerIndex {
  if (value !== 0 && value !== 1) {
    throw new Error(`${field} must be 0 or 1`);
  }
}

/**
 * Compute commit hash for a player's hidden first-player choice.
 */
export function buildFirstPlayerChoiceCommitV1(input: FirstPlayerChoiceCommitV1Input): `0x${string}` {
  assertBytes32(input.matchSalt, "matchSalt");
  assertBytes32(input.nonce, "nonce");
  assertPlayerIndex(input.firstPlayer, "firstPlayer");

  const player = getAddress(input.player);
  const encoded = coder.encode(
    ["bytes32", "address", "uint8", "bytes32"],
    [input.matchSalt, player, input.firstPlayer, input.nonce],
  );

  return keccak256(encoded) as `0x${string}`;
}

/**
 * Verify a commit against reveal parameters.
 */
export function verifyFirstPlayerChoiceCommitV1(
  commit: `0x${string}`,
  input: FirstPlayerChoiceCommitV1Input,
): boolean {
  assertBytes32(commit, "commit");
  return buildFirstPlayerChoiceCommitV1(input) === commit.toLowerCase();
}

/**
 * Compute commit hash for a player's hidden reveal secret.
 */
export function buildFirstPlayerRevealCommitV1(input: FirstPlayerRevealCommitV1Input): `0x${string}` {
  assertBytes32(input.matchSalt, "matchSalt");
  assertBytes32(input.reveal, "reveal");

  const encoded = coder.encode(
    ["bytes32", "bytes32"],
    [input.matchSalt, input.reveal],
  );

  return keccak256(encoded) as `0x${string}`;
}

/**
 * Verify reveal-secret commit against reveal parameters.
 */
export function verifyFirstPlayerRevealCommitV1(
  commit: `0x${string}`,
  input: FirstPlayerRevealCommitV1Input,
): boolean {
  assertBytes32(commit, "commit");
  return buildFirstPlayerRevealCommitV1(input) === commit.toLowerCase();
}

/**
 * Resolve first player from two revealed secrets (commit-reveal style).
 *
 * This function is deterministic and order-fixed (`revealA`, `revealB`).
 */
export function deriveFirstPlayerFromCommitRevealV1(input: FirstPlayerCommitRevealV1Input): PlayerIndex {
  assertBytes32(input.matchSalt, "matchSalt");
  assertBytes32(input.revealA, "revealA");
  assertBytes32(input.revealB, "revealB");

  const encoded = coder.encode(["bytes32", "bytes32", "bytes32"], [input.matchSalt, input.revealA, input.revealB]);
  const mixed = keccak256(encoded);
  const bit = Number(BigInt(mixed) & 1n);
  return bit as PlayerIndex;
}

/**
 * Resolve first player from commit-reveal and optionally verify commit hashes.
 *
 * This helper reduces integration mistakes by bundling:
 * - reveal validation
 * - optional commit/reveal consistency checks
 * - deterministic first-player derivation
 */
export function resolveFirstPlayerFromCommitRevealV1(
  input: FirstPlayerCommitRevealResolutionV1Input,
): PlayerIndex {
  const { commitA, commitB } = input;
  if (commitA !== undefined || commitB !== undefined) {
    if (commitA === undefined || commitB === undefined) {
      throw new Error("commitA and commitB must be provided together");
    }

    const okA = verifyFirstPlayerRevealCommitV1(commitA, {
      matchSalt: input.matchSalt,
      reveal: input.revealA,
    });
    if (!okA) throw new Error("commitA mismatch");

    const okB = verifyFirstPlayerRevealCommitV1(commitB, {
      matchSalt: input.matchSalt,
      reveal: input.revealB,
    });
    if (!okB) throw new Error("commitB mismatch");
  }

  return deriveFirstPlayerFromCommitRevealV1(input);
}

/**
 * Resolve first player from a single shared seed.
 *
 * Useful when both players already agreed on one randomness source
 * (or a trusted randomness output is available) and commit-reveal
 * is unnecessary for that match setup.
 */
export function deriveFirstPlayerFromSeedV1(input: FirstPlayerSeedV1Input): PlayerIndex {
  assertBytes32(input.matchSalt, "matchSalt");
  assertBytes32(input.seed, "seed");

  const encoded = coder.encode(["bytes32", "bytes32"], [input.matchSalt, input.seed]);
  const mixed = keccak256(encoded);
  const bit = Number(BigInt(mixed) & 1n);
  return bit as PlayerIndex;
}

/**
 * Resolve first player from explicit agreement.
 * Throws if both players did not agree on the same value.
 */
export function resolveFirstPlayerByMutualChoiceV1(choiceA: number, choiceB: number): PlayerIndex {
  assertPlayerIndex(choiceA, "choiceA");
  assertPlayerIndex(choiceB, "choiceB");
  if (choiceA !== choiceB) throw new Error("mutual choice mismatch");
  return choiceA;
}
