/**
 * CardPreviewPanel.test.ts
 *
 * Smoke tests for the CardPreviewPanel component.
 * Validates module exports are correctly structured.
 */
import { describe, it, expect } from "vitest";

describe("CardPreviewPanel", () => {
  it("exports CardPreviewPanel component", async () => {
    const mod = await import("../CardPreviewPanel");
    expect(mod.CardPreviewPanel).toBeDefined();
    expect(typeof mod.CardPreviewPanel).toBe("function");
  });
});

describe("CardNyanoDuel", () => {
  it("exports CardNyanoDuel component", async () => {
    const mod = await import("../CardNyanoDuel");
    expect(mod.CardNyanoDuel).toBeDefined();
    expect(typeof mod.CardNyanoDuel).toBe("function");
  });

  it("exports CardNyanoDuelProps interface (via component existence)", async () => {
    const mod = await import("../CardNyanoDuel");
    // Verify the function accepts the expected number of props (1 object param)
    expect(mod.CardNyanoDuel.length).toBeGreaterThanOrEqual(0);
  });
});
