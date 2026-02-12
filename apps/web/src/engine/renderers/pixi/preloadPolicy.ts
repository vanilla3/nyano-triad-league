import type { VfxQuality } from "@/lib/visual/visualSettings";

/**
 * Preload concurrency policy tuned for low-end devices.
 * off/low keep background requests minimal.
 */
export function texturePreloadConcurrencyForQuality(quality: VfxQuality): number {
  switch (quality) {
    case "off":
      return 0;
    case "low":
      return 1;
    case "medium":
      return 2;
    case "high":
      return 3;
  }
}

/**
 * Normalize tokenIds for preload queueing:
 * - trim whitespace
 * - drop empty values
 * - keep stable insertion order while deduping
 */
export function normalizePreloadTokenIds(tokenIds: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tokenIds) {
    const tokenId = raw.trim();
    if (!tokenId) continue;
    // Token IDs are decimal positive integers in this project.
    // Filtering here avoids futile preload requests for malformed inputs.
    if (!/^\d+$/.test(tokenId)) continue;
    if (tokenId === "0") continue;
    if (seen.has(tokenId)) continue;
    seen.add(tokenId);
    out.push(tokenId);
  }
  return out;
}
