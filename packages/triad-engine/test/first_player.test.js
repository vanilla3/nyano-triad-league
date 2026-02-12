import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFirstPlayerChoiceCommitV1,
  verifyFirstPlayerChoiceCommitV1,
  buildFirstPlayerRevealCommitV1,
  verifyFirstPlayerRevealCommitV1,
  deriveFirstPlayerFromCommitRevealV1,
  deriveFirstPlayerFromSeedV1,
  resolveFirstPlayerByMutualChoiceV1,
} from "../dist/index.js";

test("first-player commit: build + verify", () => {
  const input = {
    matchSalt: "0x1111111111111111111111111111111111111111111111111111111111111111",
    player: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
    firstPlayer: 0,
    nonce: "0x2222222222222222222222222222222222222222222222222222222222222222",
  };

  const commit = buildFirstPlayerChoiceCommitV1(input);
  assert.match(commit, /^0x[0-9a-f]{64}$/);
  assert.equal(verifyFirstPlayerChoiceCommitV1(commit, input), true);

  const tampered = { ...input, firstPlayer: 1 };
  assert.equal(verifyFirstPlayerChoiceCommitV1(commit, tampered), false);
});

test("first-player commit: invalid firstPlayer throws", () => {
  assert.throws(() =>
    buildFirstPlayerChoiceCommitV1({
      matchSalt: "0x1111111111111111111111111111111111111111111111111111111111111111",
      player: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
      firstPlayer: 2,
      nonce: "0x2222222222222222222222222222222222222222222222222222222222222222",
    }),
  );
});

test("commit-reveal first-player: deterministic and sensitive to reveals", () => {
  const matchSalt = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const base = deriveFirstPlayerFromCommitRevealV1({
    matchSalt,
    revealA: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    revealB: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  });

  assert.ok(base === 0 || base === 1, "firstPlayer must be 0 or 1");
  assert.equal(
    base,
    deriveFirstPlayerFromCommitRevealV1({
      matchSalt,
      revealA: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      revealB: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    }),
  );

  let changed = false;
  for (let i = 1; i <= 16; i++) {
    const revealB = `0x${i.toString(16).padStart(64, "0")}`;
    const v = deriveFirstPlayerFromCommitRevealV1({
      matchSalt,
      revealA: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      revealB,
    });
    if (v !== base) {
      changed = true;
      break;
    }
  }
  assert.equal(changed, true, "at least one alternate reveal should change the outcome");
});

test("seed-based first-player: deterministic and sensitive to seed", () => {
  const matchSalt = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const base = deriveFirstPlayerFromSeedV1({
    matchSalt,
    seed: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });

  assert.ok(base === 0 || base === 1, "firstPlayer must be 0 or 1");
  assert.equal(
    base,
    deriveFirstPlayerFromSeedV1({
      matchSalt,
      seed: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    }),
  );

  let changed = false;
  for (let i = 1; i <= 16; i++) {
    const seed = `0x${i.toString(16).padStart(64, "0")}`;
    const v = deriveFirstPlayerFromSeedV1({ matchSalt, seed });
    if (v !== base) {
      changed = true;
      break;
    }
  }
  assert.equal(changed, true, "at least one alternate seed should change the outcome");
});

test("seed-based first-player: invalid seed throws", () => {
  assert.throws(() =>
    deriveFirstPlayerFromSeedV1({
      matchSalt: "0x1111111111111111111111111111111111111111111111111111111111111111",
      seed: "0x1234",
    }),
  );
});

test("reveal-commit: build + verify", () => {
  const input = {
    matchSalt: "0x1111111111111111111111111111111111111111111111111111111111111111",
    reveal: "0x3333333333333333333333333333333333333333333333333333333333333333",
  };

  const commit = buildFirstPlayerRevealCommitV1(input);
  assert.match(commit, /^0x[0-9a-f]{64}$/);
  assert.equal(verifyFirstPlayerRevealCommitV1(commit, input), true);

  const tampered = { ...input, reveal: "0x4444444444444444444444444444444444444444444444444444444444444444" };
  assert.equal(verifyFirstPlayerRevealCommitV1(commit, tampered), false);
});

test("mutual-choice first-player: matches when both agree, throws on mismatch", () => {
  assert.equal(resolveFirstPlayerByMutualChoiceV1(0, 0), 0);
  assert.equal(resolveFirstPlayerByMutualChoiceV1(1, 1), 1);
  assert.throws(() => resolveFirstPlayerByMutualChoiceV1(0, 1));
});
