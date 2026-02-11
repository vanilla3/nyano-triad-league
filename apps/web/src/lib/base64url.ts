export function base64UrlEncodeBytes(bytes: Uint8Array): string {
  // Convert bytes to binary string in chunks to avoid call stack issues.
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    bin += String.fromCharCode(...sub);
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64UrlDecodeBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (b64.length % 4)) % 4;
  const padded = b64 + "=".repeat(padLen);

  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function base64UrlEncodeUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return base64UrlEncodeBytes(bytes);
}

export function base64UrlDecodeUtf8(b64url: string): string {
  const bytes = base64UrlDecodeBytes(b64url);
  return new TextDecoder().decode(bytes);
}

export function safeBase64UrlDecodeUtf8(b64url: string): string | null {
  try {
    return base64UrlDecodeUtf8(b64url);
  } catch {
    return null;
  }
}

/* ─── Gzip via fflate (sync, 8kB, all environments) ─── */

import { gzipSync, decompressSync } from "fflate";

/** Gzip-compress UTF-8 text and return base64url(bytes). */
export function gzipCompressUtf8ToBase64Url(text: string): string {
  const compressed = gzipSync(new TextEncoder().encode(text));
  return base64UrlEncodeBytes(compressed);
}

/** Decompress base64url-encoded gzip bytes and return UTF-8 text. */
export function gzipDecompressUtf8FromBase64Url(b64url: string): string {
  return new TextDecoder().decode(decompressSync(base64UrlDecodeBytes(b64url)));
}

/** Safe wrapper: returns null instead of throwing. */
export function safeGzipDecompressUtf8FromBase64Url(b64url: string): string | null {
  try {
    return gzipDecompressUtf8FromBase64Url(b64url);
  } catch {
    return null;
  }
}

/** Safe wrapper: returns null instead of throwing. */
export function tryGzipCompressUtf8ToBase64Url(text: string): string | null {
  try {
    return gzipCompressUtf8ToBase64Url(text);
  } catch {
    return null;
  }
}
