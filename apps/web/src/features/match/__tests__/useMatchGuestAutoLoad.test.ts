import { describe, expect, it } from "vitest";
import { shouldAutoLoadGuestCards } from "@/features/match/useMatchGuestAutoLoad";

describe("features/match/useMatchGuestAutoLoad", () => {
  it("returns false when not in guest mode", () => {
    expect(
      shouldAutoLoadGuestCards({
        isGuestMode: false,
        hasCards: false,
        isLoading: false,
      }),
    ).toBe(false);
  });

  it("returns false when cards are already loaded", () => {
    expect(
      shouldAutoLoadGuestCards({
        isGuestMode: true,
        hasCards: true,
        isLoading: false,
      }),
    ).toBe(false);
  });

  it("returns false when load is already in progress", () => {
    expect(
      shouldAutoLoadGuestCards({
        isGuestMode: true,
        hasCards: false,
        isLoading: true,
      }),
    ).toBe(false);
  });

  it("returns true only when guest mode has no cards and is idle", () => {
    expect(
      shouldAutoLoadGuestCards({
        isGuestMode: true,
        hasCards: false,
        isLoading: false,
      }),
    ).toBe(true);
  });
});
