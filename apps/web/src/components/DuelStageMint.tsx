import React from "react";
import type { CutInImpact } from "./NyanoReaction";

/* ═══════════════════════════════════════════════════════════════════════════
   DuelStageMint — 3D Perspective + Holo Grid stage wrapper (P2-200)

   Pure presentational wrapper. No game logic.
   Wraps BoardViewMint (or any child) in a cinematic stage container.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface DuelStageMintProps {
  children: React.ReactNode;
  className?: string;
  impact?: CutInImpact | null;
  impactBurst?: boolean;
}

export function DuelStageMint({
  children,
  className = "",
  impact = null,
  impactBurst = false,
}: DuelStageMintProps) {
  const stageClassName = [
    "mint-stage",
    "mint-stage--gamefeel",
    impact ? `mint-stage--impact-${impact}` : "",
    impactBurst ? "mint-stage--impact-burst" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={stageClassName}>
      {/* Stage rim + atmosphere layers (kept lightweight and CSS-driven). */}
      <div className="mint-stage__rim" aria-hidden="true" />
      <div className="mint-stage__atmo" aria-hidden="true" />

      {/* Holo grid background (pure CSS, no image assets) */}
      <div className="mint-stage__holo" aria-hidden="true" />

      {/* Ambient edge glows */}
      <div className="mint-stage__glow mint-stage__glow--top" aria-hidden="true" />
      <div className="mint-stage__glow mint-stage__glow--bottom" aria-hidden="true" />

      {/* Board container with 3D tilt */}
      <div className="mint-stage__board">
        {children}
      </div>
    </div>
  );
}
