/**
 * anti_spam.ts
 *
 * Pure-function anti-spam logic for stream voting.
 * Extracted from Stream.tsx for testability and configurability.
 *
 * Handles:
 * - Per-user rate limiting (configurable cooldown)
 * - Username validation (length, character pattern)
 * - Vote change limits per round
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AntiSpamConfig {
  /** Per-user cooldown in ms. Default: 2000. */
  rateLimitMs: number;
  /** Max vote changes per user per round. 0 = unlimited. Default: 0. */
  maxVoteChangesPerRound: number;
  /** Minimum username length (after trim). Default: 1. */
  minUserNameLength: number;
  /** Maximum username length (after trim). Default: 50. */
  maxUserNameLength: number;
  /** Regex pattern for allowed username characters. Default: /^[\w-]+$/ */
  userNamePattern: RegExp;
}

export type AntiSpamCheckResult =
  | { ok: true }
  | { ok: false; reason: "rate_limited"; waitMs: number }
  | { ok: false; reason: "max_changes_exceeded"; limit: number }
  | { ok: false; reason: "invalid_username"; detail: string };

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_ANTI_SPAM_CONFIG: AntiSpamConfig = {
  rateLimitMs: 2000,
  maxVoteChangesPerRound: 0, // 0 = unlimited
  minUserNameLength: 1,
  maxUserNameLength: 50,
  userNamePattern: /^[\w-]+$/,
};

// ---------------------------------------------------------------------------
// Validation functions
// ---------------------------------------------------------------------------

/**
 * Validate a username against the anti-spam config.
 * Returns ok:true if the username is acceptable, or an error with reason.
 */
export function validateUsername(
  name: string,
  config: AntiSpamConfig = DEFAULT_ANTI_SPAM_CONFIG,
): AntiSpamCheckResult {
  const trimmed = name.trim();

  if (trimmed.length < config.minUserNameLength) {
    return {
      ok: false,
      reason: "invalid_username",
      detail: `too_short (min ${config.minUserNameLength})`,
    };
  }

  if (trimmed.length > config.maxUserNameLength) {
    return {
      ok: false,
      reason: "invalid_username",
      detail: `too_long (max ${config.maxUserNameLength})`,
    };
  }

  if (!config.userNamePattern.test(trimmed)) {
    return {
      ok: false,
      reason: "invalid_username",
      detail: "invalid_chars",
    };
  }

  return { ok: true };
}

/**
 * Check per-user rate limit.
 * The caller is responsible for recording the timestamp after a successful vote.
 *
 * @param userName - trimmed username
 * @param nowMs - current timestamp in ms
 * @param rateLimitMap - mutable map of username → last vote timestamp
 * @param config - anti-spam configuration
 */
export function checkRateLimit(
  userName: string,
  nowMs: number,
  rateLimitMap: Map<string, number>,
  config: AntiSpamConfig = DEFAULT_ANTI_SPAM_CONFIG,
): AntiSpamCheckResult {
  const lastVoteAt = rateLimitMap.get(userName);
  if (lastVoteAt !== undefined && nowMs - lastVoteAt < config.rateLimitMs) {
    return {
      ok: false,
      reason: "rate_limited",
      waitMs: config.rateLimitMs - (nowMs - lastVoteAt),
    };
  }
  return { ok: true };
}

/**
 * Check per-user vote change limit within a single round.
 * A "vote change" is counted each time the user votes (including the first vote).
 * The caller is responsible for incrementing the count after a successful vote.
 *
 * @param userName - trimmed username
 * @param voteChangeCountMap - mutable map of username → vote change count this round
 * @param config - anti-spam configuration
 */
export function checkVoteChangeLimit(
  userName: string,
  voteChangeCountMap: Map<string, number>,
  config: AntiSpamConfig = DEFAULT_ANTI_SPAM_CONFIG,
): AntiSpamCheckResult {
  // 0 means unlimited
  if (config.maxVoteChangesPerRound <= 0) {
    return { ok: true };
  }

  const count = voteChangeCountMap.get(userName) ?? 0;
  if (count >= config.maxVoteChangesPerRound) {
    return {
      ok: false,
      reason: "max_changes_exceeded",
      limit: config.maxVoteChangesPerRound,
    };
  }

  return { ok: true };
}
