/* ═══════════════════════════════════════════════════════════════════════════
   TELEMETRY — Minimal UX Measurement (NIN-UX-003)

   Privacy-first: localStorage only, no network calls.
   Tracks the "Nintendo UX" quality metrics:
   - first_interaction_ms: Time to first user interaction
   - first_place_ms: Time to first card placement
   - first_result_ms: Time to first result reveal
   - home_lcp_ms: Largest Contentful Paint on Home page
   - invalid_action_count: Number of invalid action attempts
   ═══════════════════════════════════════════════════════════════════════════ */

export interface SessionTelemetry {
  /** ms from page load to first user interaction (click/tap) */
  first_interaction_ms: number | null;
  /** ms from page load to first card placement */
  first_place_ms: number | null;
  /** ms from page load to first result reveal */
  first_result_ms: number | null;
  /** ms from Home quick-play click to first card placement */
  quickplay_to_first_place_ms: number | null;
  /** Count of invalid action attempts in this session */
  invalid_action_count: number;
}

const STORAGE_PREFIX = "nytl.telemetry.";
const UX_SNAPSHOT_HISTORY_KEY = `${STORAGE_PREFIX}ux_snapshot_history_v1`;
const MAX_UX_SNAPSHOT_HISTORY = 20;

// ── Persistence helpers ────────────────────────────────────────────────

function readNumber(key: string): number | null {
  try {
    const v = localStorage.getItem(STORAGE_PREFIX + key);
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeNumber(key: string, value: number): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, String(value));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function removeNumber(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // localStorage unavailable — silently ignore
  }
}

// ── Cumulative stats ───────────────────────────────────────────────────

export interface CumulativeStats {
  sessions: number;
  avg_first_interaction_ms: number | null;
  avg_first_place_ms: number | null;
  avg_first_result_ms: number | null;
  avg_quickplay_to_first_place_ms: number | null;
  avg_home_lcp_ms: number | null;
  total_invalid_actions: number;
}

export type UxTargetStatus = "pass" | "fail" | "insufficient";

export interface UxTargetEvaluation {
  id: "A-1" | "B-1" | "B-4" | "G-3";
  label: string;
  target: string;
  status: UxTargetStatus;
  valueText: string;
}

export interface UxTelemetrySnapshot {
  generatedAtIso: string;
  stats: CumulativeStats;
  checks: UxTargetEvaluation[];
  context?: UxTelemetryContext;
}

export interface UxTelemetryContext {
  route: string;
  viewport: string;
  language: string;
  userAgent: string;
}

function parseFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseStatus(value: unknown): UxTargetStatus | null {
  if (value === "pass" || value === "fail" || value === "insufficient") return value;
  return null;
}

function parseSnapshotContext(value: unknown): UxTelemetryContext | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "object") return undefined;
  const v = value as Partial<UxTelemetryContext>;
  if (
    typeof v.route !== "string" ||
    typeof v.viewport !== "string" ||
    typeof v.language !== "string" ||
    typeof v.userAgent !== "string"
  ) {
    return undefined;
  }
  return {
    route: v.route,
    viewport: v.viewport,
    language: v.language,
    userAgent: v.userAgent,
  };
}

function parseSnapshotStats(value: unknown): CumulativeStats | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const sessions = parseFiniteNumber(v.sessions);
  const totalInvalidActions = parseFiniteNumber(v.total_invalid_actions);
  if (sessions === null || totalInvalidActions === null) return null;
  return {
    sessions,
    avg_first_interaction_ms: parseFiniteNumber(v.avg_first_interaction_ms),
    avg_first_place_ms: parseFiniteNumber(v.avg_first_place_ms),
    avg_first_result_ms: parseFiniteNumber(v.avg_first_result_ms),
    avg_quickplay_to_first_place_ms: parseFiniteNumber(v.avg_quickplay_to_first_place_ms),
    avg_home_lcp_ms: parseFiniteNumber(v.avg_home_lcp_ms),
    total_invalid_actions: totalInvalidActions,
  };
}

function parseSnapshotChecks(value: unknown): UxTargetEvaluation[] | null {
  if (!Array.isArray(value)) return null;
  const checks: UxTargetEvaluation[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const v = item as Record<string, unknown>;
    const status = parseStatus(v.status);
    if (status === null) return null;
    const id = v.id;
    if (id !== "A-1" && id !== "B-1" && id !== "B-4" && id !== "G-3") return null;
    if (
      typeof v.label !== "string" ||
      typeof v.target !== "string" ||
      typeof v.valueText !== "string"
    ) {
      return null;
    }
    checks.push({
      id,
      label: v.label,
      target: v.target,
      status,
      valueText: v.valueText,
    });
  }
  return checks;
}

