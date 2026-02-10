/**
 * Shared localStorage read/write helpers with type coercion and error handling.
 *
 * All read functions return `fallback` on missing key, parse failure, or storage exceptions.
 * All write functions silently swallow exceptions (quota exceeded, etc.).
 */

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/**
 * Read a boolean setting from localStorage.
 * Accepts "1", "true", "yes", "on" as true; "0", "false", "no", "off" as false.
 */
export function readBoolSetting(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    const s = v.trim().toLowerCase();
    if (s === "1" || s === "true" || s === "yes" || s === "on") return true;
    if (s === "0" || s === "false" || s === "no" || s === "off") return false;
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Read a numeric setting from localStorage with optional min/max clamping.
 */
export function readNumberSetting(
  key: string,
  fallback: number,
  min?: number,
  max?: number,
): number {
  try {
    const v = localStorage.getItem(key);
    if (v === null || v.trim() === "") return fallback;
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    let result = n;
    if (typeof min === "number" && result < min) result = min;
    if (typeof max === "number" && result > max) result = max;
    return result;
  } catch {
    return fallback;
  }
}

/**
 * Read a string setting from localStorage, trimming whitespace.
 */
export function readStringSetting(key: string, fallback: string): string {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v.trim();
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

export function writeBoolSetting(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // ignore (quota exceeded, etc.)
  }
}

export function writeNumberSetting(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

export function writeStringSetting(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Stream-specific shortcuts
// ---------------------------------------------------------------------------

/** Read the stream settings lock state. */
export function readStreamLock(): boolean {
  return readBoolSetting("stream.settingsLocked", false);
}

/** Write the stream settings lock state. */
export function writeStreamLock(locked: boolean): void {
  writeBoolSetting("stream.settingsLocked", locked);
}

/** Read the stream settings lock timestamp (ms since epoch, or 0 if not set). */
export function readStreamLockTimestamp(): number {
  return readNumberSetting("stream.settingsLockedAt", 0);
}

/** Write the stream settings lock timestamp. */
export function writeStreamLockTimestamp(ts: number): void {
  writeNumberSetting("stream.settingsLockedAt", ts);
}

// ---------------------------------------------------------------------------
// UI Density (NIN-UX-041)
// ---------------------------------------------------------------------------

export type UiDensity = "minimal" | "standard" | "full";

const DENSITY_KEY = "nytl.ui.density";
const VALID_DENSITIES: Set<string> = new Set(["minimal", "standard", "full"]);

/** Read UI density preference (defaults to "minimal" for Mint, "full" otherwise). */
export function readUiDensity(fallback: UiDensity = "minimal"): UiDensity {
  const v = readStringSetting(DENSITY_KEY, fallback);
  return VALID_DENSITIES.has(v) ? (v as UiDensity) : fallback;
}

/** Write UI density preference. */
export function writeUiDensity(density: UiDensity): void {
  writeStringSetting(DENSITY_KEY, density);
}
