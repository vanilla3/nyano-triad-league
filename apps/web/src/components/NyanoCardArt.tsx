import React from "react";
import { useNyanoTokenMetadata } from "@/lib/nyano/useNyanoTokenMetadata";
import { NyanoImage } from "./NyanoImage";

/* ═══════════════════════════════════════════════════════════════════════════
   NyanoCardArt — Per-token card art with NyanoImage fallback
   ═══════════════════════════════════════════════════════════════════════════ */

const SIZE_MAP = { sm: 48, md: 72, lg: 96 } as const;

export interface NyanoCardArtProps {
  tokenId: bigint;
  /** Display size */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Display per-token NFT card art when metadata is configured.
 *
 * Resolution order:
 *  1. `useNyanoTokenMetadata` → token-specific image URL
 *  2. Fallback → `<NyanoImage>` (generic mascot, local→Arweave→text)
 *
 * When metadata is not configured (no env var, no GameIndex imageBaseUrl),
 * the hook returns `undefined` and we immediately render NyanoImage.
 */
export function NyanoCardArt({ tokenId, size = "md", className = "" }: NyanoCardArtProps) {
  const { data: meta, isLoading } = useNyanoTokenMetadata(tokenId);
  const px = SIZE_MAP[size];

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={[
          "animate-pulse rounded-xl bg-surface-200",
          className,
        ].join(" ")}
        style={{ width: px, height: px }}
        aria-label="Loading card art..."
      />
    );
  }

  // Per-token image available
  if (meta?.imageUrl) {
    return (
      <TokenImage
        src={meta.imageUrl}
        tokenId={tokenId}
        size={px}
        className={className}
      />
    );
  }

  // Fallback: generic NyanoImage
  return <NyanoImage size={px} className={className} />;
}

/* ── Internal: Token image with error fallback ─────────────────────── */

function TokenImage({
  src,
  tokenId,
  size,
  className,
}: {
  src: string;
  tokenId: bigint;
  size: number;
  className: string;
}) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return <NyanoImage size={size} className={className} />;
  }

  return (
    <div
      className={[
        "overflow-hidden rounded-xl border border-surface-200 bg-surface-100",
        "shadow-soft-sm",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={`Nyano #${tokenId.toString()}`}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
