/**
 * Resolve CardData for a list of token IDs.
 *
 * Strategy: game index first (fast, cached, offline), then RPC fallback
 * for any tokens not found in the index.
 *
 * This avoids the 5-10 on-chain reads per replay that made shared replay
 * links fragile when public RPC endpoints were down or rate-limited.
 */

import type { CardData } from "@nyano/triad-engine";
import { fetchGameIndex, getFromGameIndex, type GameIndexV1 } from "./nyano/gameIndex";
import { fetchNyanoCards, type NyanoCardBundle } from "./nyano_rpc";

export type ResolvedCards = {
  cards: Map<bigint, CardData>;
  owners: Map<bigint, `0x${string}`>;
  /** How each token was resolved: "index" | "rpc" */
  sources: Map<bigint, "index" | "rpc">;
};

/**
 * Build a CardData from game index params.
 * Trait is set to "none" — the engine derives it from the ruleset config.
 */
function cardDataFromIndex(
  tokenId: bigint,
  index: GameIndexV1,
): CardData | null {
  const p = getFromGameIndex(index, tokenId);
  if (!p) return null;

  const combatStatSum =
    p.combat.hp + p.combat.atk + p.combat.matk +
    p.combat.def + p.combat.mdef + p.combat.agi;

  return {
    tokenId,
    edges: { up: p.triad.up, right: p.triad.right, down: p.triad.down, left: p.triad.left },
    jankenHand: p.hand,
    combatStatSum,
    trait: "none",
  };
}

/**
 * Resolve cards using game index first, with RPC fallback for missing tokens.
 *
 * @param tokenIds - The token IDs to resolve
 * @param opts.skipRpc - If true, never call RPC (fully offline mode)
 */
export async function resolveCards(
  tokenIds: bigint[],
  opts?: { skipRpc?: boolean },
): Promise<ResolvedCards> {
  const cards = new Map<bigint, CardData>();
  const owners = new Map<bigint, `0x${string}`>();
  const sources = new Map<bigint, "index" | "rpc">();

  // De-duplicate
  const uniq = Array.from(new Set(tokenIds.map((t) => t.toString()))).map((s) => BigInt(s));

  // 1. Try game index (fast, cached)
  let index: GameIndexV1 | null = null;
  try {
    index = await fetchGameIndex();
  } catch {
    // Game index unavailable — fall through to RPC
  }

  const missing: bigint[] = [];

  if (index) {
    for (const tid of uniq) {
      const card = cardDataFromIndex(tid, index);
      if (card) {
        cards.set(tid, card);
        // Game index doesn't have owner info — use zero address placeholder
        owners.set(tid, "0x0000000000000000000000000000000000000000");
        sources.set(tid, "index");
      } else {
        missing.push(tid);
      }
    }
  } else {
    missing.push(...uniq);
  }

  // 2. RPC fallback for missing tokens
  if (missing.length > 0 && !opts?.skipRpc) {
    try {
      const bundles: Map<bigint, NyanoCardBundle> = await fetchNyanoCards(missing);
      for (const [tid, b] of bundles.entries()) {
        cards.set(tid, b.card);
        owners.set(tid, b.owner);
        sources.set(tid, "rpc");
      }
    } catch {
      // RPC also failed — cards will be incomplete
      // The caller should handle missing cards gracefully
    }
  }

  return { cards, owners, sources };
}
