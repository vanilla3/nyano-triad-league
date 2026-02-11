/**
 * NFT Token Metadata resolution.
 *
 * Resolves tokenId → image URL using a configurable base URL pattern.
 * Sources (in priority order):
 *   1. `VITE_NYANO_METADATA_BASE` env variable
 *   2. GameIndex `metadata.imageBaseUrl` field
 *   3. Hardcoded default Arweave URL (ensures images load even without GameIndex)
 */

// ── Types ────────────────────────────────────────────────────────────

export type NyanoTokenMetadata = {
  imageUrl: string;
  name?: string;
};

export type MetadataConfig = {
  /**
   * URL pattern where `{id}` is replaced with the tokenId string.
   * Example: `"https://meta.nyano.ai/token/{id}.png"`
   */
  baseUrlPattern: string;
};

// ── Hardcoded default (last resort) ─────────────────────────────────

/**
 * Default Arweave image URL pattern — used when neither env var nor
 * GameIndex provides `imageBaseUrl`. This ensures NFT images load even
 * when the GameIndex fetch fails or hasn't completed yet.
 *
 * This is the production Arweave subdomain gateway URL for Nyano token images.
 */
export const DEFAULT_NYANO_IMAGE_BASE =
  "https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/{id}.png";

// ── Config resolution ────────────────────────────────────────────────

/**
 * Get metadata config from available sources.
 *
 * Priority:
 *   1. VITE_NYANO_METADATA_BASE env variable
 *   2. GameIndex metadata.imageBaseUrl field
 *   3. Hardcoded default Arweave URL
 */
export function getMetadataConfig(
  gameIndexMetadata?: Record<string, unknown> | null,
): MetadataConfig | null {
  // 1. Env variable override
  const envBase =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_NYANO_METADATA_BASE as string | undefined)
      : undefined;
  if (envBase) {
    if (!envBase.includes("{id}")) {
      if (import.meta.env?.DEV) {
        console.warn(
          `[metadata] VITE_NYANO_METADATA_BASE is missing "{id}" placeholder: "${envBase}". Ignoring.`,
        );
      }
      // Fall through to GameIndex source
    } else {
      return { baseUrlPattern: envBase };
    }
  }

  // 2. GameIndex metadata field
  if (gameIndexMetadata && typeof gameIndexMetadata === "object") {
    const indexBase = (gameIndexMetadata as Record<string, string>).imageBaseUrl;
    if (typeof indexBase === "string" && indexBase && indexBase.includes("{id}")) {
      return { baseUrlPattern: indexBase };
    }
  }

  // 3. Hardcoded default — ensures images load even without GameIndex
  return { baseUrlPattern: DEFAULT_NYANO_IMAGE_BASE };
}

// ── URL resolution ───────────────────────────────────────────────────

/**
 * Resolve a token image URL from tokenId and config.
 * Returns null if config is not available.
 */
export function resolveTokenImageUrl(
  tokenId: bigint | string,
  config: MetadataConfig | null,
): string | null {
  if (!config?.baseUrlPattern) return null;
  const idStr = typeof tokenId === "bigint" ? tokenId.toString() : tokenId;
  return config.baseUrlPattern.replace("{id}", idStr);
}
