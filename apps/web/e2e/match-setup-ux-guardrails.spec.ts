import { expect, test } from "@playwright/test";

test.describe("Match Setup UX guardrails", () => {
  test("setup summary reflects key selections and URL-backed state", async ({ page }) => {
    await page.goto("/match?opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint&fpm=manual&fp=0");
    await expect(page.getByTestId("match-setup-panel")).toBeVisible({ timeout: 15_000 });

    const summary = page.getByTestId("match-setup-summary-line");
    await expect(summary).toContainText("v2 シャドウ+戦術");
    await expect(summary).toContainText("Nyano AI");
    await expect(summary).toContainText("先手: manual");
    await expect(summary).toContainText("盤面: mint");

    await page.getByTestId("match-setup-opponent-pvp").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("opp")).toBe("pvp");
    await expect(summary).toContainText("対戦相手: 対人");

    await page.getByTestId("mint-ruleset-family-classic").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("rk")).toBe("classic_plus_same");
    await page.getByTestId("mint-ruleset-preset-classic_order").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("rk")).toBe("classic_order");
    await expect(summary).toContainText("クラシック Order");

    await page.getByTestId("match-setup-board-ui").selectOption("engine");
    await expect.poll(() => new URL(page.url()).searchParams.get("ui")).toBe("engine");
    await expect(summary).toContainText("盤面: engine");

    await page.getByTestId("match-setup-first-player-mode").selectOption("mutual");
    await expect.poll(() => new URL(page.url()).searchParams.get("fpm")).toBe("mutual");
    await expect(summary).toContainText("先手: mutual");
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

