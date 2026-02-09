import { describe, it, expect } from "vitest";
import { parseTranscriptV1Json } from "../transcript_import";

/* ------------------------------------------------------------------ */
/* Helper                                                              */
/* ------------------------------------------------------------------ */

function makeValidTranscript(): object {
  return {
    header: {
      version: 1,
      rulesetId: "0xabc",
      seasonId: 1,
      playerA: "0x1111",
      playerB: "0x2222",
      deckA: ["1", "2", "3", "4", "5"],
      deckB: ["6", "7", "8", "9", "10"],
      firstPlayer: 0,
      deadline: 9999,
      salt: "0xdeadbeef",
    },
    turns: Array.from({ length: 9 }, (_, i) => ({ cell: i, cardIndex: i % 5 })),
  };
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe("parseTranscriptV1Json", () => {
  /* ── happy path ─────────────────────────────────────────────────── */

  it("parses a valid transcript returning correct types", () => {
    const result = parseTranscriptV1Json(JSON.stringify(makeValidTranscript()));

    expect(result.header.version).toBe(1);
    expect(result.header.rulesetId).toBe("0xabc");
    expect(result.header.seasonId).toBe(1);
    expect(result.header.playerA).toBe("0x1111");
    expect(result.header.playerB).toBe("0x2222");
    expect(result.header.firstPlayer).toBe(0);
    expect(result.header.deadline).toBe(9999);
    expect(result.header.salt).toBe("0xdeadbeef");
    expect(result.header.deckA).toHaveLength(5);
    expect(result.header.deckB).toHaveLength(5);
    expect(result.turns).toHaveLength(9);
  });

  it("converts string deck values to bigint", () => {
    const t = makeValidTranscript() as any;
    t.header.deckA = ["100", "200", "300", "400", "500"];
    const result = parseTranscriptV1Json(JSON.stringify(t));

    expect(result.header.deckA[0]).toBe(100n);
    expect(result.header.deckA[4]).toBe(500n);
    expect(typeof result.header.deckA[0]).toBe("bigint");
  });

  it("converts number deck values to bigint", () => {
    const t = makeValidTranscript() as any;
    t.header.deckA = [100, 200, 300, 400, 500];
    const result = parseTranscriptV1Json(JSON.stringify(t));

    expect(result.header.deckA[0]).toBe(100n);
    expect(result.header.deckA[4]).toBe(500n);
  });

  it("handles string numeric turn values (cell, cardIndex)", () => {
    const t = makeValidTranscript() as any;
    t.turns = [{ cell: "4", cardIndex: "2" }];
    const result = parseTranscriptV1Json(JSON.stringify(t));

    expect(result.turns[0].cell).toBe(4);
    expect(result.turns[0].cardIndex).toBe(2);
  });

  it("normalises optional turn fields (warningMarkCell)", () => {
    const t = makeValidTranscript() as any;
    t.turns = [{ cell: 0, cardIndex: 0, warningMarkCell: 3 }];
    const result = parseTranscriptV1Json(JSON.stringify(t));

    expect(result.turns[0].warningMarkCell).toBe(3);
  });

  it("leaves absent optional turn fields as undefined", () => {
    const t = makeValidTranscript() as any;
    t.turns = [{ cell: 0, cardIndex: 0 }];
    const result = parseTranscriptV1Json(JSON.stringify(t));

    expect(result.turns[0].warningMarkCell).toBeUndefined();
    expect(result.turns[0].earthBoostEdge).toBeUndefined();
    expect(result.turns[0].reserved).toBeUndefined();
  });

  /* ── error: JSON ────────────────────────────────────────────────── */

  it("throws on malformed JSON", () => {
    expect(() => parseTranscriptV1Json("not json")).toThrow(SyntaxError);
  });

  /* ── error: missing header fields ───────────────────────────────── */

  it("throws on missing header", () => {
    expect(() => parseTranscriptV1Json(JSON.stringify({ turns: [] }))).toThrow("header missing");
  });

  it("throws on missing header.version", () => {
    const t = makeValidTranscript() as any;
    delete t.header.version;
    expect(() => parseTranscriptV1Json(JSON.stringify(t))).toThrow("header.version missing");
  });

  it("throws on missing header.deckA", () => {
    const t = makeValidTranscript() as any;
    delete t.header.deckA;
    expect(() => parseTranscriptV1Json(JSON.stringify(t))).toThrow("header.deckA missing");
  });

  it("throws on missing header.rulesetId", () => {
    const t = makeValidTranscript() as any;
    delete t.header.rulesetId;
    expect(() => parseTranscriptV1Json(JSON.stringify(t))).toThrow("header.rulesetId missing");
  });

  /* ── error: hex validation ──────────────────────────────────────── */

  it("throws on non-hex rulesetId", () => {
    const t = makeValidTranscript() as any;
    t.header.rulesetId = "notHex";
    expect(() => parseTranscriptV1Json(JSON.stringify(t))).toThrow("must start with 0x");
  });

  it("throws on non-hex playerA", () => {
    const t = makeValidTranscript() as any;
    t.header.playerA = "notHex";
    expect(() => parseTranscriptV1Json(JSON.stringify(t))).toThrow("must start with 0x");
  });

  /* ── error: turns ───────────────────────────────────────────────── */

  it("throws on missing turns", () => {
    const t = makeValidTranscript() as any;
    delete t.turns;
    expect(() => parseTranscriptV1Json(JSON.stringify(t))).toThrow("turns missing");
  });

  it("throws on missing turn cell", () => {
    const t = makeValidTranscript() as any;
    t.turns = [{ cardIndex: 0 }];
    expect(() => parseTranscriptV1Json(JSON.stringify(t))).toThrow("turn[0].cell missing");
  });

  it("throws on missing turn cardIndex", () => {
    const t = makeValidTranscript() as any;
    t.turns = [{ cell: 0 }];
    expect(() => parseTranscriptV1Json(JSON.stringify(t))).toThrow("turn[0].cardIndex missing");
  });
});
