import { describe, it, expect } from "vitest";
import { stringifyWithBigInt } from "../json";

describe("stringifyWithBigInt", () => {
  it("serializes BigInt values as strings", () => {
    const result = stringifyWithBigInt({ id: 123n });
    expect(JSON.parse(result)).toEqual({ id: "123" });
  });

  it("handles nested BigInt fields", () => {
    const result = stringifyWithBigInt({ deck: { tokenA: 999n, tokenB: 42n } });
    const parsed = JSON.parse(result);
    expect(parsed.deck.tokenA).toBe("999");
    expect(parsed.deck.tokenB).toBe("42");
  });

  it("passes non-BigInt values through normally", () => {
    const obj = { a: 1, b: "hello", c: true, d: null };
    expect(stringifyWithBigInt(obj)).toBe(JSON.stringify(obj, null, 2));
  });
});
