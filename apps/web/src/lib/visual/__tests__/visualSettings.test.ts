import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { detectVfxQuality, resolveVfxQuality, applyVfxQualityToDocument, type VfxQuality } from "../visualSettings";

/* ═══════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════ */

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  };
}

function stubMatchMedia(reducedMotion: boolean) {
  vi.stubGlobal("window", {
    ...globalThis.window,
    matchMedia: (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" && reducedMotion,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

function stubNavigator(mem: number | undefined, cores: number | undefined) {
  const nav: Record<string, unknown> = {};
  if (mem !== undefined) nav.deviceMemory = mem;
  if (cores !== undefined) nav.hardwareConcurrency = cores;
  vi.stubGlobal("navigator", nav);
}

function stubDocument() {
  const dataset: Record<string, string> = {};
  vi.stubGlobal("document", {
    documentElement: { dataset },
  });
}

/* ═══════════════════════════════════════════════════════════════════
   detectVfxQuality
   ═══════════════════════════════════════════════════════════════════ */

describe("detectVfxQuality", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns 'off' when prefers-reduced-motion is enabled", () => {
    stubMatchMedia(true);
    stubNavigator(16, 16);
    expect(detectVfxQuality()).toBe("off");
  });

  it("returns 'low' when deviceMemory < 4", () => {
    stubMatchMedia(false);
    stubNavigator(2, 8);
    expect(detectVfxQuality()).toBe("low");
  });

  it("returns 'low' when hardwareConcurrency < 4", () => {
    stubMatchMedia(false);
    stubNavigator(8, 2);
    expect(detectVfxQuality()).toBe("low");
  });

  it("returns 'high' when deviceMemory >= 8 and hardwareConcurrency >= 8", () => {
    stubMatchMedia(false);
    stubNavigator(8, 8);
    expect(detectVfxQuality()).toBe("high");
  });

  it("returns 'high' with very strong hardware (32GB, 16 cores)", () => {
    stubMatchMedia(false);
    stubNavigator(32, 16);
    expect(detectVfxQuality()).toBe("high");
  });

  it("returns 'medium' for middle-range device (4GB, 4 cores)", () => {
    stubMatchMedia(false);
    stubNavigator(4, 4);
    expect(detectVfxQuality()).toBe("medium");
  });

  it("returns 'medium' when navigator hints are unavailable", () => {
    stubMatchMedia(false);
    stubNavigator(undefined, undefined);
    expect(detectVfxQuality()).toBe("medium");
  });

  it("returns 'medium' when only one hint is high (8GB, unknown cores)", () => {
    stubMatchMedia(false);
    stubNavigator(8, undefined);
    expect(detectVfxQuality()).toBe("medium");
  });
});

/* ═══════════════════════════════════════════════════════════════════
   resolveVfxQuality
   ═══════════════════════════════════════════════════════════════════ */

describe("resolveVfxQuality", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMockStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns detected quality when preference is 'auto'", () => {
    stubMatchMedia(false);
    stubNavigator(8, 8);
    // Default pref is "auto"
    expect(resolveVfxQuality()).toBe("high");
  });

  it("returns explicit preference when set to 'off'", () => {
    stubMatchMedia(false);
    stubNavigator(8, 8);
    localStorage.setItem("nytl.vfx.quality", "off");
    expect(resolveVfxQuality()).toBe("off");
  });

  it("returns explicit preference when set to 'low'", () => {
    stubMatchMedia(false);
    stubNavigator(8, 8);
    localStorage.setItem("nytl.vfx.quality", "low");
    expect(resolveVfxQuality()).toBe("low");
  });
});

/* ═══════════════════════════════════════════════════════════════════
   applyVfxQualityToDocument
   ═══════════════════════════════════════════════════════════════════ */

describe("applyVfxQualityToDocument", () => {
  beforeEach(() => stubDocument());
  afterEach(() => vi.unstubAllGlobals());

  it("sets data-vfx attribute on documentElement", () => {
    applyVfxQualityToDocument("high");
    expect(document.documentElement.dataset.vfx).toBe("high");
  });

  it("updates when called with different value", () => {
    applyVfxQualityToDocument("medium");
    expect(document.documentElement.dataset.vfx).toBe("medium");

    applyVfxQualityToDocument("off");
    expect(document.documentElement.dataset.vfx).toBe("off");
  });

  it("handles all four quality levels", () => {
    const levels: VfxQuality[] = ["off", "low", "medium", "high"];
    for (const level of levels) {
      applyVfxQualityToDocument(level);
      expect(document.documentElement.dataset.vfx).toBe(level);
    }
  });
});
