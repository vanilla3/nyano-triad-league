import { expect, test, type Page } from "@playwright/test";
import { gzipSync } from "node:zlib";

const TRANSCRIPT_JSON = JSON.stringify({
  header: {
    version: 1,
    rulesetId: "0x" + "11".repeat(32),
    seasonId: 0,
    playerA: "0x" + "aa".repeat(20),
    playerB: "0x" + "bb".repeat(20),
    deckA: ["1", "2", "3", "4", "5"],
    deckB: ["6", "7", "8", "9", "10"],
    firstPlayer: 0,
    deadline: 9999999999,
    salt: "0x" + "22".repeat(32),
  },
  turns: [
    { cell: 4, cardIndex: 0 },
    { cell: 0, cardIndex: 0 },
    { cell: 2, cardIndex: 1 },
    { cell: 6, cardIndex: 1 },
    { cell: 8, cardIndex: 2 },
    { cell: 1, cardIndex: 2 },
    { cell: 3, cardIndex: 3 },
    { cell: 5, cardIndex: 3 },
    { cell: 7, cardIndex: 4 },
  ],
});

function encodeTranscriptZ(json: string): string {
  const compressed = gzipSync(Buffer.from(json, "utf-8"));
  return compressed.toString("base64url");
}

async function disableGuestTutorial(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("nytl.tutorial.seen", "true");
      localStorage.setItem("nytl.ui.density", "standard");
      localStorage.setItem(
        "nytl.onboarding.progress_v1",
        JSON.stringify({
          version: 1,
          updatedAtIso: "2026-01-01T00:00:00.000Z",
          steps: {
            read_quick_guide: true,
            start_first_match: true,
            commit_first_move: true,
          },
        }),
      );
    } catch {
      // ignore storage failures in hardened browser contexts
    }
  });
}

async function dismissGuestTutorialIfPresent(page: Page): Promise<void> {
  const gotItButton = page.getByRole("button", { name: "Got it!" });
  if (await gotItButton.isVisible().catch(() => false)) {
    await gotItButton.click();
    return;
  }
  const skipButton = page.getByRole("button", { name: "Skip tutorial" });
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }
}

test.describe("Main flow guardrail", () => {
  test("Home -> Arena -> Match -> Replay(final step)", async ({ page }) => {
    test.setTimeout(60_000);
    await disableGuestTutorial(page);

    await page.goto("/");
    const arenaLink = page.locator('a[href="/arena"]').first();
    await expect(arenaLink).toBeVisible({ timeout: 10_000 });
    await arenaLink.click();

    await expect(page).toHaveURL(/\/arena/);
    const playNowLink = page.locator('a[href^="/match?mode=guest&opp=vs_nyano_ai"]').first();
    await expect(playNowLink).toBeVisible({ timeout: 10_000 });
    await playNowLink.click();

    await expect(page).toHaveURL(/\/match/);
    await dismissGuestTutorialIfPresent(page);
    await expect(page.getByText("Guest Quick Play")).toBeVisible({ timeout: 15_000 });

    const shareButton = page.getByRole("button", { name: "Share URL", exact: true }).first();
    const replayButton = page.getByRole("button", { name: "Replay", exact: true }).first();
    await expect(shareButton).toBeDisabled();
    await expect(replayButton).toBeDisabled();

    const zParam = encodeTranscriptZ(TRANSCRIPT_JSON);
    await page.goto(`/replay?z=${zParam}&step=9&ui=mint`);

    await expect(page.getByText("Replay from transcript")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Left\/Right step/).first()).toBeVisible();
    await expect
      .poll(() => {
        const url = new URL(page.url());
        return url.pathname.endsWith("/replay") && url.searchParams.has("z") && url.searchParams.get("step") === "9";
      })
      .toBe(true);
  });
});
