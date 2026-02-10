import React from "react";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";

/* ═══════════════════════════════════════════════════════════════════════════
   useCardPreview — Hover/long-press state machine for card preview panel

   Desktop: hover over a card → 200ms delay → show preview
            right-click on a card → show preview (context menu prevented)
   Mobile:  long-press (400ms) → show preview, vibrate on open
   Dismiss: pointer leave, ESC key, tap outside, scroll
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
  /** Show preview immediately (for long-press / right-click) */
  showImmediate: (card: CardData, owner: PlayerIndex, anchorEl: HTMLElement) => void;
  /** Immediately hide the preview */
  hide: () => void;
  /** Event handlers for long-press support (attach to card element) */
  longPressHandlers: (card: CardData, owner: PlayerIndex) => {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onTouchMove: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
  };
}

/**
 * Compute preferred position based on anchor element's screen location.
 * If the card is in the right half of the viewport → show panel on left, else right.
 */
function computePosition(rect: DOMRect): "left" | "right" {
  const viewportCenter = window.innerWidth / 2;
  return rect.left + rect.width / 2 > viewportCenter ? "left" : "right";
}

/** Threshold (ms) for long-press on mobile */
const LONG_PRESS_MS = 400;

export function useCardPreview(options?: { hoverDelay?: number }): UseCardPreviewReturn {
  const delay = options?.hoverDelay ?? 200;
  const [state, setState] = React.useState<CardPreviewState>(INITIAL_STATE);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearLongPress = React.useCallback(() => {
    if (longPressRef.current !== null) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  const showImmediate = React.useCallback(
    (card: CardData, owner: PlayerIndex, anchorEl: HTMLElement) => {
      clearTimer();
      const rect = anchorEl.getBoundingClientRect();
      setState({
        visible: true,
        card,
        owner,
        anchorRect: rect,
        position: computePosition(rect),
      });
    },
    [clearTimer],
  );

  const show = React.useCallback(
    (card: CardData, owner: PlayerIndex, anchorEl: HTMLElement) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        showImmediate(card, owner, anchorEl);
        timerRef.current = null;
      }, delay);
    },
    [delay, clearTimer, showImmediate],
  );

  const hide = React.useCallback(() => {
    clearTimer();
    clearLongPress();
    setState(INITIAL_STATE);
  }, [clearTimer, clearLongPress]);

  /** Return long-press event handlers for a specific card */
  const longPressHandlers = React.useCallback(
    (card: CardData, owner: PlayerIndex) => ({
      onTouchStart: (e: React.TouchEvent) => {
        clearLongPress();
        const el = e.currentTarget as HTMLElement;
        longPressRef.current = setTimeout(() => {
          showImmediate(card, owner, el);
          // Haptic feedback on mobile
          try { navigator.vibrate?.(30); } catch { /* noop */ }
          longPressRef.current = null;
        }, LONG_PRESS_MS);
      },
      onTouchEnd: () => {
        clearLongPress();
      },
      onTouchMove: () => {
        // Cancel long-press if finger moves (scroll gesture)
        clearLongPress();
      },
      onContextMenu: (e: React.MouseEvent) => {
        // Right-click opens inspect on desktop
        e.preventDefault();
        showImmediate(card, owner, e.currentTarget as HTMLElement);
      },
    }),
    [clearLongPress, showImmediate],
  );

  // ESC key dismissal
  React.useEffect(() => {
    if (!state.visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.visible, hide]);

  // Click-outside dismissal (for mobile after long-press)
  React.useEffect(() => {
    if (!state.visible) return;
    const handler = () => hide();
    // Use setTimeout so the current touch-end doesn't immediately dismiss
    const t = setTimeout(() => {
      window.addEventListener("pointerdown", handler, { once: true });
    }, 100);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", handler);
    };
  }, [state.visible, hide]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearTimer();
      clearLongPress();
    };
  }, [clearTimer, clearLongPress]);

  return { state, show, showImmediate, hide, longPressHandlers };
}
