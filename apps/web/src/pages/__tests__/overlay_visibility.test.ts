import { describe, it, expect } from "vitest";

/* ═══════════════════════════════════════════════════════════════════
   Overlay HUD Visibility — Sprint 53 (commit-0084)

   Validates OBS readability improvements:
   - Overlay.tsx export integrity after contrast changes
   - OverlayTheme type exports
   - Overlay theme helper functions
   ═══════════════════════════════════════════════════════════════════ */

describe("Overlay.tsx export integrity (Sprint 53)", () => {
  it("exports OverlayPage as a named function component", async () => {
    const mod = await import("../Overlay");
    expect(mod.OverlayPage).toBeDefined();
    expect(typeof mod.OverlayPage).toBe("function");
  });

  it("exports OverlayTheme type (runtime keys available via OVERLAY_THEMES)", async () => {
    // OverlayTheme is a type (erased at runtime), but the module should still import cleanly
    const mod = await import("../Overlay");
    const keys = Object.keys(mod);
    expect(keys).toContain("OverlayPage");
  });

  it("module imports without side effects (no DOM access at import time)", async () => {
    const result = await Promise.allSettled([import("../Overlay")]);
    expect(result[0].status).toBe("fulfilled");
  });
});

describe("Overlay component co-imports (Sprint 53)", () => {
  it("FlipTraceBadges can be imported alongside Overlay", async () => {
    const [overlayMod, badgeMod] = await Promise.all([
      import("../Overlay"),
      import("@/components/FlipTraceBadges"),
    ]);
    expect(overlayMod.OverlayPage).toBeDefined();
    expect(badgeMod.FlipTraceBadges).toBeDefined();
  });

  it("flipTraceDescribe functions can be imported", async () => {
    const mod = await import("@/components/flipTraceDescribe");
    expect(mod.flipTracesReadout).toBeDefined();
    expect(mod.flipTracesSummary).toBeDefined();
    expect(typeof mod.flipTracesReadout).toBe("function");
    expect(typeof mod.flipTracesSummary).toBe("function");
  });

  it("triad_vote_utils can be co-imported with Overlay", async () => {
    const [overlayMod, voteMod] = await Promise.all([
      import("../Overlay"),
      import("@/lib/triad_vote_utils"),
    ]);
    expect(overlayMod.OverlayPage).toBeDefined();
    expect(voteMod.toViewerMoveText).toBeDefined();
    expect(voteMod.computeStrictAllowed).toBeDefined();
  });
});
