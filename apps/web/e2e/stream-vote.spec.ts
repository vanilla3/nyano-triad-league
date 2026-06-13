import { test, expect } from "@playwright/test";

/**
 * E2E: Stream Vote flow
 *
 * Tests the stream voting UX (mock-based, single tab).
 * Since voting requires a live match state, this tests the UI elements
 * and validation feedback without a live game.
 */

test.describe("Stream vote flow", () => {
  test("stream page loads with voting UI", async ({ page }) => {
    await page.goto("/stream");
    await expect(page.getByText(/Nyano Stream Studio|配信スタジオ/).first()).toBeVisible({ timeout: 10_000 });

    // Verify the voting section exists
    await expect(page.getByText(/Nyano vs Chat|投票ベータ/).first()).toBeVisible();
    await expect(page.getByText(/Vote control|投票操作/).first()).toBeVisible();
    await expect(page.getByText(/Simulated chat input|模擬チャット入力/).first()).toBeVisible();
  });

  test("viewer command guide is visible", async ({ page }) => {
    await page.goto("/stream");
    await expect(page.getByText(/Nyano Stream Studio|配信スタジオ/).first()).toBeVisible({ timeout: 10_000 });

    // RM06-020: Verify the help callout is present
    await expect(page.getByText(/Viewer Command Guide|視聴者コマンド案内/).first()).toBeVisible();
    await expect(page.getByText(/Common mistakes|よくあるミス/).first()).toBeVisible();
  });

  test("copy viewer instructions button works", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/stream");
    await expect(page.getByText(/Nyano Stream Studio|配信スタジオ/).first()).toBeVisible({ timeout: 10_000 });

    // Click "Copy Viewer Instructions"
    const copyBtn = page.getByRole("button", { name: /Copy Viewer Instructions|投票コマンドをコピー|視聴者コマンド/ });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Verify clipboard content contains the command format
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("#triad");
    expect(clipboardText).toMatch(/スロット|slot/i);
  });

  test("chat input shows real-time validation", async ({ page }) => {
    await page.goto("/stream");
    await expect(page.getByText(/Nyano Stream Studio|配信スタジオ/).first()).toBeVisible({ timeout: 10_000 });

    // Enter a valid command
    const chatInput = page.locator("input[placeholder='#triad A2->B2 wm=C3']");
    await chatInput.fill("#triad A2->B2");

    // Should show valid indicator
    await expect(page.getByText(/Valid:|有効:/).first()).toBeVisible({ timeout: 3_000 });

    // Enter an invalid command
    await chatInput.fill("invalid command");

    // Should show invalid indicator
    await expect(page.getByText(/Invalid command|無効なコマンド/).first()).toBeVisible({ timeout: 3_000 });
  });

  test("vote controls are present and interactive", async ({ page }) => {
    await page.goto("/stream");
    await expect(page.getByText(/Nyano Stream Studio|配信スタジオ/).first()).toBeVisible({ timeout: 10_000 });

    // Controlled side selector
    const sideSelect = page.locator("select").filter({ has: page.locator("option", { hasText: "A" }) }).first();
    await expect(sideSelect).toBeVisible();

    // Vote seconds input
    const secondsInput = page.locator("input[type='number']").first();
    await expect(secondsInput).toBeVisible();

    // Start vote button (should be disabled without live state)
    const startBtn = page.getByRole("button", { name: /Start vote|投票開始/ });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeDisabled();

    // CLOSED badge should be visible (use .first() as multiple elements may match)
    await expect(page.getByText(/CLOSED|受付終了|終了/).first()).toBeVisible();
  });
});
