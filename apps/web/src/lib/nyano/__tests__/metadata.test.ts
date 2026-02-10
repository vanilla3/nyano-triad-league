import { describe, it, expect, afterEach } from "vitest";
import {
  getMetadataConfig,
  resolveTokenImageUrl,
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

  it("returns null when neither source is available", () => {
    delete import.meta.env.VITE_NYANO_METADATA_BASE;
    expect(getMetadataConfig()).toBeNull();
    expect(getMetadataConfig(null)).toBeNull();
    expect(getMetadataConfig(undefined)).toBeNull();
  });

  it("returns null when GameIndex metadata has no imageBaseUrl", () => {
    delete import.meta.env.VITE_NYANO_METADATA_BASE;
    const result = getMetadataConfig({ otherField: "value" });
    expect(result).toBeNull();
  });

  it("returns null when GameIndex imageBaseUrl is empty string", () => {
    delete import.meta.env.VITE_NYANO_METADATA_BASE;
    const result = getMetadataConfig({ imageBaseUrl: "" });
    expect(result).toBeNull();
  });

  it("returns null when GameIndex imageBaseUrl is not a string", () => {
    delete import.meta.env.VITE_NYANO_METADATA_BASE;
    const result = getMetadataConfig({ imageBaseUrl: 42 });
    expect(result).toBeNull();
  });
});
