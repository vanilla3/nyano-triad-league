export const MAX_CHAIN_CAP_PER_TURN = 8;

/**
 * Parse URL/query value for experimental Layer4 chain-cap.
 *
 * - `null` / empty -> disabled (null)
 * - valid integer [0..8] -> parsed value
 * - invalid -> null (safe fallback)
 */
export function parseChainCapPerTurnParam(v: string | null): number | null {
  if (v === null) return null;
  const trimmed = v.trim();
  if (trimmed.length === 0) return null;

  const n = Number(trimmed);
  if (!Number.isInteger(n)) return null;
  if (n < 0 || n > MAX_CHAIN_CAP_PER_TURN) return null;
  return n;
}

