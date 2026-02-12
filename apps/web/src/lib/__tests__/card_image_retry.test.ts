import { describe, expect, it } from "vitest";
import {
  applyImageRetryNonce,
  buildImageRetryAttemptSources,
  normalizeImageRetryQueryKey,
} from "../card_image_retry";

describe("normalizeImageRetryQueryKey", () => {
  it("keeps valid query keys", () => {
    expect(normalizeImageRetryQueryKey("retry_nonce")).toBe("retry_nonce");
  });

  it("falls back for invalid keys", () => {
    expect(normalizeImageRetryQueryKey("")).toBe("__retry");
    expect(normalizeImageRetryQueryKey("  ")).toBe("__retry");
    expect(normalizeImageRetryQueryKey("bad key")).toBe("__retry");
    expect(normalizeImageRetryQueryKey("bad?key")).toBe("__retry");
  });
});

describe("applyImageRetryNonce", () => {
  it("keeps url unchanged when nonce is 0", () => {
    const url = "https://example.com/img.png";
    expect(applyImageRetryNonce(url, 0)).toBe(url);
  });

  it("adds nonce query param to absolute url", () => {
    const url = "https://example.com/img.png?x=1#hash";
    const out = applyImageRetryNonce(url, 2);
    expect(out).toBe("https://example.com/img.png?x=1&__retry=2#hash");
  });

  it("adds nonce query param to relative url", () => {
    const url = "/assets/img.png?x=1#h";
    const out = applyImageRetryNonce(url, 3);
    expect(out).toBe("/assets/img.png?x=1&__retry=3#h");
  });
});

describe("buildImageRetryAttemptSources", () => {
  it("returns primary active src and unique fallback queue", () => {
    const primary = "https://cdn.example.com/a.png";
    const fallbacks = [primary, "https://arweave.net/a.png", "https://arweave.net/a.png", "https://ar-io.dev/a.png"];
    const plan = buildImageRetryAttemptSources(primary, fallbacks, 1);

    expect(plan.activeSrc).toBe("https://cdn.example.com/a.png?__retry=1");
    expect(plan.fallbackQueue).toEqual([
      "https://arweave.net/a.png?__retry=1",
      "https://ar-io.dev/a.png?__retry=1",
    ]);
  });
});

