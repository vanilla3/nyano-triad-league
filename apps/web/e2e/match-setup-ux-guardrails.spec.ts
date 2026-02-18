import { expect, test } from "@playwright/test";

test.describe("Match Setup UX guardrails", () => {
  test("setup summary reflects key selections and URL-backed state", async ({ page }) => {
    await page.goto("/match?opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint&fpm=manual&fp=0");
    await expect(page.getByTestId("match-setup-panel")).toBeVisible({ timeout: 15_000 });

    const summary = page.getByTestId("match-setup-summary-line");
    await expect(summary).toContainText("v2 shadow+tactics");
    await expect(summary).toContainText("Nyano AI");
    await expect(summary).toContainText("first=manual");
    await expect(summary).toContainText("board=mint");

    await page.getByTestId("match-setup-opponent-pvp").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("opp")).toBe("pvp");
    await expect(summary).toContainText("Human vs Human");

    await page.getByTestId("match-setup-ruleset").selectOption("classic_order");
    await expect.poll(() => new URL(page.url()).searchParams.get("rk")).toBe("classic_order");
    await expect(summary).toContainText("classic order");

    await page.getByTestId("match-setup-board-ui").selectOption("engine");
    await expect.poll(() => new URL(page.url()).searchParams.get("ui")).toBe("engine");
    await expect(summary).toContainText("board=engine");

    await page.getByTestId("match-setup-first-player-mode").selectOption("mutual");
    await expect.poll(() => new URL(page.url()).searchParams.get("fpm")).toBe("mutual");
    await expect(summary).toContainText("first=mutual");
  });

  test("advanced setup auto-opens for non-manual first-player mode and keeps ccap in URL", async ({ page }) => {
    await page.goto("/match?opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint&fpm=manual&fp=0");
    await expect(page.getByTestId("match-setup-panel")).toBeVisible({ timeout: 15_000 });

    const advancedContent = page.getByTestId("match-setup-advanced-content");
    await expect(advancedContent).toHaveCount(0);

    await page.getByTestId("match-setup-first-player-mode").selectOption("mutual");
    await expect.poll(() => new URL(page.url()).searchParams.get("fpm")).toBe("mutual");
    await expect(advancedContent).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Mutual choice A")).toBeVisible();

    await page.getByTestId("match-setup-chain-cap").selectOption("2");
    await expect.poll(() => new URL(page.url()).searchParams.get("ccap")).toBe("2");

    const advancedToggle = page.getByTestId("match-setup-advanced-toggle");
    await advancedToggle.click();
    await expect(advancedContent).toHaveCount(0);
    await advancedToggle.click();
    await expect(advancedContent).toBeVisible({ timeout: 10_000 });
  });
});

