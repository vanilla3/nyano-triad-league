import { describe, it, expect } from "vitest";

/* ═══════════════════════════════════════════════════════════════════
   Events.tsx — findBestAttemptId logic test (Sprint 35)

   The function is tested by reproducing its logic here since it's
   a private function in the component. This ensures the sort/compare
   logic is correct independently.
   ═══════════════════════════════════════════════════════════════════ */

type Attempt = { id: string; winner: 0 | 1; tilesA: number; tilesB: number; createdAt: string };

/** Reproduce findBestAttemptId logic for testing. */
function findBestAttemptId(attempts: Attempt[]): string | null {
  if (attempts.length === 0) return null;
  let best = attempts[0];
  for (let i = 1; i < attempts.length; i++) {
    const a = attempts[i];
    const bestIsWin = best.winner === 0;
    const aIsWin = a.winner === 0;
    if (aIsWin && !bestIsWin) { best = a; continue; }
    if (!aIsWin && bestIsWin) continue;
    const bestDiff = best.tilesA - best.tilesB;
    const aDiff = a.tilesA - a.tilesB;
    if (aDiff > bestDiff) { best = a; continue; }
    if (aDiff < bestDiff) continue;
    if (a.createdAt > best.createdAt) { best = a; }
  }
  return best.id;
}

describe("findBestAttemptId", () => {
  it("returns null for empty list", () => {
    expect(findBestAttemptId([])).toBeNull();
  });

  it("returns the only attempt", () => {
    expect(findBestAttemptId([
      { id: "x", winner: 1, tilesA: 3, tilesB: 6, createdAt: "2026-01-01" },
    ])).toBe("x");
  });

  it("prefers win over loss", () => {
    expect(findBestAttemptId([
      { id: "loss", winner: 1, tilesA: 4, tilesB: 5, createdAt: "2026-01-02" },
      { id: "win", winner: 0, tilesA: 5, tilesB: 4, createdAt: "2026-01-01" },
    ])).toBe("win");
  });

  it("prefers higher tile advantage among wins", () => {
    expect(findBestAttemptId([
      { id: "close-win", winner: 0, tilesA: 5, tilesB: 4, createdAt: "2026-01-02" },
      { id: "big-win", winner: 0, tilesA: 7, tilesB: 2, createdAt: "2026-01-01" },
    ])).toBe("big-win");
  });

  it("prefers higher tile advantage among losses", () => {
    expect(findBestAttemptId([
      { id: "bad-loss", winner: 1, tilesA: 2, tilesB: 7, createdAt: "2026-01-02" },
      { id: "close-loss", winner: 1, tilesA: 4, tilesB: 5, createdAt: "2026-01-01" },
    ])).toBe("close-loss");
  });

  it("prefers newer attempt when tie on tiles", () => {
    expect(findBestAttemptId([
      { id: "older", winner: 0, tilesA: 6, tilesB: 3, createdAt: "2026-01-01" },
      { id: "newer", winner: 0, tilesA: 6, tilesB: 3, createdAt: "2026-01-02" },
    ])).toBe("newer");
  });

  it("handles mixed wins/losses correctly", () => {
    const attempts: Attempt[] = [
      { id: "loss1", winner: 1, tilesA: 3, tilesB: 6, createdAt: "2026-01-01" },
      { id: "win1", winner: 0, tilesA: 5, tilesB: 4, createdAt: "2026-01-02" },
      { id: "win2", winner: 0, tilesA: 7, tilesB: 2, createdAt: "2026-01-03" },
      { id: "loss2", winner: 1, tilesA: 4, tilesB: 5, createdAt: "2026-01-04" },
    ];
    expect(findBestAttemptId(attempts)).toBe("win2");
  });
});
