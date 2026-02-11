import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getMetadataConfig,
  resolveTokenImageUrl,
  DEFAULT_NYANO_IMAGE_BASE,
  type MetadataConfig,
} from "../metadata";

/* ═══════════════════════════════════════════════════════════════════
   metadata.ts — Test Coverage
   ═══════════════════════════════════════════════════════════════════ */

describe("resolveTokenImageUrl", () => {
  it("replaces {id} with bigint tokenId", () => {
    const config: MetadataConfig = {
      baseUrlPattern: "https://meta.nyano.ai/token/{id}.png",
    };
    expect(resolveTokenImageUrl(42n, config)).toBe(
      "https://meta.nyano.ai/token/42.png",
    );
  });

  it("replaces {id} with string tokenId", () => {
    const config: MetadataConfig = {
      baseUrlPattern: "https://example.com/{id}/image",
    };
    expect(resolveTokenImageUrl("123", config)).toBe(
      "https://example.com/123/image",
    );
  });

  it("returns null when config is null", () => {
    expect(resolveTokenImageUrl(1n, null)).toBeNull();
  });

  it("returns null when baseUrlPattern is empty", () => {
    const config: MetadataConfig = { baseUrlPattern: "" };
    expect(resolveTokenImageUrl(1n, config)).toBeNull();
  });

  it("handles large tokenId values", () => {
    const config: MetadataConfig = {
      baseUrlPattern: "https://meta.nyano.ai/{id}",
    };
    const largeId = 999999999999999n;
    expect(resolveTokenImageUrl(largeId, config)).toBe(
      "https://meta.nyano.ai/999999999999999",
    );
  });

  it("resolves Arweave subdomain URL pattern correctly", () => {
    const config: MetadataConfig = {
      baseUrlPattern:
        "https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/{id}.png",
    };
    expect(resolveTokenImageUrl(1n, config)).toBe(
      "https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/1.png",
    );
    expect(resolveTokenImageUrl(9999n, config)).toBe(
      "https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/9999.png",
    );
  });
});

