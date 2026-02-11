import { describe, it, expect } from "vitest";

describe("NyanoCardArt", () => {
  it("exports NyanoCardArt component", async () => {
    const mod = await import("../NyanoCardArt");
    expect(mod.NyanoCardArt).toBeDefined();
    expect(typeof mod.NyanoCardArt).toBe("function");
  });

  it("exports NyanoCardArtProps type (compile-time check)", async () => {
    // This test verifies the module can be imported cleanly
    const mod = await import("../NyanoCardArt");
    expect(mod).toBeDefined();
  });
});

describe("NyanoCardArt dependencies", () => {
  it("imports NyanoTokenPlaceholder (generative fallback)", async () => {
    // Verify NyanoTokenPlaceholder can be imported
    const mod = await import("../NyanoTokenPlaceholder");
    expect(mod.NyanoTokenPlaceholder).toBeDefined();
  });

  it("imports useNyanoTokenMetadata hook", async () => {
    const mod = await import("@/lib/nyano/useNyanoTokenMetadata");
    expect(mod.useNyanoTokenMetadata).toBeDefined();
    expect(typeof mod.useNyanoTokenMetadata).toBe("function");
  });
});
