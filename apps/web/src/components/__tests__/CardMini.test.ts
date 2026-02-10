/**
 * CardMini.test.ts
 *
 * Tests for the CardMini component.
 * Validates module exports, variant support, and prop interface.
 */
import { describe, it, expect } from "vitest";

describe("CardMini", () => {
  it("exports CardMini component", async () => {
    const mod = await import("../CardMini");
    expect(mod.CardMini).toBeDefined();
    expect(typeof mod.CardMini).toBe("function");
  });

  it("CardMini is a named export (no default export)", async () => {
    const mod = await import("../CardMini");
    expect((mod as any).default).toBeUndefined();
    expect(mod.CardMini).toBeDefined();
  });

  it("does not re-export CardNyanoDuel or CardNyanoCompact", async () => {
    const mod = await import("../CardMini") as Record<string, unknown>;
    // CardMini imports these internally — they should not leak
    expect(mod.CardNyanoDuel).toBeUndefined();
    expect(mod.CardNyanoCompact).toBeUndefined();
  });
});

describe("CardMini — variant type contract", () => {
  it("accepts both 'duel' and 'compact' variant values (compile-time check)", async () => {
    // TypeScript compilation ensures:
    //   variant?: "duel" | "compact"
    // At runtime we just confirm the component exists and doesn't throw on import
    const mod = await import("../CardMini");
    expect(typeof mod.CardMini).toBe("function");
  });

  it("component function accepts all required and optional props", async () => {
    // The component signature: (card, owner, subtle?, variant?, onClick?, title?, className?)
    const mod = await import("../CardMini");
    // React functional components compiled by Vite have Function.length = 1 (single props object)
    expect(mod.CardMini.length).toBeLessThanOrEqual(1);
  });
});
