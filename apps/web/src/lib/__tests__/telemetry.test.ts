import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  buildUxTelemetrySnapshot,
  clearUxTelemetrySnapshotHistory,
  clearCumulativeStats,
  createTelemetryTracker,
  evaluateUxTargets,
  formatUxTelemetrySnapshotMarkdown,
  markQuickPlayStart,
  readUxTelemetrySnapshotHistory,
  recordHomeLcpMs,
  readCumulativeStats,
  saveUxTelemetrySnapshot,
} from "../telemetry";

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

const sessionStore = new Map<string, string>();
const mockSessionStorage = {
  getItem: (key: string) => sessionStore.get(key) ?? null,
  setItem: (key: string, value: string) => { sessionStore.set(key, value); },
  removeItem: (key: string) => { sessionStore.delete(key); },
  clear: () => { sessionStore.clear(); },
  get length() { return sessionStore.size; },
  key: (index: number) => Array.from(sessionStore.keys())[index] ?? null,
};

describe("telemetry", () => {
  beforeEach(() => {
    store.clear();
    sessionStore.clear();
    globalThis.localStorage = mockLocalStorage as unknown as Storage;
    globalThis.sessionStorage = mockSessionStorage as unknown as Storage;
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

  it("records first result time", () => {
    const tracker = createTelemetryTracker();
    expect(tracker.getSession().first_result_ms).toBeNull();

    vi.spyOn(performance, "now").mockReturnValue(12000);
    tracker.recordResult();

    expect(tracker.getSession().first_result_ms).toBe(12000);
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
    expect(stats.avg_first_result_ms).toBeNull();
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
    expect(stats.avg_first_result_ms).toBeNull();
    expect(stats.avg_quickplay_to_first_place_ms).toBeNull();
    expect(stats.avg_home_lcp_ms).toBeNull();
    expect(stats.total_invalid_actions).toBe(3); // 1+2
  });

  it("accumulates first result reveal across sessions", () => {
    vi.spyOn(performance, "now").mockReturnValue(0);
    const t1 = createTelemetryTracker();
    vi.spyOn(performance, "now").mockReturnValue(9_000);
    t1.recordResult();
    t1.flush();

    vi.spyOn(performance, "now").mockReturnValue(0);
    const t2 = createTelemetryTracker();
    vi.spyOn(performance, "now").mockReturnValue(15_000);
    t2.recordResult();
    t2.flush();

    const stats = readCumulativeStats();
    expect(stats.sessions).toBe(2);
    expect(stats.avg_first_result_ms).toBe(12_000);
  });

  it("records quick-play to first place from Home marker", () => {
    vi.spyOn(Date, "now").mockReturnValue(10_000);
    markQuickPlayStart();

    const tracker = createTelemetryTracker();
    vi.spyOn(performance, "now").mockReturnValue(2200);
    vi.spyOn(Date, "now").mockReturnValue(17_400);
    tracker.recordPlace();

    expect(tracker.getSession().quickplay_to_first_place_ms).toBe(7400);

    tracker.flush();
    const stats = readCumulativeStats();
    expect(stats.avg_quickplay_to_first_place_ms).toBe(7400);
  });

  it("consumes quick-play marker once", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    markQuickPlayStart();

    const t1 = createTelemetryTracker();
    vi.spyOn(performance, "now").mockReturnValue(1500);
    vi.spyOn(Date, "now").mockReturnValue(3_000);
    t1.recordPlace();
    t1.flush();

    const t2 = createTelemetryTracker();
    vi.spyOn(performance, "now").mockReturnValue(1800);
    vi.spyOn(Date, "now").mockReturnValue(8_000);
    t2.recordPlace();
    t2.flush();

    const stats = readCumulativeStats();
    expect(stats.sessions).toBe(2);
    expect(stats.avg_quickplay_to_first_place_ms).toBe(2000);
  });

  it("ignores stale quick-play markers", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    markQuickPlayStart();

    const tracker = createTelemetryTracker();
    vi.spyOn(performance, "now").mockReturnValue(2500);
    vi.spyOn(Date, "now").mockReturnValue(701_001); // 11m 40s later
    tracker.recordPlace();
    tracker.flush();

    const stats = readCumulativeStats();
    expect(stats.avg_quickplay_to_first_place_ms).toBeNull();
  });

  it("records Home LCP cumulative average", () => {
    recordHomeLcpMs(2400.4);
    recordHomeLcpMs(2600.4);
    const stats = readCumulativeStats();
    expect(stats.avg_home_lcp_ms).toBe(2500);
  });

  it("ignores invalid Home LCP values", () => {
    recordHomeLcpMs(Number.NaN);
    recordHomeLcpMs(-1);
    recordHomeLcpMs(Number.POSITIVE_INFINITY);
    const stats = readCumulativeStats();
    expect(stats.avg_home_lcp_ms).toBeNull();
  });

  it("evaluates ux targets as insufficient without data", () => {
    const checks = evaluateUxTargets(readCumulativeStats());
    const statuses = Object.fromEntries(checks.map((c) => [c.id, c.status]));
    expect(statuses["A-1"]).toBe("insufficient");
    expect(statuses["B-1"]).toBe("insufficient");
    expect(statuses["B-4"]).toBe("insufficient");
    expect(statuses["G-3"]).toBe("insufficient");
  });

  it("evaluates ux targets with mixed pass/fail", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    markQuickPlayStart();

    const tracker = createTelemetryTracker();
    vi.spyOn(performance, "now").mockReturnValue(20_000); // A-1 pass (<30s)
    vi.spyOn(Date, "now").mockReturnValue(13_000); // B-1 fail (12s > 10s)
    tracker.recordPlace();
    tracker.recordInvalidAction();
    tracker.recordInvalidAction(); // B-4 fail (2.00 is not < 2.00)
    tracker.flush();

    recordHomeLcpMs(3000); // G-3 fail (> 2.5s)

    const checks = evaluateUxTargets(readCumulativeStats());
    const statuses = Object.fromEntries(checks.map((c) => [c.id, c.status]));
    expect(statuses["A-1"]).toBe("pass");
    expect(statuses["B-1"]).toBe("fail");
    expect(statuses["B-4"]).toBe("fail");
    expect(statuses["G-3"]).toBe("fail");
  });

  it("builds telemetry snapshot with deterministic timestamp", () => {
    recordHomeLcpMs(2200);
    const snapshot = buildUxTelemetrySnapshot(readCumulativeStats(), 1_700_000_000_000);
    expect(snapshot.generatedAtIso).toBe("2023-11-14T22:13:20.000Z");
    expect(snapshot.checks).toHaveLength(4);
    expect(snapshot.stats.avg_home_lcp_ms).toBe(2200);
    expect(snapshot.context).toBeUndefined();
  });

  it("includes context in telemetry snapshot when provided", () => {
    const snapshot = buildUxTelemetrySnapshot(
      readCumulativeStats(),
      1_700_000_000_000,
      {
        route: "/?mode=guest",
        viewport: "1280x720",
        language: "ja-JP",
        userAgent: "Vitest UA",
      },
    );
    expect(snapshot.context).toEqual({
      route: "/?mode=guest",
      viewport: "1280x720",
      language: "ja-JP",
      userAgent: "Vitest UA",
    });
  });

  it("formats telemetry snapshot markdown for playtest log", () => {
    const stats = {
      sessions: 2,
      avg_first_interaction_ms: 1200,
      avg_first_place_ms: 9000,
      avg_first_result_ms: 21000,
      avg_quickplay_to_first_place_ms: 8500,
      avg_home_lcp_ms: 2100,
      total_invalid_actions: 1,
    };
    const snapshot = buildUxTelemetrySnapshot(stats, 1_700_000_000_000);
    const markdown = formatUxTelemetrySnapshotMarkdown(snapshot);
    expect(markdown).toContain("## 2023-11-14T22:13:20.000Z — Local UX snapshot");
    expect(markdown).toContain("Avg Home LCP: 2.1s");
    expect(markdown).toContain("Avg first result reveal: 21.0s");
    expect(markdown).toContain("| A-1 初見が30秒以内に1手目 | PASS | 9.0s | < 30.0s |");
    expect(markdown).toContain("| B-4 誤操作が2回未満/試合 | PASS | 0.50 | < 2.00 |");
  });

  it("formats context lines when snapshot includes context", () => {
    const snapshot = buildUxTelemetrySnapshot(
      readCumulativeStats(),
      1_700_000_000_000,
      {
        route: "/",
        viewport: "390x844",
        language: "ja-JP",
        userAgent: "Vitest UA",
      },
    );
    const markdown = formatUxTelemetrySnapshotMarkdown(snapshot);
    expect(markdown).toContain("- Route: /");
    expect(markdown).toContain("- Viewport: 390x844");
    expect(markdown).toContain("- Language: ja-JP");
    expect(markdown).toContain("- User agent: Vitest UA");
  });

  it("saves and reads UX snapshot history (newest first)", () => {
    const s1 = buildUxTelemetrySnapshot(readCumulativeStats(), 1_700_000_000_000, {
      route: "/",
      viewport: "1280x720",
      language: "ja-JP",
      userAgent: "UA-1",
    });
    const s2 = buildUxTelemetrySnapshot(readCumulativeStats(), 1_700_000_001_000, {
      route: "/match",
      viewport: "390x844",
      language: "en-US",
      userAgent: "UA-2",
    });

    saveUxTelemetrySnapshot(s1);
    saveUxTelemetrySnapshot(s2);

    const history = readUxTelemetrySnapshotHistory();
    expect(history).toHaveLength(2);
    expect(history[0].generatedAtIso).toBe("2023-11-14T22:13:21.000Z");
    expect(history[1].generatedAtIso).toBe("2023-11-14T22:13:20.000Z");
    expect(history[0].context?.route).toBe("/match");
  });

  it("keeps only latest 20 snapshots", () => {
    for (let i = 0; i < 25; i += 1) {
      saveUxTelemetrySnapshot(
        buildUxTelemetrySnapshot(readCumulativeStats(), 1_700_000_000_000 + i * 1000),
      );
    }
    const history = readUxTelemetrySnapshotHistory();
    expect(history).toHaveLength(20);
    // Newest retained
    expect(history[0].generatedAtIso).toBe("2023-11-14T22:13:44.000Z");
    // Oldest retained after clipping (index 5 from 0..24)
    expect(history[19].generatedAtIso).toBe("2023-11-14T22:13:25.000Z");
  });

  it("ignores invalid stored snapshot history", () => {
    mockLocalStorage.setItem("nytl.telemetry.ux_snapshot_history_v1", "{\"broken\":true}");
    expect(readUxTelemetrySnapshotHistory()).toEqual([]);

    mockLocalStorage.setItem("nytl.telemetry.ux_snapshot_history_v1", "[{\"foo\":\"bar\"}]");
    expect(readUxTelemetrySnapshotHistory()).toEqual([]);
  });

  it("clears UX snapshot history", () => {
    saveUxTelemetrySnapshot(buildUxTelemetrySnapshot(readCumulativeStats(), 1_700_000_000_000));
    expect(readUxTelemetrySnapshotHistory()).toHaveLength(1);
    clearUxTelemetrySnapshotHistory();
    expect(readUxTelemetrySnapshotHistory()).toHaveLength(0);
  });

  it("returns safe defaults when nothing stored", () => {
    const stats = readCumulativeStats();
    expect(stats.sessions).toBe(0);
    expect(stats.avg_first_interaction_ms).toBeNull();
    expect(stats.avg_first_place_ms).toBeNull();
    expect(stats.avg_first_result_ms).toBeNull();
    expect(stats.avg_quickplay_to_first_place_ms).toBeNull();
    expect(stats.avg_home_lcp_ms).toBeNull();
    expect(stats.total_invalid_actions).toBe(0);
  });

  it("clears cumulative stats", () => {
    const tracker = createTelemetryTracker();
    vi.spyOn(performance, "now").mockReturnValue(1000);
    tracker.recordPlace();
    tracker.recordInvalidAction();
    tracker.flush();

    expect(readCumulativeStats().sessions).toBe(1);

    clearCumulativeStats();

    const stats = readCumulativeStats();
    expect(stats.sessions).toBe(0);
    expect(stats.avg_first_interaction_ms).toBeNull();
    expect(stats.avg_first_place_ms).toBeNull();
    expect(stats.avg_first_result_ms).toBeNull();
    expect(stats.avg_quickplay_to_first_place_ms).toBeNull();
    expect(stats.avg_home_lcp_ms).toBeNull();
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
