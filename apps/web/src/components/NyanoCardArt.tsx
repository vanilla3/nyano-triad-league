import React from "react";
import { useNyanoTokenMetadata } from "@/lib/nyano/useNyanoTokenMetadata";
import { NyanoTokenPlaceholder } from "./NyanoTokenPlaceholder";

/* ═══════════════════════════════════════════════════════════════════════════
   NyanoCardArt — Per-token card art with generative fallback
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
 *  1. `useNyanoTokenMetadata` → token-specific image URL (Arweave)
 *  2. Arweave canonical gateway fallback (subdomain → arweave.net)
 *  3. `<NyanoTokenPlaceholder>` — deterministic generative art based on tokenId
 *
 * When metadata is not configured (no env var, no GameIndex imageBaseUrl),
 * the hook returns `undefined` and we immediately render the placeholder.
 */
export function NyanoCardArt({ tokenId, size = "md", fill = false, className = "" }: NyanoCardArtProps) {
  const { data: meta, isLoading, error } = useNyanoTokenMetadata(tokenId);
  const px = SIZE_MAP[size];

  // DEV diagnostic: log metadata resolution state for debugging NFT image issues.
  // useEffect is always called (hook rules), but the log body is gated by DEV.
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug(
        `[NyanoCardArt #${tokenId}] isLoading=${isLoading} imageUrl=${meta?.imageUrl ?? "none"} error=${error ? String(error) : "none"}`,
      );
    }
  }, [tokenId, isLoading, meta?.imageUrl, error]);

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
        size={px}
        fill={fill}
        className={className}
      />
    );
  }

  // Fallback: deterministic generative art
  return (
    <NyanoTokenPlaceholder
      tokenId={tokenId}
      size={fill ? 96 : (px ?? 72)}
      fill={fill}
      className={className}
    />
  );
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
  size,
  fill = false,
  className,
}: {
  src: string;
  tokenId: bigint;
  size: number;
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
    return (
      <NyanoTokenPlaceholder
        tokenId={tokenId}
        size={fill ? 96 : size}
        fill={fill}
        className={className}
      />
    );
  }

  const sizeStyle = fill
    ? undefined
    : ({ width: size, height: size } as React.CSSProperties);

  return (
    <div
      className={[
        "overflow-hidden bg-slate-900/20",
        fill ? "w-full h-full" : "rounded-xl border border-surface-200 shadow-soft-sm",
        className,
      ].filter(Boolean).join(" ")}
      style={sizeStyle}
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
