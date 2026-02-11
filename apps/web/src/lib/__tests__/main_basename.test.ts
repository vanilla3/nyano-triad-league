import { describe, it, expect, afterEach } from "vitest";
import { getAppBasePath } from "../appUrl";

/* ═══════════════════════════════════════════════════════════════════
   Router basename derivation from BASE_URL
   Validates that the basename logic matches createBrowserRouter usage.
   ═══════════════════════════════════════════════════════════════════ */

describe("router basename derivation", () => {
  const originalEnv = { ...import.meta.env };
  afterEach(() => {
    Object.keys(import.meta.env).forEach((key) => {
      if (!(key in originalEnv)) delete import.meta.env[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  /** Simulates the basename computation from main.tsx */
  function computeBasename(): string {
    return getAppBasePath().replace(/\/$/, "") || "/";
  }

  it("returns / for root deployment", () => {
    import.meta.env.BASE_URL = "/";
    expect(computeBasename()).toBe("/");
  });

  it("returns /nyano-triad-league for subpath deployment", () => {
    import.meta.env.BASE_URL = "/nyano-triad-league/";
    expect(computeBasename()).toBe("/nyano-triad-league");
  });

  it("returns /sub for subpath without trailing slash", () => {
    import.meta.env.BASE_URL = "/sub";
    expect(computeBasename()).toBe("/sub");
  });

  it("returns / for empty BASE_URL", () => {
    import.meta.env.BASE_URL = "";
    expect(computeBasename()).toBe("/");
  });
});
