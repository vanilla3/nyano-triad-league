import React from "react";
import { createPortal } from "react-dom";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";
import { CardNyanoDuel } from "./CardNyanoDuel";

/* ═══════════════════════════════════════════════════════════════════════════
   FLIGHT-0100: CardFlight — Flying card animation from hand to board

   Renders a full-size CardNyanoDuel clone as a fixed-position portal
   that animates from sourceRect → targetRect using CSS transitions.
   On completion, fires onLand callback so the parent can commit the
   actual turn (triggering the existing placement pop-in).
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CardFlightProps {
  card: CardData;
  owner: PlayerIndex;
  sourceRect: DOMRect;
  targetRect: DOMRect;
  /** Called when the card "lands" on the target cell */
  onLand: () => void;
}

/** Flight duration in ms — matches dramatic pacing */
export const FLIGHT_MS = 380;

export function CardFlight({
  card,
  owner,
  sourceRect,
  targetRect,
  onLand,
}: CardFlightProps) {
  const [phase, setPhase] = React.useState<"start" | "fly" | "done">("start");

  // Trigger the transition after a microtask (so "start" position renders first)
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setPhase("fly");
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Fire onLand when transition completes
  React.useEffect(() => {
    if (phase !== "fly") return;
    const t = setTimeout(() => {
      setPhase("done");
      onLand();
    }, FLIGHT_MS);
    return () => clearTimeout(t);
  }, [phase, onLand]);

  if (phase === "done") return null;

  const isStart = phase === "start";

  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 100,
    // Source → Target interpolation
    top: isStart ? sourceRect.top : targetRect.top,
    left: isStart ? sourceRect.left : targetRect.left,
    width: isStart ? sourceRect.width : targetRect.width,
    height: isStart ? sourceRect.height : targetRect.height,
    // Smooth transition
    transition: isStart
      ? "none"
      : `top ${FLIGHT_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
         left ${FLIGHT_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
         width ${FLIGHT_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
         height ${FLIGHT_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
         transform ${FLIGHT_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
         opacity ${FLIGHT_MS}ms ease`,
    // Slight arc via transform: lift up in the middle of flight
    transform: isStart
      ? "scale(1) rotate(0deg)"
      : "scale(1.05) rotate(0deg)",
    opacity: isStart ? 0.95 : 1,
    pointerEvents: "none",
    willChange: "top, left, width, height, transform",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: isStart
      ? "0 4px 16px rgba(0,0,0,0.2)"
      : "0 8px 32px rgba(0,0,0,0.3), 0 0 16px rgba(16,185,129,0.3)",
  };

  return createPortal(
    <div style={style} aria-hidden="true">
      <CardNyanoDuel card={card} owner={owner} />
    </div>,
    document.body,
  );
}
