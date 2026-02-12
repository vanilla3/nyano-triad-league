import test from "node:test";
import assert from "node:assert/strict";
import { Wallet } from "ethers";
import {
  adoptSeasonCouncilRulesetV1,
  buildSeasonCouncilProposalIdV1,
  buildSeasonCouncilVoteHashV1,
  buildSeasonCouncilVoteTypedDataDigestV1,
  buildSeasonCouncilVoteTypedDataV1,
  canonicalizeSeasonCouncilCandidatesV1,
  hashSeasonCouncilCandidateSetV1,
  recoverSeasonCouncilVoteSignerV1,
  tallySeasonCouncilVotesV1,
  verifySeasonCouncilVoteSignatureV1,
} from "../dist/index.js";

const RULESET_A = "0x000000000000000000000000000000000000000000000000000000000000000a";
const RULESET_B = "0x000000000000000000000000000000000000000000000000000000000000000b";
const RULESET_C = "0x000000000000000000000000000000000000000000000000000000000000000c";

function baseProposal() {
  return {
    seasonId: 5,
    startsAt: 1_700_000_000,
    endsAt: 1_700_003_600,
    quorumWeight: 10n,
    candidates: [RULESET_A, RULESET_B],
    proposer: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
    salt: "0x1111111111111111111111111111111111111111111111111111111111111111",
  };
}

test("season-council proposal id: candidate order/duplicates do not change id", () => {
  const p1 = baseProposal();
  const p2 = {
    ...baseProposal(),
    candidates: [RULESET_B, RULESET_A, RULESET_B, RULESET_A],
  };

  assert.deepEqual(canonicalizeSeasonCouncilCandidatesV1(p1.candidates), [RULESET_A, RULESET_B]);
  assert.equal(hashSeasonCouncilCandidateSetV1(p1.candidates), hashSeasonCouncilCandidateSetV1(p2.candidates));
  assert.equal(buildSeasonCouncilProposalIdV1(p1), buildSeasonCouncilProposalIdV1(p2));
});

test("season-council vote hash: deterministic", () => {
  const proposalId = buildSeasonCouncilProposalIdV1(baseProposal());
  const vote = {
    proposalId,
    voter: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
    rulesetId: RULESET_A,
    weight: 7n,
    nonce: 0n,
    deadline: 1_700_004_000,
  };

  assert.equal(buildSeasonCouncilVoteHashV1(vote), buildSeasonCouncilVoteHashV1(vote));
});

test("season-council vote signature: typed-data sign/verify/recover", async () => {
  const wallet = new Wallet("0x59c6995e998f97a5a0044966f0945386cf6f52f8b52f9f4f4f0f5f6f4f1f9d6f");
  const proposalId = buildSeasonCouncilProposalIdV1(baseProposal());
  const domain = {
    chainId: 31_337n,
    verifyingContract: "0x1111111111111111111111111111111111111111",
  };
  const vote = {
    proposalId,
    voter: wallet.address,
    rulesetId: RULESET_B,
    weight: 12n,
    nonce: 3n,
    deadline: 1_700_005_000,
  };

  const payload = buildSeasonCouncilVoteTypedDataV1(domain, vote);
  const sig = await wallet.signTypedData(payload.domain, payload.types, payload.message);

  assert.match(buildSeasonCouncilVoteTypedDataDigestV1(domain, vote), /^0x[0-9a-f]{64}$/);
  assert.equal(verifySeasonCouncilVoteSignatureV1(domain, vote, sig), true);
  assert.equal(recoverSeasonCouncilVoteSignerV1(domain, vote, sig), wallet.address);
  assert.equal(
    verifySeasonCouncilVoteSignatureV1(domain, { ...vote, rulesetId: RULESET_A }, sig),
    false,
  );
});

