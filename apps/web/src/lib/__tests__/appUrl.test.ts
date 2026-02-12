import { describe, it, expect, afterEach } from "vitest";
import { getAppBasePath, appPath, appAbsoluteUrl, buildReplayShareUrl } from "../appUrl";

/* ═══════════════════════════════════════════════════════════════════
   appUrl.ts — BASE_URL-aware URL utilities
   ═══════════════════════════════════════════════════════════════════ */

describe("getAppBasePath", () => {
  const originalEnv = { ...import.meta.env };
  afterEach(() => {
    Object.keys(import.meta.env).forEach((key) => {
      if (!(key in originalEnv)) delete import.meta.env[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  it("returns / when BASE_URL is /", () => {
    import.meta.env.BASE_URL = "/";
    expect(getAppBasePath()).toBe("/");
  });

  it("returns subpath with trailing slash", () => {
    import.meta.env.BASE_URL = "/nyano-triad-league/";
    expect(getAppBasePath()).toBe("/nyano-triad-league/");
  });

  it("adds trailing slash when missing", () => {
    import.meta.env.BASE_URL = "/sub";
    expect(getAppBasePath()).toBe("/sub/");
  });

  it("returns / when BASE_URL is empty", () => {
    import.meta.env.BASE_URL = "";
    expect(getAppBasePath()).toBe("/");
  });

  it("normalizes bare segment BASE_URL to rooted subpath", () => {
    import.meta.env.BASE_URL = "nyano-triad-league";
    expect(getAppBasePath()).toBe("/nyano-triad-league/");
  });

  it("uses pathname from absolute BASE_URL", () => {
    import.meta.env.BASE_URL = "https://cdn.example.com/nyano-triad-league/?v=1#hash";
    expect(getAppBasePath()).toBe("/nyano-triad-league/");
  });

  it("treats ./ BASE_URL as root", () => {
    import.meta.env.BASE_URL = "./";
    expect(getAppBasePath()).toBe("/");
  });
});

describe("appPath", () => {
  const originalEnv = { ...import.meta.env };
  afterEach(() => {
    Object.keys(import.meta.env).forEach((key) => {
      if (!(key in originalEnv)) delete import.meta.env[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  it("builds relative path at root", () => {
    import.meta.env.BASE_URL = "/";
    expect(appPath("replay")).toBe("/replay");
  });

  it("builds relative path with subpath", () => {
    import.meta.env.BASE_URL = "/nyano-triad-league/";
    expect(appPath("replay?z=abc")).toBe("/nyano-triad-league/replay?z=abc");
  });

  it("strips leading slash from path", () => {
    import.meta.env.BASE_URL = "/sub/";
    expect(appPath("/replay")).toBe("/sub/replay");
  });
});

describe("appAbsoluteUrl", () => {
  const originalEnv = { ...import.meta.env };
  afterEach(() => {
    Object.keys(import.meta.env).forEach((key) => {
      if (!(key in originalEnv)) delete import.meta.env[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  it("builds absolute URL at root (Node env — no origin)", () => {
    import.meta.env.BASE_URL = "/";
    // In Node test env, window.location.origin is not available
    const url = appAbsoluteUrl("replay?z=test123");
    expect(url).toContain("/replay?z=test123");
  });

  it("includes subpath in absolute URL", () => {
    import.meta.env.BASE_URL = "/nyano-triad-league/";
    const url = appAbsoluteUrl("replay?z=test123");
    expect(url).toContain("/nyano-triad-league/replay?z=test123");
  });
});

describe("buildReplayShareUrl", () => {
  const originalEnv = { ...import.meta.env };
  afterEach(() => {
    Object.keys(import.meta.env).forEach((key) => {
      if (!(key in originalEnv)) delete import.meta.env[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  it("builds root replay URL with query params", () => {
    import.meta.env.BASE_URL = "/";
    const url = buildReplayShareUrl({
      data: { key: "z", value: "abc123" },
      mode: "auto",
      step: 9,
      absolute: false,
    });
    expect(url).toBe("/replay?z=abc123&mode=auto&step=9");
  });

  it("builds subpath replay URL with event param", () => {
    import.meta.env.BASE_URL = "/nyano-triad-league/";
    const url = buildReplayShareUrl({
      data: { key: "t", value: "raw_payload" },
      eventId: "gp-1",
      step: 9,
      absolute: false,
    });
    expect(url).toBe("/nyano-triad-league/replay?t=raw_payload&event=gp-1&step=9");
  });

  it("includes ui query param when provided", () => {
    import.meta.env.BASE_URL = "/";
    const url = buildReplayShareUrl({
      data: { key: "z", value: "abc123" },
      mode: "auto",
      ui: "engine",
      step: 9,
      absolute: false,
    });
    expect(url).toBe("/replay?z=abc123&mode=auto&ui=engine&step=9");
  });

  it("returns absolute URL in browser env", () => {
    import.meta.env.BASE_URL = "/sub/";
    const url = buildReplayShareUrl({
      data: { key: "z", value: "test123" },
      step: 9,
      absolute: true,
    });
    expect(url).toContain("/sub/replay?z=test123&step=9");
  });

  it("normalizes non-integer step values to integer", () => {
    import.meta.env.BASE_URL = "/";
    const url = buildReplayShareUrl({
      data: { key: "z", value: "abc123" },
      mode: "auto",
      step: 7.9,
      absolute: false,
    });
    expect(url).toBe("/replay?z=abc123&mode=auto&step=7");
  });

  it("omits invalid step values outside replay range", () => {
    import.meta.env.BASE_URL = "/";

    const tooLarge = buildReplayShareUrl({
      data: { key: "z", value: "abc123" },
      step: 99,
      absolute: false,
    });
    expect(tooLarge).toBe("/replay?z=abc123");

    const negative = buildReplayShareUrl({
      data: { key: "z", value: "abc123" },
      step: -1,
      absolute: false,
    });
    expect(negative).toBe("/replay?z=abc123");
  });
});
