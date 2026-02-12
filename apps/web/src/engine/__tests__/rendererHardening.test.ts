import { describe, it, expect } from "vitest";

/* ═══════════════════════════════════════════════════════════════════
   Renderer Hardening — Sprint 52

   Validates quality hardening changes:
   - errorMessage utility reachable from engine context
   - textureResolver import safety
   - BattleStageEngine export integrity after initError addition
   - Overlay component import compatibility
   ═══════════════════════════════════════════════════════════════════ */

describe("errorMessage utility (engine context)", () => {
  it("can be imported from @/lib/errorMessage", async () => {
    const mod = await import("@/lib/errorMessage");
    expect(mod.errorMessage).toBeDefined();
    expect(typeof mod.errorMessage).toBe("function");
  });

  it("extracts message from Error instances", async () => {
    const { errorMessage } = await import("@/lib/errorMessage");
    expect(errorMessage(new Error("WebGL not available"))).toBe("WebGL not available");
  });

  it("handles string throws", async () => {
    const { errorMessage } = await import("@/lib/errorMessage");
    expect(errorMessage("something broke")).toBe("something broke");
  });

  it("handles non-Error, non-string throws gracefully", async () => {
    const { errorMessage } = await import("@/lib/errorMessage");
    expect(errorMessage(42)).toBe("42");
    expect(errorMessage(null)).toBe("Unknown error");
    expect(errorMessage(undefined)).toBe("Unknown error");
  });
});

describe("textureResolver module safety", () => {
  it("tokenImageUrls can be imported without pixi.js dependency", async () => {
    // tokenImageUrls is a pure helper — no pixi.js import
    const mod = await import("../renderers/pixi/tokenImageUrls");
    expect(mod.buildTokenImageUrls).toBeDefined();
    expect(typeof mod.buildTokenImageUrls).toBe("function");
  });
});

describe("BattleStageEngine export integrity (Sprint 52)", () => {
  it("still exports only BattleStageEngine after adding initError state", async () => {
    const mod = await import("../components/BattleStageEngine");
    expect(Object.keys(mod)).toEqual(["BattleStageEngine"]);
    expect(typeof mod.BattleStageEngine).toBe("function");
  });
});

describe("Overlay component import compatibility (Sprint 52)", () => {
  it("FlipArrowOverlay and CardPreviewPanel can be co-imported with engine", async () => {
    const results = await Promise.allSettled([
      import("../components/BattleStageEngine"),
      import("@/components/FlipArrowOverlay"),
      import("@/components/CardPreviewPanel"),
      import("@/hooks/useCardPreview"),
    ]);
    for (const result of results) {
      expect(result.status).toBe("fulfilled");
    }
  });
});
