import { TypedDataEncoder, getAddress, verifyTypedData } from "ethers";
import type { TranscriptV1 } from "./types.js";
import { hashTranscriptV1, validateTranscriptV1 } from "./transcript.js";

const HEX_32_RE = /^0x[0-9a-fA-F]{64}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const MAX_U32 = 0xffff_ffff;
const MAX_U64 = (1n << 64n) - 1n;
const MIN_I32 = -0x8000_0000;
const MAX_I32 = 0x7fff_ffff;

export const LADDER_PROTOCOL_VERSION_V1 = 1 as const;
export const LADDER_MATCH_ATTESTATION_EIP712_NAME = "NyanoTriadLeagueLadder";
export const LADDER_MATCH_ATTESTATION_EIP712_VERSION = "1";
export const LADDER_MATCH_ATTESTATION_PRIMARY_TYPE = "LadderMatchAttestationV1";

export const LADDER_MATCH_ATTESTATION_EIP712_TYPES_V1: Record<string, Array<{ name: string; type: string }>> = {
  [LADDER_MATCH_ATTESTATION_PRIMARY_TYPE]: [
    { name: "seasonId", type: "uint32" },
    { name: "rulesetId", type: "bytes32" },
    { name: "matchId", type: "bytes32" },
    { name: "playerA", type: "address" },
    { name: "playerB", type: "address" },
    { name: "replayHash", type: "bytes32" },
    { name: "sourceChainId", type: "uint64" },
    { name: "sourceTxHash", type: "bytes32" },
    { name: "sourceLogIndex", type: "uint32" },
  ],
};

export const LADDER_STANDINGS_TIE_BREAK_ORDER_V1 = [
  "points desc",
  "wins desc",
  "tileDiff desc",
  "losses asc",
  "player address asc",
] as const;

export interface LadderMatchAttestationV1Input {
  seasonId: number;
  rulesetId: `0x${string}`;
  matchId: `0x${string}`;
  playerA: `0x${string}`;
  playerB: `0x${string}`;
  replayHash: `0x${string}`;
  sourceChainId: bigint | number;
  sourceTxHash: `0x${string}`;
  sourceLogIndex: number;
}

export interface LadderMatchAttestationDomainV1Input {
  chainId: bigint | number;
  verifyingContract: `0x${string}`;
}

export interface LadderMatchAttestationTypedDataV1 {
  domain: {
    name: string;
    version: string;
    chainId: bigint;
    verifyingContract: `0x${string}`;
  };
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: {
    seasonId: number;
    rulesetId: `0x${string}`;
    matchId: `0x${string}`;
    playerA: `0x${string}`;
    playerB: `0x${string}`;
    replayHash: `0x${string}`;
    sourceChainId: bigint;
    sourceTxHash: `0x${string}`;
    sourceLogIndex: number;
  };
}

export interface LadderMatchSettledEventV1 {
  matchId: `0x${string}`;
  rulesetId: `0x${string}`;
  seasonId: number;
  playerA: `0x${string}`;
  playerB: `0x${string}`;
  winner: `0x${string}`;
  tilesA: number;
  tilesB: number;
  pointsDeltaA: number;
  pointsDeltaB: number;
  replayHash: `0x${string}`;
  settledAt: number;
  source: {
    chainId: bigint | number;
    blockNumber: bigint | number;
    txHash: `0x${string}`;
    logIndex: number;
  };
}

export interface LadderMatchRecordV1 {
  transcript: TranscriptV1;
  settled: LadderMatchSettledEventV1;
  signatureA: `0x${string}`;
  signatureB: `0x${string}`;
}

export interface NormalizedLadderMatchSettledEventV1 {
  matchId: `0x${string}`;
  rulesetId: `0x${string}`;
  seasonId: number;
  playerA: `0x${string}`;
  playerB: `0x${string}`;
  winner: `0x${string}`;
  tilesA: number;
  tilesB: number;
  pointsDeltaA: number;
  pointsDeltaB: number;
  replayHash: `0x${string}`;
  settledAt: number;
  source: {
    chainId: bigint;
    blockNumber: bigint;
    txHash: `0x${string}`;
    logIndex: number;
  };
}

export interface VerifiedLadderMatchRecordV1 {
  transcript: TranscriptV1;
  settled: NormalizedLadderMatchSettledEventV1;
  sourceKey: string;
  eventFingerprint: string;
}

