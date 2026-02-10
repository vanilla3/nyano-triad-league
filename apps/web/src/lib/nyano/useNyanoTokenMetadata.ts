/**
 * React Query hook for resolving per-token NFT metadata (image URL).
 *
 * When no metadata configuration is available (no VITE_NYANO_METADATA_BASE
 * env var and no GameIndex metadata.imageBaseUrl), the query is disabled
 * and returns undefined — callers should fall back to NyanoImage.
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
    retry: 1,
  });
}
