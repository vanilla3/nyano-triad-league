import { describe, it, expect, afterEach, vi } from "vitest";
import { isDebugMode } from "../debug";

/* ═══════════════════════════════════════════════════════════════════
   isDebugMode — URL ?debug=1 detection
   ═══════════════════════════════════════════════════════════════════ */

describe("isDebugMode", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    // Restore original window
    if (originalWindow === undefined) {
      // @ts-expect-error -- test cleanup
      delete globalThis.window;
    }
  });

  it("returns false when window is undefined (SSR)", () => {
    const saved = globalThis.window;
    // @ts-expect-error -- simulate SSR
    delete globalThis.window;
    expect(isDebugMode()).toBe(false);
    globalThis.window = saved;
  });

  it("returns false when no debug parameter", () => {
    vi.stubGlobal("window", { location: { search: "" } });
    expect(isDebugMode()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("returns true when ?debug=1", () => {
    vi.stubGlobal("window", { location: { search: "?debug=1" } });
    expect(isDebugMode()).toBe(true);
    vi.unstubAllGlobals();
  });

  it("returns false when ?debug=0", () => {
    vi.stubGlobal("window", { location: { search: "?debug=0" } });
    expect(isDebugMode()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("returns false when ?debug=true (only '1' activates)", () => {
    vi.stubGlobal("window", { location: { search: "?debug=true" } });
    expect(isDebugMode()).toBe(false);
    vi.unstubAllGlobals();
  });
});
