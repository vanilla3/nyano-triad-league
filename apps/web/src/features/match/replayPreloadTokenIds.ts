export function resolveReplayPreloadTokenIds(input: {
  deckA: readonly bigint[];
  deckB: readonly bigint[];
}): bigint[] {
  const out: bigint[] = [];
  const seen = new Set<string>();
  for (const tokenId of [...input.deckA, ...input.deckB]) {
    const key = tokenId.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tokenId);
  }
  return out;
}