export interface LadderBuildOptionsV1 {
  expectedSeasonId?: number;
  expectedRulesetId?: `0x${string}`;
  requireZeroSumPoints?: boolean;
}

export interface LadderRejectionV1 {
  index: number;
  reason: string;
}

export interface LadderStandingEntryV1 {
  rank: number;
  player: `0x${string}`;
  points: bigint;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  tileDiff: number;
  lastSettledAt: number;
}

export interface LadderStandingsResultV1 {
  seasonId: number | null;
  rulesetId: `0x${string}` | null;
  recordsInput: number;
  recordsAccepted: number;
  recordsRejected: number;
  duplicatesIgnored: number;
  rejections: LadderRejectionV1[];
  tieBreakOrder: readonly string[];
  standings: LadderStandingEntryV1[];
}

function assertBytes32(value: `0x${string}`, field: string): void {
  if (!HEX_32_RE.test(value)) {
    throw new Error(`${field} must be bytes32`);
  }
}

function normalizeBytes32(value: `0x${string}`, field: string): `0x${string}` {
  assertBytes32(value, field);
  return value.toLowerCase() as `0x${string}`;
}

function assertSafeUint(value: number, max: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > max) {
    throw new Error(`${field} must be uint <= ${max}`);
  }
}

function normalizeUint64(value: bigint | number, field: string): bigint {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`${field} must be a non-negative safe integer`);
    }
    return BigInt(value);
  }
  if (value < 0n || value > MAX_U64) {
    throw new Error(`${field} out of range`);
  }
  return value;
}

function normalizeInt32(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < MIN_I32 || value > MAX_I32) {
    throw new Error(`${field} must be int32`);
  }
  return value;
}

function normalizeDomainV1(input: LadderMatchAttestationDomainV1Input): {
  chainId: bigint;
  verifyingContract: `0x${string}`;
} {
  const chainId = typeof input.chainId === "number" ? BigInt(input.chainId) : input.chainId;
  if (chainId < 0n) {
    throw new Error("chainId must be >= 0");
  }

  return {
    chainId,
    verifyingContract: getAddress(input.verifyingContract) as `0x${string}`,
  };
}

function normalizeAttestationV1(input: LadderMatchAttestationV1Input): {
  seasonId: number;
  rulesetId: `0x${string}`;
  matchId: `0x${string}`;
  playerA: `0x${string}`;
  playerB: `0x${string}`;
  replayHash: `0x${string}`;
  sourceChainId: bigint;
  sourceTxHash: `0x${string}`;
  sourceLogIndex: number;
} {
  const seasonId = input.seasonId;
  assertSafeUint(seasonId, MAX_U32, "seasonId");

  const rulesetId = normalizeBytes32(input.rulesetId, "rulesetId");
  const matchId = normalizeBytes32(input.matchId, "matchId");
  const replayHash = normalizeBytes32(input.replayHash, "replayHash");
  const sourceChainId = normalizeUint64(input.sourceChainId, "sourceChainId");
  const sourceTxHash = normalizeBytes32(input.sourceTxHash, "sourceTxHash");
  assertSafeUint(input.sourceLogIndex, MAX_U32, "sourceLogIndex");

  const playerA = getAddress(input.playerA) as `0x${string}`;
  const playerB = getAddress(input.playerB) as `0x${string}`;
  if (playerA === playerB) {
    throw new Error("playerA and playerB must be different");
  }

  return {
    seasonId,
    rulesetId,
    matchId,
    playerA,
    playerB,
    replayHash,
    sourceChainId,
    sourceTxHash,
    sourceLogIndex: input.sourceLogIndex,
  };
}

