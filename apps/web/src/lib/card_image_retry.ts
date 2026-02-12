const DEFAULT_IMAGE_RETRY_QUERY_KEY = "__retry";
const SAFE_QUERY_KEY_RE = /^[a-zA-Z0-9_.-]+$/;

/**
 * Normalize retry query key.
 * Falls back to a safe default if key is empty or contains unsafe chars.
 */
export function normalizeImageRetryQueryKey(queryKey?: string): string {
  const trimmed = (queryKey ?? "").trim();
  if (!trimmed || !SAFE_QUERY_KEY_RE.test(trimmed)) {
    return DEFAULT_IMAGE_RETRY_QUERY_KEY;
  }
  return trimmed;
}

/**
 * Apply retry nonce to URL as query param.
 *
 * - Nonce <= 0 keeps URL unchanged (first attempt).
 * - Works with absolute and relative URLs.
 */
export function applyImageRetryNonce(
  url: string,
  retryNonce: number,
  queryKey: string = DEFAULT_IMAGE_RETRY_QUERY_KEY,
): string {
  const nonce = Number.isFinite(retryNonce) ? Math.max(0, Math.floor(retryNonce)) : 0;
  if (nonce <= 0) return url;

  const key = normalizeImageRetryQueryKey(queryKey);
  const value = String(nonce);

  try {
    const parsed = new URL(url);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    const hashIndex = url.indexOf("#");
    const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
    const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;

    const queryIndex = withoutHash.indexOf("?");
    const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
    const query = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "";

    const params = new URLSearchParams(query);
    params.set(key, value);
    const nextQuery = params.toString();
    return nextQuery ? `${path}?${nextQuery}${hash}` : `${path}${hash}`;
  }
}

/**
 * Build per-attempt image sources.
 *
 * Returns:
 * - activeSrc: primary source for this attempt
 * - fallbackQueue: ordered, unique fallback sources
 */
export function buildImageRetryAttemptSources(
  primarySrc: string,
  fallbackSrcs: string[],
  retryNonce: number,
  queryKey: string = DEFAULT_IMAGE_RETRY_QUERY_KEY,
): { activeSrc: string; fallbackQueue: string[] } {
  const seen = new Set<string>();
  const fallbackQueue: string[] = [];

  seen.add(primarySrc);

  for (const fallback of fallbackSrcs) {
    if (!fallback || seen.has(fallback)) continue;
    seen.add(fallback);
    fallbackQueue.push(applyImageRetryNonce(fallback, retryNonce, queryKey));
  }

  return {
    activeSrc: applyImageRetryNonce(primarySrc, retryNonce, queryKey),
    fallbackQueue,
  };
}

