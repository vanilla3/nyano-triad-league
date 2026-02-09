import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTelemetryTracker, readCumulativeStats } from "../telemetry";

// ── Mock localStorage for node test environment ────────────────────────
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  get length() { return store.size; },
  key: (index: number) => Array.from(store.keys())[index] ?? null,
};

describe("telemetry", () => {
  beforeEach(() => {
    store.clear();
    globalThis.localStorage = mockLocalStorage as unknown as Storage;
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records first interaction time", () => {
    const tracker = createTelemetryTracker();
    expect(tracker.getSession().first_interaction_ms).toBeNull();

    vi.spyOn(performance, "now").mockReturnValue(1500);
    tracker.recordInteraction();

    expect(tracker.getSession().first_interaction_ms).toBe(1500);
  });

  it("records first interaction only once", () => {
    const tracker = createTelemetryTracker();

    vi.spyOn(performance, "now").mockReturnValue(1000);
    tracker.recordInteraction();

    vi.spyOn(performance, "now").mockReturnValue(5000);
    tracker.recordInteraction();

    expect(tracker.getSession().first_interaction_ms).toBe(1000);
  });

  it("records first place time", () => {
    const tracker = createTelemetryTracker();
    expect(tracker.getSession().first_place_ms).toBeNull();

    vi.spyOn(performance, "now").mockReturnValue(8000);
    tracker.recordPlace();

    expect(tracker.getSession().first_place_ms).toBe(8000);
  });

  it("recordPlace also sets first interaction", () => {
    const tracker = createTelemetryTracker();

    vi.spyOn(performance, "now").mockReturnValue(3000);
    tracker.recordPlace();

    expect(tracker.getSession().first_interaction_ms).toBe(3000);
    expect(tracker.getSession().first_place_ms).toBe(3000);
  });

  it("counts invalid actions", () => {
    const tracker = createTelemetryTracker();
    expect(tracker.getSession().invalid_action_count).toBe(0);

    tracker.recordInvalidAction();
    tracker.recordInvalidAction();
    tracker.recordInvalidAction();

    expect(tracker.getSession().invalid_action_count).toBe(3);
  });

  it("flushes session to cumulative stats", () => {
    const tracker = createTelemetryTracker();

    vi.spyOn(performance, "now").mockReturnValue(2000);
    tracker.recordInteraction();

    vi.spyOn(performance, "now").mockReturnValue(5000);
    tracker.recordPlace();

    tracker.recordInvalidAction();
    tracker.recordInvalidAction();

    tracker.flush();

    const stats = readCumulativeStats();
    expect(stats.sessions).toBe(1);
    expect(stats.avg_first_interaction_ms).toBe(2000);
    expect(stats.avg_first_place_ms).toBe(5000);
    expect(stats.total_invalid_actions).toBe(2);
  });

  it("flush is idempotent", () => {
    const tracker = createTelemetryTracker();

    vi.spyOn(performance, "now").mockReturnValue(1000);
    tracker.recordPlace();

    tracker.flush();
    tracker.flush();
    tracker.flush();

    const stats = readCumulativeStats();
    expect(stats.sessions).toBe(1); // not 3
  });

  it("accumulates across sessions", () => {
    // Session 1
    const t1 = createTelemetryTracker();
    vi.spyOn(performance, "now").mockReturnValue(2000);
    t1.recordInteraction();
    vi.spyOn(performance, "now").mockReturnValue(6000);
    t1.recordPlace();
    t1.recordInvalidAction();
    t1.flush();

    // Session 2
    vi.spyOn(performance, "now").mockReturnValue(0);
    const t2 = createTelemetryTracker();
    vi.spyOn(performance, "now").mockReturnValue(4000);
    t2.recordInteraction();
    vi.spyOn(performance, "now").mockReturnValue(10000);
    t2.recordPlace();
    t2.recordInvalidAction();
    t2.recordInvalidAction();
    t2.flush();

    const stats = readCumulativeStats();
    expect(stats.sessions).toBe(2);
    expect(stats.avg_first_interaction_ms).toBe(3000); // (2000+4000)/2
    expect(stats.avg_first_place_ms).toBe(8000); // (6000+10000)/2
    expect(stats.total_invalid_actions).toBe(3); // 1+2
  });

  it("returns safe defaults when nothing stored", () => {
    const stats = readCumulativeStats();
    expect(stats.sessions).toBe(0);
    expect(stats.avg_first_interaction_ms).toBeNull();
    expect(stats.avg_first_place_ms).toBeNull();
    expect(stats.total_invalid_actions).toBe(0);
  });

  it("getSession returns a copy", () => {
    const tracker = createTelemetryTracker();
    const s1 = tracker.getSession();
    tracker.recordInvalidAction();
    const s2 = tracker.getSession();

    expect(s1.invalid_action_count).toBe(0);
    expect(s2.invalid_action_count).toBe(1);
  });
});
