import { describe, expect, it } from "vitest";

describe("CardBrowserMint", () => {
  it("exports CardBrowserMint component", async () => {
    const mod = await import("../CardBrowserMint");
    expect(mod.CardBrowserMint).toBeDefined();
    expect(typeof mod.CardBrowserMint).toBe("function");
  });

  it("CardBrowserMint is a named export (no default export)", async () => {
    const mod = await import("../CardBrowserMint");
    expect((mod as Record<string, unknown>).default).toBeUndefined();
    expect(mod.CardBrowserMint).toBeDefined();
  });
});