test("season-council tally: highest nonce per voter wins, invalid votes are rejected", () => {
  const proposal = baseProposal();
  const proposalId = buildSeasonCouncilProposalIdV1(proposal);
  const votes = [
    {
      proposalId,
      voter: "0x1000000000000000000000000000000000000001",
      rulesetId: RULESET_A,
      weight: 6n,
      nonce: 0n,
      deadline: 1_700_010_000,
    },
    {
      proposalId,
      voter: "0x1000000000000000000000000000000000000001",
      rulesetId: RULESET_B,
      weight: 6n,
      nonce: 1n,
      deadline: 1_700_010_000,
    },
    {
      proposalId,
      voter: "0x2000000000000000000000000000000000000002",
      rulesetId: RULESET_A,
      weight: 5n,
      nonce: 0n,
      deadline: 1_700_010_000,
    },
    {
      proposalId,
      voter: "0x3000000000000000000000000000000000000003",
      rulesetId: RULESET_B,
      weight: 4n,
      nonce: 0n,
      deadline: 1_600_000_000,
    },
    {
      proposalId: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      voter: "0x4000000000000000000000000000000000000004",
      rulesetId: RULESET_A,
      weight: 9n,
      nonce: 0n,
      deadline: 1_700_010_000,
    },
    {
      proposalId,
      voter: "0x5000000000000000000000000000000000000005",
      rulesetId: RULESET_C,
      weight: 9n,
      nonce: 0n,
      deadline: 1_700_010_000,
    },
  ];

  const result = tallySeasonCouncilVotesV1(proposal, votes, {
    asOfTime: proposal.endsAt + 1,
  });

  assert.equal(result.proposalId, proposalId);
  assert.equal(result.turnoutWeight, 11n);
  assert.equal(result.quorumReached, true);
  assert.equal(result.uniqueVoters, 2);
  assert.equal(result.winningRulesetId, RULESET_B);
  assert.equal(result.winningWeight, 6n);
  assert.equal(result.rejectedVotes, 3);
  assert.equal(result.adopted, true);
  assert.deepEqual(
    result.totals.map((x) => [x.rulesetId, x.weight]),
    [
      [RULESET_B, 6n],
      [RULESET_A, 5n],
    ],
  );
});

test("season-council tally: conflicting same-nonce vote throws", () => {
  const proposal = baseProposal();
  const proposalId = buildSeasonCouncilProposalIdV1(proposal);
  const votes = [
    {
      proposalId,
      voter: "0x1000000000000000000000000000000000000001",
      rulesetId: RULESET_A,
      weight: 6n,
      nonce: 1n,
      deadline: 1_700_010_000,
    },
    {
      proposalId,
      voter: "0x1000000000000000000000000000000000000001",
      rulesetId: RULESET_B,
      weight: 6n,
      nonce: 1n,
      deadline: 1_700_010_000,
    },
  ];

  assert.throws(
    () => tallySeasonCouncilVotesV1(proposal, votes, { asOfTime: proposal.endsAt + 1 }),
    /conflicting vote nonce/,
  );
});

test("season-council adopt: quorum required and tie-break is deterministic", () => {
  const proposal = baseProposal();
  const proposalId = buildSeasonCouncilProposalIdV1(proposal);
  const tieVotes = [
    {
      proposalId,
      voter: "0x1000000000000000000000000000000000000001",
      rulesetId: RULESET_A,
      weight: 5n,
      nonce: 0n,
      deadline: 1_700_010_000,
    },
    {
      proposalId,
      voter: "0x2000000000000000000000000000000000000002",
      rulesetId: RULESET_B,
      weight: 5n,
      nonce: 0n,
      deadline: 1_700_010_000,
    },
  ];

  const adopted = adoptSeasonCouncilRulesetV1(proposal, tieVotes, { asOfTime: proposal.endsAt + 1 });
  assert.equal(adopted.proposalId, proposalId);
  assert.equal(adopted.rulesetId, RULESET_A);
  assert.equal(adopted.tieBreakUsed, true);

  assert.throws(
    () =>
      adoptSeasonCouncilRulesetV1(proposal, tieVotes, {
        asOfTime: proposal.startsAt,
      }),
    /voting window not closed/,
  );

  const noQuorumVotes = [
    {
      proposalId,
      voter: "0x1000000000000000000000000000000000000001",
      rulesetId: RULESET_A,
      weight: 9n,
      nonce: 0n,
      deadline: 1_700_010_000,
    },
  ];
  assert.throws(
    () => adoptSeasonCouncilRulesetV1(proposal, noQuorumVotes, { asOfTime: proposal.endsAt + 1 }),
    /quorum not reached/,
  );
});
