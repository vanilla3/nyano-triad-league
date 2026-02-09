import { test, expect } from "@playwright/test";

/**
 * smoke.spec.ts
 *
 * Page-level smoke tests — each test navigates to a route,
 * asserts key text is visible, and checks for JS errors.
 */

test.describe("Page smoke tests", () => {
  /** Collect console errors per test. */
  let pageErrors: string[];

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });
  });

  test.afterEach(() => {
    expect(pageErrors, "No JS errors on page").toEqual([]);
  });

  test("/arena loads", async ({ page }) => {
    await page.goto("/arena");
    await expect(page.getByRole("main").getByText("Arena")).toBeVisible({ timeout: 10_000 });
  });

  test("/decks loads", async ({ page }) => {
    await page.goto("/decks");
    await expect(page.getByText("Deck Studio")).toBeVisible({ timeout: 10_000 });
  });

  test("/replay loads", async ({ page }) => {
    await page.goto("/replay");
    await expect(page.getByText("Replay from transcript")).toBeVisible({ timeout: 10_000 });
  });

  test("/rulesets loads", async ({ page }) => {
    await page.goto("/rulesets");
    await expect(page.getByText("Ruleset Registry")).toBeVisible({ timeout: 10_000 });
  });

  test("/overlay?controls=0 loads", async ({ page }) => {
    await page.goto("/overlay?controls=0");
    // Overlay in no-controls mode shows "No signal yet" and/or "Now Playing"
    await expect(
      page.getByText("No signal yet").or(page.getByText("Now Playing")).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("/events loads", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("main").getByText("Events", { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test("/playground loads", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.getByText("Nyano Lab")).toBeVisible({ timeout: 10_000 });
  });

  test("/stream loads", async ({ page }) => {
    await page.goto("/stream");
    await expect(page.getByText("Nyano Stream Studio")).toBeVisible({ timeout: 10_000 });
  });

  test("/nyano loads", async ({ page }) => {
    await page.goto("/nyano");
    await expect(page.getByText("Nyano Inspector")).toBeVisible({ timeout: 10_000 });
  });
});
