import { describe, expect, it } from "vitest";
import type { MetadataConfig } from "../metadata";
import {
  normalizeNyanoTokenId,
  resolveNyanoImageUrl,
  resolveNyanoImageUrls,
} from "../resolveNyanoImageUrl";
import { buildTokenImageUrls } from "@/engine/renderers/pixi/tokenImageUrls";

const ARWEAVE_CONFIG: MetadataConfig = {
  baseUrlPattern: "https://abc123.arweave.net/tx123/{id}.png",
};

describe("normalizeNyanoTokenId", () => {
  it("normalizes boundary tokenIds used by NFT image paths", () => {
    expect(normalizeNyanoTokenId(1n)).toBe("1");
    expect(normalizeNyanoTokenId(2)).toBe("2");
    expect(normalizeNyanoTokenId("9999")).toBe("9999");
    expect(normalizeNyanoTokenId(10000n)).toBe("10000");
  });

  it("returns null for invalid tokenId inputs", () => {
    expect(normalizeNyanoTokenId(null)).toBeNull();
    expect(normalizeNyanoTokenId(undefined)).toBeNull();
    expect(normalizeNyanoTokenId(0)).toBeNull();
    expect(normalizeNyanoTokenId(-1)).toBeNull();
    expect(normalizeNyanoTokenId(1.25)).toBeNull();
    expect(normalizeNyanoTokenId("abc")).toBeNull();
    expect(normalizeNyanoTokenId("  ")).toBeNull();
  });
});

describe("resolveNyanoImageUrl", () => {
  it("builds primary URL from normalized tokenId", () => {
    expect(resolveNyanoImageUrl("0002", ARWEAVE_CONFIG)).toBe(
      "https://abc123.arweave.net/tx123/2.png",
    );
  });

  it("returns null when tokenId cannot be normalized", () => {
    expect(resolveNyanoImageUrl("not-a-number", ARWEAVE_CONFIG)).toBeNull();
  });
});

describe("resolveNyanoImageUrls", () => {
  it("returns primary plus Arweave fallbacks", () => {
    expect(resolveNyanoImageUrls(1n, ARWEAVE_CONFIG)).toEqual([
      "https://abc123.arweave.net/tx123/1.png",
      "https://arweave.net/tx123/1.png",
      "https://ar-io.dev/tx123/1.png",
    ]);
  });
});

describe("DOM/Pixi URL consistency", () => {
  it("returns identical URL lists for edge tokenIds", () => {
    for (const id of ["1", "2", "9999", "10000"]) {
      expect(resolveNyanoImageUrls(id, ARWEAVE_CONFIG)).toEqual(
        buildTokenImageUrls(id, ARWEAVE_CONFIG),
      );
    }
  });
});
