import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFirstPlayerChoiceCommitV1,
  verifyFirstPlayerChoiceCommitV1,
  buildFirstPlayerRevealCommitV1,
  verifyFirstPlayerRevealCommitV1,
  deriveFirstPlayerFromCommitRevealV1,
  resolveFirstPlayerFromCommitRevealV1,
  deriveFirstPlayerFromSeedV1,
  resolveFirstPlayerByMutualChoiceV1,
  resolveFirstPlayerV1,
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

test("commit-reveal resolver: verifies commits before deriving", () => {
  const matchSalt = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const revealA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const revealB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const commitA = buildFirstPlayerRevealCommitV1({ matchSalt, reveal: revealA });
  const commitB = buildFirstPlayerRevealCommitV1({ matchSalt, reveal: revealB });

  const viaResolve = resolveFirstPlayerFromCommitRevealV1({
    matchSalt,
    revealA,
    revealB,
    commitA,
    commitB,
  });
  const viaDerive = deriveFirstPlayerFromCommitRevealV1({ matchSalt, revealA, revealB });
  assert.equal(viaResolve, viaDerive);
});

test("commit-reveal resolver: mismatch commit throws", () => {
  const matchSalt = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const revealA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const revealB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const commitA = buildFirstPlayerRevealCommitV1({ matchSalt, reveal: revealA });
  const wrongCommitB = buildFirstPlayerRevealCommitV1({
    matchSalt,
    reveal: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  });

  assert.throws(
    () =>
      resolveFirstPlayerFromCommitRevealV1({
        matchSalt,
        revealA,
        revealB,
        commitA,
        commitB: wrongCommitB,
      }),
    /commitB mismatch/,
  );
});

test("commit-reveal resolver: one-sided commit input throws", () => {
  const matchSalt = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const revealA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const revealB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const commitA = buildFirstPlayerRevealCommitV1({ matchSalt, reveal: revealA });

  assert.throws(
    () =>
      resolveFirstPlayerFromCommitRevealV1({
        matchSalt,
        revealA,
        revealB,
        commitA,
      }),
    /must be provided together/,
  );
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

test("resolveFirstPlayerV1: mutual_choice mode", () => {
  assert.equal(resolveFirstPlayerV1({ mode: "mutual_choice", choiceA: 1, choiceB: 1 }), 1);
});

test("resolveFirstPlayerV1: seed mode", () => {
  const matchSalt = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const seed = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  assert.equal(
    resolveFirstPlayerV1({ mode: "seed", matchSalt, seed }),
    deriveFirstPlayerFromSeedV1({ matchSalt, seed }),
  );
});

test("resolveFirstPlayerV1: commit_reveal mode", () => {
  const matchSalt = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const revealA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const revealB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const commitA = buildFirstPlayerRevealCommitV1({ matchSalt, reveal: revealA });
  const commitB = buildFirstPlayerRevealCommitV1({ matchSalt, reveal: revealB });
  assert.equal(
    resolveFirstPlayerV1({ mode: "commit_reveal", matchSalt, revealA, revealB, commitA, commitB }),
    deriveFirstPlayerFromCommitRevealV1({ matchSalt, revealA, revealB }),
  );
});

test("resolveFirstPlayerV1: unsupported mode throws", () => {
  assert.throws(
    () => resolveFirstPlayerV1({ mode: "future_mode" }),
    /unsupported first-player mode/,
  );
});
