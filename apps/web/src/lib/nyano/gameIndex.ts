// Nyano Game Index (runtime helper)
//
// The game index is a compact JSON file generated from metadata.
// It enables fast lookups of gameplay parameters (hand/combat/triad) without
// making RPC calls for 10,000 tokens.
//
// IMPORTANT
// - The index is a cache/UX helper.
// - For trustless verification, use the onchain view functions as the source of truth.

export const GAME_INDEX_VERSION = 1 as const;
export const GAME_INDEX_FIELDS = [
  "hand",
  "hp",
  "atk",
  "matk",
  "def",
  "mdef",
  "agi",
  "up",
  "right",
  "left",
  "down",
] as const;

export type GameIndexField = (typeof GAME_INDEX_FIELDS)[number];

export type JankenHand = 0 | 1 | 2;

export type CombatStats = {
  hp: number;
  atk: number;
  matk: number;
  def: number;
  mdef: number;
  agi: number;
};

export type TriadStats = {
  up: number;
  right: number;
  left: number;
  down: number;
};

export type GameIndexV1 = {
  v: 1;
  generatedAt?: string;
  maxTokenId: number;
  fields: string[];
  tokens: Record<string, number[]>;
  missing: number[];
  metadata?: Record<string, any>;
};

export type IndexTokenGameParams = {
  hand: JankenHand;
  combat: CombatStats;
  triad: TriadStats;
};

const STORAGE_KEY = "nyano.gameIndex.v1";

function toIntSafe(v: unknown): number {
  const n = typeof v === "bigint" ? Number(v) : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function isValidHand(n: number): n is JankenHand {
  return n === 0 || n === 1 || n === 2;
}

function safeReadJsonFromStorage(key: string): any | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function safeWriteJsonToStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or similar; silently ignore
  }
}

/**
 * Get gameplay params for a token from the index.
 * Returns null if the token is not present.
 */
export function getFromGameIndex(
  index: GameIndexV1 | null | undefined,
  tokenId: bigint | number | string,
): IndexTokenGameParams | null {
  if (!index || index.v !== 1) return null;
  const idStr = typeof tokenId === "string" ? tokenId : tokenId.toString();
  const arr = index.tokens?.[idStr];
  if (!arr || arr.length < 11) return null;

  const handN = toIntSafe(arr[0]);
  if (!isValidHand(handN)) return null;

  const combat: CombatStats = {
    hp: toIntSafe(arr[1]),
    atk: toIntSafe(arr[2]),
    matk: toIntSafe(arr[3]),
    def: toIntSafe(arr[4]),
    mdef: toIntSafe(arr[5]),
    agi: toIntSafe(arr[6]),
  };

  const triad: TriadStats = {
    up: toIntSafe(arr[7]),
    right: toIntSafe(arr[8]),
    left: toIntSafe(arr[9]),
    down: toIntSafe(arr[10]),
  };

  return { hand: handN, combat, triad };
}

/**
 * Get all token IDs present in the index.
 */
export function getAllTokenIds(index: GameIndexV1 | null | undefined): string[] {
  if (!index || index.v !== 1) return [];
  return Object.keys(index.tokens);
}

/**
 * Fetch index from /game/index.v1.json.
 * Includes a tiny localStorage cache for faster repeat loads.
 */
export async function fetchGameIndex(opts?: { force?: boolean }): Promise<GameIndexV1 | null> {
  const force = Boolean(opts?.force);

  if (!force && typeof window !== "undefined") {
    const cached = safeReadJsonFromStorage(STORAGE_KEY);
    if (cached && cached.v === 1 && cached.tokens) {
      return cached as GameIndexV1;
    }
  }

  const res = await fetch("/game/index.v1.json").catch(() => null);
  if (!res || !res.ok) return null;

  const json = (await res.json().catch(() => null)) as any;
  if (!json || json.v !== 1 || !json.tokens) return null;

  if (typeof window !== "undefined") {
    safeWriteJsonToStorage(STORAGE_KEY, json);
  }

  return json as GameIndexV1;
}
