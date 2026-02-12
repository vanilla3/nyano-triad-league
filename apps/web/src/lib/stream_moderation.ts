/**
 * stream_moderation.ts
 *
 * Pure-function moderation helpers for /stream vote intake.
 * Handles:
 * - banned user checks
 * - blocked word checks
 * - per-user slow mode checks
 */

export interface StreamModerationConfig {
  slowModeSeconds: number;
  bannedUsers: string[];
  blockedWords: string[];
}

export type SlowModeCheckResult =
  | { ok: true }
  | { ok: false; waitMs: number };

export function normalizeModerationUser(input: string): string {
  return input.trim().toLowerCase();
}

export function parseModerationListText(input: string): string[] {
  if (!input.trim()) return [];
  const tokens = input
    .split(/[\n,]/g)
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x.length > 0);
  return Array.from(new Set(tokens));
}

export function buildStreamModerationConfig(input: {
  slowModeSeconds: number;
  bannedUsersText: string;
  blockedWordsText: string;
}): StreamModerationConfig {
  const sec = Number.isFinite(input.slowModeSeconds)
    ? Math.max(0, Math.min(120, Math.floor(input.slowModeSeconds)))
    : 0;
  return {
    slowModeSeconds: sec,
    bannedUsers: parseModerationListText(input.bannedUsersText),
    blockedWords: parseModerationListText(input.blockedWordsText),
  };
}

export function isUserBanned(userName: string, config: StreamModerationConfig): boolean {
  const key = normalizeModerationUser(userName);
  if (!key) return false;
  return config.bannedUsers.includes(key);
}

export function findBlockedWord(text: string, config: StreamModerationConfig): string | null {
  if (!text.trim() || config.blockedWords.length === 0) return null;
  const lower = text.toLowerCase();
  for (const word of config.blockedWords) {
    if (word.length > 0 && lower.includes(word)) return word;
  }
  return null;
}

export function checkSlowMode(
  userName: string,
  nowMs: number,
  lastAcceptedAtMap: Map<string, number>,
  slowModeSeconds: number,
): SlowModeCheckResult {
  const sec = Math.max(0, Math.floor(slowModeSeconds));
  if (sec <= 0) return { ok: true };
  const key = normalizeModerationUser(userName);
  if (!key) return { ok: true };
  const last = lastAcceptedAtMap.get(key);
  const limitMs = sec * 1000;
  if (last !== undefined && nowMs - last < limitMs) {
    return { ok: false, waitMs: limitMs - (nowMs - last) };
  }
  return { ok: true };
}

export function recordSlowModeAcceptedVote(
  userName: string,
  nowMs: number,
  lastAcceptedAtMap: Map<string, number>,
): void {
  const key = normalizeModerationUser(userName);
  if (!key) return;
  lastAcceptedAtMap.set(key, nowMs);
}
