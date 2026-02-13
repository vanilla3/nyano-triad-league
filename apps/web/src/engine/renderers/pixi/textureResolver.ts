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
import { normalizePreloadTokenIds } from "./preloadPolicy";

export type TextureLoadResult = "loaded" | "failed";

export interface TextureLoadStatusEvent {
  tokenId: string;
  result: TextureLoadResult;
}

type TextureStatusListener = (event: TextureLoadStatusEvent) => void;

/**
 * Manages NFT card image texture loading, caching, and URL fallback.
 *
 * Usage:
 * - `getTexture(tokenId)` - synchronous cache lookup; returns null if not loaded
 * - `loadTexture(tokenId)` - async load with fallback; resolves to Texture | null
 * - `preloadTextures(tokenIds, maxConcurrent)` - background preload queue
 * - `dispose()` - clear cache (call from renderer destroy)
 */
export class TextureResolver {
  private config: MetadataConfig | null = null;
  private cache = new Map<string, Texture>();
  private pending = new Map<string, Promise<Texture | null>>();
  private failed = new Set<string>();
  private statusListeners = new Set<TextureStatusListener>();
  private preloadQueue: string[] = [];
  private preloadQueued = new Set<string>();
  private preloadInFlight = 0;
  private preloadMaxConcurrent = 2;
  private generation = 0;

  /**
   * Synchronous cache lookup. Returns cached Texture or null.
   * Call this from redraw() and start loadTexture() separately when null.
   */
  getTexture(tokenId: string): Texture | null {
    return this.cache.get(tokenId) ?? null;
  }

  isPending(tokenId: string): boolean {
    return this.pending.has(tokenId);
  }

  isFailed(tokenId: string): boolean {
    return this.failed.has(tokenId);
  }

  /**
   * Clear failed flags so caller can re-attempt texture loads.
   * If tokenIds omitted, clears all failed markers.
   */
  clearFailed(tokenIds?: readonly string[]): void {
    if (!tokenIds) {
      this.failed.clear();
      return;
    }
    for (const tokenId of tokenIds) this.failed.delete(tokenId);
  }

  /**
   * Subscribe texture load outcomes (loaded/failed).
   * Returns unsubscribe function.
   */
  onStatus(listener: TextureStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
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

    // New attempt replaces previous failed marker.
    this.failed.delete(tokenId);

    const urls = buildTokenImageUrls(tokenId, this.ensureConfig());
    if (urls.length === 0) {
      this.failed.add(tokenId);
      this.emitStatus({ tokenId, result: "failed" });
      return null;
    }

    const generationAtStart = this.generation;
    const promise = this.tryLoadFromUrls(urls, tokenId, generationAtStart);
    this.pending.set(tokenId, promise);

    try {
      return await promise;
    } finally {
      this.pending.delete(tokenId);
    }
  }

  /**
   * Queue token textures for background preloading with limited concurrency.
   * Visible cards should call this so card art appears faster when cells update.
   */
  preloadTextures(tokenIds: readonly string[], maxConcurrent = 2): void {
    const normalizedConcurrency = Number.isFinite(maxConcurrent)
      ? Math.max(0, Math.trunc(maxConcurrent))
      : 0;
    this.preloadMaxConcurrent = normalizedConcurrency;
    if (normalizedConcurrency === 0) {
      this.preloadQueue = [];
      this.preloadQueued.clear();
      return;
    }

    for (const tokenId of normalizePreloadTokenIds(tokenIds)) {
      if (this.cache.has(tokenId)) continue;
      if (this.pending.has(tokenId)) continue;
      if (this.preloadQueued.has(tokenId)) continue;
      this.preloadQueue.push(tokenId);
      this.preloadQueued.add(tokenId);
    }

    this.drainPreloadQueue();
  }

  /** Clear cache and pending loads. Called from renderer destroy(). */
  dispose(): void {
    this.generation += 1;
    this.cache.clear();
    this.pending.clear();
    this.failed.clear();
    this.statusListeners.clear();
    this.preloadQueue = [];
    this.preloadQueued.clear();
    this.preloadInFlight = 0;
    this.preloadMaxConcurrent = 2;
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
    generationAtStart: number,
  ): Promise<Texture | null> {
    for (const url of urls) {
      if (generationAtStart !== this.generation) return null;
      try {
        const texture = await Assets.load<Texture>(url);
        if (generationAtStart !== this.generation) return null;
        if (texture && !texture.destroyed) {
          this.cache.set(tokenId, texture);
          this.failed.delete(tokenId);
          this.emitStatus({ tokenId, result: "loaded" });
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

    if (generationAtStart === this.generation) {
      this.failed.add(tokenId);
      this.emitStatus({ tokenId, result: "failed" });
    }

    return null;
  }

  private drainPreloadQueue(): void {
    while (
      this.preloadInFlight < this.preloadMaxConcurrent &&
      this.preloadQueue.length > 0
    ) {
      const tokenId = this.preloadQueue.shift();
      if (!tokenId) continue;
      this.preloadQueued.delete(tokenId);

      if (this.cache.has(tokenId) || this.pending.has(tokenId)) {
        continue;
      }

      this.preloadInFlight += 1;
      void this.loadTexture(tokenId).finally(() => {
        this.preloadInFlight = Math.max(0, this.preloadInFlight - 1);
        this.drainPreloadQueue();
      });
    }
  }

  private emitStatus(event: TextureLoadStatusEvent): void {
    for (const listener of this.statusListeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors to keep texture pipeline stable.
      }
    }
  }
}
