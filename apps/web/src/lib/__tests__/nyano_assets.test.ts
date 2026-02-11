import { describe, it, expect } from "vitest";
import {
  NYANO_IMAGE_URL,
  NYANO_IMAGE_PNG_URL,
  NYANO_IMAGE_WEBP_URL,
  NYANO_IMAGE_ARWEAVE_URL,
} from "../nyano_assets";

describe("nyano_assets", () => {
  it("NYANO_IMAGE_URL equals NYANO_IMAGE_WEBP_URL", () => {
    expect(NYANO_IMAGE_URL).toBe(NYANO_IMAGE_WEBP_URL);
  });

  it("NYANO_IMAGE_PNG_URL is deprecated alias for WebP", () => {
    expect(NYANO_IMAGE_PNG_URL).toBe("/nyano.webp");
    expect(NYANO_IMAGE_PNG_URL).toBe(NYANO_IMAGE_WEBP_URL);
  });

  it('NYANO_IMAGE_WEBP_URL is "/nyano.webp"', () => {
    expect(NYANO_IMAGE_WEBP_URL).toBe("/nyano.webp");
  });

  it("NYANO_IMAGE_ARWEAVE_URL starts with https://arweave.net/", () => {
    expect(NYANO_IMAGE_ARWEAVE_URL).toMatch(/^https:\/\/arweave\.net\//);
  });
});
