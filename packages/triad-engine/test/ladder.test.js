import test from "node:test";
import assert from "node:assert/strict";
import { Wallet } from "ethers";
import {
  buildLadderMatchAttestationInputFromSettledV1,
  buildLadderMatchAttestationTypedDataDigestV1,
  buildLadderMatchAttestationTypedDataV1,
  buildLadderStandingsV1,
  verifyLadderMatchRecordV1,
} from "../dist/index.js";
import { hashTranscriptV1 } from "../dist/transcript.js";

const RULESET_ID = "0x1111111111111111111111111111111111111111111111111111111111111111";
const REPLAY_HASH = "0x2222222222222222222222222222222222222222222222222222222222222222";
const TX_HASH_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TX_HASH_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const TX_HASH_C = "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

const DOMAIN = {
  chainId: 8453n,
  verifyingContract: "0x1111111111111111111111111111111111111111",
};

function makeWallet(hex) {
  return new Wallet(hex);
}

function makeTranscript({ playerA, playerB, salt, seasonId = 1 }) {
  let usedA = 0;
  let usedB = 0;
  const turns = [];
  for (let i = 0; i < 9; i++) {
    const isATurn = i % 2 === 0;
    turns.push({
      cell: i,
      cardIndex: isATurn ? usedA++ : usedB++,
      warningMarkCell: 255,
      earthBoostEdge: 255,
      reserved: 0,
    });
  }

  return {
    header: {
      version: 1,
      rulesetId: RULESET_ID,
      seasonId,
      playerA,
      playerB,
      deckA: [1n, 2n, 3n, 4n, 5n],
      deckB: [6n, 7n, 8n, 9n, 10n],
      firstPlayer: 0,
      deadline: 1_900_000_000,
      salt,
    },
    turns,
  };
}

function makeSettled(transcript, overrides = {}) {
  const base = {
    matchId: hashTranscriptV1(transcript),
    rulesetId: transcript.header.rulesetId,
    seasonId: transcript.header.seasonId,
    playerA: transcript.header.playerA,
    playerB: transcript.header.playerB,
    winner: transcript.header.playerA,
    tilesA: 6,
    tilesB: 3,
    pointsDeltaA: 10,
    pointsDeltaB: -10,
    replayHash: REPLAY_HASH,
    settledAt: 1_700_000_100,
    source: {
      chainId: 8453n,
      blockNumber: 100n,
      txHash: TX_HASH_A,
      logIndex: 0,
    },
  };

  const out = { ...base, ...overrides };
  if (overrides.source) {
    out.source = { ...base.source, ...overrides.source };
  }
  return out;
}

async function signSettled(settled, walletA, walletB) {
  const attestation = buildLadderMatchAttestationInputFromSettledV1(settled);
  const payload = buildLadderMatchAttestationTypedDataV1(DOMAIN, attestation);
  const signatureA = await walletA.signTypedData(payload.domain, payload.types, payload.message);
  const signatureB = await walletB.signTypedData(payload.domain, payload.types, payload.message);
  return { signatureA, signatureB };
}

test("ladder: verify record succeeds for transcript + settled + signatures", async () => {
  const walletA = makeWallet("0x59c6995e998f97a5a0044966f0945386cf6f52f8b52f9f4f4f0f5f6f4f1f9d6f");
  const walletB = makeWallet("0x8b3a350cf5c34c9194ca3a545d3e64e9d7f6f5e6a7b8c9d0e1f2030405060708");

  const transcript = makeTranscript({
    playerA: walletA.address,
    playerB: walletB.address,
    salt: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });
  const settled = makeSettled(transcript);
  const { signatureA, signatureB } = await signSettled(settled, walletA, walletB);

  const attestation = buildLadderMatchAttestationInputFromSettledV1(settled);
  const digest = buildLadderMatchAttestationTypedDataDigestV1(DOMAIN, attestation);
  assert.match(digest, /^0x[0-9a-f]{64}$/);

  const verified = verifyLadderMatchRecordV1(
    {
      transcript,
      settled,
      signatureA,
      signatureB,
    },
    DOMAIN,
  );

  assert.equal(verified.settled.matchId, settled.matchId.toLowerCase());
  assert.equal(verified.settled.playerA, walletA.address);
  assert.equal(verified.settled.playerB, walletB.address);
  assert.equal(verified.settled.source.blockNumber, 100n);
});

test("ladder: transcript and settled mismatch is rejected", async () => {
  const walletA = makeWallet("0x0123456789012345678901234567890123456789012345678901234567890123");
  const walletB = makeWallet("0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd");

  const transcript = makeTranscript({
    playerA: walletA.address,
    playerB: walletB.address,
    salt: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  });
  const settled = makeSettled(transcript, {
    matchId: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  });
  const { signatureA, signatureB } = await signSettled(settled, walletA, walletB);

  assert.throws(
    () =>
      verifyLadderMatchRecordV1(
        {
          transcript,
          settled,
          signatureA,
          signatureB,
        },
        DOMAIN,
      ),
    /transcript matchId mismatch/,
  );
});

test("ladder: signature mismatch is rejected", async () => {
  const walletA = makeWallet("0x1111111111111111111111111111111111111111111111111111111111111111");
  const walletB = makeWallet("0x2222222222222222222222222222222222222222222222222222222222222222");
  const walletC = makeWallet("0x3333333333333333333333333333333333333333333333333333333333333333");

  const transcript = makeTranscript({
    playerA: walletA.address,
    playerB: walletB.address,
    salt: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  });
  const settled = makeSettled(transcript);

  const attestation = buildLadderMatchAttestationInputFromSettledV1(settled);
  const payload = buildLadderMatchAttestationTypedDataV1(DOMAIN, attestation);
  const signatureA = await walletC.signTypedData(payload.domain, payload.types, payload.message);
  const signatureB = await walletB.signTypedData(payload.domain, payload.types, payload.message);

  assert.throws(
    () =>
      verifyLadderMatchRecordV1(
        {
          transcript,
          settled,
          signatureA,
          signatureB,
        },
        DOMAIN,
      ),
    /signatureA does not match playerA/,
  );
});

