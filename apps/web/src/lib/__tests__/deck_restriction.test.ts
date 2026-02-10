import { describe, it, expect, vi } from "vitest";
import {
  parseDeckRestriction,
  validateDeckAgainstRestriction,
  RESTRICTION_PRESETS,
  type DeckRestrictionRule,
} from "../deck_restriction";

// ---------------------------------------------------------------------------
// parseDeckRestriction
// ---------------------------------------------------------------------------

describe("parseDeckRestriction", () => {
  it("returns 'none' rule for undefined", () => {
    const rule = parseDeckRestriction(undefined);
    expect(rule.type).toBe("none");
    expect(rule.label).toBe("No Restriction");
  });

  it("returns 'none' rule for empty string", () => {
    const rule = parseDeckRestriction("");
    expect(rule.type).toBe("none");
  });

  it("returns 'mint_only' rule for 'mint_only'", () => {
    const rule = parseDeckRestriction("mint_only");
    expect(rule.type).toBe("mint_only");
    expect(rule.label).toBe("Mint Only");
    expect(rule.allowedTokenIds).toBeInstanceOf(Set);
    expect(rule.allowedTokenIds!.size).toBeGreaterThan(0);
  });

  it("returns 'none' rule for unknown restriction string (with console.warn)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const rule = parseDeckRestriction("custom_tournament_2026");
    expect(rule.type).toBe("none");
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("trims whitespace", () => {
    const rule = parseDeckRestriction("  mint_only  ");
    expect(rule.type).toBe("mint_only");
  });
});

// ---------------------------------------------------------------------------
// validateDeckAgainstRestriction
// ---------------------------------------------------------------------------

describe("validateDeckAgainstRestriction", () => {
  it("always passes with 'none' restriction", () => {
    const rule = parseDeckRestriction("none");
    const result = validateDeckAgainstRestriction(["999", "1000", "2000", "3000", "4000"], rule);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("passes mint_only when all tokenIds are in allowedTokenIds", () => {
    const rule = parseDeckRestriction("mint_only");
    const result = validateDeckAgainstRestriction(["1", "2", "3", "4", "5"], rule);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("fails mint_only when a tokenId is not in allowedTokenIds", () => {
    const rule = parseDeckRestriction("mint_only");
    const result = validateDeckAgainstRestriction(["1", "2", "999", "4", "5"], rule);
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toContain("999");
  });

  it("reports multiple violations", () => {
    const rule = parseDeckRestriction("mint_only");
    const result = validateDeckAgainstRestriction(["200", "300", "3", "4", "5"], rule);
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(2);
  });

  it("handles empty deck gracefully", () => {
    const rule = parseDeckRestriction("mint_only");
    const result = validateDeckAgainstRestriction([], rule);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("fails when allowedTokenIds is empty", () => {
    const rule: DeckRestrictionRule = {
      type: "mint_only",
      label: "Empty Mint",
      description: "No tokens allowed",
      allowedTokenIds: new Set(),
    };
    const result = validateDeckAgainstRestriction(["1"], rule);
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RESTRICTION_PRESETS
// ---------------------------------------------------------------------------

describe("RESTRICTION_PRESETS", () => {
  it("'none' preset exists and is valid", () => {
    expect(RESTRICTION_PRESETS.none).toBeDefined();
    expect(RESTRICTION_PRESETS.none.type).toBe("none");
    expect(RESTRICTION_PRESETS.none.label).toBeTruthy();
    expect(RESTRICTION_PRESETS.none.description).toBeTruthy();
  });

  it("'mint_only' preset exists and has allowedTokenIds", () => {
    expect(RESTRICTION_PRESETS.mint_only).toBeDefined();
    expect(RESTRICTION_PRESETS.mint_only.type).toBe("mint_only");
    expect(RESTRICTION_PRESETS.mint_only.allowedTokenIds).toBeInstanceOf(Set);
    expect(RESTRICTION_PRESETS.mint_only.allowedTokenIds!.has("1")).toBe(true);
    expect(RESTRICTION_PRESETS.mint_only.allowedTokenIds!.has("100")).toBe(true);
  });

  it("all presets have label and description", () => {
    for (const [_key, rule] of Object.entries(RESTRICTION_PRESETS)) {
      expect(rule.label).toBeTruthy();
      expect(rule.description).toBeTruthy();
    }
  });
});
