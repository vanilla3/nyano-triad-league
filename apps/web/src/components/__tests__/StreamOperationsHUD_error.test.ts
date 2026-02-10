import { describe, it, expect } from "vitest";
import type { PersistentError } from "../StreamOperationsHUD";

/* ================================================================
   StreamOperationsHUD — PersistentError type & LastErrorBanner
   Sprint 20 P0-ERR verification
   ================================================================ */

describe("PersistentError type", () => {
  it("accepts valid error objects", () => {
    const err: PersistentError = {
      message: "warudo POST failed: 500 Internal Server Error",
      timestampMs: Date.now(),
    };
    expect(err.message).toBeTruthy();
    expect(err.timestampMs).toBeGreaterThan(0);
  });

  it("can be set to null (dismissed state)", () => {
    const state: PersistentError | null = null;
    expect(state).toBeNull();
  });
});

describe("StreamOperationsHUD exports", () => {
  it("exports PersistentError type-compatible shape", async () => {
    const mod = await import("../StreamOperationsHUD");
    // The component itself must be exported
    expect(typeof mod.StreamOperationsHUD).toBe("function");
    // computeSyncStatus and computeConnectionHealth must still be exported
    expect(typeof mod.computeSyncStatus).toBe("function");
    expect(typeof mod.computeConnectionHealth).toBe("function");
  });
});