function normalizeSettledV1(input: LadderMatchSettledEventV1): NormalizedLadderMatchSettledEventV1 {
  const playerA = getAddress(input.playerA) as `0x${string}`;
  const playerB = getAddress(input.playerB) as `0x${string}`;
  if (playerA === playerB) {
    throw new Error("settled.playerA and settled.playerB must be different");
  }

  const winner = getAddress(input.winner) as `0x${string}`;
  if (winner !== playerA && winner !== playerB && winner !== ZERO_ADDRESS) {
    throw new Error("settled.winner must be playerA, playerB, or zero address");
  }

  assertSafeUint(input.seasonId, MAX_U32, "settled.seasonId");
  assertSafeUint(input.tilesA, 9, "settled.tilesA");
  assertSafeUint(input.tilesB, 9, "settled.tilesB");
  assertSafeUint(input.settledAt, Number.MAX_SAFE_INTEGER, "settled.settledAt");

  const sourceChainId = normalizeUint64(input.source.chainId, "settled.source.chainId");
  const sourceBlockNumber = normalizeUint64(input.source.blockNumber, "settled.source.blockNumber");
  assertSafeUint(input.source.logIndex, MAX_U32, "settled.source.logIndex");

  return {
    matchId: normalizeBytes32(input.matchId, "settled.matchId"),
    rulesetId: normalizeBytes32(input.rulesetId, "settled.rulesetId"),
    seasonId: input.seasonId,
    playerA,
    playerB,
    winner,
    tilesA: input.tilesA,
    tilesB: input.tilesB,
    pointsDeltaA: normalizeInt32(input.pointsDeltaA, "settled.pointsDeltaA"),
    pointsDeltaB: normalizeInt32(input.pointsDeltaB, "settled.pointsDeltaB"),
    replayHash: normalizeBytes32(input.replayHash, "settled.replayHash"),
    settledAt: input.settledAt,
    source: {
      chainId: sourceChainId,
      blockNumber: sourceBlockNumber,
      txHash: normalizeBytes32(input.source.txHash, "settled.source.txHash"),
      logIndex: input.source.logIndex,
    },
  };
}

function buildSourceKey(x: NormalizedLadderMatchSettledEventV1): string {
  return [
    x.source.chainId.toString(10),
    x.source.blockNumber.toString(10),
    x.source.txHash,
    String(x.source.logIndex),
  ].join(":");
}

function buildEventFingerprint(x: NormalizedLadderMatchSettledEventV1): string {
  return [
    x.matchId,
    x.rulesetId,
    String(x.seasonId),
    x.playerA,
    x.playerB,
    x.winner,
    String(x.tilesA),
    String(x.tilesB),
    String(x.pointsDeltaA),
    String(x.pointsDeltaB),
    x.replayHash,
    String(x.settledAt),
    x.source.chainId.toString(10),
    x.source.blockNumber.toString(10),
    x.source.txHash,
    String(x.source.logIndex),
  ].join("|");
}

export function validateLadderMatchSettledEventV1(input: LadderMatchSettledEventV1): void {
  normalizeSettledV1(input);
}

export function buildLadderMatchAttestationInputFromSettledV1(
  settledInput: LadderMatchSettledEventV1,
): LadderMatchAttestationV1Input {
  const settled = normalizeSettledV1(settledInput);
  return {
    seasonId: settled.seasonId,
    rulesetId: settled.rulesetId,
    matchId: settled.matchId,
    playerA: settled.playerA,
    playerB: settled.playerB,
    replayHash: settled.replayHash,
    sourceChainId: settled.source.chainId,
    sourceTxHash: settled.source.txHash,
    sourceLogIndex: settled.source.logIndex,
  };
}

export function buildLadderMatchAttestationTypedDataV1(
  domainInput: LadderMatchAttestationDomainV1Input,
  attestationInput: LadderMatchAttestationV1Input,
): LadderMatchAttestationTypedDataV1 {
  const domain = normalizeDomainV1(domainInput);
  const attestation = normalizeAttestationV1(attestationInput);

  return {
    domain: {
      name: LADDER_MATCH_ATTESTATION_EIP712_NAME,
      version: LADDER_MATCH_ATTESTATION_EIP712_VERSION,
      chainId: domain.chainId,
      verifyingContract: domain.verifyingContract,
    },
    types: LADDER_MATCH_ATTESTATION_EIP712_TYPES_V1,
    primaryType: LADDER_MATCH_ATTESTATION_PRIMARY_TYPE,
    message: {
      seasonId: attestation.seasonId,
      rulesetId: attestation.rulesetId,
      matchId: attestation.matchId,
      playerA: attestation.playerA,
      playerB: attestation.playerB,
      replayHash: attestation.replayHash,
      sourceChainId: attestation.sourceChainId,
      sourceTxHash: attestation.sourceTxHash,
      sourceLogIndex: attestation.sourceLogIndex,
    },
  };
}

export function buildLadderMatchAttestationTypedDataDigestV1(
  domainInput: LadderMatchAttestationDomainV1Input,
  attestationInput: LadderMatchAttestationV1Input,
): `0x${string}` {
  const payload = buildLadderMatchAttestationTypedDataV1(domainInput, attestationInput);
  return TypedDataEncoder.hash(
    payload.domain,
    payload.types,
    payload.message,
  ) as `0x${string}`;
}

