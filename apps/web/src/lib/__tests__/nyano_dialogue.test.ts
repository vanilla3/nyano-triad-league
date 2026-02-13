import { describe, it, expect } from "vitest";
import {
  REACTION_DIALOGUES,
  REASON_DIALOGUES,
  pickDialogue,
  pickReasonDialogue,
  detectLanguage,
} from "../nyano_dialogue";
import type { ReactionKind } from "../expression_map";

/* ═══════════════════════════════════════════════════════════════════
   nyano_dialogue.ts — Test Coverage
   ═══════════════════════════════════════════════════════════════════ */

const ALL_REACTION_KINDS: ReactionKind[] = [
  "idle",
  "flip_single",
  "flip_multi",
  "chain",
  "fever",
  "momentum",
  "domination",
  "warning_triggered",
  "advantage",
  "disadvantage",
  "draw_state",
  "victory",
  "defeat",
  "game_draw",
];

describe("REACTION_DIALOGUES", () => {
  it("has entries for every ReactionKind", () => {
    for (const kind of ALL_REACTION_KINDS) {
      expect(REACTION_DIALOGUES[kind]).toBeDefined();
      expect(REACTION_DIALOGUES[kind].length).toBeGreaterThan(0);
    }
  });

  it("every line has non-empty ja and en strings", () => {
    for (const kind of ALL_REACTION_KINDS) {
      for (const line of REACTION_DIALOGUES[kind]) {
        expect(line.ja).toBeTruthy();
        expect(line.en).toBeTruthy();
        expect(typeof line.ja).toBe("string");
        expect(typeof line.en).toBe("string");
      }
    }
  });

  it("uses the new Japanese suffix style (ぴかっ✨)", () => {
    const jaLines: string[] = [];

    for (const lines of Object.values(REACTION_DIALOGUES)) {
      for (const line of lines) jaLines.push(line.ja);
    }
    for (const lines of Object.values(REASON_DIALOGUES)) {
      if (!lines) continue;
      for (const line of lines) jaLines.push(line.ja);
    }

    expect(jaLines.some((line) => line.includes("ぴかっ✨"))).toBe(true);
    for (const line of jaLines) {
      expect(line).not.toMatch(/にゃっ([！？?!…。．♪]*)$/u);
      expect(line).not.toMatch(/にゃ[ー〜~]*([！？?!…。．♪]*)$/u);
      expect(line).not.toMatch(/ぴかっ✨([！？?!…。．♪]+)$/u);
    }
  });

  it("places punctuation before ぴかっ✨ when converting former にゃ lines", () => {
    const flipSingle = REACTION_DIALOGUES.flip_single.find((line) => line.en === "Got one!");
    const drawState = REACTION_DIALOGUES.draw_state.find((line) => line.en === "Who'll win?");
    const blockCorner = REASON_DIALOGUES.BLOCK_CORNER?.find((line) => line.en === "Corner secured!");

    expect(flipSingle?.ja).toMatch(/！ぴかっ✨$/u);
    expect(flipSingle?.ja).not.toMatch(/ぴかっ✨！$/u);

    expect(drawState?.ja).toMatch(/？ぴかっ✨$/u);
    expect(drawState?.ja).not.toMatch(/ぴかっ✨？$/u);

    // No trailing punctuation in source should still become conversational ("！ぴかっ✨")
    expect(blockCorner?.ja).toMatch(/！ぴかっ✨$/u);
  });
});

describe("REASON_DIALOGUES", () => {
  it("has entries for at least 5 AI reason codes", () => {
    const keys = Object.keys(REASON_DIALOGUES);
    expect(keys.length).toBeGreaterThanOrEqual(5);
  });

  it("every line has non-empty ja and en strings", () => {
    for (const [, lines] of Object.entries(REASON_DIALOGUES)) {
      if (!lines) continue;
      for (const line of lines) {
        expect(line.ja).toBeTruthy();
        expect(line.en).toBeTruthy();
      }
    }
  });
});

describe("pickDialogue", () => {
  it("returns a ja string by default for idle", () => {
    const result = pickDialogue("idle", 0);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    // Default lang is "ja" — verify it matches a ja line
    const jaLines = REACTION_DIALOGUES.idle.map((l) => l.ja);
    expect(jaLines).toContain(result);
  });

  it("returns an en string when lang=en", () => {
    const result = pickDialogue("idle", 0, "en");
    const enLines = REACTION_DIALOGUES.idle.map((l) => l.en);
    expect(enLines).toContain(result);
  });

  it("different seeds produce different lines (with enough variation)", () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(pickDialogue("idle", i));
    }
    // idle has 4 lines, so at least 2 unique results are expected
    expect(results.size).toBeGreaterThanOrEqual(2);
  });

  it("same seed always returns the same line (deterministic)", () => {
    const a = pickDialogue("victory", 42);
    const b = pickDialogue("victory", 42);
    expect(a).toBe(b);
  });

  it("returns empty string for unknown kind", () => {
    // Force cast to simulate unknown kind
    const result = pickDialogue("nonexistent_kind" as ReactionKind, 0);
    expect(result).toBe("");
  });

  it("handles negative seed values", () => {
    const result = pickDialogue("chain", -3);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("works for all reaction kinds", () => {
    for (const kind of ALL_REACTION_KINDS) {
      const result = pickDialogue(kind, 0);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});

describe("pickReasonDialogue", () => {
  it("returns a ja string for MAXIMIZE_FLIPS", () => {
    const result = pickReasonDialogue("MAXIMIZE_FLIPS", 0);
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
    expect(result!.length).toBeGreaterThan(0);
  });

  it("returns an en string when lang=en", () => {
    const result = pickReasonDialogue("MAXIMIZE_FLIPS", 0, "en");
    expect(result).not.toBeNull();
    const enLines = REASON_DIALOGUES.MAXIMIZE_FLIPS!.map((l) => l.en);
    expect(enLines).toContain(result!);
  });

  it("returns null for unknown reason code", () => {
    const result = pickReasonDialogue("UNKNOWN_CODE" as any, 0);
    expect(result).toBeNull();
  });

  it("same seed always returns the same line (deterministic)", () => {
    const a = pickReasonDialogue("BLOCK_CORNER", 7);
    const b = pickReasonDialogue("BLOCK_CORNER", 7);
    expect(a).toBe(b);
  });
});

describe("detectLanguage", () => {
  it("returns 'ja' or 'en'", () => {
    const result = detectLanguage();
    expect(["ja", "en"]).toContain(result);
  });
});
