/**
 * useNyanoTokenMetadata.test.ts
 *
 * Tests for the React Query hook that resolves per-token NFT image URLs.
 * Validates module exports, function signature, and integration contract.
 *
 * NOTE: queryKey must include config to re-fire when gameIndex loads.
 * This was the root cause of NFT images not displaying (Sprint 29 fix).
 */
import { describe, it, expect } from "vitest";

describe("useNyanoTokenMetadata", () => {
  it("exports useNyanoTokenMetadata function", async () => {
    const mod = await import("../useNyanoTokenMetadata");
    expect(mod.useNyanoTokenMetadata).toBeDefined();
    expect(typeof mod.useNyanoTokenMetadata).toBe("function");
  });

  it("hook function takes one parameter (tokenId)", async () => {
    const mod = await import("../useNyanoTokenMetadata");
    expect(mod.useNyanoTokenMetadata.length).toBe(1);
  });

  it("is a named export only (no default export)", async () => {
    const mod = await import("../useNyanoTokenMetadata");
    expect((mod as any).default).toBeUndefined();
  });
});

describe("useNyanoTokenMetadata — dependency integration", () => {
  it("imports getMetadataConfig from metadata module", async () => {
    const mod = await import("../metadata");
    expect(mod.getMetadataConfig).toBeDefined();
    expect(typeof mod.getMetadataConfig).toBe("function");
  });

  it("imports resolveTokenImageUrl from metadata module", async () => {
    const mod = await import("../metadata");
    expect(mod.resolveTokenImageUrl).toBeDefined();
    expect(typeof mod.resolveTokenImageUrl).toBe("function");
  });

  it("imports useNyanoGameIndex from hooks module", async () => {
    const mod = await import("../hooks");
    expect(mod.useNyanoGameIndex).toBeDefined();
    expect(typeof mod.useNyanoGameIndex).toBe("function");
  });

  it("getMetadataConfig + resolveTokenImageUrl pipeline works end-to-end", async () => {
    const { getMetadataConfig, resolveTokenImageUrl } = await import("../metadata");

    // Simulate real GameIndex metadata (from /game/index.v1.json)
    const gameMetadata = {
      imageBaseUrl:
        "https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/{id}.png",
    };

    const config = getMetadataConfig(gameMetadata);
    expect(config).not.toBeNull();

    const url = resolveTokenImageUrl(42n, config);
    expect(url).toBe(
      "https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/42.png",
    );
  });

  it("getMetadataConfig returns hardcoded default when gameIndex has no metadata", async () => {
    const { getMetadataConfig, DEFAULT_NYANO_IMAGE_BASE } = await import("../metadata");

    // Simulates gameIndex still loading (undefined) or missing metadata
    // → falls back to hardcoded default Arweave URL
    expect(getMetadataConfig(undefined)?.baseUrlPattern).toBe(DEFAULT_NYANO_IMAGE_BASE);
    expect(getMetadataConfig(null)?.baseUrlPattern).toBe(DEFAULT_NYANO_IMAGE_BASE);
    expect(getMetadataConfig({})?.baseUrlPattern).toBe(DEFAULT_NYANO_IMAGE_BASE);
  });
});