export function recoverLadderMatchAttestationSignerV1(
  domainInput: LadderMatchAttestationDomainV1Input,
  attestationInput: LadderMatchAttestationV1Input,
  signature: `0x${string}`,
): `0x${string}` {
  const payload = buildLadderMatchAttestationTypedDataV1(domainInput, attestationInput);
  return getAddress(verifyTypedData(
    payload.domain,
    payload.types,
    payload.message,
    signature,
  )) as `0x${string}`;
}

export function verifyLadderMatchAttestationSignatureV1(
  domainInput: LadderMatchAttestationDomainV1Input,
  attestationInput: LadderMatchAttestationV1Input,
  signature: `0x${string}`,
  expectedSigner: `0x${string}`,
): boolean {
  const signer = recoverLadderMatchAttestationSignerV1(domainInput, attestationInput, signature);
  return signer === getAddress(expectedSigner);
}

export function verifyLadderMatchRecordV1(
  record: LadderMatchRecordV1,
  domainInput: LadderMatchAttestationDomainV1Input,
): VerifiedLadderMatchRecordV1 {
  const settled = normalizeSettledV1(record.settled);

  validateTranscriptV1(record.transcript);
  const transcriptMatchId = hashTranscriptV1(record.transcript);
  if (transcriptMatchId !== settled.matchId) {
    throw new Error("transcript matchId mismatch");
  }

  const headerRulesetId = normalizeBytes32(record.transcript.header.rulesetId, "transcript.header.rulesetId");
  const headerPlayerA = getAddress(record.transcript.header.playerA) as `0x${string}`;
  const headerPlayerB = getAddress(record.transcript.header.playerB) as `0x${string}`;
  if (headerRulesetId !== settled.rulesetId) {
    throw new Error("rulesetId mismatch between transcript and settled event");
  }
  if (record.transcript.header.seasonId !== settled.seasonId) {
    throw new Error("seasonId mismatch between transcript and settled event");
  }
  if (headerPlayerA !== settled.playerA || headerPlayerB !== settled.playerB) {
    throw new Error("player mismatch between transcript and settled event");
  }

  const attestation = buildLadderMatchAttestationInputFromSettledV1(settled);
  if (!verifyLadderMatchAttestationSignatureV1(domainInput, attestation, record.signatureA, settled.playerA)) {
    throw new Error("signatureA does not match playerA attestation");
  }
  if (!verifyLadderMatchAttestationSignatureV1(domainInput, attestation, record.signatureB, settled.playerB)) {
    throw new Error("signatureB does not match playerB attestation");
  }

  return {
    transcript: record.transcript,
    settled,
    sourceKey: buildSourceKey(settled),
    eventFingerprint: buildEventFingerprint(settled),
  };
}

