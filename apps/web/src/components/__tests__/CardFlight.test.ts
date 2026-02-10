/**
 * CardFlight.test.ts
 *
 * Tests for the CardFlight component and FLIGHT_MS constant.
 * Validates module exports, animation timing constant, and component contract.
 */
import { describe, it, expect } from "vitest";

describe("CardFlight", () => {
  it("exports CardFlight component", async () => {
    const mod = await import("../CardFlight");
    expect(mod.CardFlight).toBeDefined();
    expect(typeof mod.CardFlight).toBe("function");
  });

  it("exports FLIGHT_MS constant", async () => {
    const mod = await import("../CardFlight");
    expect(mod.FLIGHT_MS).toBeDefined();
    expect(typeof mod.FLIGHT_MS).toBe("number");
  });

  it("FLIGHT_MS is a positive integer (animation duration)", async () => {
    const mod = await import("../CardFlight");
    expect(mod.FLIGHT_MS).toBeGreaterThan(0);
    expect(Number.isInteger(mod.FLIGHT_MS)).toBe(true);
  });

  it("FLIGHT_MS is 380ms (matches easeOutExpo pacing)", async () => {
    const mod = await import("../CardFlight");
    expect(mod.FLIGHT_MS).toBe(380);
  });

  it("CardFlight is a named export (no default export)", async () => {
    const mod = await import("../CardFlight");
    expect((mod as any).default).toBeUndefined();
  });

  it("does not export useCardFlight (hook was moved to hooks/)", async () => {
    const mod = await import("../CardFlight") as Record<string, unknown>;
    expect(mod.useCardFlight).toBeUndefined();
    expect(mod.CardFlightState).toBeUndefined(); // type, should be erased
  });

  it("module exports exactly CardFlight and FLIGHT_MS", async () => {
    const mod = await import("../CardFlight");
    const exportKeys = Object.keys(mod);
    expect(exportKeys.sort()).toEqual(["CardFlight", "FLIGHT_MS"].sort());
  });
});
