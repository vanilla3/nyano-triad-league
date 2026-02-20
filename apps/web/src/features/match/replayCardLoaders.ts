import type { CardData } from "@nyano/triad-engine";
import type { ParsedReplay } from "@/lib/replay_bundle";
import { resolveCards } from "@/lib/resolveCards";

type ReplayCardLoaderDeps = {
  resolveCards: typeof resolveCards;
};

const DEFAULT_DEPS: ReplayCardLoaderDeps = {
  resolveCards,
};

export type ReplayResolvedCards = {
  cards: Map<bigint, CardData>;
  owners: Map<bigint, `0x${string}`>;
};

function resolveReplayMissingTokenIds(
  tokenIds: readonly bigint[],
  cards: ReadonlyMap<bigint, CardData>,
): string[] {
  const uniqueTokenIds = [...new Set(tokenIds.map((tokenId) => tokenId.toString()))];
  return uniqueTokenIds.filter((tokenId) => !cards.has(BigInt(tokenId)));
}

export function formatReplayMissingCardsError(missingTokenIds: readonly string[]): string {
  const preview = missingTokenIds.slice(0, 5).join(", ");
  const suffix = missingTokenIds.length > 5 ? "\u2026" : "";
  return `${missingTokenIds.length}\u679A\u306E\u30AB\u30FC\u30C9\u3092\u89E3\u6C7A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F: ${preview}${suffix}\u3002\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u63A5\u7D9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
}

export async function resolveReplayCardsFromPayload(
  input: { parsed: ParsedReplay },
  depsPartial?: Partial<ReplayCardLoaderDeps>,
): Promise<ReplayResolvedCards> {
  if (input.parsed.version === 2) {
    return {
      cards: input.parsed.cards,
      owners: new Map(),
    };
  }

  const deps: ReplayCardLoaderDeps = { ...DEFAULT_DEPS, ...(depsPartial ?? {}) };
  const tokenIds = [...input.parsed.transcript.header.deckA, ...input.parsed.transcript.header.deckB];
  const resolved = await deps.resolveCards(tokenIds);
  const missingTokenIds = resolveReplayMissingTokenIds(tokenIds, resolved.cards);
  if (missingTokenIds.length > 0) {
    throw new Error(formatReplayMissingCardsError(missingTokenIds));
  }

  return {
    cards: resolved.cards,
    owners: resolved.owners,
  };
}
