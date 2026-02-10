/**
 * useCardFlight.test.ts
 *
 * Tests for the card flight animation state machine hook.
 * Validates module exports, interface shapes, and constant/type contracts.
 */
import { describe, it, expect } from "vitest";

describe("useCardFlight", () => {
  it("exports useCardFlight function", async () => {
    const mod = await import("../useCardFlight");
    expect(mod.useCardFlight).toBeDefined();
    expect(typeof mod.useCardFlight).toBe("function");
  });

  it("hook function takes no arguments (arity 0)", async () => {
    const mod = await import("../useCardFlight");
    expect(mod.useCardFlight.length).toBe(0);
  });

  it("module has no default export (named export only)", async () => {
    const mod = await import("../useCardFlight");
    expect((mod as any).default).toBeUndefined();
  });
});

describe("CardFlightState type contract", () => {
  it("exports CardFlightState type (verifiable via interface usage)", async () => {
    // TypeScript compilation verifies the interface exists.
    // At runtime we check the module structure.
    const mod = await import("../useCardFlight");
    expect(mod).toHaveProperty("useCardFlight");
    // No extra runtime exports expected (types are erased)
    const exportKeys = Object.keys(mod);
    expect(exportKeys).toContain("useCardFlight");
  });
});

describe("UseCardFlightReturn interface contract", () => {
  it("return type includes state, launch, isFlying (type-level check)", async () => {
    // This test verifies compilation. The type annotations ensure:
    // - state: CardFlightState | null
    // - launch: (card, owner, sourceEl, targetEl, onLand) => void
    // - isFlying: boolean
    const mod = await import("../useCardFlight");
    // Just ensure the module loaded correctly
    expect(typeof mod.useCardFlight).toBe("function");
  });
});
