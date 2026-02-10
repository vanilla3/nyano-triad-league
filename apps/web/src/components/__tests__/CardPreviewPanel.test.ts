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
    // React.memo wraps the function — result is object with $$typeof
    expect(typeof mod.CardNyanoDuel).toMatch(/function|object/);
  });

  it("exports CardNyanoDuelProps interface (via component existence)", async () => {
    const mod = await import("../CardNyanoDuel");
    // React.memo components are objects; the inner function is accessible via .type
    expect(mod.CardNyanoDuel).toBeDefined();
  });
});
