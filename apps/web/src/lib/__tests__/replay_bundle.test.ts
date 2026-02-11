import { describe, it, expect } from "vitest";
import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import {
  compactCardData,
  expandCardData,
  buildReplayBundleV2,
  stringifyReplayBundle,
  parseReplayPayload,
} from "../replay_bundle";
import { stringifyWithBigInt } from "../json";

/* ═══════════════════════════════════════════════════════════════════
   Fixtures
   ═══════════════════════════════════════════════════════════════════ */

function makeCard(tokenId: bigint, edges: [number, number, number, number], hand: 0 | 1 | 2 = 0): CardData {
  return {
    tokenId,
    edges: { up: edges[0], right: edges[1], down: edges[2], left: edges[3] },
    jankenHand: hand,
    combatStatSum: edges[0] + edges[1] + edges[2] + edges[3],
    trait: "none",
  };
}

const DECK_A_IDS: bigint[] = [1n, 2n, 3n, 4n, 5n];
const DECK_B_IDS: bigint[] = [6n, 7n, 8n, 9n, 10n];

function makeTranscript(): TranscriptV1 {
  return {
    header: {
      version: 1,
      rulesetId: `0x${"11".repeat(32)}` as `0x${string}`,
      seasonId: 1,
      playerA: "0xaaaa" as `0x${string}`,
      playerB: "0xbbbb" as `0x${string}`,
      deckA: DECK_A_IDS,
      deckB: DECK_B_IDS,
      firstPlayer: 0 as 0 | 1,
      deadline: 9999,
      salt: "0xcc" as `0x${string}`,
    },
    turns: [
      { cell: 4, cardIndex: 0 },
      { cell: 0, cardIndex: 0 },
    ],
  };
}

function makeCards(): Map<bigint, CardData> {
  const m = new Map<bigint, CardData>();
  for (let i = 1; i <= 10; i++) {
    m.set(BigInt(i), makeCard(BigInt(i), [i, i + 1, i + 2, i + 3], (i % 3) as 0 | 1 | 2));
  }
  return m;
}

/* ═══════════════════════════════════════════════════════════════════
   compactCardData / expandCardData
   ═══════════════════════════════════════════════════════════════════ */

