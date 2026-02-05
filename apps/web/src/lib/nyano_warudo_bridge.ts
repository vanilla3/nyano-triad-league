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

export async function postNyanoWarudoSnapshot(baseUrl: string, req: NyanoWarudoSnapshotRequest): Promise<NyanoWarudoSnapshotResponse> {
  const b = normalizeBaseUrl(baseUrl);
  if (!b) return { ok: false, status: 0, text: "NYANO_WARUDO_BASE_URL is empty" };

  const url = `${b}/v1/snapshots`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });

    const text = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, text };
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : String(e);
    return { ok: false, status: 0, text: msg };
  }
}
