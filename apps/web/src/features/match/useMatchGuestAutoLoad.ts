import React from "react";

export function shouldAutoLoadGuestCards(input: {
  isGuestMode: boolean;
  hasCards: boolean;
  isLoading: boolean;
}): boolean {
  return input.isGuestMode && !input.hasCards && !input.isLoading;
}

export function useMatchGuestAutoLoad(input: {
  isGuestMode: boolean;
  hasCards: boolean;
  isLoading: boolean;
  loadCardsFromIndex: () => Promise<void>;
}): void {
  React.useEffect(() => {
    if (
      shouldAutoLoadGuestCards({
        isGuestMode: input.isGuestMode,
        hasCards: input.hasCards,
        isLoading: input.isLoading,
      })
    ) {
      void input.loadCardsFromIndex();
    }
    // Keep parity with existing behavior: trigger when mode flips to guest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.isGuestMode]);
}
