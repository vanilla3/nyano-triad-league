/**
 * tokenImageUrls — pure URL resolution for NFT card images.
 *
 * Combines metadata config resolution and Arweave multi-gateway fallback
 * into an ordered list of image URLs for a given tokenId.
 *
 * This file has NO pixi.js dependency — safe for Node.js tests.
 */

import { type MetadataConfig } from "@/lib/nyano/metadata";
import { resolveNyanoImageUrls } from "@/lib/nyano/resolveNyanoImageUrl";

/**
 * Build an ordered list of image URLs for a given tokenId.
 *
 * Returns [primaryUrl, ...arweaveFallbacks]:
 * - Arweave subdomain URL → [primary, canonical, ar-io.dev]
 * - Arweave canonical URL → [primary, ar-io.dev]
 * - Non-Arweave URL       → [primary]
 * - No config / no URL    → []
 */
export function buildTokenImageUrls(
  tokenId: string,
  config: MetadataConfig | null,
): string[] {
  return resolveNyanoImageUrls(tokenId, config);
}
