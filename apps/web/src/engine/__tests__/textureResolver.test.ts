import { describe, it, expect } from "vitest";
import { buildTokenImageUrls } from "../renderers/pixi/tokenImageUrls";
import { DEFAULT_NYANO_IMAGE_BASE } from "@/lib/nyano/metadata";

/* ═══════════════════════════════════════════════════════════════════
   tokenImageUrls + textureResolver — pure function + module contract tests

   Tests buildTokenImageUrls which combines metadata URL resolution
   and Arweave gateway fallback into an ordered URL list.

   The pure function is in tokenImageUrls.ts (no pixi.js dependency).
   TextureResolver class in textureResolver.ts is pixi.js dependent
   and NOT directly tested here (requires WebGL runtime).
   ═══════════════════════════════════════════════════════════════════ */

describe("buildTokenImageUrls", () => {
  it("returns empty array when config is null", () => {
    expect(buildTokenImageUrls("42", null)).toEqual([]);
  });

  it("returns empty array when baseUrlPattern is empty", () => {
    expect(buildTokenImageUrls("1", { baseUrlPattern: "" })).toEqual([]);
  });

  it("returns primary URL only for non-Arweave URL", () => {
    const config = { baseUrlPattern: "https://cdn.example.com/{id}.png" };
    const urls = buildTokenImageUrls("42", config);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("https://cdn.example.com/42.png");
  });

  it("returns primary + 2 fallbacks for Arweave subdomain URL", () => {
    const config = {
      baseUrlPattern: "https://abc123.arweave.net/tx123/{id}.png",
    };
    const urls = buildTokenImageUrls("7", config);
    expect(urls).toHaveLength(3);
    expect(urls[0]).toBe("https://abc123.arweave.net/tx123/7.png");
    expect(urls[1]).toBe("https://arweave.net/tx123/7.png");
    expect(urls[2]).toBe("https://ar-io.dev/tx123/7.png");
  });

  it("returns primary + 1 fallback for canonical Arweave URL", () => {
    const config = {
      baseUrlPattern: "https://arweave.net/txid/{id}.png",
    };
    const urls = buildTokenImageUrls("99", config);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe("https://arweave.net/txid/99.png");
    expect(urls[1]).toBe("https://ar-io.dev/txid/99.png");
  });

  it("substitutes tokenId correctly in URL pattern", () => {
    const config = { baseUrlPattern: "https://example.com/tokens/{id}/image" };
    const urls = buildTokenImageUrls("9999", config);
    expect(urls[0]).toBe("https://example.com/tokens/9999/image");
  });

  it("works with DEFAULT_NYANO_IMAGE_BASE", () => {
    const config = { baseUrlPattern: DEFAULT_NYANO_IMAGE_BASE };
    const urls = buildTokenImageUrls("1", config);
    // DEFAULT_NYANO_IMAGE_BASE is an Arweave subdomain URL → 3 URLs
    expect(urls).toHaveLength(3);
    expect(urls[0]).toContain("1.png");
    expect(urls[0]).toContain("arweave.net");
    expect(urls[1]).toMatch(/^https:\/\/arweave\.net\//);
    expect(urls[2]).toMatch(/^https:\/\/ar-io\.dev\//);
  });
});

describe("tokenImageUrls module", () => {
  it("exports buildTokenImageUrls as a named function", async () => {
    const mod = await import("../renderers/pixi/tokenImageUrls");
    expect(typeof mod.buildTokenImageUrls).toBe("function");
  });
});
