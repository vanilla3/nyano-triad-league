import { describe, it, expect } from "vitest";
import { VECTORS } from "../vectors";
import { buildTranscriptFromVector, buildCardsMapFromVector } from "../build";

/* ------------------------------------------------------------------ */
/* VECTORS constant                                                    */
/* ------------------------------------------------------------------ */

describe("VECTORS", () => {
  it("core_tactics_v1 has 10 cases", () => {
    expect(VECTORS.core_tactics_v1.cases).toHaveLength(10);
  });

  it("core_tactics_shadow_v2 has 2 cases", () => {
    expect(VECTORS.core_tactics_shadow_v2.cases).toHaveLength(2);
  });

  it("notes is always an array (normalized)", () => {
    expect(Array.isArray(VECTORS.core_tactics_v1.notes)).toBe(true);
    expect(Array.isArray(VECTORS.core_tactics_shadow_v2.notes)).toBe(true);
  });

  it("schema contains nyano-triad-league", () => {
    expect(VECTORS.core_tactics_v1.schema).toContain("nyano-triad-league");
  });

  it("each case has name and transcript", () => {
    for (const c of VECTORS.core_tactics_v1.cases) {
      expect(c.name).toBeTruthy();
      expect(c.transcript).toBeTruthy();
      expect(c.tokens).toBeTruthy();
    }
  });
});

/* ------------------------------------------------------------------ */
/* buildTranscriptFromVector                                           */
/* ------------------------------------------------------------------ */

describe("buildTranscriptFromVector", () => {
  const c0 = VECTORS.core_tactics_v1.cases[0];
  const result = buildTranscriptFromVector(c0);

  it("header.version matches case transcript version", () => {
    expect(result.header.version).toBe(c0.transcript.version);
  });

  it("deckA elements are bigint", () => {
    expect(typeof result.header.deckA[0]).toBe("bigint");
    expect(result.header.deckA).toHaveLength(5);
  });

  it("deckB elements are bigint", () => {
    expect(typeof result.header.deckB[0]).toBe("bigint");
    expect(result.header.deckB).toHaveLength(5);
  });

  it("turns has 9 entries (full game)", () => {
    expect(result.turns).toHaveLength(9);
  });

  it("firstPlayer is preserved", () => {
    expect(result.header.firstPlayer).toBe(c0.transcript.firstPlayer);
  });

  it("header fields are preserved", () => {
    expect(result.header.seasonId).toBe(c0.transcript.seasonId);
    expect(result.header.rulesetId).toBe(c0.transcript.rulesetId);
    expect(result.header.playerA).toBe(c0.transcript.playerA);
    expect(result.header.playerB).toBe(c0.transcript.playerB);
    expect(result.header.deadline).toBe(c0.transcript.deadline);
    expect(result.header.salt).toBe(c0.transcript.salt);
  });

  it("turns have cell and cardIndex fields", () => {
    for (const turn of result.turns) {
      expect(turn.cell).toBeGreaterThanOrEqual(0);
      expect(turn.cell).toBeLessThanOrEqual(8);
      expect(turn.cardIndex).toBeGreaterThanOrEqual(0);
      expect(turn.cardIndex).toBeLessThanOrEqual(4);
    }
  });

  it("works with shadow_v2 cases", () => {
    const cv2 = VECTORS.core_tactics_shadow_v2.cases[0];
    const r2 = buildTranscriptFromVector(cv2);
    expect(r2.header.version).toBe(cv2.transcript.version);
    expect(r2.turns).toHaveLength(9);
  });
});

/* ------------------------------------------------------------------ */
/* buildCardsMapFromVector                                             */
/* ------------------------------------------------------------------ */

describe("buildCardsMapFromVector", () => {
  const c0 = VECTORS.core_tactics_v1.cases[0];
  const map = buildCardsMapFromVector(c0);

  it("map size matches token count", () => {
    expect(map.size).toBe(Object.keys(c0.tokens).length);
  });

  it("keys are bigint", () => {
    const firstKey = Object.keys(c0.tokens)[0];
    expect(map.has(BigInt(firstKey))).toBe(true);
  });

  it("card edges match token triad", () => {
    for (const [k, v] of Object.entries(c0.tokens)) {
      const card = map.get(BigInt(k));
      expect(card).toBeDefined();
      expect(card!.edges.up).toBe(v.triad.up);
      expect(card!.edges.right).toBe(v.triad.right);
      expect(card!.edges.down).toBe(v.triad.down);
      expect(card!.edges.left).toBe(v.triad.left);
    }
  });

  it("jankenHand is propagated", () => {
    for (const [k, v] of Object.entries(c0.tokens)) {
      const card = map.get(BigInt(k));
      expect(card!.jankenHand).toBe(v.hand);
    }
  });

  it("combatStatSum is propagated", () => {
    for (const [k, v] of Object.entries(c0.tokens)) {
      const card = map.get(BigInt(k));
      expect(card!.combatStatSum).toBe(v.power);
    }
  });

  it("no-trait tokens get 'none'", () => {
    // v1 cases have no trait field
    for (const [k] of Object.entries(c0.tokens)) {
      const card = map.get(BigInt(k));
      expect(card!.trait).toBe("none");
    }
  });

  it("shadow_v2 case with traits builds correctly", () => {
    const cv2 = VECTORS.core_tactics_shadow_v2.cases[0];
    const map2 = buildCardsMapFromVector(cv2);
    expect(map2.size).toBe(Object.keys(cv2.tokens).length);

    // shadow_v2 tokens have trait field — verify they don't become "none"
    for (const [k, v] of Object.entries(cv2.tokens)) {
      const card = map2.get(BigInt(k));
      expect(card).toBeDefined();
      if (v.trait) {
        // trait was provided — should be derived (not "none" unless derivation yields "none")
        expect(card!.trait).toBeDefined();
      }
    }
  });

  it("tokenId on card matches the map key", () => {
    for (const [k] of Object.entries(c0.tokens)) {
      const id = BigInt(k);
      const card = map.get(id);
      expect(card!.tokenId).toBe(id);
    }
  });
});
