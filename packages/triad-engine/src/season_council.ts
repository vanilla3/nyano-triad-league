import { AbiCoder, TypedDataEncoder, getAddress, keccak256, verifyTypedData } from "ethers";

const coder = AbiCoder.defaultAbiCoder();
const HEX_32_RE = /^0x[0-9a-fA-F]{64}$/;

const MAX_U32 = 0xffff_ffff;
const MAX_U64 = (1n << 64n) - 1n;
const MAX_U96 = (1n << 96n) - 1n;

export const SEASON_COUNCIL_PROTOCOL_VERSION_V1 = 1 as const;
export const SEASON_COUNCIL_VOTE_EIP712_NAME = "NyanoTriadLeagueSeasonCouncil";
export const SEASON_COUNCIL_VOTE_EIP712_VERSION = "1";
export const SEASON_COUNCIL_VOTE_PRIMARY_TYPE = "SeasonCouncilVoteV1";

export const SEASON_COUNCIL_VOTE_EIP712_TYPES_V1: Record<string, Array<{ name: string; type: string }>> = {
  [SEASON_COUNCIL_VOTE_PRIMARY_TYPE]: [
    { name: "proposalId", type: "bytes32" },
    { name: "voter", type: "address" },
    { name: "rulesetId", type: "bytes32" },
    { name: "weight", type: "uint96" },
    { name: "nonce", type: "uint64" },
    { name: "deadline", type: "uint64" },
  ],
};

export interface SeasonCouncilProposalV1Input {
  seasonId: number;
  startsAt: number;
  endsAt: number;
  quorumWeight: bigint;
  candidates: `0x${string}`[];
  proposer: `0x${string}`;
  salt: `0x${string}`;
}

export interface SeasonCouncilVoteV1Input {
  proposalId: `0x${string}`;
  voter: `0x${string}`;
  rulesetId: `0x${string}`;
  weight: bigint;
  nonce: bigint;
  deadline: number;
}

export interface SeasonCouncilVoteDomainV1Input {
  chainId: bigint | number;
  verifyingContract: `0x${string}`;
}

export interface SeasonCouncilVoteTypedDataV1 {
  domain: {
    name: string;
    version: string;
    chainId: bigint;
    verifyingContract: `0x${string}`;
  };
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: {
    proposalId: `0x${string}`;
    voter: `0x${string}`;
    rulesetId: `0x${string}`;
    weight: bigint;
    nonce: bigint;
    deadline: bigint;
  };
}

export interface SeasonCouncilTallyOptionsV1 {
  asOfTime?: number;
  requireClosed?: boolean;
}

export interface SeasonCouncilTallyEntryV1 {
  rulesetId: `0x${string}`;
  weight: bigint;
  voters: number;
}

export interface SeasonCouncilTallyResultV1 {
  proposalId: `0x${string}`;
  seasonId: number;
  asOfTime: number;
  totals: SeasonCouncilTallyEntryV1[];
  turnoutWeight: bigint;
  quorumWeight: bigint;
  quorumReached: boolean;
  uniqueVoters: number;
  winningRulesetId: `0x${string}` | null;
  winningWeight: bigint;
  tieBreakUsed: boolean;
  adopted: boolean;
  rejectedVotes: number;
}