export function buildLadderStandingsV1(
  records: LadderMatchRecordV1[],
  domainInput: LadderMatchAttestationDomainV1Input,
  options: LadderBuildOptionsV1 = {},
): LadderStandingsResultV1 {
  const requireZeroSumPoints = options.requireZeroSumPoints ?? false;
  const expectedSeasonId = options.expectedSeasonId;
  const expectedRulesetId = options.expectedRulesetId
    ? normalizeBytes32(options.expectedRulesetId, "expectedRulesetId")
    : null;

  if (expectedSeasonId !== undefined) {
    assertSafeUint(expectedSeasonId, MAX_U32, "expectedSeasonId");
  }

  const rejections: LadderRejectionV1[] = [];
  const uniqueBySourceKey = new Map<string, VerifiedLadderMatchRecordV1>();
  let duplicatesIgnored = 0;

  for (let i = 0; i < records.length; i++) {
    try {
      const verified = verifyLadderMatchRecordV1(records[i], domainInput);
      if (expectedSeasonId !== undefined && verified.settled.seasonId !== expectedSeasonId) {
        throw new Error("record seasonId does not match expectedSeasonId");
      }
      if (expectedRulesetId !== null && verified.settled.rulesetId !== expectedRulesetId) {
        throw new Error("record rulesetId does not match expectedRulesetId");
      }
      if (requireZeroSumPoints && verified.settled.pointsDeltaA + verified.settled.pointsDeltaB !== 0) {
        throw new Error("pointsDelta must be zero-sum when requireZeroSumPoints=true");
      }

      const existing = uniqueBySourceKey.get(verified.sourceKey);
      if (existing) {
        if (existing.eventFingerprint === verified.eventFingerprint) {
          duplicatesIgnored++;
          continue;
        }
        throw new Error(`conflicting duplicate event source: ${verified.sourceKey}`);
      }

      uniqueBySourceKey.set(verified.sourceKey, verified);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      rejections.push({ index: i, reason });
    }
  }

  const accepted = Array.from(uniqueBySourceKey.values()).sort((a, b) => {
    if (a.settled.source.chainId !== b.settled.source.chainId) {
      return a.settled.source.chainId < b.settled.source.chainId ? -1 : 1;
    }
    if (a.settled.source.blockNumber !== b.settled.source.blockNumber) {
      return a.settled.source.blockNumber < b.settled.source.blockNumber ? -1 : 1;
    }
    const txCmp = a.settled.source.txHash.localeCompare(b.settled.source.txHash);
    if (txCmp !== 0) return txCmp;
    if (a.settled.source.logIndex !== b.settled.source.logIndex) {
      return a.settled.source.logIndex - b.settled.source.logIndex;
    }
    return a.settled.matchId.localeCompare(b.settled.matchId);
  });

  type Acc = {
    player: `0x${string}`;
    points: bigint;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    tileDiff: number;
    lastSettledAt: number;
  };

  const byPlayer = new Map<string, Acc>();

  function accFor(player: `0x${string}`): Acc {
    const key = player.toLowerCase();
    const cur = byPlayer.get(key);
    if (cur) return cur;
    const next: Acc = {
      player,
      points: 0n,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      tileDiff: 0,
      lastSettledAt: 0,
    };
    byPlayer.set(key, next);
    return next;
  }

  for (const record of accepted) {
    const { settled } = record;
    const a = accFor(settled.playerA);
    const b = accFor(settled.playerB);

    a.points += BigInt(settled.pointsDeltaA);
    b.points += BigInt(settled.pointsDeltaB);

    a.matches += 1;
    b.matches += 1;

    const tileDiffA = settled.tilesA - settled.tilesB;
    a.tileDiff += tileDiffA;
    b.tileDiff -= tileDiffA;

    a.lastSettledAt = Math.max(a.lastSettledAt, settled.settledAt);
    b.lastSettledAt = Math.max(b.lastSettledAt, settled.settledAt);

    if (settled.winner === settled.playerA) {
      a.wins += 1;
      b.losses += 1;
    } else if (settled.winner === settled.playerB) {
      b.wins += 1;
      a.losses += 1;
    } else {
      a.draws += 1;
      b.draws += 1;
    }
  }

  const standings = Array.from(byPlayer.values())
    .sort((a, b) => {
      if (a.points !== b.points) return a.points > b.points ? -1 : 1;
      if (a.wins !== b.wins) return b.wins - a.wins;
      if (a.tileDiff !== b.tileDiff) return b.tileDiff - a.tileDiff;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.player.toLowerCase().localeCompare(b.player.toLowerCase());
    })
    .map((x, i) => ({
      rank: i + 1,
      player: x.player,
      points: x.points,
      matches: x.matches,
      wins: x.wins,
      draws: x.draws,
      losses: x.losses,
      tileDiff: x.tileDiff,
      lastSettledAt: x.lastSettledAt,
    }));

  let seasonId: number | null = null;
  if (expectedSeasonId !== undefined) {
    seasonId = expectedSeasonId;
  } else if (accepted.length > 0) {
    const uniq = new Set<number>(accepted.map((x) => x.settled.seasonId));
    if (uniq.size === 1) {
      seasonId = accepted[0].settled.seasonId;
    }
  }

  let rulesetId: `0x${string}` | null = null;
  if (expectedRulesetId !== null) {
    rulesetId = expectedRulesetId;
  } else if (accepted.length > 0) {
    const uniq = new Set<string>(accepted.map((x) => x.settled.rulesetId));
    if (uniq.size === 1) {
      rulesetId = accepted[0].settled.rulesetId;
    }
  }

  return {
    seasonId,
    rulesetId,
    recordsInput: records.length,
    recordsAccepted: accepted.length,
    recordsRejected: rejections.length,
    duplicatesIgnored,
    rejections,
    tieBreakOrder: LADDER_STANDINGS_TIE_BREAK_ORDER_V1,
    standings,
  };
}
