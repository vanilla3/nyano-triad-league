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
// Anti-spam settings
// ---------------------------------------------------------------------------

/** Read the anti-spam per-user rate limit in ms (default 2000). */
export function readAntiSpamRateLimitMs(): number {
  return readNumberSetting("stream.antiSpam.rateLimitMs", 2000, 500, 30000);
}

/** Write the anti-spam per-user rate limit in ms. */
export function writeAntiSpamRateLimitMs(ms: number): void {
  writeNumberSetting("stream.antiSpam.rateLimitMs", ms);
}

/** Read the max vote changes per user per round (0=unlimited, default 0). */
export function readAntiSpamMaxVoteChanges(): number {
  return readNumberSetting("stream.antiSpam.maxVoteChanges", 0, 0, 100);
}

/** Write the max vote changes per user per round. */
export function writeAntiSpamMaxVoteChanges(n: number): void {
  writeNumberSetting("stream.antiSpam.maxVoteChanges", n);
}

// ---------------------------------------------------------------------------
// Stream moderation settings
// ---------------------------------------------------------------------------

/** Read stream slow mode seconds (0=off, default 0). */
export function readStreamSlowModeSeconds(): number {
  return readNumberSetting("stream.moderation.slowModeSeconds", 0, 0, 120);
}

/** Write stream slow mode seconds. */
export function writeStreamSlowModeSeconds(seconds: number): void {
  writeNumberSetting("stream.moderation.slowModeSeconds", seconds);
}

/** Read stream banned-user list text (comma/newline delimited). */
export function readStreamBannedUsersText(): string {
  return readStringSetting("stream.moderation.bannedUsers", "");
}

/** Write stream banned-user list text (comma/newline delimited). */
export function writeStreamBannedUsersText(value: string): void {
  writeStringSetting("stream.moderation.bannedUsers", value);
}

/** Read stream blocked-word list text (comma/newline delimited). */
export function readStreamBlockedWordsText(): string {
  return readStringSetting("stream.moderation.blockedWords", "");
}

/** Write stream blocked-word list text (comma/newline delimited). */
export function writeStreamBlockedWordsText(value: string): void {
  writeStringSetting("stream.moderation.blockedWords", value);
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

// ---------------------------------------------------------------------------
// VFX Quality (P2-VFX-001)
// ---------------------------------------------------------------------------

export type VfxPreference = "auto" | "off" | "low" | "medium" | "high";

const VFX_KEY = "nytl.vfx.quality";
const VALID_VFX: Set<string> = new Set(["auto", "off", "low", "medium", "high"]);

/** Read VFX quality preference (defaults to "auto" → device detection). */
export function readVfxQuality(fallback: VfxPreference = "auto"): VfxPreference {
  const v = readStringSetting(VFX_KEY, fallback);
  return VALID_VFX.has(v) ? (v as VfxPreference) : fallback;
}

/** Write VFX quality preference. */
export function writeVfxQuality(pref: VfxPreference): void {
  writeStringSetting(VFX_KEY, pref);
}
