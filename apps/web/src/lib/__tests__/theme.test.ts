import { afterEach, describe, expect, it, vi } from "vitest";
import { appendThemeToPath, resolveAppTheme } from "../theme";

describe("resolveAppTheme", () => {
  const storageKey = "nytl.theme";
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
      return store.size;
    },
  };

  afterEach(() => {
    store.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("prefers query theme over storage and normalizes casing", () => {
    vi.stubGlobal("localStorage", mockStorage);
    localStorage.setItem(storageKey, "rpg");
    const params = new URLSearchParams("theme=MiNt");
    expect(resolveAppTheme(params)).toBe("mint");
  });

  it("uses stored theme when query is missing", () => {
    vi.stubGlobal("localStorage", mockStorage);
    localStorage.setItem(storageKey, "RPG");
    const params = new URLSearchParams();
    expect(resolveAppTheme(params)).toBe("rpg");
  });

  it("falls back to mint when storage access fails", () => {
    vi.stubGlobal("localStorage", mockStorage);
    vi.spyOn(mockStorage, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    const params = new URLSearchParams();
    expect(resolveAppTheme(params)).toBe("mint");
  });
});

describe("appendThemeToPath", () => {
  it("adds theme when query string is empty", () => {
    expect(appendThemeToPath("/arena", "mint")).toBe("/arena?theme=mint");
  });

  it("preserves existing query and hash", () => {
    expect(appendThemeToPath("/arena?mode=guest#top", "mint")).toBe(
      "/arena?mode=guest&theme=mint#top",
    );
  });

  it("does not overwrite existing theme", () => {
    expect(appendThemeToPath("/arena?theme=rpg&mode=guest", "mint")).toBe(
      "/arena?theme=rpg&mode=guest",
    );
  });

  it("returns original path when theme is empty", () => {
    expect(appendThemeToPath("/arena?mode=guest#top", "")).toBe("/arena?mode=guest#top");
  });
});
