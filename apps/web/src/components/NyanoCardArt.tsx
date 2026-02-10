import React from "react";
import { useNyanoTokenMetadata } from "@/lib/nyano/useNyanoTokenMetadata";
import { NyanoImage } from "./NyanoImage";

/* ═══════════════════════════════════════════════════════════════════════════
   NyanoCardArt — Per-token card art with NyanoImage fallback
   ═══════════════════════════════════════════════════════════════════════════ */

const SIZE_MAP = { sm: 48, md: 72, lg: 96 } as const;

export interface NyanoCardArtProps {
  tokenId: bigint;
  /** Display size (ignored when fill=true) */
  size?: "sm" | "md" | "lg";
  /** Fill parent container (width/height 100%) — used by CardNyanoDuel hero art */
  fill?: boolean;
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
export function NyanoCardArt({ tokenId, size = "md", fill = false, className = "" }: NyanoCardArtProps) {
  const { data: meta, isLoading } = useNyanoTokenMetadata(tokenId);
  const px = SIZE_MAP[size];
  const sizeStyle: { width: number | "100%"; height: number | "100%" } = fill
    ? { width: "100%", height: "100%" }
    : { width: px, height: px };

  // Loading skeleton — matches card shape with shimmer
  if (isLoading) {
    return (
      <div
        className={[
          "skeleton-base",
          fill && "w-full h-full",
          className,
        ].filter(Boolean).join(" ")}
        style={fill ? undefined : { width: px, height: px }}
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
        sizeStyle={sizeStyle}
        fill={fill}
        className={className}
      />
    );
  }

  // Fallback: generic NyanoImage
  return <NyanoImage size={fill ? 96 : (px ?? 72)} className={fill ? `w-full h-full ${className}` : className} />;
}

/* ── Internal: Arweave subdomain → canonical gateway fallback ──────── */

function rewriteToFallbackGateway(url: string): string | null {
  // https://<hash>.arweave.net/<txid>/<path> → https://arweave.net/<txid>/<path>
  const m = url.match(/^https:\/\/[^.]+\.arweave\.net\/(.+)$/);
  return m ? `https://arweave.net/${m[1]}` : null;
}

/* ── Internal: Token image with error fallback ─────────────────────── */

type ImgState = "primary" | "fallback" | "failed";

function TokenImage({
  src,
  tokenId,
  sizeStyle,
  fill = false,
  className,
}: {
  src: string;
  tokenId: bigint;
  sizeStyle: { width: number | "100%"; height: number | "100%" };
  fill?: boolean;
  className: string;
}) {
  const [state, setState] = React.useState<ImgState>("primary");
  const [activeSrc, setActiveSrc] = React.useState(src);

  // Reset when src changes (e.g. different token)
  React.useEffect(() => {
    setState("primary");
    setActiveSrc(src);
  }, [src]);

  if (state === "failed") {
    return <NyanoImage size={fill ? 96 : (typeof sizeStyle.width === "number" ? sizeStyle.width : 72)} className={fill ? `w-full h-full ${className}` : className} />;
  }

  return (
    <div
      className={[
        "overflow-hidden bg-slate-900/20",
        fill ? "w-full h-full" : "rounded-xl border border-surface-200 shadow-soft-sm",
        className,
      ].filter(Boolean).join(" ")}
      style={fill ? undefined : (sizeStyle as React.CSSProperties)}
    >
      <img
        src={activeSrc}
        alt={`Nyano #${tokenId.toString()}`}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => {
          if (state === "primary") {
            const fallbackUrl = rewriteToFallbackGateway(activeSrc);
            if (fallbackUrl) {
              setActiveSrc(fallbackUrl);
              setState("fallback");
            } else {
              setState("failed");
            }
          } else {
            setState("failed");
          }
        }}
      />
    </div>
  );
}