export interface SeasonCouncilAdoptionV1 {
  proposalId: `0x${string}`;
  seasonId: number;
  rulesetId: `0x${string}`;
  adoptedAt: number;
  quorumWeight: bigint;
  turnoutWeight: bigint;
  uniqueVoters: number;
  tieBreakUsed: boolean;
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

function assertBigIntRange(value: bigint, min: bigint, max: bigint, field: string): void {
  if (typeof value !== "bigint") {
    throw new Error(`${field} must be bigint`);
  }
  if (value < min || value > max) {
    throw new Error(`${field} out of range`);
  }
}

function normalizeSeasonCouncilVoteV1(input: SeasonCouncilVoteV1Input): {
  proposalId: `0x${string}`;
  voter: `0x${string}`;
  rulesetId: `0x${string}`;
  weight: bigint;
  nonce: bigint;
  deadline: number;
} {
  const proposalId = normalizeBytes32(input.proposalId, "proposalId");
  const rulesetId = normalizeBytes32(input.rulesetId, "rulesetId");
  const voter = getAddress(input.voter) as `0x${string}`;

  assertBigIntRange(input.weight, 1n, MAX_U96, "weight");
  assertBigIntRange(input.nonce, 0n, MAX_U64, "nonce");
  assertSafeUint(input.deadline, Number.MAX_SAFE_INTEGER, "deadline");

  return {
    proposalId,
    voter,
    rulesetId,
    weight: input.weight,
    nonce: input.nonce,
    deadline: input.deadline,
  };
}

function normalizeDomainV1(input: SeasonCouncilVoteDomainV1Input): {
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

export function validateSeasonCouncilProposalV1(input: SeasonCouncilProposalV1Input): void {
  assertSafeUint(input.seasonId, MAX_U32, "seasonId");
  assertSafeUint(input.startsAt, Number.MAX_SAFE_INTEGER, "startsAt");
  assertSafeUint(input.endsAt, Number.MAX_SAFE_INTEGER, "endsAt");
  if (input.endsAt <= input.startsAt) {
    throw new Error("endsAt must be greater than startsAt");
  }

  assertBigIntRange(input.quorumWeight, 1n, MAX_U96, "quorumWeight");
  getAddress(input.proposer);
  assertBytes32(input.salt, "salt");

  canonicalizeSeasonCouncilCandidatesV1(input.candidates);
}

export function validateSeasonCouncilVoteV1(input: SeasonCouncilVoteV1Input): void {
  normalizeSeasonCouncilVoteV1(input);
}

export function canonicalizeSeasonCouncilCandidatesV1(candidates: `0x${string}`[]): `0x${string}`[] {
  if (candidates.length === 0) {
    throw new Error("candidates must not be empty");
  }

  const uniq = new Set<string>();
  for (let i = 0; i < candidates.length; i++) {
    const c = normalizeBytes32(candidates[i], `candidates[${i}]`);
    uniq.add(c);
  }

  return Array.from(uniq).sort() as `0x${string}`[];
}

export function hashSeasonCouncilCandidateSetV1(candidates: `0x${string}`[]): `0x${string}` {
  const normalized = canonicalizeSeasonCouncilCandidatesV1(candidates);
  const encoded = coder.encode(["bytes32[]"], [normalized]);
  return keccak256(encoded) as `0x${string}`;
}

export function buildSeasonCouncilProposalIdV1(input: SeasonCouncilProposalV1Input): `0x${string}` {
  validateSeasonCouncilProposalV1(input);

  const candidateSetHash = hashSeasonCouncilCandidateSetV1(input.candidates);
  const proposer = getAddress(input.proposer);

  const encoded = coder.encode(
    ["uint8", "uint32", "uint64", "uint64", "uint96", "bytes32", "address", "bytes32"],
    [
      SEASON_COUNCIL_PROTOCOL_VERSION_V1,
      input.seasonId,
      input.startsAt,
      input.endsAt,
      input.quorumWeight,
      candidateSetHash,
      proposer,
      input.salt,
    ],
  );

  return keccak256(encoded) as `0x${string}`;
}

export function buildSeasonCouncilVoteHashV1(input: SeasonCouncilVoteV1Input): `0x${string}` {
  const vote = normalizeSeasonCouncilVoteV1(input);
  const encoded = coder.encode(
    ["bytes32", "address", "bytes32", "uint96", "uint64", "uint64"],
    [vote.proposalId, vote.voter, vote.rulesetId, vote.weight, vote.nonce, BigInt(vote.deadline)],
  );
  return keccak256(encoded) as `0x${string}`;
}

export function buildSeasonCouncilVoteTypedDataV1(
  domainInput: SeasonCouncilVoteDomainV1Input,
  voteInput: SeasonCouncilVoteV1Input,
): SeasonCouncilVoteTypedDataV1 {
  const domain = normalizeDomainV1(domainInput);
  const vote = normalizeSeasonCouncilVoteV1(voteInput);

  return {
    domain: {
      name: SEASON_COUNCIL_VOTE_EIP712_NAME,
      version: SEASON_COUNCIL_VOTE_EIP712_VERSION,
      chainId: domain.chainId,
      verifyingContract: domain.verifyingContract,
    },
    types: SEASON_COUNCIL_VOTE_EIP712_TYPES_V1,
    primaryType: SEASON_COUNCIL_VOTE_PRIMARY_TYPE,
    message: {
      proposalId: vote.proposalId,
      voter: vote.voter,
      rulesetId: vote.rulesetId,
      weight: vote.weight,
      nonce: vote.nonce,
      deadline: BigInt(vote.deadline),
    },
  };
}

export function buildSeasonCouncilVoteTypedDataDigestV1(
  domainInput: SeasonCouncilVoteDomainV1Input,
  voteInput: SeasonCouncilVoteV1Input,
): `0x${string}` {
  const payload = buildSeasonCouncilVoteTypedDataV1(domainInput, voteInput);
  return TypedDataEncoder.hash(
    payload.domain,
    payload.types,
    payload.message,
  ) as `0x${string}`;
}

export function recoverSeasonCouncilVoteSignerV1(
  domainInput: SeasonCouncilVoteDomainV1Input,
  voteInput: SeasonCouncilVoteV1Input,
  signature: `0x${string}`,
): `0x${string}` {
  const payload = buildSeasonCouncilVoteTypedDataV1(domainInput, voteInput);
  return getAddress(verifyTypedData(
    payload.domain,
    payload.types,
    payload.message,
    signature,
  )) as `0x${string}`;
}

export function verifySeasonCouncilVoteSignatureV1(
  domainInput: SeasonCouncilVoteDomainV1Input,
  voteInput: SeasonCouncilVoteV1Input,
  signature: `0x${string}`,
): boolean {
  const vote = normalizeSeasonCouncilVoteV1(voteInput);
  const signer = recoverSeasonCouncilVoteSignerV1(domainInput, voteInput, signature);
  return signer === vote.voter;
}

export function tallySeasonCouncilVotesV1(
  proposal: SeasonCouncilProposalV1Input,
  votes: SeasonCouncilVoteV1Input[],
  options: SeasonCouncilTallyOptionsV1 = {},
): SeasonCouncilTallyResultV1 {
  validateSeasonCouncilProposalV1(proposal);

  const proposalId = buildSeasonCouncilProposalIdV1(proposal);
  const asOfTime = options.asOfTime ?? proposal.endsAt;
  assertSafeUint(asOfTime, Number.MAX_SAFE_INTEGER, "asOfTime");
  if (options.requireClosed !== false && asOfTime < proposal.endsAt) {
    throw new Error("voting window not closed");
  }

  const candidateList = canonicalizeSeasonCouncilCandidatesV1(proposal.candidates);
  const candidateSet = new Set<string>(candidateList);
  const totals = new Map<string, SeasonCouncilTallyEntryV1>();
  for (const rulesetId of candidateList) {
    totals.set(rulesetId, { rulesetId, weight: 0n, voters: 0 });
  }

  const byVoter = new Map<string, ReturnType<typeof normalizeSeasonCouncilVoteV1>>();
  let rejectedVotes = 0;

  for (const raw of votes) {
    const vote = normalizeSeasonCouncilVoteV1(raw);
    if (vote.proposalId !== proposalId) {
      rejectedVotes++;
      continue;
    }
    if (vote.deadline < asOfTime) {
      rejectedVotes++;
      continue;
    }
    if (!candidateSet.has(vote.rulesetId)) {
      rejectedVotes++;
      continue;
    }

    const cur = byVoter.get(vote.voter);
    if (!cur) {
      byVoter.set(vote.voter, vote);
      continue;
    }

    if (vote.nonce > cur.nonce) {
      byVoter.set(vote.voter, vote);
      continue;
    }

    if (vote.nonce === cur.nonce) {
      if (vote.rulesetId !== cur.rulesetId || vote.weight !== cur.weight || vote.deadline !== cur.deadline) {
        throw new Error(`conflicting vote nonce for voter ${vote.voter}`);
      }
      continue;
    }
  }

  let turnoutWeight = 0n;
  for (const vote of byVoter.values()) {
    const entry = totals.get(vote.rulesetId);
    if (!entry) continue;
    entry.weight += vote.weight;
    entry.voters += 1;
    turnoutWeight += vote.weight;
  }

  const sortedTotals = Array.from(totals.values()).sort((a, b) => {
    if (a.weight === b.weight) {
      return a.rulesetId.localeCompare(b.rulesetId);
    }
    return a.weight > b.weight ? -1 : 1;
  });

  const top = sortedTotals[0];
  const second = sortedTotals[1];
  const hasWinner = !!top && top.weight > 0n;
  const tieBreakUsed = !!top && !!second && top.weight > 0n && top.weight === second.weight;
  const winningRulesetId = hasWinner ? top.rulesetId : null;
  const winningWeight = hasWinner ? top.weight : 0n;
  const quorumReached = turnoutWeight >= proposal.quorumWeight;
  const adopted = quorumReached && winningRulesetId !== null;

  return {
    proposalId,
    seasonId: proposal.seasonId,
    asOfTime,
    totals: sortedTotals,
    turnoutWeight,
    quorumWeight: proposal.quorumWeight,
    quorumReached,
    uniqueVoters: byVoter.size,
    winningRulesetId,
    winningWeight,
    tieBreakUsed,
    adopted,
    rejectedVotes,
  };
}

export function adoptSeasonCouncilRulesetV1(
  proposal: SeasonCouncilProposalV1Input,
  votes: SeasonCouncilVoteV1Input[],
  options: SeasonCouncilTallyOptionsV1 = {},
): SeasonCouncilAdoptionV1 {
  const asOfTime = options.asOfTime ?? proposal.endsAt;
  const tally = tallySeasonCouncilVotesV1(proposal, votes, {
    asOfTime,
    requireClosed: options.requireClosed ?? true,
  });

  if (!tally.quorumReached) {
    throw new Error("quorum not reached");
  }
  if (!tally.winningRulesetId) {
    throw new Error("no winning ruleset");
  }

  return {
    proposalId: tally.proposalId,
    seasonId: tally.seasonId,
    rulesetId: tally.winningRulesetId,
    adoptedAt: asOfTime,
    quorumWeight: tally.quorumWeight,
    turnoutWeight: tally.turnoutWeight,
    uniqueVoters: tally.uniqueVoters,
    tieBreakUsed: tally.tieBreakUsed,
  };
}
