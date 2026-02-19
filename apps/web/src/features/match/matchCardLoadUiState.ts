export type MatchCardLoadEmptyState = "loading" | "guest_prompt" | "setup_prompt";

export function resolveCanLoadCards(input: {
  isGuestMode: boolean;
  hasDeckA: boolean;
  deckATokensCount: number;
  deckBTokensCount: number;
}): boolean {
  if (input.isGuestMode) return true;
  return input.hasDeckA && input.deckATokensCount === 5 && input.deckBTokensCount === 5;
}

export function resolveMatchCardLoadEmptyState(input: {
  isLoading: boolean;
  isGuestMode: boolean;
}): MatchCardLoadEmptyState {
  if (input.isLoading) return "loading";
  if (input.isGuestMode) return "guest_prompt";
  return "setup_prompt";
}
