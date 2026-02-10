import React from "react";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";

/* ═══════════════════════════════════════════════════════════════════════════
   useCardFlight — State machine for card flight animation

   Usage in Match.tsx:
     const flight = useCardFlight();

     // Instead of directly calling commitTurn:
     flight.launch(card, owner, sourceEl, targetEl, () => commitTurn(move));

     // Render:
     {flight.state && <CardFlight {...flight.state} />}
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CardFlightState {
  card: CardData;
  owner: PlayerIndex;
  sourceRect: DOMRect;
  targetRect: DOMRect;
  onLand: () => void;
}

export interface UseCardFlightReturn {
  state: CardFlightState | null;
  /** Launch a flying card. onLand is called when animation completes. */
  launch: (
    card: CardData,
    owner: PlayerIndex,
    sourceEl: HTMLElement,
    targetEl: HTMLElement,
    onLand: () => void,
  ) => void;
  /** Whether a flight is currently in progress */
  isFlying: boolean;
}

export function useCardFlight(): UseCardFlightReturn {
  const [state, setState] = React.useState<CardFlightState | null>(null);

  const launch = React.useCallback(
    (
      card: CardData,
      owner: PlayerIndex,
      sourceEl: HTMLElement,
      targetEl: HTMLElement,
      onLand: () => void,
    ) => {
      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      setState({
        card,
        owner,
        sourceRect,
        targetRect,
        onLand: () => {
          setState(null);
          onLand();
        },
      });
    },
    [],
  );

  return { state, launch, isFlying: state !== null };
}
