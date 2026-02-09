/**
 * Nyano Warudo Bridge (Triad League → nyano-warudo)
 *
 * Minimal contract:
 *   POST /v1/snapshots
 *   { source: "triad_league", kind: "ai_prompt"|"state_json", content: "..." }
 */
export type NyanoWarudoSnapshotKind = "ai_prompt" | "state_json";

export type NyanoWarudoSnapshotRequest = {
  source: "triad_league";
  kind: NyanoWarudoSnapshotKind;
  content: string; // stringified prompt or JSON
};

export type NyanoWarudoSnapshotResponse = {
  ok: boolean;
  status: number;
  text: string;
};

export function normalizeBaseUrl(baseUrl: string): string {
  const t = (baseUrl ?? "").trim();
  if (!t) return "";
  return t.endsWith("/") ? t.slice(0, -1) : t;
}

// ── Retry configuration ─────────────────────────────────────────────────

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;

/**
 * Internal fetch wrapper with exponential backoff retry.
 * Only retries on network errors or 5xx status codes.
 * 4xx responses are returned immediately (not retried).
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries: number = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      // Don't retry client errors (4xx) or success
      if (res.ok || res.status < 500) return res;
      // Server error — retry if we have attempts left
      if (attempt === retries) return res;
    } catch (err) {
      // Network error — retry if we have attempts left
      if (attempt === retries) throw err;
    }
    // Exponential backoff: 500ms, 1000ms
    await new Promise((r) => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt)));
  }
  // unreachable, but TypeScript needs it
  throw new Error("fetchWithRetry: unexpected end of retry loop");
}

export async function postNyanoWarudoSnapshot(
  baseUrl: string,
  req: NyanoWarudoSnapshotRequest,
  opts?: { signal?: AbortSignal },
): Promise<NyanoWarudoSnapshotResponse> {
  const b = normalizeBaseUrl(baseUrl);
  if (!b) return { ok: false, status: 0, text: "NYANO_WARUDO_BASE_URL is empty" };

  const url = `${b}/v1/snapshots`;

  try {
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
      signal: opts?.signal,
    });

    const text = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, text };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, text: msg };
  }
}
