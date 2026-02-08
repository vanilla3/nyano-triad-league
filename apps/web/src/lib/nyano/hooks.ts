// Convenience hooks for Nyano game data.
// Uses @tanstack/react-query for caching and deduplication.

import { useQuery } from "@tanstack/react-query";
import { readTokenGameDataBatch, readOwnedTokenIds, type TokenGameData } from "./sdk";
import { fetchGameIndex, type GameIndexV1 } from "./gameIndex";

function normalizeTokenIdInput(v: string | number | bigint): bigint | null {
  try {
    if (typeof v === "bigint") return v;
    if (typeof v === "number") {
      if (!Number.isFinite(v) || v <= 0) return null;
      return BigInt(Math.floor(v));
    }
    const s = String(v).trim();
    if (!s) return null;
    if (!/^\d+$/.test(s)) return null;
    return BigInt(s);
  } catch {
    return null;
  }
}

function stableTokenKey(tokenIds: Array<string | number | bigint>): string {
  const ids = tokenIds
    .map(normalizeTokenIdInput)
    .filter((v): v is bigint => v !== null)
    .map((v) => v.toString());
  ids.sort((a, b) => (a === b ? 0 : a < b ? -1 : 1));
  const uniq: string[] = [];
  let prev = "";
  for (const s of ids) {
    if (s === prev) continue;
    uniq.push(s);
    prev = s;
  }
  return uniq.join(",");
}

export function useOwnedNyanoTokenIds(owner?: `0x${string}`, limit = 30) {
  return useQuery({
    queryKey: ["nyano", "ownedTokenIds", owner ?? "", String(limit)],
    enabled: Boolean(owner),
    queryFn: async () => {
      if (!owner) return [] as bigint[];
      return await readOwnedTokenIds(owner, limit);
    },
  });
}

export function useNyanoGameDataBatch(tokenIds: Array<string | number | bigint>) {
  const key = stableTokenKey(tokenIds);
  return useQuery({
    queryKey: ["nyano", "gameDataBatch", key],
    enabled: Boolean(key),
    queryFn: async () => {
      const ids = key
        .split(",")
        .filter(Boolean)
        .map((s) => BigInt(s));
      if (!ids.length) return [] as TokenGameData[];
      return await readTokenGameDataBatch(ids);
    },
  });
}

export function useNyanoGameIndex(opts?: { force?: boolean }) {
  const force = Boolean(opts?.force);
  return useQuery({
    queryKey: ["nyano", "gameIndex", force ? "force" : "cache"],
    queryFn: async () => {
      return (await fetchGameIndex({ force })) as GameIndexV1 | null;
    },
    staleTime: 1000 * 60 * 60 * 12,
  });
}