test("ladder: standings are deterministic, dedupe duplicates, and apply fixed tie-break", async () => {
  const walletA = makeWallet("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  const walletB = makeWallet("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  const walletC = makeWallet("0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc");

  const transcriptAC = makeTranscript({
    playerA: walletA.address,
    playerB: walletC.address,
    salt: "0x1010101010101010101010101010101010101010101010101010101010101010",
  });
  const settledAC = makeSettled(transcriptAC, {
    winner: walletA.address,
    tilesA: 6,
    tilesB: 3,
    pointsDeltaA: 10,
    pointsDeltaB: -10,
    source: { blockNumber: 200n, txHash: TX_HASH_A, logIndex: 0 },
  });
  const signedAC = await signSettled(settledAC, walletA, walletC);
  const recordAC = {
    transcript: transcriptAC,
    settled: settledAC,
    signatureA: signedAC.signatureA,
    signatureB: signedAC.signatureB,
  };

  const transcriptBC = makeTranscript({
    playerA: walletB.address,
    playerB: walletC.address,
    salt: "0x2020202020202020202020202020202020202020202020202020202020202020",
  });
  const settledBC = makeSettled(transcriptBC, {
    winner: walletB.address,
    tilesA: 5,
    tilesB: 4,
    pointsDeltaA: 10,
    pointsDeltaB: -10,
    source: { blockNumber: 201n, txHash: TX_HASH_B, logIndex: 0 },
  });
  const signedBC = await signSettled(settledBC, walletB, walletC);
  const recordBC = {
    transcript: transcriptBC,
    settled: settledBC,
    signatureA: signedBC.signatureA,
    signatureB: signedBC.signatureB,
  };

  const resultA = buildLadderStandingsV1(
    [recordBC, recordAC, recordAC],
    DOMAIN,
    {
      expectedSeasonId: 1,
      expectedRulesetId: RULESET_ID,
      requireZeroSumPoints: true,
    },
  );
  const resultB = buildLadderStandingsV1(
    [recordAC, recordBC],
    DOMAIN,
    {
      expectedSeasonId: 1,
      expectedRulesetId: RULESET_ID,
      requireZeroSumPoints: true,
    },
  );

  assert.equal(resultA.recordsInput, 3);
  assert.equal(resultA.recordsAccepted, 2);
  assert.equal(resultA.recordsRejected, 0);
  assert.equal(resultA.duplicatesIgnored, 1);
  assert.deepEqual(resultA.standings, resultB.standings);

  assert.equal(resultA.standings.length, 3);
  assert.equal(resultA.standings[0].player, walletA.address);
  assert.equal(resultA.standings[0].rank, 1);
  assert.equal(resultA.standings[0].points, 10n);
  assert.equal(resultA.standings[0].wins, 1);
  assert.equal(resultA.standings[0].tileDiff, 3);

  assert.equal(resultA.standings[1].player, walletB.address);
  assert.equal(resultA.standings[1].rank, 2);
  assert.equal(resultA.standings[1].points, 10n);
  assert.equal(resultA.standings[1].wins, 1);
  assert.equal(resultA.standings[1].tileDiff, 1);

  assert.equal(resultA.standings[2].player, walletC.address);
  assert.equal(resultA.standings[2].rank, 3);
  assert.equal(resultA.standings[2].points, -20n);
});

test("ladder: conflicting duplicate event source is rejected", async () => {
  const walletA = makeWallet("0x4444444444444444444444444444444444444444444444444444444444444444");
  const walletB = makeWallet("0x5555555555555555555555555555555555555555555555555555555555555555");

  const transcript1 = makeTranscript({
    playerA: walletA.address,
    playerB: walletB.address,
    salt: "0x3030303030303030303030303030303030303030303030303030303030303030",
  });
  const settled1 = makeSettled(transcript1, {
    source: { blockNumber: 333n, txHash: TX_HASH_C, logIndex: 0 },
  });
  const signed1 = await signSettled(settled1, walletA, walletB);

  const transcript2 = makeTranscript({
    playerA: walletA.address,
    playerB: walletB.address,
    salt: "0x4040404040404040404040404040404040404040404040404040404040404040",
  });
  const settled2 = makeSettled(transcript2, {
    source: { blockNumber: 333n, txHash: TX_HASH_C, logIndex: 0 },
  });
  const signed2 = await signSettled(settled2, walletA, walletB);

  const result = buildLadderStandingsV1(
    [
      { transcript: transcript1, settled: settled1, signatureA: signed1.signatureA, signatureB: signed1.signatureB },
      { transcript: transcript2, settled: settled2, signatureA: signed2.signatureA, signatureB: signed2.signatureB },
    ],
    DOMAIN,
    {
      expectedSeasonId: 1,
      expectedRulesetId: RULESET_ID,
      requireZeroSumPoints: true,
    },
  );

  assert.equal(result.recordsAccepted, 1);
  assert.equal(result.recordsRejected, 1);
  assert.equal(result.rejections.length, 1);
  assert.match(result.rejections[0].reason, /conflicting duplicate event source/);
});
