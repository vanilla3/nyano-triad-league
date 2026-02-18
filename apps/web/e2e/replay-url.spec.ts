import { test, expect } from "@playwright/test";
import { gzipSync } from "node:zlib";

/* ─── Fixture: golden vector 1 transcript ─── */

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

/* ─── Encoding helpers (Node.js side — no page.evaluate needed) ─── */

/** Encode transcript JSON to z= parameter via Node.js zlib gzip + base64url. */
function encodeTranscriptZ(json: string): string {
  const compressed = gzipSync(Buffer.from(json, "utf-8"));
  return compressed.toString("base64url");
}

/** Encode transcript JSON to t= parameter via plain base64url. */
function encodeTranscriptT(json: string): string {
  return Buffer.from(json, "utf-8").toString("base64url");
}

test("Replay page shows form and keyboard legend", async ({ page }) => {
  await page.goto("/replay");
  await expect(page.getByText(/Replay from transcript|リプレイ読込/).first()).toBeVisible({ timeout: 10_000 });
  // Keyboard legend is always visible
  await expect(page.getByText(/play\/pause|再生\s*\/\s*停止/).first()).toBeVisible();
  // Textarea for transcript JSON input should be present
  await expect(page.locator("textarea")).toBeVisible();
});

test("Replay rejects invalid z= parameter gracefully", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/replay?z=invaliddata");
  // Should show error message, not crash
  await page.waitForTimeout(3000);
  await expect(page.locator("text=RPC Error")).not.toBeVisible();

  // Page should still be functional (no fatal JS error)
  expect(errors).toEqual([]);
});

/* ═══════════════════════════════════════════════════════════════════
   E2E Replay Playback Tests (Sprint 24 — Phase 3)
   ═══════════════════════════════════════════════════════════════════ */

test("Replay loads and decodes z= parameter correctly", async ({ page }) => {
  const zParam = encodeTranscriptZ(TRANSCRIPT_JSON);

  // Navigate with the z= parameter
  await page.goto(`/replay?z=${zParam}`);
  await expect(page.getByText(/Replay from transcript|リプレイ読込/).first()).toBeVisible({ timeout: 10_000 });

  // The textarea should contain the decoded transcript JSON
  const textarea = page.locator("textarea");
  await expect(textarea).toBeVisible({ timeout: 5_000 });
  const value = await textarea.inputValue();
  // Decoded JSON should contain our header fields
  expect(value).toContain('"version"');
  expect(value).toContain('"deckA"');
});

test("Replay loads and decodes t= parameter correctly", async ({ page }) => {
  const tParam = encodeTranscriptT(TRANSCRIPT_JSON);

  await page.goto(`/replay?t=${tParam}`);
  await expect(page.getByText(/Replay from transcript|リプレイ読込/).first()).toBeVisible({ timeout: 10_000 });

  // The textarea should contain the decoded transcript JSON
  const textarea = page.locator("textarea");
  await expect(textarea).toBeVisible({ timeout: 5_000 });
  const value = await textarea.inputValue();
  expect(value).toContain('"version"');
  expect(value).toContain('"playerA"');
});

test("Replay shows error on RPC failure gracefully", async ({ page }) => {
  // Block game index AND all RPC endpoints to simulate complete network failure.
  // Since resolveCards() tries game index first (fast/cached), we must block it
  // too — otherwise tokens 1-10 are resolved from the static index.v1.json and
  // no RPC call is ever made.
  await page.route("**/game/index.v1.json", (route) => route.abort());
  await page.route("**/*publicnode*", (route) => route.abort());
  await page.route("**/*ankr*", (route) => route.abort());
  await page.route("**/*llamarpc*", (route) => route.abort());
  await page.route("**/*cloudflare*", (route) => route.abort());

  // Clear any cached game index from localStorage so it cannot be reused
  await page.goto("/replay");
  await page.evaluate(() => {
    try { localStorage.removeItem("nyano.gameIndex.v1"); } catch { /* noop */ }
  });

  const zParam = encodeTranscriptZ(TRANSCRIPT_JSON);
  await page.goto(`/replay?z=${zParam}`);

  // Click "Load & replay"
  const loadBtn = page.getByRole("button", { name: /Load replay|読み込む/ }).first();
  await expect(loadBtn).toBeVisible({ timeout: 10_000 });
  await loadBtn.click();

  // Should show an error message (card resolution failure) — page should not crash
  // The error appears in rose-700 text
  await expect(page.locator(".text-rose-700").first()).toBeVisible({ timeout: 30_000 });

  // Verify page is still functional (form is still there)
  await expect(page.getByText(/Replay from transcript|リプレイ読込/).first()).toBeVisible();
});

test("Replay decodes z= without fatal JS errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  const zParam = encodeTranscriptZ(TRANSCRIPT_JSON);
  await page.goto(`/replay?z=${zParam}`);

  // Confirm transcript was decoded into textarea
  const textarea = page.locator("textarea");
  await expect(textarea).toBeVisible({ timeout: 5_000 });
  const value = await textarea.inputValue();
  expect(value).toContain('"playerA"');
  expect(value).toContain('"turns"');

  // No fatal JS errors from the z= decoding
  expect(errors).toEqual([]);
});
