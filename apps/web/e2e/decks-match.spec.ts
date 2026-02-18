import { test, expect } from "@playwright/test";

/**
 * E2E: Decks → Match flow
 *
 * Tests the full deck creation and match navigation integration.
 */

test.describe("Decks → Match flow", () => {
  test("can create a deck and navigate to match", async ({ page }) => {
    // 1. Navigate to /decks
    await page.goto("/decks?theme=mint");
    await expect(page.getByText(/Deck Builder|デッキビルダー/)).toBeVisible({ timeout: 10_000 });

    // 2. Enter deck name + 5 tokenIds → Save
    await page.getByPlaceholder(/My Deck|マイデッキ/).fill("E2E Test Deck");
    await page.getByPlaceholder(/例:/).fill("1, 2, 3, 4, 5");
    await page.getByRole("button", { name: /Save Deck|デッキを保存/ }).first().click();

    // 3. Verify deck appears in saved list (scope to main to avoid toast match)
    const main = page.getByRole("main");
    await expect(main.getByText("E2E Test Deck")).toBeVisible({ timeout: 5_000 });
    await expect(main.getByText("1, 2, 3, 4, 5")).toBeVisible();

    // 4. Click "Set as A" → verify navigation to /match
    const setAsALink = main.getByRole("link", { name: /Set as A|Aにセット/ }).first();
    await expect(setAsALink).toBeVisible();

    const href = await setAsALink.getAttribute("href");
    expect(href).toContain("/match?a=");
  });

  test("deck edit and delete work", async ({ page }) => {
    await page.goto("/decks?theme=mint");
    await expect(page.getByText(/Deck Builder|デッキビルダー/)).toBeVisible({ timeout: 10_000 });

    const main = page.getByRole("main");

    // Create a deck
    await page.getByPlaceholder(/My Deck|マイデッキ/).fill("Delete Me Deck");
    await page.getByPlaceholder(/例:/).fill("10, 20, 30, 40, 50");
    await page.getByRole("button", { name: /Save Deck|デッキを保存/ }).first().click();

    await expect(main.getByText("Delete Me Deck")).toBeVisible({ timeout: 5_000 });

    // Edit the deck
    await main.getByRole("button", { name: /Edit|編集/ }).first().click();
    const nameInput = page.getByPlaceholder(/My Deck|マイデッキ/);
    await expect(nameInput).toHaveValue("Delete Me Deck");

    // Delete the deck (accept dialog)
    page.on("dialog", (dialog) => dialog.accept());
    await main.getByRole("button", { name: /Delete|削除/ }).first().click();
  });

  test("deck validation shows error for invalid input", async ({ page }) => {
    await page.goto("/decks?theme=mint");
    await expect(page.getByText(/Deck Builder|デッキビルダー/)).toBeVisible({ timeout: 10_000 });

    // Try to save with only 3 tokenIds
    await page.getByPlaceholder(/My Deck|マイデッキ/).fill("Bad Deck");
    await page.getByPlaceholder(/例:/).fill("1, 2, 3");
    await page.getByRole("button", { name: /Save Deck|デッキを保存/ }).first().click();

    // Should show validation error
    await expect(page.getByText("tokenId は 5 つ必要です")).toBeVisible({ timeout: 3_000 });
  });
});
