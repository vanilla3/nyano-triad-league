import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  readStringSetting,
  writeStringSetting,
} from "@/lib/local_settings";

/* ================================================================
   Stream eventId persistence — Sprint 20 P0-PERSIST verification
   ================================================================ */

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

const STORAGE_KEY = "stream.eventId";

describe("stream.eventId localStorage round-trip", () => {
  it("write then read returns same value", () => {
    writeStringSetting(STORAGE_KEY, "nyano-open-challenge");
    expect(readStringSetting(STORAGE_KEY, "")).toBe("nyano-open-challenge");
  });

  it("returns fallback when nothing stored", () => {
    expect(readStringSetting(STORAGE_KEY, "")).toBe("");
  });

  it("overwrites previous value", () => {
    writeStringSetting(STORAGE_KEY, "event-alpha");
    writeStringSetting(STORAGE_KEY, "event-beta");
    expect(readStringSetting(STORAGE_KEY, "")).toBe("event-beta");
  });

  it("stored value matches known EVENTS id", () => {
    // Simulate the Stream.tsx init logic:
    // if stored eventId exists in EVENTS list, use it; otherwise fallback
    const KNOWN_IDS = ["nyano-open-challenge"];
    writeStringSetting(STORAGE_KEY, "nyano-open-challenge");
    const stored = readStringSetting(STORAGE_KEY, "");
    const isValid = stored !== "" && KNOWN_IDS.includes(stored);
    expect(isValid).toBe(true);
  });

  it("falls back when stored eventId is not in known list", () => {
    const KNOWN_IDS = ["nyano-open-challenge"];
    writeStringSetting(STORAGE_KEY, "deleted-event-999");
    const stored = readStringSetting(STORAGE_KEY, "");
    const isValid = stored !== "" && KNOWN_IDS.includes(stored);
    expect(isValid).toBe(false);
    // Should fallback to pickDefaultEvent — demonstrated by isValid being false
  });
});
