import { test, expect } from "@playwright/test";

const HEX_32_RE = /^0x[0-9a-fA-F]{64}$/;
const SEED = `0x${"11".repeat(32)}`;
const REVEAL_A = `0x${"22".repeat(32)}`;
const REVEAL_B = `0x${"33".repeat(32)}`;
const COMMIT_A = `0x${"44".repeat(32)}`;
const COMMIT_B = `0x${"55".repeat(32)}`;

test.describe("Match first-player mode URL params", () => {
  test("switching to commit_reveal fills required inputs and clears unrelated mode params", async ({ page }) => {
    await page.goto(
      `/match?fpm=manual&fpsd=${SEED}&fpoa=0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa&fpna=${REVEAL_A}&fcoa=${COMMIT_A}`,
    );

    await expect(page.getByLabel("First player mode")).toBeVisible({ timeout: 10_000 });
    await page.getByLabel("First player mode").selectOption("commit_reveal");

    await expect.poll(() => new URL(page.url()).searchParams.get("fpm")).toBe("commit_reveal");
    await expect.poll(() => {
      const params = new URL(page.url()).searchParams;
      const fps = params.get("fps");
      const fra = params.get("fra");
      const frb = params.get("frb");
      return Boolean(fps && fra && frb && HEX_32_RE.test(fps) && HEX_32_RE.test(fra) && HEX_32_RE.test(frb));
    }).toBe(true);
    await expect.poll(() => new URL(page.url()).searchParams.has("fpsd")).toBe(false);
    await expect.poll(() => new URL(page.url()).searchParams.has("fpoa")).toBe(false);
    await expect.poll(() => new URL(page.url()).searchParams.has("fpna")).toBe(false);
    await expect.poll(() => new URL(page.url()).searchParams.has("fcoa")).toBe(false);
  });

  test("switching to committed_mutual_choice fills choice/nonce defaults and drops commit-reveal params", async ({ page }) => {
    await page.goto(
      `/match?fpm=commit_reveal&fps=${SEED}&fra=${REVEAL_A}&frb=${REVEAL_B}&fca=${COMMIT_A}&fcb=${COMMIT_B}`,
    );

    await expect(page.getByLabel("First player mode")).toBeVisible({ timeout: 10_000 });
    await page.getByLabel("First player mode").selectOption("committed_mutual_choice");

    await expect.poll(() => new URL(page.url()).searchParams.get("fpm")).toBe("committed_mutual_choice");
    await expect.poll(() => {
      const params = new URL(page.url()).searchParams;
      const fps = params.get("fps");
      const fpna = params.get("fpna");
      const fpnb = params.get("fpnb");
      return Boolean(fps && fpna && fpnb && HEX_32_RE.test(fps) && HEX_32_RE.test(fpna) && HEX_32_RE.test(fpnb));
    }).toBe(true);
    await expect.poll(() => new URL(page.url()).searchParams.get("fpa")).toBe("0");
    await expect.poll(() => new URL(page.url()).searchParams.get("fpb")).toBe("0");
    await expect.poll(() => new URL(page.url()).searchParams.get("fpoa")).toBe(
      "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
    );
    await expect.poll(() => new URL(page.url()).searchParams.get("fpob")).toBe(
      "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
    );

    await expect.poll(() => new URL(page.url()).searchParams.has("fra")).toBe(false);
    await expect.poll(() => new URL(page.url()).searchParams.has("frb")).toBe(false);
    await expect.poll(() => new URL(page.url()).searchParams.has("fca")).toBe(false);
    await expect.poll(() => new URL(page.url()).searchParams.has("fcb")).toBe(false);
    await expect.poll(() => new URL(page.url()).searchParams.has("fpsd")).toBe(false);
  });
});

