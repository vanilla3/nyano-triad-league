/**
 * TextureResolver - NFT card image texture loading for PixiJS renderer.
 *
 * Resolves token image URLs via shared Nyano URL helpers, then loads textures
 * with fallback URLs in order.
 *
 * This file imports from "pixi.js" and must only be loaded via dynamic
 * import() chain, same restriction as PixiBattleRenderer.
 */

import { Assets, Texture } from "pixi.js";
import { getCachedGameIndexMetadata } from "@/lib/nyano/gameIndex";
import { getMetadataConfig, type MetadataConfig } from "@/lib/nyano/metadata";
import { errorMessage } from "@/lib/errorMessage";
import { buildTokenImageUrls } from "./tokenImageUrls";

/**
 * Manages NFT card image texture loading, caching, and URL fallback.
 *
 * Usage:
 * - `getTexture(tokenId)` - synchronous cache lookup; returns null if not loaded
 * - `loadTexture(tokenId)` - async load with fallback; resolves to Texture | null
 * - `dispose()` - clear cache (call from renderer destroy)
 */
export class TextureResolver {
  private config: MetadataConfig | null = null;
  private cache = new Map<string, Texture>();
  private pending = new Map<string, Promise<Texture | null>>();

  /**
   * Synchronous cache lookup. Returns cached Texture or null.
   * Call this from redraw() and start loadTexture() separately when null.
   */
  getTexture(tokenId: string): Texture | null {
    return this.cache.get(tokenId) ?? null;
  }

  /**
   * Asynchronously load a texture for the given tokenId.
   * Tries primary URL first, then fallback URLs in order.
   * Deduplicates concurrent loads for the same tokenId.
   * Returns null if all URLs fail.
   */
  async loadTexture(tokenId: string): Promise<Texture | null> {
    const cached = this.cache.get(tokenId);
    if (cached) return cached;

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
  }

  /**
   * Resolve metadata config lazily from cache/env/default.
   * Keeps Pixi and DOM URL sources aligned when cache has metadata.
   */
  private ensureConfig(): MetadataConfig | null {
    const nextConfig = getMetadataConfig(getCachedGameIndexMetadata());
    if (this.config?.baseUrlPattern !== nextConfig?.baseUrlPattern) {
      this.config = nextConfig;
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
      } catch (e: unknown) {
        if (import.meta.env.DEV) {
          console.warn(`[TextureResolver] #${tokenId} failed from ${url}:`, errorMessage(e));
        }
      }
    }

    if (import.meta.env.DEV) {
      console.warn(`[TextureResolver] All ${urls.length} URLs failed for #${tokenId}`);
    }

    return null;
  }
}
