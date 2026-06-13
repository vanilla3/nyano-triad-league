import { describe, expect, it } from "vitest";
import { buildMatchXShareText, buildXShareIntentUrl } from "@/lib/share_x";

describe("buildXShareIntentUrl", () => {
  it("builds an x.com post intent with encoded text and url", () => {
    const url = buildXShareIntentUrl("hello world #tag", "https://example.com/replay?z=abc");
    expect(url.startsWith("https://x.com/intent/post?")).toBe(true);

    const parsed = new URL(url);
    expect(parsed.searchParams.get("text")).toBe("hello world #tag");
    expect(parsed.searchParams.get("url")).toBe("https://example.com/replay?z=abc");
  });

  it("omits empty parts", () => {
    const url = buildXShareIntentUrl("", "https://example.com");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("text")).toBeNull();
    expect(parsed.searchParams.get("url")).toBe("https://example.com");
  });
});

describe("buildMatchXShareText", () => {
  it("includes the project hashtag", () => {
    expect(buildMatchXShareText()).toContain("#NyanoTriadLeague");
  });
});
