// One-off: capture "after" screenshots of the upgraded card codex + decks browser.
// Usage: node scripts/capture_after_shots.mjs  (dev server must be running on :5173)
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT_DIR = "test-artifacts/visual-after";
mkdirSync(OUT_DIR, { recursive: true });

const BASE = process.env.BASE_URL ?? "http://localhost:5173";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// 1) Card codex (/nyano) — new offline zukan with tier frames
await page.goto(`${BASE}/nyano?theme=mint`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".mint-card-browser__grid", { timeout: 20_000 });
await page.waitForTimeout(1500); // let entrance animation + images settle
await page.screenshot({ path: `${OUT_DIR}/zukan-nyano-after.png`, fullPage: false });
console.log("saved zukan-nyano-after.png");

// 2) Decks browser panel
await page.goto(`${BASE}/decks?theme=mint`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".mint-card-browser__grid", { timeout: 20_000 });
await page.waitForTimeout(1200);
const panel = page.locator(".mint-decks-browser-panel");
await panel.screenshot({ path: `${OUT_DIR}/decks-browser-after.png` });
console.log("saved decks-browser-after.png");

// 3) Mobile dex (390px)
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/nyano?theme=mint`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".mint-card-browser__grid", { timeout: 20_000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT_DIR}/zukan-mobile-after.png`, fullPage: false });
console.log("saved zukan-mobile-after.png");

await browser.close();
