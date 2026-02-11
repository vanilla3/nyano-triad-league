/**
 * React Query hook for resolving per-token NFT metadata (image URL).
 *
 * Resolution priority:
 *   1. VITE_NYANO_METADATA_BASE env variable
 *   2. GameIndex metadata.imageBaseUrl field
 *   3. Hardcoded default Arweave URL (always available)
 *
 * The queryKey includes the resolved baseUrlPattern so the cache refreshes
 * when GameIndex loads (upgrading from hardcoded default to actual URL).
 */

import { useQuery } from "@tanstack/react-query";
import { useNyanoGameIndex } from "./hooks";
import {
  getMetadataConfig,
  resolveTokenImageUrl,
  type NyanoTokenMetadata,
} from "./metadata";

export function useNyanoTokenMetadata(tokenId: bigint | null) {
  const { data: gameIndex } = useNyanoGameIndex();
  const config = getMetadataConfig(gameIndex?.metadata);

  return useQuery({
    queryKey: ["nyano", "tokenMeta", tokenId?.toString() ?? "null", config?.baseUrlPattern ?? ""],
    enabled: tokenId !== null && config !== null,
    queryFn: async (): Promise<NyanoTokenMetadata | null> => {
      if (!tokenId || !config) return null;
      const imageUrl = resolveTokenImageUrl(tokenId, config);
      if (!imageUrl) return null;
      // For now, construct URL directly. Future: fetch JSON metadata and extract image field.
      return { imageUrl };
    },
    staleTime: 1000 * 60 * 60, // 1 hour — token images don't change often
    gcTime: 1000 * 60 * 60 * 2, // 2 hours — image URLs are stable
    retry: 1,
  });
}
