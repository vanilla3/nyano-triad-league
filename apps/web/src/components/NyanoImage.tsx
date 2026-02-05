import React from "react";
import { NYANO_IMAGE_URL } from "@/lib/nyano_assets";

type Props = {
  size?: number;
  className?: string;
  alt?: string;
  title?: string;
};

/**
 * Nyano image (Arweave-hosted).
 * - keeps layout stable (square box)
 * - graceful fallback when remote image fails
 */
export function NyanoImage({ size = 72, className = "", alt = "Nyano", title }: Props) {
  const [failed, setFailed] = React.useState(false);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${className}`}
      style={{ width: size, height: size }}
      title={title ?? alt}
    >
      {!failed ? (
        <img
          src={NYANO_IMAGE_URL}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Nyano</div>
      )}
    </div>
  );
}
