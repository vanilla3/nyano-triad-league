import React from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   DuelStageMint — 3D Perspective + Holo Grid stage wrapper (P2-200)

   Pure presentational wrapper. No game logic.
   Wraps BoardViewMint (or any child) in a cinematic stage container.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface DuelStageMintProps {
  children: React.ReactNode;
  className?: string;
}

export function DuelStageMint({ children, className = "" }: DuelStageMintProps) {
  return (
    <div className={["mint-stage", className].join(" ")}>
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
