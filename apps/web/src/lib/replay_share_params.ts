import {
  safeBase64UrlDecodeUtf8,
  safeGzipDecompressUtf8FromBase64Url,
} from "@/lib/base64url";

export type ReplaySharePayloadDecodeResult =
  | { kind: "none" }
  | { kind: "ok"; param: "z" | "t"; text: string }
  | { kind: "error"; param: "z" | "t"; error: string };

const REPLAY_SHARE_PARAM_KEYS = ["z", "t"] as const;
const REPLAY_STATE_PARAM_KEYS = ["mode", "step"] as const;

export function hasReplaySharePayload(params: URLSearchParams): boolean {
  return REPLAY_SHARE_PARAM_KEYS.some((key) => params.has(key));
}

/**
 * Decode replay share payload from URL params.
 * z (gzip) is preferred over t (raw) when both exist.
 */
export function decodeReplaySharePayload(params: URLSearchParams): ReplaySharePayloadDecodeResult {
  const z = params.get("z");
  if (z) {
    const decoded = safeGzipDecompressUtf8FromBase64Url(z);
    if (!decoded) {
      return { kind: "error", param: "z", error: "Invalid share link (z parameter could not be decompressed)." };
    }
    return { kind: "ok", param: "z", text: decoded };
  }

  const t = params.get("t");
  if (t) {
    const decoded = safeBase64UrlDecodeUtf8(t);
    if (!decoded) {
      return { kind: "error", param: "t", error: "Invalid share link (t parameter could not be decoded)." };
    }
    return { kind: "ok", param: "t", text: decoded };
  }

  return { kind: "none" };
}

/**
 * Remove replay share-related params while preserving unrelated params
 * such as event/broadcast/ui.
 */
export function stripReplayShareParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of REPLAY_SHARE_PARAM_KEYS) next.delete(key);
  for (const key of REPLAY_STATE_PARAM_KEYS) next.delete(key);
  return next;
}
