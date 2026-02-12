/**
 * TextureResolver — NFT card image texture loading for PixiJS renderer.
 *
 * Resolves tokenId → image URL using existing pure functions from metadata.ts
 * and arweave_gateways.ts, then loads textures via PixiJS Assets with
 * Arweave multi-gateway fallback.
 *
 * This file imports from "pixi.js" and must only be loaded via dynamic
 * import() chain — same restriction as PixiBattleRenderer.
 */

import { Assets, Texture } from "pixi.js";
import { getMetadataConfig, type MetadataConfig } from "@/lib/nyano/metadata";
import { buildTokenImageUrls } from "./tokenImageUrls";

/* ═══════════════════════════════════════════════════════════════════════════
   TextureResolver class
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Manages NFT card image texture loading, caching, and Arweave fallback.
 *
 * Usage:
 * - `getTexture(tokenId)` — synchronous cache lookup; returns null if not loaded
 * - `loadTexture(tokenId)` — async load with fallback; resolves to Texture | null
 * - `dispose()` — clear cache (call from renderer destroy)
 */
export class TextureResolver {
  private config: MetadataConfig | null = null;
  private configResolved = false;
  private cache = new Map<string, Texture>();
  private pending = new Map<string, Promise<Texture | null>>();

  /**
   * Synchronous cache lookup. Returns cached Texture or null.
   * Call this from redraw() — if null, kick off loadTexture() separately.
   */
  getTexture(tokenId: string): Texture | null {
    return this.cache.get(tokenId) ?? null;
  }

  /**
   * Asynchronously load a texture for the given tokenId.
   * Tries primary URL first, then Arweave fallbacks in order.
   * Deduplicates concurrent loads for the same tokenId.
   * Returns null if all URLs fail.
   */
  async loadTexture(tokenId: string): Promise<Texture | null> {
    // Return from cache
    const cached = this.cache.get(tokenId);
    if (cached) return cached;

    // Deduplicate concurrent loads
    const existing = this.pending.get(tokenId);
    if (existing) return existing;

    const urls = buildTokenImageUrls(tokenId, this.ensureConfig());
    if (urls.length === 0) return null;

    const promise = this.tryLoadFromUrls(urls, tokenId);
    this.pending.set(tokenId, promise);

    try {
      return await promise;
    } finally {
      this.pending.delete(tokenId);
    }
  }

  /** Clear cache and pending loads. Called from renderer destroy(). */
  dispose(): void {
    this.cache.clear();
    this.pending.clear();
    this.config = null;
    this.configResolved = false;
  }

  /* ── Private helpers ─────────────────────────────────────────────── */

  /**
   * Resolve metadata config lazily (memoized).
   * Uses getMetadataConfig() with no GameIndex arg — relies on
   * hardcoded DEFAULT_NYANO_IMAGE_BASE for immediate availability.
   */
  private ensureConfig(): MetadataConfig | null {
    if (!this.configResolved) {
      this.config = getMetadataConfig();
      this.configResolved = true;
    }
    return this.config;
  }

  /**
   * Try loading a texture from each URL in order.
   * Returns the first successfully loaded Texture, or null.
   */
  private async tryLoadFromUrls(
    urls: string[],
    tokenId: string,
  ): Promise<Texture | null> {
    for (const url of urls) {
      try {
        const texture = await Assets.load<Texture>(url);
        if (texture && !texture.destroyed) {
          this.cache.set(tokenId, texture);
          return texture;
        }
      } catch {
        // Try next fallback
        continue;
      }
    }
    return null;
  }
}
