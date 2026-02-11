import { describe, it, expect } from "vitest";
// @ts-expect-error -- node:zlib available in Vitest (Node runtime) but not in web tsconfig types
import { gzipSync as nodeGzipSync } from "node:zlib";
import {
  base64UrlEncodeBytes,
  base64UrlDecodeBytes,
  base64UrlEncodeUtf8,
  base64UrlDecodeUtf8,
  safeBase64UrlDecodeUtf8,
  gzipCompressUtf8ToBase64Url,
  gzipDecompressUtf8FromBase64Url,
  safeGzipDecompressUtf8FromBase64Url,
  tryGzipCompressUtf8ToBase64Url,
} from "../base64url";

/* ═══════════════════════════════════════════════════════════════════
   base64url.test.ts
   Unit tests for base64url encode/decode utilities.
   ═══════════════════════════════════════════════════════════════════ */

describe("base64UrlEncodeBytes / base64UrlDecodeBytes", () => {
  it("roundtrips empty Uint8Array", () => {
    const empty = new Uint8Array(0);
    const encoded = base64UrlEncodeBytes(empty);
    const decoded = base64UrlDecodeBytes(encoded);
    expect(decoded.length).toBe(0);
  });

  it("roundtrips known bytes (Hello)", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    const encoded = base64UrlEncodeBytes(bytes);
    const decoded = base64UrlDecodeBytes(encoded);
    expect(Array.from(decoded)).toEqual([72, 101, 108, 108, 111]);
  });

  it("output uses URL-safe characters only (no +, /, =)", () => {
    // Use bytes that produce + and / in standard base64
    const bytes = new Uint8Array([0xff, 0xfe, 0xfd, 0xfc, 0xfb]);
    const encoded = base64UrlEncodeBytes(bytes);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("roundtrips single byte with padding edge case", () => {
    const bytes = new Uint8Array([0xff]);
    const encoded = base64UrlEncodeBytes(bytes);
    const decoded = base64UrlDecodeBytes(encoded);
    expect(Array.from(decoded)).toEqual([0xff]);
  });

  it("roundtrips large payload", () => {
    const bytes = new Uint8Array(10000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;
    const encoded = base64UrlEncodeBytes(bytes);
    const decoded = base64UrlDecodeBytes(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(bytes));
  });
});

describe("base64UrlEncodeUtf8 / base64UrlDecodeUtf8", () => {
  it("roundtrips ASCII string", () => {
    const text = "Hello, world!";
    expect(base64UrlDecodeUtf8(base64UrlEncodeUtf8(text))).toBe(text);
  });

  it("roundtrips Unicode string with multibyte chars", () => {
    const text = "にゃーん 🐱";
    expect(base64UrlDecodeUtf8(base64UrlEncodeUtf8(text))).toBe(text);
  });

  it("roundtrips empty string", () => {
    expect(base64UrlDecodeUtf8(base64UrlEncodeUtf8(""))).toBe("");
  });
});

describe("safeBase64UrlDecodeUtf8", () => {
  it("returns null on invalid base64", () => {
    expect(safeBase64UrlDecodeUtf8("!!not-base64!!")).toBeNull();
  });

  it("returns decoded string on valid input", () => {
    const encoded = base64UrlEncodeUtf8("test");
    expect(safeBase64UrlDecodeUtf8(encoded)).toBe("test");
  });
});

/* ═══════════════════════════════════════════════════════════════════
   gzip compress/decompress via fflate (sync)
   ═══════════════════════════════════════════════════════════════════ */

describe("gzipCompressUtf8ToBase64Url / gzipDecompressUtf8FromBase64Url", () => {
  it("roundtrips ASCII string", () => {
    const text = "Hello, world!";
    const encoded = gzipCompressUtf8ToBase64Url(text);
    expect(gzipDecompressUtf8FromBase64Url(encoded)).toBe(text);
  });

  it("roundtrips Unicode string with emoji", () => {
    const text = "にゃーん 🐱 Triad League";
    const encoded = gzipCompressUtf8ToBase64Url(text);
    expect(gzipDecompressUtf8FromBase64Url(encoded)).toBe(text);
  });

  it("roundtrips empty string", () => {
    const encoded = gzipCompressUtf8ToBase64Url("");
    expect(gzipDecompressUtf8FromBase64Url(encoded)).toBe("");
  });

  it("roundtrips large JSON payload", () => {
    const obj = {
      header: { version: 1, rulesetId: "0x" + "11".repeat(32), seasonId: 0 },
      turns: Array.from({ length: 9 }, (_, i) => ({ cell: i, cardIndex: i % 5 })),
    };
    const json = JSON.stringify(obj);
    const encoded = gzipCompressUtf8ToBase64Url(json);
    expect(gzipDecompressUtf8FromBase64Url(encoded)).toBe(json);
  });

  it("produces smaller output than raw base64url for compressible data", () => {
    // Repetitive JSON compresses well
    const json = JSON.stringify({ data: "a".repeat(500) });
    const gzipped = gzipCompressUtf8ToBase64Url(json);
    const raw = base64UrlEncodeUtf8(json);
    expect(gzipped.length).toBeLessThan(raw.length);
  });

  it("output uses URL-safe characters only (no +, /, =)", () => {
    const text = "test data for URL safety check";
    const encoded = gzipCompressUtf8ToBase64Url(text);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("interoperates with Node.js zlib.gzipSync output (backward compatibility)", () => {
    // Simulate how E2E tests and existing z= URLs are created:
    // Node.js zlib.gzipSync → base64url → should be decodable by fflate
    const json = '{"header":{"version":1},"turns":[]}';
    const compressed = nodeGzipSync(json);
    const b64url = base64UrlEncodeBytes(new Uint8Array(compressed));
    // fflate's decompressSync can decode Node.js gzip output
    expect(gzipDecompressUtf8FromBase64Url(b64url)).toBe(json);
  });
});

describe("safeGzipDecompressUtf8FromBase64Url", () => {
  it("returns decoded string on valid gzipped input", () => {
    const encoded = gzipCompressUtf8ToBase64Url("safe test");
    expect(safeGzipDecompressUtf8FromBase64Url(encoded)).toBe("safe test");
  });

  it("returns null on invalid data", () => {
    expect(safeGzipDecompressUtf8FromBase64Url("not-valid-gzip")).toBeNull();
  });

  it("returns null on truncated gzip header", () => {
    // A gzip stream needs at least 10 bytes for the header; a short base64 can't be valid
    expect(safeGzipDecompressUtf8FromBase64Url("AQID")).toBeNull();
  });
});

describe("tryGzipCompressUtf8ToBase64Url", () => {
  it("returns compressed base64url string on valid input", () => {
    const result = tryGzipCompressUtf8ToBase64Url("try test");
    expect(result).not.toBeNull();
    expect(gzipDecompressUtf8FromBase64Url(result!)).toBe("try test");
  });
});