describe("compactCardData / expandCardData", () => {
  it("roundtrips a normal card", () => {
    const card = makeCard(42n, [5, 3, 7, 2], 1);
    const compact = compactCardData(card);
    const restored = expandCardData(compact);
    expect(restored.tokenId).toBe(42n);
    expect(restored.edges).toEqual({ up: 5, right: 3, down: 7, left: 2 });
    expect(restored.jankenHand).toBe(1);
    expect(restored.combatStatSum).toBe(17);
  });

  it("roundtrips edge values 0 and 10", () => {
    const card = makeCard(1n, [0, 10, 0, 10], 2);
    const compact = compactCardData(card);
    const restored = expandCardData(compact);
    expect(restored.edges).toEqual({ up: 0, right: 10, down: 0, left: 10 });
    expect(restored.jankenHand).toBe(2);
  });

  it("roundtrips all three janken hands", () => {
    for (const hand of [0, 1, 2] as const) {
      const card = makeCard(BigInt(hand + 100), [1, 1, 1, 1], hand);
      const restored = expandCardData(compactCardData(card));
      expect(restored.jankenHand).toBe(hand);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════
   buildReplayBundleV2
   ═══════════════════════════════════════════════════════════════════ */

describe("buildReplayBundleV2", () => {
  it("produces bundleVersion 2", () => {
    const bundle = buildReplayBundleV2(makeTranscript(), makeCards());
    expect(bundle.bundleVersion).toBe(2);
  });

  it("includes transcript", () => {
    const transcript = makeTranscript();
    const bundle = buildReplayBundleV2(transcript, makeCards());
    expect(bundle.transcript.header.playerA).toBe(transcript.header.playerA);
    expect(bundle.transcript.turns.length).toBe(2);
  });

  it("includes 10 unique cards for both decks", () => {
    const bundle = buildReplayBundleV2(makeTranscript(), makeCards());
    expect(bundle.cards.length).toBe(10);
  });

  it("deduplicates cards when same token in both decks", () => {
    const transcript = makeTranscript();
    // Force overlap: deckB[0] = deckA[0]
    transcript.header.deckB = [1n, 7n, 8n, 9n, 10n];
    const bundle = buildReplayBundleV2(transcript, makeCards());
    expect(bundle.cards.length).toBe(9); // 1 is shared
  });

  it("skips missing cards gracefully", () => {
    const cards = new Map<bigint, CardData>();
    cards.set(1n, makeCard(1n, [1, 2, 3, 4]));
    // Only 1 of 10 cards available
    const bundle = buildReplayBundleV2(makeTranscript(), cards);
    expect(bundle.cards.length).toBe(1);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   parseReplayPayload — v2 parsing
   ═══════════════════════════════════════════════════════════════════ */

describe("parseReplayPayload (v2)", () => {
  function makeV2Json(): string {
    const bundle = buildReplayBundleV2(makeTranscript(), makeCards());
    return stringifyReplayBundle(bundle);
  }

  it("detects v2 and returns version 2", () => {
    const parsed = parseReplayPayload(makeV2Json());
    expect(parsed.version).toBe(2);
  });

  it("restores transcript with correct bigint deckA", () => {
    const parsed = parseReplayPayload(makeV2Json());
    expect(parsed.transcript.header.deckA[0]).toBe(1n);
    expect(typeof parsed.transcript.header.deckA[0]).toBe("bigint");
  });

  it("restores cards map with correct entries", () => {
    const parsed = parseReplayPayload(makeV2Json());
    if (parsed.version !== 2) throw new Error("expected v2");
    expect(parsed.cards.size).toBe(10);
  });

  it("restores card data fields correctly", () => {
    const parsed = parseReplayPayload(makeV2Json());
    if (parsed.version !== 2) throw new Error("expected v2");
    const card = parsed.cards.get(1n);
    expect(card).toBeDefined();
    expect(card!.tokenId).toBe(1n);
    expect(card!.edges.up).toBe(1);
    expect(card!.jankenHand).toBe(1); // 1 % 3 = 1
  });

  it("restores transcript turns", () => {
    const parsed = parseReplayPayload(makeV2Json());
    expect(parsed.transcript.turns.length).toBe(2);
    expect(parsed.transcript.turns[0].cell).toBe(4);
  });

  it("handles empty cards array", () => {
    const json = JSON.stringify({ bundleVersion: 2, transcript: JSON.parse(stringifyWithBigInt(makeTranscript())), cards: [] });
    const parsed = parseReplayPayload(json);
    expect(parsed.version).toBe(2);
    if (parsed.version === 2) {
      expect(parsed.cards.size).toBe(0);
    }
  });

  it("skips malformed card entries", () => {
    const bundle = JSON.parse(stringifyReplayBundle(buildReplayBundleV2(makeTranscript(), makeCards())));
    bundle.cards.push([]);         // too short
    bundle.cards.push("invalid");  // not array
    const parsed = parseReplayPayload(JSON.stringify(bundle));
    if (parsed.version !== 2) throw new Error("expected v2");
    expect(parsed.cards.size).toBe(10); // only the valid 10
  });
});

/* ═══════════════════════════════════════════════════════════════════
   parseReplayPayload — v1 fallback
   ═══════════════════════════════════════════════════════════════════ */

describe("parseReplayPayload (v1 fallback)", () => {
  it("parses bare TranscriptV1 as version 1", () => {
    const json = stringifyWithBigInt(makeTranscript());
    const parsed = parseReplayPayload(json);
    expect(parsed.version).toBe(1);
  });

  it("restores transcript fields for v1", () => {
    const json = stringifyWithBigInt(makeTranscript());
    const parsed = parseReplayPayload(json);
    expect(parsed.transcript.header.deckA[0]).toBe(1n);
    expect(parsed.transcript.turns.length).toBe(2);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseReplayPayload("{not json")).toThrow();
  });

  it("throws on missing header", () => {
    expect(() => parseReplayPayload(JSON.stringify({ turns: [] }))).toThrow(/header/i);
  });
});

/* ═══════════════════════════════════════════════════════════════════
   Full roundtrip
   ═══════════════════════════════════════════════════════════════════ */

describe("full roundtrip", () => {
  it("build → stringify → parse → compare", () => {
    const transcript = makeTranscript();
    const cards = makeCards();
    const bundle = buildReplayBundleV2(transcript, cards);
    const json = stringifyReplayBundle(bundle);
    const parsed = parseReplayPayload(json);

    expect(parsed.version).toBe(2);
    if (parsed.version !== 2) throw new Error("expected v2");

    // Transcript comparison
    expect(parsed.transcript.header.playerA).toBe(transcript.header.playerA);
    expect(parsed.transcript.header.deckA).toEqual(transcript.header.deckA);
    expect(parsed.transcript.turns).toEqual(transcript.turns);

    // Cards comparison
    for (const [tid, orig] of cards) {
      const restored = parsed.cards.get(tid);
      expect(restored).toBeDefined();
      expect(restored!.edges).toEqual(orig.edges);
      expect(restored!.jankenHand).toBe(orig.jankenHand);
      expect(restored!.combatStatSum).toBe(orig.combatStatSum);
    }
  });

  it("v1 JSON stays backward compatible", () => {
    const json = stringifyWithBigInt(makeTranscript());
    const parsed = parseReplayPayload(json);
    expect(parsed.version).toBe(1);
    expect(parsed.transcript.header.deckA.length).toBe(5);
  });

  it("v2 JSON roundtrips through re-serialization", () => {
    const bundle = buildReplayBundleV2(makeTranscript(), makeCards());
    const json1 = stringifyReplayBundle(bundle);
    const parsed = parseReplayPayload(json1);
    if (parsed.version !== 2) throw new Error("expected v2");
    const bundle2 = buildReplayBundleV2(parsed.transcript, parsed.cards);
    const json2 = stringifyReplayBundle(bundle2);
    // Re-parse to compare structurally (JSON string order may differ)
    const parsed2 = parseReplayPayload(json2);
    expect(parsed2.version).toBe(2);
    if (parsed2.version === 2) {
      expect(parsed2.cards.size).toBe(parsed.cards.size);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════
   URL size sanity
   ═══════════════════════════════════════════════════════════════════ */

describe("URL size sanity", () => {
  it("10-card v2 JSON is under 2000 bytes", () => {
    const json = stringifyReplayBundle(buildReplayBundleV2(makeTranscript(), makeCards()));
    expect(json.length).toBeLessThan(2000);
  });

  it("v2 compact format is smaller than full CardData JSON", () => {
    const cards = makeCards();
    const fullJson = stringifyWithBigInt(Object.fromEntries(
      [...cards].map(([k, v]) => [k.toString(), v])
    ));
    const compactJson = JSON.stringify(
      [...cards.values()].map(compactCardData)
    );
    expect(compactJson.length).toBeLessThan(fullJson.length);
  });

  it("v2 bundle JSON length is reasonable", () => {
    const v2Json = stringifyReplayBundle(buildReplayBundleV2(makeTranscript(), makeCards()));
    const v1Json = stringifyWithBigInt(makeTranscript(), 0);
    // v2 should be larger than v1 (has cards) but not more than 3x
    expect(v2Json.length).toBeGreaterThan(v1Json.length);
    expect(v2Json.length).toBeLessThan(v1Json.length * 3);
  });
});
