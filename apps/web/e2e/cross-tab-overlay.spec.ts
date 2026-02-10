import { test, expect, type BrowserContext, type Page } from "@playwright/test";

/**
 * E2E: Cross-tab overlay communication
 *
 * Verifies that the /overlay page receives state from a "stream" tab
 * via BroadcastChannel and localStorage.
 *
 * Playwright's context.newPage() creates pages within the same BrowserContext,
 * sharing localStorage and BroadcastChannel (Chromium).
 */

/* ─── Constants (must match streamer_bus.ts) ─── */

const OVERLAY_CHANNEL = "nyano-triad-league.overlay.v1";
const OVERLAY_STORAGE_KEY = "nyano_triad_league.overlay_state_v1";

const VOTE_CHANNEL = "nyano-triad-league.stream_vote.v1";
const VOTE_STORAGE_KEY = "nyano_triad_league.stream_vote_state_v1";

/* ─── Fixtures ─── */

function sampleOverlayState() {
  return {
    version: 1,
    updatedAtMs: Date.now(),
    mode: "live" as const,
    eventId: "e2e-test-event",
    eventTitle: "E2E Cross-Tab Test",
    turn: 3,
    firstPlayer: 0 as const,
    playerA: "0x" + "aa".repeat(20),
    playerB: "0x" + "bb".repeat(20),
    board: Array.from({ length: 9 }, () => null),
    lastMove: {
      turnIndex: 2,
      by: 0 as const,
      cell: 4,
      cardIndex: 0,
    },
  };
}

function sampleVoteState() {
  return {
    version: 1,
    updatedAtMs: Date.now(),
    status: "open" as const,
    eventId: "e2e-test-event",
    eventTitle: "E2E Cross-Tab Test",
    turn: 3,
    controlledSide: 0 as const,
    endsAtMs: Date.now() + 30_000,
    totalVotes: 42,
    top: [
      { move: { cell: 5, cardIndex: 1 }, count: 15 },
      { move: { cell: 7, cardIndex: 2 }, count: 12 },
    ],
  };
}

/* ─── Helpers ─── */

/** Publish an overlay state from the source page via BroadcastChannel + localStorage. */
async function publishOverlayFromPage(page: Page, state: object) {
  await page.evaluate(
    ([channelName, storageKey, stateJson]) => {
      const s = JSON.parse(stateJson);
      localStorage.setItem(storageKey, JSON.stringify(s));
      const bc = new BroadcastChannel(channelName);
      bc.postMessage({ type: "overlay_state_v1", state: s });
      bc.close();
    },
    [OVERLAY_CHANNEL, OVERLAY_STORAGE_KEY, JSON.stringify(state)] as const,
  );
}

/** Publish a vote state from the source page via BroadcastChannel + localStorage. */
async function publishVoteFromPage(page: Page, state: object) {
  await page.evaluate(
    ([channelName, storageKey, stateJson]) => {
      const s = JSON.parse(stateJson);
      localStorage.setItem(storageKey, JSON.stringify(s));
      const bc = new BroadcastChannel(channelName);
      bc.postMessage({ type: "stream_vote_state_v1", state: s });
      bc.close();
    },
    [VOTE_CHANNEL, VOTE_STORAGE_KEY, JSON.stringify(state)] as const,
  );
}

/** Write overlay state to localStorage only (no BroadcastChannel). */
async function writeOverlayToStorage(page: Page, state: object) {
  await page.evaluate(
    ([storageKey, stateJson]) => {
      localStorage.setItem(storageKey, stateJson);
    },
    [OVERLAY_STORAGE_KEY, JSON.stringify(state)] as const,
  );
}

/* ─── Tests ─── */

test.describe("Cross-tab overlay communication", () => {
  test("overlay receives overlay state via BroadcastChannel", async ({ context }) => {
    // Open two pages: one acts as "stream" (publisher), other is the overlay
    const streamPage = await context.newPage();
    const overlayPage = await context.newPage();

    // Navigate overlay page first so it subscribes to BroadcastChannel
    await overlayPage.goto("/overlay?controls=1");
    await overlayPage.waitForLoadState("networkidle");

    // Navigate stream page (just needs to be on same origin for BroadcastChannel)
    await streamPage.goto("/");
    await streamPage.waitForLoadState("networkidle");

    // Publish overlay state from stream page
    const state = sampleOverlayState();
    await publishOverlayFromPage(streamPage, state);

    // Overlay should render the event title from the published state
    // The title appears in multiple places; use .first() to avoid strict mode violation
    await expect(overlayPage.getByText("E2E Cross-Tab Test").first()).toBeVisible({ timeout: 5_000 });

    // Overlay should show "Now Playing" panel
    await expect(overlayPage.getByText("Now Playing")).toBeVisible({ timeout: 3_000 });
  });

  test("overlay receives vote state when stream publishes vote open", async ({ context }) => {
    const streamPage = await context.newPage();
    const overlayPage = await context.newPage();

    // Navigate overlay with vote panel enabled
    await overlayPage.goto("/overlay?controls=1&vote=1");
    await overlayPage.waitForLoadState("networkidle");

    await streamPage.goto("/");
    await streamPage.waitForLoadState("networkidle");

    // First publish overlay state so the overlay has context
    const overlayState = sampleOverlayState();
    await publishOverlayFromPage(streamPage, overlayState);

    // Then publish vote state
    const voteState = sampleVoteState();
    await publishVoteFromPage(streamPage, voteState);

    // Overlay should show "Chat voting" section with OPEN badge
    await expect(overlayPage.getByText("Chat voting")).toBeVisible({ timeout: 5_000 });
    await expect(overlayPage.getByText("OPEN", { exact: true })).toBeVisible({ timeout: 3_000 });

    // Overlay should show vote countdown (remaining seconds)
    await expect(overlayPage.getByText(/remaining/)).toBeVisible({ timeout: 3_000 });
  });

  test("localStorage persistence allows overlay recovery after refresh", async ({ context }) => {
    // First page writes state to localStorage (simulating a stream tab)
    const writerPage = await context.newPage();
    await writerPage.goto("/");
    await writerPage.waitForLoadState("networkidle");

    const state = sampleOverlayState();
    await writeOverlayToStorage(writerPage, state);

    // Now open the overlay page fresh — it should recover state from localStorage
    const overlayPage = await context.newPage();
    await overlayPage.goto("/overlay?controls=1");

    // Overlay reads localStorage on mount via readStoredOverlayState()
    await expect(overlayPage.getByText("E2E Cross-Tab Test").first()).toBeVisible({ timeout: 5_000 });
    await expect(overlayPage.getByText("Now Playing")).toBeVisible({ timeout: 3_000 });
  });
});
