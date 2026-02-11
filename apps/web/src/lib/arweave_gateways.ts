/**
 * Arweave gateway URL helpers.
 *
 * Provides multi-stage fallback gateway resolution for Arweave NFT image URLs.
 * Used by NyanoCardArt to gracefully handle gateway unreachability.
 */

/**
 * Generate an ordered list of fallback gateway URLs for an Arweave asset.
 *
 * Given `https://<hash>.arweave.net/<txid>/<path>`:
 *   1. canonical gateway: `https://arweave.net/<txid>/<path>`
 *   2. ar-io gateway:     `https://ar-io.dev/<txid>/<path>`
 *
 * Given `https://arweave.net/<txid>/<path>`:
 *   1. ar-io gateway:     `https://ar-io.dev/<txid>/<path>`
 *
 * Returns empty array if the URL is not an Arweave URL.
 */
export function buildArweaveFallbacks(url: string): string[] {
  const fallbacks: string[] = [];

  // Pattern 1: subdomain gateway → extract path part
  const sub = url.match(/^https:\/\/[^.]+\.arweave\.net\/(.+)$/);
  if (sub) {
    fallbacks.push(`https://arweave.net/${sub[1]}`);
    fallbacks.push(`https://ar-io.dev/${sub[1]}`);
    return fallbacks;
  }

  // Pattern 2: canonical gateway → only ar-io fallback
  const canon = url.match(/^https:\/\/arweave\.net\/(.+)$/);
  if (canon) {
    fallbacks.push(`https://ar-io.dev/${canon[1]}`);
    return fallbacks;
  }

  return fallbacks;
}