function parseSnapshot(value: unknown): UxTelemetrySnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.generatedAtIso !== "string") return null;
  const stats = parseSnapshotStats(v.stats);
  const checks = parseSnapshotChecks(v.checks);
  if (stats === null || checks === null) return null;
  return {
    generatedAtIso: v.generatedAtIso,
    stats,
    checks,
    context: parseSnapshotContext(v.context),
  };
}

function readStoredSnapshotHistory(): UxTelemetrySnapshot[] {
  try {
    const raw = localStorage.getItem(UX_SNAPSHOT_HISTORY_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const history: UxTelemetrySnapshot[] = [];
    for (const item of parsed) {
      const snapshot = parseSnapshot(item);
      if (snapshot !== null) history.push(snapshot);
    }
    return history;
  } catch {
    return [];
  }
}

function writeStoredSnapshotHistory(history: UxTelemetrySnapshot[]): void {
  try {
    localStorage.setItem(UX_SNAPSHOT_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // localStorage unavailable/full
  }
}

const CUMULATIVE_KEYS = [
  "cum.sessions",
  "cum.sum_first_interaction_ms",
  "cum.sum_first_place_ms",
  "cum.sum_first_result_ms",
  "cum.sum_quickplay_to_first_place_ms",
  "cum.sum_home_lcp_ms",
  "cum.count_first_interaction",
  "cum.count_first_place",
  "cum.count_first_result",
  "cum.count_quickplay_to_first_place",
  "cum.count_home_lcp",
  "cum.total_invalid_actions",
] as const;

export function readCumulativeStats(): CumulativeStats {
  const sessions = readNumber("cum.sessions") ?? 0;
  const sumInteraction = readNumber("cum.sum_first_interaction_ms");
  const sumPlace = readNumber("cum.sum_first_place_ms");
  const sumResult = readNumber("cum.sum_first_result_ms");
  const sumQuickPlayToFirstPlace = readNumber("cum.sum_quickplay_to_first_place_ms");
  const sumHomeLcp = readNumber("cum.sum_home_lcp_ms");
  const countInteraction = readNumber("cum.count_first_interaction") ?? 0;
  const countPlace = readNumber("cum.count_first_place") ?? 0;
  const countResult = readNumber("cum.count_first_result") ?? 0;
  const countQuickPlayToFirstPlace = readNumber("cum.count_quickplay_to_first_place") ?? 0;
  const countHomeLcp = readNumber("cum.count_home_lcp") ?? 0;
  const totalInvalid = readNumber("cum.total_invalid_actions") ?? 0;

  return {
    sessions,
    avg_first_interaction_ms:
      countInteraction > 0 && sumInteraction !== null
        ? Math.round(sumInteraction / countInteraction)
        : null,
    avg_first_place_ms:
      countPlace > 0 && sumPlace !== null ? Math.round(sumPlace / countPlace) : null,
    avg_first_result_ms:
      countResult > 0 && sumResult !== null ? Math.round(sumResult / countResult) : null,
    avg_quickplay_to_first_place_ms:
      countQuickPlayToFirstPlace > 0 && sumQuickPlayToFirstPlace !== null
        ? Math.round(sumQuickPlayToFirstPlace / countQuickPlayToFirstPlace)
        : null,
    avg_home_lcp_ms:
      countHomeLcp > 0 && sumHomeLcp !== null ? Math.round(sumHomeLcp / countHomeLcp) : null,
    total_invalid_actions: totalInvalid,
  };
}

export function clearCumulativeStats(): void {
  for (const key of CUMULATIVE_KEYS) {
    removeNumber(key);
  }
}

/**
 * Record Home page LCP in milliseconds (local cumulative average only).
 */
export function recordHomeLcpMs(lcpMs: number): void {
  if (!Number.isFinite(lcpMs) || lcpMs < 0) return;
  const rounded = Math.round(lcpMs);
  const sum = (readNumber("cum.sum_home_lcp_ms") ?? 0) + rounded;
  const count = (readNumber("cum.count_home_lcp") ?? 0) + 1;
  writeNumber("cum.sum_home_lcp_ms", sum);
  writeNumber("cum.count_home_lcp", count);
}

function formatSeconds(ms: number | null): string {
  if (ms === null) return "--";
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Evaluate current telemetry against key UX scorecard targets.
 */
export function evaluateUxTargets(stats: CumulativeStats): UxTargetEvaluation[] {
  const avgInvalidPerSession = stats.sessions > 0
    ? stats.total_invalid_actions / stats.sessions
    : null;

  const checks: UxTargetEvaluation[] = [
    {
      id: "A-1",
      label: "初見が30秒以内に1手目",
      target: "< 30.0s",
      status:
        stats.avg_first_place_ms === null
          ? "insufficient"
          : (stats.avg_first_place_ms < 30_000 ? "pass" : "fail"),
      valueText: formatSeconds(stats.avg_first_place_ms),
    },
    {
      id: "B-1",
      label: "Home→試合開始 10秒以内",
      target: "< 10.0s",
      status:
        stats.avg_quickplay_to_first_place_ms === null
          ? "insufficient"
          : (stats.avg_quickplay_to_first_place_ms < 10_000 ? "pass" : "fail"),
      valueText: formatSeconds(stats.avg_quickplay_to_first_place_ms),
    },
    {
      id: "B-4",
      label: "誤操作が2回未満/試合",
      target: "< 2.00",
      status:
        avgInvalidPerSession === null
          ? "insufficient"
          : (avgInvalidPerSession < 2 ? "pass" : "fail"),
      valueText: avgInvalidPerSession === null ? "--" : avgInvalidPerSession.toFixed(2),
    },
    {
      id: "G-3",
      label: "Home LCP 2.5秒未満",
      target: "< 2.5s",
      status:
        stats.avg_home_lcp_ms === null
          ? "insufficient"
          : (stats.avg_home_lcp_ms < 2_500 ? "pass" : "fail"),
      valueText: formatSeconds(stats.avg_home_lcp_ms),
    },
  ];

  return checks;
}

export function buildUxTelemetrySnapshot(
  stats: CumulativeStats,
  nowMs: number = Date.now(),
  context?: UxTelemetryContext,
): UxTelemetrySnapshot {
  return {
    generatedAtIso: new Date(nowMs).toISOString(),
    stats,
    checks: evaluateUxTargets(stats),
    context,
  };
}

function statusText(status: UxTargetStatus): string {
  if (status === "pass") return "PASS";
  if (status === "fail") return "FAIL";
  return "N/A";
}

/**
 * Format snapshot as markdown for docs/ux/PLAYTEST_LOG.md paste.
 */
export function formatUxTelemetrySnapshotMarkdown(snapshot: UxTelemetrySnapshot): string {
  const { stats, checks } = snapshot;
  const avgInvalidPerSession = stats.sessions > 0
    ? (stats.total_invalid_actions / stats.sessions).toFixed(2)
    : "--";
  const contextLines = snapshot.context
    ? [
      `- Route: ${snapshot.context.route}`,
      `- Viewport: ${snapshot.context.viewport}`,
      `- Language: ${snapshot.context.language}`,
      `- User agent: ${snapshot.context.userAgent}`,
      "",
    ]
    : [];

  const lines = [
    `## ${snapshot.generatedAtIso} — Local UX snapshot`,
    "",
    ...contextLines,
    `- Sessions: ${stats.sessions}`,
    `- Avg first interaction: ${formatSeconds(stats.avg_first_interaction_ms)}`,
    `- Avg first place: ${formatSeconds(stats.avg_first_place_ms)}`,
    `- Avg first result reveal: ${formatSeconds(stats.avg_first_result_ms)}`,
    `- Avg quick-play to first place: ${formatSeconds(stats.avg_quickplay_to_first_place_ms)}`,
    `- Avg Home LCP: ${formatSeconds(stats.avg_home_lcp_ms)}`,
    `- Invalid / session: ${avgInvalidPerSession}`,
    "",
    "| Target | Status | Current | Goal |",
    "|---|---|---|---|",
    ...checks.map((c) => `| ${c.id} ${c.label} | ${statusText(c.status)} | ${c.valueText} | ${c.target} |`),
    "",
  ];

  return lines.join("\n");
}

/**
 * Save a UX snapshot into local history (newest retained, fixed-size ring).
 */
export function saveUxTelemetrySnapshot(snapshot: UxTelemetrySnapshot): void {
  const history = readStoredSnapshotHistory();
  history.push(snapshot);
  const clipped = history.slice(-MAX_UX_SNAPSHOT_HISTORY);
  writeStoredSnapshotHistory(clipped);
}

/**
 * Read recent UX snapshots from local history (newest first).
 */
export function readUxTelemetrySnapshotHistory(limit: number = MAX_UX_SNAPSHOT_HISTORY): UxTelemetrySnapshot[] {
  const max = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : MAX_UX_SNAPSHOT_HISTORY;
  const history = readStoredSnapshotHistory();
  return history.slice(-max).reverse();
}

export function clearUxTelemetrySnapshotHistory(): void {
  try {
    localStorage.removeItem(UX_SNAPSHOT_HISTORY_KEY);
  } catch {
    // localStorage unavailable
  }
}

function persistSession(session: SessionTelemetry): void {
  const sessions = (readNumber("cum.sessions") ?? 0) + 1;
  writeNumber("cum.sessions", sessions);

  if (session.first_interaction_ms !== null) {
    const sum = (readNumber("cum.sum_first_interaction_ms") ?? 0) + session.first_interaction_ms;
    const count = (readNumber("cum.count_first_interaction") ?? 0) + 1;
    writeNumber("cum.sum_first_interaction_ms", sum);
    writeNumber("cum.count_first_interaction", count);
  }

  if (session.first_place_ms !== null) {
    const sum = (readNumber("cum.sum_first_place_ms") ?? 0) + session.first_place_ms;
    const count = (readNumber("cum.count_first_place") ?? 0) + 1;
    writeNumber("cum.sum_first_place_ms", sum);
    writeNumber("cum.count_first_place", count);
  }

  if (session.first_result_ms !== null) {
    const sum = (readNumber("cum.sum_first_result_ms") ?? 0) + session.first_result_ms;
    const count = (readNumber("cum.count_first_result") ?? 0) + 1;
    writeNumber("cum.sum_first_result_ms", sum);
    writeNumber("cum.count_first_result", count);
  }

  if (session.quickplay_to_first_place_ms !== null) {
    const sum =
      (readNumber("cum.sum_quickplay_to_first_place_ms") ?? 0) +
      session.quickplay_to_first_place_ms;
    const count = (readNumber("cum.count_quickplay_to_first_place") ?? 0) + 1;
    writeNumber("cum.sum_quickplay_to_first_place_ms", sum);
    writeNumber("cum.count_quickplay_to_first_place", count);
  }

  const totalInvalid =
    (readNumber("cum.total_invalid_actions") ?? 0) + session.invalid_action_count;
  writeNumber("cum.total_invalid_actions", totalInvalid);
}

// ── Cross-page quick play marker (Home -> Match) ──────────────────────

const QUICKPLAY_START_KEY = `${STORAGE_PREFIX}ephemeral.quickplay_start_epoch_ms`;
const MAX_QUICKPLAY_TO_FIRST_PLACE_MS = 10 * 60 * 1000;

function getTransientStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> | null {
  try {
    if (typeof sessionStorage !== "undefined") return sessionStorage;
  } catch {
    // ignore
  }
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Called from Home quick-play CTA to mark "start match flow".
 * Stored only locally (sessionStorage preferred).
 */
export function markQuickPlayStart(epochMs: number = Date.now()): void {
  const storage = getTransientStorage();
  if (!storage || !Number.isFinite(epochMs)) return;
  try {
    storage.setItem(QUICKPLAY_START_KEY, String(Math.round(epochMs)));
  } catch {
    // storage unavailable/full
  }
}

function consumeQuickPlayStart(): number | null {
  const storage = getTransientStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(QUICKPLAY_START_KEY);
    storage.removeItem(QUICKPLAY_START_KEY);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

// ── Session tracker ────────────────────────────────────────────────────

export interface TelemetryTracker {
  /** Call on first user interaction (click/tap anywhere) */
  recordInteraction: () => void;
  /** Call when a card is successfully placed */
  recordPlace: () => void;
  /** Call when result UI becomes visible */
  recordResult: () => void;
  /** Call when an invalid action is attempted */
  recordInvalidAction: () => void;
  /** Get current session data */
  getSession: () => SessionTelemetry;
  /** Flush session to cumulative stats (call on unmount / game end) */
  flush: () => void;
}

export function createTelemetryTracker(): TelemetryTracker {
  const startTime = performance.now();
  let flushed = false;

  const session: SessionTelemetry = {
    first_interaction_ms: null,
    first_place_ms: null,
    first_result_ms: null,
    quickplay_to_first_place_ms: null,
    invalid_action_count: 0,
  };

  return {
    recordInteraction() {
      if (session.first_interaction_ms === null) {
        session.first_interaction_ms = Math.round(performance.now() - startTime);
      }
    },

    recordPlace() {
      // Also counts as an interaction
      if (session.first_interaction_ms === null) {
        session.first_interaction_ms = Math.round(performance.now() - startTime);
      }
      if (session.first_place_ms === null) {
        session.first_place_ms = Math.round(performance.now() - startTime);
        const quickPlayStartedAt = consumeQuickPlayStart();
        if (quickPlayStartedAt !== null) {
          const elapsed = Date.now() - quickPlayStartedAt;
          if (
            Number.isFinite(elapsed) &&
            elapsed >= 0 &&
            elapsed <= MAX_QUICKPLAY_TO_FIRST_PLACE_MS
          ) {
            session.quickplay_to_first_place_ms = Math.round(elapsed);
          }
        }
      }
    },

    recordResult() {
      if (session.first_result_ms === null) {
        session.first_result_ms = Math.round(performance.now() - startTime);
      }
    },

    recordInvalidAction() {
      session.invalid_action_count += 1;
    },

    getSession() {
      return { ...session };
    },

    flush() {
      if (flushed) return;
      flushed = true;
      persistSession(session);

      if (import.meta.env.DEV && typeof console !== "undefined" && console.debug) {
        console.debug("[nytl-telemetry] session:", session);
      }
    },
  };
}
