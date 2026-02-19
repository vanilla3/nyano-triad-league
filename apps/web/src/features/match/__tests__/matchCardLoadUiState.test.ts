import { describe, expect, it } from "vitest";
import {
  resolveCanLoadCards,
  resolveMatchCardLoadEmptyState,
} from "@/features/match/matchCardLoadUiState";

describe("features/match/matchCardLoadUiState", () => {
  it("always allows load in guest mode", () => {
    expect(
      resolveCanLoadCards({
        isGuestMode: true,
        hasDeckA: false,
        deckATokensCount: 0,
        deckBTokensCount: 0,
      }),
    ).toBe(true);
  });

  it("requires both 5-card decks in non-guest mode", () => {
    expect(
      resolveCanLoadCards({
        isGuestMode: false,
        hasDeckA: true,
        deckATokensCount: 5,
        deckBTokensCount: 5,
      }),
    ).toBe(true);
    expect(
      resolveCanLoadCards({
        isGuestMode: false,
        hasDeckA: false,
        deckATokensCount: 5,
        deckBTokensCount: 5,
      }),
    ).toBe(false);
    expect(
      resolveCanLoadCards({
        isGuestMode: false,
        hasDeckA: true,
        deckATokensCount: 4,
        deckBTokensCount: 5,
      }),
    ).toBe(false);
  });

  it("resolves loading empty-state first", () => {
    expect(
      resolveMatchCardLoadEmptyState({
        isLoading: true,
        isGuestMode: true,
      }),
    ).toBe("loading");
  });

  it("resolves guest prompt when idle guest mode", () => {
    expect(
      resolveMatchCardLoadEmptyState({
        isLoading: false,
        isGuestMode: true,
      }),
    ).toBe("guest_prompt");
  });

  it("resolves setup prompt for non-guest idle mode", () => {
    expect(
      resolveMatchCardLoadEmptyState({
        isLoading: false,
        isGuestMode: false,
      }),
    ).toBe("setup_prompt");
  });
});
