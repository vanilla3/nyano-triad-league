import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  computeSyncStatus,
  computeConnectionHealth,
  type ExternalResult,
} from "../StreamOperationsHUD";
import type { OverlayStateV1 } from "@/lib/streamer_bus";

/* ═══════════════════════════════════════════════════════════════════
   StreamOperationsHUD pure function tests
   ═══════════════════════════════════════════════════════════════════ */

describe("computeSyncStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns all false and null age for undefined input", () => {
    const result = computeSyncStatus(undefined);
    expect(result).toEqual({
      age: null,
      isFresh: false,
      isDelayed: false,
      isStale: false,
    });
  });

  it("returns isFresh for age < 5s", () => {
    const now = Date.now();
    const result = computeSyncStatus(now - 2000); // 2 seconds ago
    expect(result.age).toBe(2);
    expect(result.isFresh).toBe(true);
    expect(result.isDelayed).toBe(false);
    expect(result.isStale).toBe(false);
  });

  it("returns isFresh for age = 0s", () => {
    const now = Date.now();
    const result = computeSyncStatus(now);
    expect(result.age).toBe(0);
    expect(result.isFresh).toBe(true);
    expect(result.isDelayed).toBe(false);
    expect(result.isStale).toBe(false);
  });

  it("returns isDelayed for age 5-9s", () => {
    const now = Date.now();
    const result = computeSyncStatus(now - 7000); // 7 seconds ago
    expect(result.age).toBe(7);
    expect(result.isFresh).toBe(false);
    expect(result.isDelayed).toBe(true);
    expect(result.isStale).toBe(false);
  });

  it("returns isDelayed at boundary (exactly 5s)", () => {
    const now = Date.now();
    const result = computeSyncStatus(now - 5000);
    expect(result.age).toBe(5);
    expect(result.isFresh).toBe(false);
    expect(result.isDelayed).toBe(true);
    expect(result.isStale).toBe(false);
  });

  it("returns isStale for age >= 10s", () => {
    const now = Date.now();
    const result = computeSyncStatus(now - 15000); // 15 seconds ago
    expect(result.age).toBe(15);
    expect(result.isFresh).toBe(false);
    expect(result.isDelayed).toBe(false);
    expect(result.isStale).toBe(true);
  });

  it("returns isStale at boundary (exactly 10s)", () => {
    const now = Date.now();
    const result = computeSyncStatus(now - 10000);
    expect(result.age).toBe(10);
    expect(result.isFresh).toBe(false);
    expect(result.isDelayed).toBe(false);
    expect(result.isStale).toBe(true);
  });
});

describe("computeConnectionHealth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const makeLive = (overrides: Partial<OverlayStateV1> = {}): OverlayStateV1 => ({
    version: 1,
    updatedAtMs: Date.now(),
    mode: "live",
    ...overrides,
  });

  it("returns all disconnected when live is null", () => {
    const result = computeConnectionHealth(null, "", null);
    expect(result).toEqual({
      overlayConnected: false,
      matchConnected: false,
      warudoConfigured: false,
      warudoLastOk: null,
    });
  });

  it("returns all connected when live is fresh + warudo configured + last OK", () => {
    const live = makeLive({ updatedAtMs: Date.now() });
    const lastResult: ExternalResult = {
      kind: "warudo",
      ok: true,
      message: "sent",
      timestampMs: Date.now(),
    };
    const result = computeConnectionHealth(live, "http://localhost:8787", lastResult);
    expect(result.overlayConnected).toBe(true);
    expect(result.matchConnected).toBe(true);
    expect(result.warudoConfigured).toBe(true);
    expect(result.warudoLastOk).toBe(true);
  });

  it("overlayConnected false when stale (>10s)", () => {
    const live = makeLive({ updatedAtMs: Date.now() - 15000 });
    const result = computeConnectionHealth(live, "", null);
    expect(result.overlayConnected).toBe(false);
  });

  it("matchConnected true for replay mode", () => {
    const live = makeLive({ mode: "replay" });
    const result = computeConnectionHealth(live, "", null);
    expect(result.matchConnected).toBe(true);
  });

  it("warudoConfigured false when URL is empty", () => {
    const live = makeLive();
    const result = computeConnectionHealth(live, "", null);
    expect(result.warudoConfigured).toBe(false);
  });

  it("warudoConfigured false when URL is whitespace only", () => {
    const live = makeLive();
    const result = computeConnectionHealth(live, "   ", null);
    expect(result.warudoConfigured).toBe(false);
  });

  it("warudoLastOk null when no warudo result", () => {
    const live = makeLive();
    const result = computeConnectionHealth(live, "http://localhost:8787", null);
    expect(result.warudoLastOk).toBe(null);
  });

  it("warudoLastOk null when last result is not warudo kind", () => {
    const live = makeLive();
    const lastResult: ExternalResult = {
      kind: "rpc",
      ok: true,
      message: "ok",
      timestampMs: Date.now(),
    };
    const result = computeConnectionHealth(live, "http://localhost:8787", lastResult);
    expect(result.warudoLastOk).toBe(null);
  });

  it("warudoLastOk false when warudo result failed", () => {
    const live = makeLive();
    const lastResult: ExternalResult = {
      kind: "warudo",
      ok: false,
      message: "network error",
      timestampMs: Date.now(),
    };
    const result = computeConnectionHealth(live, "http://localhost:8787", lastResult);
    expect(result.warudoLastOk).toBe(false);
  });
});
