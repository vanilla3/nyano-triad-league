import { describe, expect, it, vi } from "vitest";

// Dynamic-import export-integrity checks can exceed the 5s default under
// full-suite parallel load (vite transform contention). Same fix as
// useNyanoTokenMetadata.test.ts.
vi.setConfig({ testTimeout: 30_000 });

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
