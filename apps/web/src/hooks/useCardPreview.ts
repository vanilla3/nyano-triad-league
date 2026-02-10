import React from "react";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";

/* ═══════════════════════════════════════════════════════════════════════════
   useCardPreview — Hover/long-press state machine for card preview panel

   Desktop: hover over a card → 200ms delay → show preview
   Mobile:  (long-press not implemented yet — desktop-first for v1)
   Dismiss: pointer leave, ESC key
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CardPreviewState {
  visible: boolean;
  card: CardData | null;
  owner: PlayerIndex | null;
  anchorRect: DOMRect | null;
  position: "left" | "right";
}

const INITIAL_STATE: CardPreviewState = {
  visible: false,
  card: null,
  owner: null,
  anchorRect: null,
  position: "right",
};

export interface UseCardPreviewReturn {
  state: CardPreviewState;
  /** Start showing preview for a card (with hover delay) */
  show: (card: CardData, owner: PlayerIndex, anchorEl: HTMLElement) => void;
  /** Immediately hide the preview */
  hide: () => void;
}

/**
 * Compute preferred position based on anchor element's screen location.
 * If the card is in the right half of the viewport → show panel on left, else right.
 */
function computePosition(rect: DOMRect): "left" | "right" {
  const viewportCenter = window.innerWidth / 2;
  return rect.left + rect.width / 2 > viewportCenter ? "left" : "right";
}

export function useCardPreview(options?: { hoverDelay?: number }): UseCardPreviewReturn {
  const delay = options?.hoverDelay ?? 200;
  const [state, setState] = React.useState<CardPreviewState>(INITIAL_STATE);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = React.useCallback(
    (card: CardData, owner: PlayerIndex, anchorEl: HTMLElement) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        const rect = anchorEl.getBoundingClientRect();
        setState({
          visible: true,
          card,
          owner,
          anchorRect: rect,
          position: computePosition(rect),
        });
        timerRef.current = null;
      }, delay);
    },
    [delay, clearTimer],
  );

  const hide = React.useCallback(() => {
    clearTimer();
    setState(INITIAL_STATE);
  }, [clearTimer]);

  // ESC key dismissal
  React.useEffect(() => {
    if (!state.visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.visible, hide]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return { state, show, hide };
}
