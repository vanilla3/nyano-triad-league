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
  impactBurstLevel?: "soft" | "medium" | "hard" | "win" | null;
}

/** Paw print SVG path (reused across decorative watermarks). */
const PAW = "M20,12a8,8 0 1,0-16,0 8,8 0 0,0 16,0M46,6a7,7 0 1,0-14,0 7,7 0 0,0 14,0M62,12a8,8 0 1,0-16,0 8,8 0 0,0 16,0M9,6a7,7 0 1,0-14,0 7,7 0 0,0 14,0M46,30a18,14 0 1,0-36,0 18,14 0 0,0 36,0";

export function DuelStageMint({
  children,
  className = "",
  impact = null,
  impactBurst = false,
  impactBurstLevel = null,
}: DuelStageMintProps) {
  const stageClassName = [
    "mint-stage",
    impact ? `mint-stage--impact-${impact}` : "",
    impactBurst ? "mint-stage--impact-burst" : "",
    impactBurstLevel ? `mint-stage--impact-burst-${impactBurstLevel}` : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={stageClassName}>
      {/* Holo grid background (pure CSS, no image assets) */}
      <div className="mint-stage__holo" aria-hidden="true" />

      {/* Ambient edge glows */}
      <div className="mint-stage__glow mint-stage__glow--top" aria-hidden="true" />
      <div className="mint-stage__glow mint-stage__glow--bottom" aria-hidden="true" />

      {/* Decorative paw print watermarks — playful Nyano identity */}
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
        style={{ opacity: 0.025, color: "var(--mint-accent-dark, #059669)" }}
      >
        <path d={PAW} transform="translate(32,24) scale(0.6)" fill="currentColor" />
        <path d={PAW} transform="translate(295,195) scale(0.5) rotate(15)" fill="currentColor" />
        <path d={PAW} transform="translate(175,235) scale(0.35) rotate(-10)" fill="currentColor" />
      </svg>

      {/* Board container with 3D tilt */}
      <div className="mint-stage__board">
        {children}
      </div>
    </div>
  );
}
