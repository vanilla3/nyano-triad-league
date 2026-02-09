import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  readBoolSetting,
  readNumberSetting,
  readStringSetting,
  writeBoolSetting,
  writeNumberSetting,
  writeStringSetting,
} from "../local_settings";

/* ------------------------------------------------------------------ */
/* Mock localStorage                                                   */
/* ------------------------------------------------------------------ */

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

beforeEach(() => {
  vi.stubGlobal("localStorage", createMockStorage());
});

/* ------------------------------------------------------------------ */
/* readBoolSetting                                                     */
/* ------------------------------------------------------------------ */

describe("readBoolSetting", () => {
  it("returns fallback when key is missing", () => {
    expect(readBoolSetting("missing", true)).toBe(true);
    expect(readBoolSetting("missing", false)).toBe(false);
  });

  it("parses truthy values", () => {
    for (const v of ["1", "true", "yes", "on", "TRUE", "Yes", "ON"]) {
      localStorage.setItem("k", v);
      expect(readBoolSetting("k", false)).toBe(true);
    }
  });

  it("parses falsy values", () => {
    for (const v of ["0", "false", "no", "off", "FALSE", "No", "OFF"]) {
      localStorage.setItem("k", v);
      expect(readBoolSetting("k", true)).toBe(false);
    }
  });

  it("returns fallback for unrecognized values", () => {
    localStorage.setItem("k", "maybe");
    expect(readBoolSetting("k", true)).toBe(true);
    expect(readBoolSetting("k", false)).toBe(false);
  });

  it("trims whitespace", () => {
    localStorage.setItem("k", "  true  ");
    expect(readBoolSetting("k", false)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* readNumberSetting                                                   */
/* ------------------------------------------------------------------ */

describe("readNumberSetting", () => {
  it("returns fallback when key is missing", () => {
    expect(readNumberSetting("missing", 42)).toBe(42);
  });

  it("parses valid integers", () => {
    localStorage.setItem("k", "15");
    expect(readNumberSetting("k", 0)).toBe(15);
  });

  it("parses valid floats", () => {
    localStorage.setItem("k", "3.14");
    expect(readNumberSetting("k", 0)).toBeCloseTo(3.14);
  });

  it("clamps to min", () => {
    localStorage.setItem("k", "2");
    expect(readNumberSetting("k", 10, 5)).toBe(5);
  });

  it("clamps to max", () => {
    localStorage.setItem("k", "200");
    expect(readNumberSetting("k", 10, 0, 100)).toBe(100);
  });

  it("returns fallback for NaN", () => {
    localStorage.setItem("k", "abc");
    expect(readNumberSetting("k", 99)).toBe(99);
  });

  it("returns fallback for empty string", () => {
    localStorage.setItem("k", "");
    expect(readNumberSetting("k", 7)).toBe(7);
  });

  it("returns fallback for Infinity", () => {
    localStorage.setItem("k", "Infinity");
    expect(readNumberSetting("k", 0)).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* readStringSetting                                                   */
/* ------------------------------------------------------------------ */

describe("readStringSetting", () => {
  it("returns fallback when key is missing", () => {
    expect(readStringSetting("missing", "default")).toBe("default");
  });

  it("returns stored value", () => {
    localStorage.setItem("k", "hello");
    expect(readStringSetting("k", "default")).toBe("hello");
  });

  it("trims whitespace", () => {
    localStorage.setItem("k", "  viewer  ");
    expect(readStringSetting("k", "default")).toBe("viewer");
  });

  it("returns empty string when stored value is empty", () => {
    localStorage.setItem("k", "");
    expect(readStringSetting("k", "default")).toBe("");
  });
});

/* ------------------------------------------------------------------ */
/* write + read roundtrips                                             */
/* ------------------------------------------------------------------ */

describe("write + read roundtrips", () => {
  it("writeBoolSetting + readBoolSetting roundtrip (true)", () => {
    writeBoolSetting("b", true);
    expect(readBoolSetting("b", false)).toBe(true);
  });

  it("writeBoolSetting + readBoolSetting roundtrip (false)", () => {
    writeBoolSetting("b", false);
    expect(readBoolSetting("b", true)).toBe(false);
  });

  it("writeNumberSetting + readNumberSetting roundtrip", () => {
    writeNumberSetting("n", 42);
    expect(readNumberSetting("n", 0)).toBe(42);
  });

  it("writeStringSetting + readStringSetting roundtrip", () => {
    writeStringSetting("s", "hello world");
    expect(readStringSetting("s", "")).toBe("hello world");
  });
});
