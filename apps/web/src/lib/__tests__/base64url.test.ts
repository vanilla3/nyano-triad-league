import { describe, it, expect } from "vitest";
import {
  base64UrlEncodeBytes,
  base64UrlDecodeBytes,
  base64UrlEncodeUtf8,
  base64UrlDecodeUtf8,
  safeBase64UrlDecodeUtf8,
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

describe("gzip functions", () => {
  it.todo("gzip compress/decompress roundtrip — requires CompressionStream (browser env)");
});
