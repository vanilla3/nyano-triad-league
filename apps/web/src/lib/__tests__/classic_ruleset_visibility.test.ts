import { computeRulesetId } from "@nyano/triad-engine";
import { describe, expect, it } from "vitest";

import { resolveClassicMetadataFromHeader } from "../classic_ruleset_visibility";
import { resolveRulesetOrThrow } from "../ruleset_registry";

function makeHeader(rulesetId: string) {
  return {
    version: 1,
    rulesetId,
    seasonId: 1,
    playerA: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
    playerB: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
    deckA: ["1", "2", "3", "4", "5"],
    deckB: ["6", "7", "8", "9", "10"],
    firstPlayer: 0 as const,
    deadline: 0,
    salt: `0x${"11".repeat(32)}`,
  };
}

describe("resolveClassicMetadataFromHeader", () => {
  it("returns null for null/unknown headers", () => {
    expect(resolveClassicMetadataFromHeader(null)).toBeNull();
    expect(resolveClassicMetadataFromHeader(makeHeader(`0x${"00".repeat(32)}`))).toBeNull();
  });

  it("returns null for non-classic rulesets", () => {
    const ruleset = resolveRulesetOrThrow("v2");
    const rulesetId = computeRulesetId(ruleset);
    expect(resolveClassicMetadataFromHeader(makeHeader(rulesetId))).toBeNull();
  });

  it("resolves classic all-open metadata", () => {
    const ruleset = resolveRulesetOrThrow("classic_all_open");
    const rulesetId = computeRulesetId(ruleset);
    const classic = resolveClassicMetadataFromHeader(makeHeader(rulesetId));

    expect(classic).not.toBeNull();
    expect(classic?.open?.mode).toBe("all_open");
    expect(classic?.open?.playerA).toEqual([0, 1, 2, 3, 4]);
    expect(classic?.open?.playerB).toEqual([0, 1, 2, 3, 4]);
    expect(classic?.swap).toBeNull();
  });

  it("resolves classic swap metadata", () => {
    const ruleset = resolveRulesetOrThrow("classic_swap");
    const rulesetId = computeRulesetId(ruleset);
    const classic = resolveClassicMetadataFromHeader(makeHeader(rulesetId));

    expect(classic).not.toBeNull();
    expect(classic?.open).toBeNull();
    expect(classic?.swap).not.toBeNull();
    expect(classic?.swap?.aIndex).toBeGreaterThanOrEqual(0);
    expect(classic?.swap?.aIndex).toBeLessThan(5);
    expect(classic?.swap?.bIndex).toBeGreaterThanOrEqual(0);
    expect(classic?.swap?.bIndex).toBeLessThan(5);
  });

  it("resolves classic three-open deterministically", () => {
    const ruleset = resolveRulesetOrThrow("classic_three_open");
    const rulesetId = computeRulesetId(ruleset);
    const header = makeHeader(rulesetId);
    const first = resolveClassicMetadataFromHeader(header);
    const second = resolveClassicMetadataFromHeader(header);

    expect(first).toEqual(second);
    expect(first?.open?.mode).toBe("three_open");
    expect(first?.open?.playerA).toHaveLength(3);
    expect(first?.open?.playerB).toHaveLength(3);
  });
});

