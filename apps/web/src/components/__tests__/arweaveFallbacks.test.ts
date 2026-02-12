import { describe, it, expect } from "vitest";
import { buildArweaveFallbacks } from "@/lib/arweave_gateways";

/* ═══════════════════════════════════════════════════════════════════
   NyanoCardArt — buildArweaveFallbacks gateway staging
   ═══════════════════════════════════════════════════════════════════ */

describe("buildArweaveFallbacks", () => {
  it("generates 2 fallbacks from subdomain gateway URL", () => {
    const url =
      "https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/42.png";
    const fallbacks = buildArweaveFallbacks(url);
    expect(fallbacks).toHaveLength(2);
    expect(fallbacks[0]).toBe(
      "https://arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/42.png",
    );
    expect(fallbacks[1]).toBe(
      "https://ar-io.dev/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/42.png",
    );
  });

  it("generates 1 fallback from canonical gateway URL", () => {
    const url = "https://arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/42.png";
    const fallbacks = buildArweaveFallbacks(url);
    expect(fallbacks).toHaveLength(1);
    expect(fallbacks[0]).toBe(
      "https://ar-io.dev/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/42.png",
    );
  });

  it("generates canonical fallback from ar-io gateway URL", () => {
    const url = "https://ar-io.dev/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/42.png";
    const fallbacks = buildArweaveFallbacks(url);
    expect(fallbacks).toHaveLength(1);
    expect(fallbacks[0]).toBe(
      "https://arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/42.png",
    );
  });

  it("returns empty array for non-Arweave URL", () => {
    expect(buildArweaveFallbacks("https://example.com/image.png")).toEqual([]);
    expect(buildArweaveFallbacks("https://ipfs.io/ipfs/abc")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(buildArweaveFallbacks("")).toEqual([]);
  });

  it("handles Arweave subdomain with simple path", () => {
    const url = "https://abc123.arweave.net/txid";
    const fallbacks = buildArweaveFallbacks(url);
    expect(fallbacks).toHaveLength(2);
    expect(fallbacks[0]).toBe("https://arweave.net/txid");
    expect(fallbacks[1]).toBe("https://ar-io.dev/txid");
  });

  it("preserves full path including nested directories", () => {
    const url = "https://hash.arweave.net/tx/images/deep/1.png";
    const fallbacks = buildArweaveFallbacks(url);
    expect(fallbacks[0]).toBe("https://arweave.net/tx/images/deep/1.png");
    expect(fallbacks[1]).toBe("https://ar-io.dev/tx/images/deep/1.png");
  });
});
