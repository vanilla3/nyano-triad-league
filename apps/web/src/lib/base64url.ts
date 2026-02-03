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

/** Gzip-compress UTF-8 text and return base64url(bytes). Requires browser CompressionStream. */
export async function gzipCompressUtf8ToBase64Url(text: string): Promise<string> {
  const CompressionStreamCtor = (globalThis as any).CompressionStream;
  if (typeof CompressionStreamCtor !== "function") throw new Error("CompressionStream is not available");

  const input = new TextEncoder().encode(text);

  // Pipe through gzip
  const cs = new CompressionStreamCtor("gzip");
  const writer = cs.writable.getWriter();
  await writer.write(input);
  await writer.close();

  const buf = await new Response(cs.readable).arrayBuffer();
  return base64UrlEncodeBytes(new Uint8Array(buf));
}

/** Reverse of gzipCompressUtf8ToBase64Url. Requires browser DecompressionStream. */
export async function gzipDecompressUtf8FromBase64Url(b64url: string): Promise<string> {
  const DecompressionStreamCtor = (globalThis as any).DecompressionStream;
  if (typeof DecompressionStreamCtor !== "function") throw new Error("DecompressionStream is not available");

  const input = base64UrlDecodeBytes(b64url);
  const ds = new DecompressionStreamCtor("gzip");

  const stream = new Response(input).body;
  if (!stream) throw new Error("no response body stream");

  const outBuf = await new Response(stream.pipeThrough(ds)).arrayBuffer();
  return new TextDecoder().decode(outBuf);
}

export async function safeGzipDecompressUtf8FromBase64Url(b64url: string): Promise<string | null> {
  try {
    return await gzipDecompressUtf8FromBase64Url(b64url);
  } catch {
    return null;
  }
}

export async function tryGzipCompressUtf8ToBase64Url(text: string): Promise<string | null> {
  try {
    return await gzipCompressUtf8ToBase64Url(text);
  } catch {
    return null;
  }
}
