import { AbiCoder, keccak256, toUtf8Bytes } from "ethers";
import type { MatchHeader } from "./types.js";

const RNG_DOMAIN = "nyano-triad-classic-rng-v1";
const coder = AbiCoder.defaultAbiCoder();

function toU32Parts(parts: readonly number[]): number[] {
  return parts.map((v) => {
    if (!Number.isInteger(v) || v < 0) throw new Error(`rng parts must be non-negative integers: ${v}`);
    return v;
  });
}

export function buildClassicSeed0(header: Pick<MatchHeader, "salt" | "playerA" | "playerB" | "rulesetId">): `0x${string}` {
  const encoded = coder.encode(
    ["bytes32", "bytes32", "address", "address", "bytes32"],
    [keccak256(toUtf8Bytes(RNG_DOMAIN)), header.salt, header.playerA, header.playerB, header.rulesetId]
  );
  return keccak256(encoded) as `0x${string}`;
}

export function classicSeed(seed0: `0x${string}`, tag: string, parts: readonly number[] = []): `0x${string}` {
  const encoded = coder.encode(
    ["bytes32", "bytes32", "uint32[]"],
    [seed0, keccak256(toUtf8Bytes(tag)), toU32Parts(parts)]
  );
  return keccak256(encoded) as `0x${string}`;
}

export function classicRandUint(
  seed0: `0x${string}`,
  tag: string,
  parts: readonly number[],
  mod: number
): number {
  if (!Number.isInteger(mod) || mod <= 0) throw new Error(`mod must be a positive integer: ${mod}`);
  const h = classicSeed(seed0, tag, parts);
  return Number(BigInt(h) % BigInt(mod));
}

