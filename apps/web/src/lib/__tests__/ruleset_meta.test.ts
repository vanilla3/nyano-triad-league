import { describe, expect, it } from "vitest";
import { MAX_CHAIN_CAP_PER_TURN, parseChainCapPerTurnParam } from "../ruleset_meta";

describe("parseChainCapPerTurnParam", () => {
  it("returns null for empty inputs", () => {
    expect(parseChainCapPerTurnParam(null)).toBeNull();
    expect(parseChainCapPerTurnParam("")).toBeNull();
    expect(parseChainCapPerTurnParam("   ")).toBeNull();
  });

  it("parses valid range [0..8]", () => {
    expect(parseChainCapPerTurnParam("0")).toBe(0);
    expect(parseChainCapPerTurnParam(String(MAX_CHAIN_CAP_PER_TURN))).toBe(MAX_CHAIN_CAP_PER_TURN);
    expect(parseChainCapPerTurnParam(" 3 ")).toBe(3);
  });

  it("rejects invalid formats", () => {
    expect(parseChainCapPerTurnParam("1.5")).toBeNull();
    expect(parseChainCapPerTurnParam("abc")).toBeNull();
    expect(parseChainCapPerTurnParam("1e2")).toBeNull();
  });

  it("rejects out-of-range values", () => {
    expect(parseChainCapPerTurnParam("-1")).toBeNull();
    expect(parseChainCapPerTurnParam(String(MAX_CHAIN_CAP_PER_TURN + 1))).toBeNull();
  });
});

