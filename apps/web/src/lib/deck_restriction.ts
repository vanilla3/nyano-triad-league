/**
 * deck_restriction.ts
 *
 * Deck restriction definitions and validation for event-based games.
 *
 * Currently supported restriction types:
 * - "none" — no restriction (default)
 * - "mint_only" — only tokenIds from a specified set (e.g., free mint tokens)
 *
 * Future types (defined but pass-through):
 * - "max_rarity_common" — only common rarity cards
 * - "season_N" — only cards from season N
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeckRestrictionType = "none" | "mint_only" | string;

export interface DeckRestrictionRule {
  /** Restriction type key. */
  type: DeckRestrictionType;
  /** Short label for UI badges (e.g. "No Restriction", "Mint Only"). */
  label: string;
  /** Longer description for tooltips. */
  description: string;
  /** For "mint_only": the set of allowed tokenId strings. */
  allowedTokenIds?: Set<string>;
}

export interface DeckValidationResult {
  /** Whether the deck passes the restriction. */
  valid: boolean;
  /** Human-readable violation descriptions (empty if valid). */
  violations: string[];
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/**
 * Known restriction presets.
 * "mint_only" includes tokenIds 1-100 as a sample set — in production this
 * would be loaded from the event config or an on-chain registry.
 */
export const RESTRICTION_PRESETS: Record<string, DeckRestrictionRule> = {
  none: {
    type: "none",
    label: "No Restriction",
    description: "Any deck is allowed.",
  },
  mint_only: {
    type: "mint_only",
    label: "Mint Only",
    description: "Only free-mint tokens (IDs 1-100) are allowed.",
    allowedTokenIds: new Set(
      Array.from({ length: 100 }, (_, i) => String(i + 1)),
    ),
  },
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Parse a deckRestriction string into a DeckRestrictionRule.
 * Falls back to "none" for undefined, empty, or unknown restriction strings.
 */
export function parseDeckRestriction(
  restriction: string | undefined,
): DeckRestrictionRule {
  if (!restriction || restriction.trim() === "") {
    return RESTRICTION_PRESETS.none;
  }

  const key = restriction.trim();
  if (key in RESTRICTION_PRESETS) {
    return RESTRICTION_PRESETS[key];
  }

  // Unknown restriction → treat as "none" with dev warning
  if (import.meta.env.DEV) {
    console.warn(
      `[deck_restriction] Unknown restriction "${key}", falling back to "none".`,
    );
  }
  return {
    type: "none",
    label: "No Restriction",
    description: `Unknown restriction "${key}" — treated as no restriction.`,
  };
}

/**
 * Validate a deck (array of tokenId strings) against a restriction rule.
 */
export function validateDeckAgainstRestriction(
  tokenIds: string[],
  rule: DeckRestrictionRule,
): DeckValidationResult {
  // "none" always passes
  if (rule.type === "none") {
    return { valid: true, violations: [] };
  }

  // "mint_only" — check each tokenId against the allowedTokenIds set
  if (rule.type === "mint_only") {
    const allowed = rule.allowedTokenIds;
    if (!allowed || allowed.size === 0) {
      return {
        valid: false,
        violations: ["Restriction has no allowed tokens defined."],
      };
    }

    const violations: string[] = [];
    for (const tid of tokenIds) {
      if (!allowed.has(tid)) {
        violations.push(`Token ${tid} is not in the allowed mint set.`);
      }
    }

    return { valid: violations.length === 0, violations };
  }

  // Unknown type at runtime — pass through (forward compatibility)
  return { valid: true, violations: [] };
}
