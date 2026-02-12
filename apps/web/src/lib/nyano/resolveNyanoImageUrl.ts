import { buildArweaveFallbacks } from "@/lib/arweave_gateways";
import { resolveTokenImageUrl, type MetadataConfig } from "./metadata";

export type NyanoTokenIdInput = bigint | number | string | null | undefined;

/**
 * Convert user/runtime tokenId input into a canonical positive integer string.
 * Returns null for nullish, non-integer, or non-positive values.
 */
export function normalizeNyanoTokenId(tokenId: NyanoTokenIdInput): string | null {
  if (tokenId === null || tokenId === undefined) return null;

  try {
    if (typeof tokenId === "bigint") {
      if (tokenId <= 0n) return null;
      return tokenId.toString();
    }

    if (typeof tokenId === "number") {
      if (!Number.isSafeInteger(tokenId) || tokenId <= 0) return null;
      return String(tokenId);
    }

    const trimmed = tokenId.trim();
    if (!/^\d+$/.test(trimmed)) return null;

    const parsed = BigInt(trimmed);
    if (parsed <= 0n) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Resolve the primary NFT image URL for a Nyano token.
 * Returns null when tokenId/config is invalid.
 */
export function resolveNyanoImageUrl(
  tokenId: NyanoTokenIdInput,
  config: MetadataConfig | null,
): string | null {
  const normalized = normalizeNyanoTokenId(tokenId);
  if (!normalized) return null;
  return resolveTokenImageUrl(normalized, config);
}

/**
 * Resolve ordered image URLs [primary, ...fallbacks] for Nyano token art.
 */
export function resolveNyanoImageUrls(
  tokenId: NyanoTokenIdInput,
  config: MetadataConfig | null,
): string[] {
  const primary = resolveNyanoImageUrl(tokenId, config);
  if (!primary) return [];
  return [primary, ...buildArweaveFallbacks(primary)];
}
