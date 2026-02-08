import React from "react";
import { NYANO_IMAGE_ARWEAVE_URL, NYANO_IMAGE_PNG_URL, NYANO_IMAGE_WEBP_URL } from "@/lib/nyano_assets";

type Props = {
  size?: number;
  className?: string;
  alt?: string;
  title?: string;
  variant?: string;
  glow?: boolean;
  animated?: boolean;
};

/**
 * Nyano image (local-first).
 * - local /public asset by default (png + webp)
 * - falls back to the original Arweave URL if local asset is missing
 * - graceful placeholder when everything fails
 */
export function NyanoImage({ size = 72, className = "", alt = "Nyano", title }: Props) {
  const [phase, setPhase] = React.useState<"local" | "arweave" | "failed">("local");
  const [src, setSrc] = React.useState<string>(NYANO_IMAGE_PNG_URL);

  const handleError = () => {
    if (phase === "local") {
      setPhase("arweave");
      setSrc(NYANO_IMAGE_ARWEAVE_URL);
      return;
    }
    setPhase("failed");
  };

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border border-surface-200 bg-surface-100",
        "shadow-soft-sm",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
      title={title ?? alt}
    >
      {phase !== "failed" ? (
        <picture>
          {phase === "local" && <source srcSet={NYANO_IMAGE_WEBP_URL} type="image/webp" />}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            onError={handleError}
          />
        </picture>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-surface-400">Nyano</div>
      )}
    </div>
  );
}

export type NyanoHeroBannerProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Hero banner used on landing / admin pages to add "game feel".
 * (Safe to render anywhere; no routing assumptions.)
 */
export function NyanoHeroBanner({
  title = "Nyano Triad League",
  subtitle = "Nyano NFTで遊べる、コミュニティ駆動型カードバトル",
  className = "",
  children,
}: NyanoHeroBannerProps) {
  return (
    <div className={["card-glass relative overflow-hidden", className].join(" ")}>
      <div className="absolute inset-0 bg-gradient-to-br from-nyano-50 via-white to-player-a-50 opacity-90" />
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-nyano-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-player-b-200/40 blur-3xl" />

      <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-center md:gap-8">
        <div className="flex items-center gap-4">
          <NyanoImage size={120} className="shadow-glow" />
          <div>
            <div className="text-xs font-semibold text-nyano-600">Mascot</div>
            <div className="text-lg font-display font-bold text-surface-900">Nyano</div>
            <div className="text-xs text-surface-500">on Ethereum</div>
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-display font-black text-surface-900">{title}</h1>
          <p className="mt-2 text-sm text-surface-600">{subtitle}</p>

          {children ? <div className="mt-4 flex flex-wrap gap-2">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
