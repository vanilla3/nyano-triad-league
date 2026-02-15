import { expect, test } from "@playwright/test";

test.describe("Rulesets UX guardrails", () => {
  test("recommended section exposes concise cards and playable CTA", async ({ page }) => {
    await page.goto("/rulesets");

    await expect(page.getByText("Ruleset Registry")).toBeVisible({ timeout: 15_000 });
    const recommended = page.getByTestId("rulesets-recommended-section");
    await expect(recommended).toBeVisible({ timeout: 15_000 });

    const cards = recommended.locator('[data-testid^="rulesets-recommended-card-"]');
    await expect(cards.first()).toBeVisible();
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    const firstCardText = (await cards.first().textContent()) ?? "";
    expect(firstCardText.trim().length).toBeGreaterThan(20);

    const firstPlayCta = recommended.locator('[data-testid^="rulesets-recommended-play-cta-"]').first();
    await expect(firstPlayCta).toBeVisible();
    const href = await firstPlayCta.getAttribute("href");
    expect(href).not.toBeNull();
    expect(href ?? "").toContain("/match?ui=mint&rk=");
  });

  test("play CTA keeps selected ruleset key when navigating to /match", async ({ page }) => {
    await page.goto("/rulesets");
    const firstPlayCta = page
      .getByTestId("rulesets-recommended-section")
      .locator('[data-testid^="rulesets-recommended-play-cta-"]')
      .first();
    await expect(firstPlayCta).toBeVisible({ timeout: 15_000 });

    const href = await firstPlayCta.getAttribute("href");
    expect(href).not.toBeNull();
    const expectedRk = new URL(href ?? "/match?ui=mint", "http://localhost").searchParams.get("rk");
    expect(expectedRk).not.toBeNull();

    await firstPlayCta.click();

    await expect.poll(() => new URL(page.url()).pathname).toBe("/match");
    await expect.poll(() => new URL(page.url()).searchParams.get("ui")).toBe("mint");
    await expect.poll(() => new URL(page.url()).searchParams.get("rk")).toBe(expectedRk);
    await expect(page.getByTestId("match-setup-panel")).toBeVisible({ timeout: 15_000 });
  });
});