describe("getMetadataConfig", () => {
  // Save and restore import.meta.env between tests
  const originalEnv = { ...import.meta.env };
  afterEach(() => {
    // Reset env
    Object.keys(import.meta.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete import.meta.env[key];
      }
    });
    Object.assign(import.meta.env, originalEnv);
  });

  it("returns env variable config when VITE_NYANO_METADATA_BASE is set", () => {
    import.meta.env.VITE_NYANO_METADATA_BASE = "https://env.example.com/{id}";
    const result = getMetadataConfig();
    expect(result).toEqual({
      baseUrlPattern: "https://env.example.com/{id}",
    });
  });

  it("returns GameIndex metadata when env is unset", () => {
    delete import.meta.env.VITE_NYANO_METADATA_BASE;
    const gameIndexMeta = { imageBaseUrl: "https://game.example.com/{id}.png" };
    const result = getMetadataConfig(gameIndexMeta);
    expect(result).toEqual({
      baseUrlPattern: "https://game.example.com/{id}.png",
    });
  });

  it("prefers env variable over GameIndex metadata", () => {
    import.meta.env.VITE_NYANO_METADATA_BASE = "https://env.example.com/{id}";
    const gameIndexMeta = { imageBaseUrl: "https://game.example.com/{id}.png" };
    const result = getMetadataConfig(gameIndexMeta);
    expect(result?.baseUrlPattern).toBe("https://env.example.com/{id}");
  });

  it("falls back to hardcoded default when neither env nor GameIndex is available", () => {
    delete import.meta.env.VITE_NYANO_METADATA_BASE;
    expect(getMetadataConfig()?.baseUrlPattern).toBe(DEFAULT_NYANO_IMAGE_BASE);
    expect(getMetadataConfig(null)?.baseUrlPattern).toBe(DEFAULT_NYANO_IMAGE_BASE);
    expect(getMetadataConfig(undefined)?.baseUrlPattern).toBe(DEFAULT_NYANO_IMAGE_BASE);
  });

  it("falls back to hardcoded default when GameIndex metadata has no imageBaseUrl", () => {
    delete import.meta.env.VITE_NYANO_METADATA_BASE;
    const result = getMetadataConfig({ otherField: "value" });
    expect(result?.baseUrlPattern).toBe(DEFAULT_NYANO_IMAGE_BASE);
  });

  it("falls back to hardcoded default when GameIndex imageBaseUrl is empty string", () => {
    delete import.meta.env.VITE_NYANO_METADATA_BASE;
    const result = getMetadataConfig({ imageBaseUrl: "" });
    expect(result?.baseUrlPattern).toBe(DEFAULT_NYANO_IMAGE_BASE);
  });

  it("falls back to hardcoded default when GameIndex imageBaseUrl is not a string", () => {
    delete import.meta.env.VITE_NYANO_METADATA_BASE;
    const result = getMetadataConfig({ imageBaseUrl: 42 });
    expect(result?.baseUrlPattern).toBe(DEFAULT_NYANO_IMAGE_BASE);
  });

  it("extracts imageBaseUrl from real GameIndex metadata shape", () => {
    delete import.meta.env.VITE_NYANO_METADATA_BASE;
    // Matches actual /game/index.v1.json metadata structure
    const realMeta = {
      mode: "local",
      dir: "public/nft-metadata",
      base: "https://arweave.net/cOk7m-gDfwPlzbAtZKYE-z9Gy91cbgj1NKIYIlWDG3M",
      ext: ".json",
      imageBaseUrl:
        "https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/{id}.png",
    };
    const result = getMetadataConfig(realMeta);
    expect(result).not.toBeNull();
    expect(result!.baseUrlPattern).toContain("{id}");
    expect(result!.baseUrlPattern).toContain("arweave.net");
  });

  // --- {id} placeholder validation (FIX-NFTIMG-004) ---

  it("rejects env variable missing {id} placeholder and falls back to hardcoded default", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    import.meta.env.VITE_NYANO_METADATA_BASE = "https://bad.example.com/no-placeholder";
    const result = getMetadataConfig();
    expect(result?.baseUrlPattern).toBe(DEFAULT_NYANO_IMAGE_BASE);
    spy.mockRestore();
  });

  it("rejects env variable missing {id} but uses GameIndex fallback", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    import.meta.env.VITE_NYANO_METADATA_BASE = "https://bad.example.com/no-placeholder";
    const gameIndexMeta = { imageBaseUrl: "https://game.example.com/{id}.png" };
    const result = getMetadataConfig(gameIndexMeta);
    expect(result).toEqual({ baseUrlPattern: "https://game.example.com/{id}.png" });
    spy.mockRestore();
  });

  it("rejects GameIndex imageBaseUrl missing {id} placeholder and falls back to default", () => {
    delete import.meta.env.VITE_NYANO_METADATA_BASE;
    const result = getMetadataConfig({ imageBaseUrl: "https://example.com/static.png" });
    expect(result?.baseUrlPattern).toBe(DEFAULT_NYANO_IMAGE_BASE);
  });

  it("accepts env variable with {id} placeholder", () => {
    import.meta.env.VITE_NYANO_METADATA_BASE = "https://valid.example.com/token/{id}.png";
    const result = getMetadataConfig();
    expect(result).toEqual({ baseUrlPattern: "https://valid.example.com/token/{id}.png" });
  });
});

describe("DEFAULT_NYANO_IMAGE_BASE", () => {
  it("contains {id} placeholder", () => {
    expect(DEFAULT_NYANO_IMAGE_BASE).toContain("{id}");
  });

  it("is an Arweave URL", () => {
    expect(DEFAULT_NYANO_IMAGE_BASE).toContain("arweave.net");
  });

  it("resolves token image URL using the hardcoded default", () => {
    const url = resolveTokenImageUrl(42n, { baseUrlPattern: DEFAULT_NYANO_IMAGE_BASE });
    expect(url).toContain("42.png");
    expect(url).toContain("arweave.net");
    expect(url).not.toContain("{id}");
  });
});
