/**
 * NFT Token Metadata resolution.
 *
 * Resolves tokenId → image URL using a configurable base URL pattern.
 * Sources (in priority order):
 *   1. `VITE_NYANO_METADATA_BASE` env variable
 *   2. GameIndex `metadata.imageBaseUrl` field
 *   3. null (no metadata configured → NyanoImage fallback)
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

// ── Config resolution ────────────────────────────────────────────────

/**
 * Get metadata config from available sources.
 *
 * Priority:
 *   1. VITE_NYANO_METADATA_BASE env variable
 *   2. GameIndex metadata.imageBaseUrl field
 *   3. null (not configured)
 */
export function getMetadataConfig(
  gameIndexMetadata?: Record<string, unknown> | null,
): MetadataConfig | null {
  // 1. Env variable override
  const envBase =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_NYANO_METADATA_BASE as string | undefined)
      : undefined;
  if (envBase) return { baseUrlPattern: envBase };

  // 2. GameIndex metadata field
  if (gameIndexMetadata && typeof gameIndexMetadata === "object") {
    const indexBase = (gameIndexMetadata as Record<string, string>).imageBaseUrl;
    if (typeof indexBase === "string" && indexBase) {
      return { baseUrlPattern: indexBase };
    }
  }

  // 3. Not configured
  return null;
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
