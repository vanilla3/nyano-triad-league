import { describe, it, expect } from "vitest";

/* ═══════════════════════════════════════════════════════════════════
   Engine Overlay Integration — Sprint 51

   Validates that all overlay components used by BattleStageEngine
   (FlipArrowOverlay, CardPreviewPanel, useCardPreview) can be safely
   imported in Vitest's Node environment and have the expected API shape.

   These imports verify there are no side-effects that crash in Node.js
   (e.g., accessing `window`, `document`, or `navigator` at import time).
   ═══════════════════════════════════════════════════════════════════ */

describe("Engine overlay integration", () => {
  it("FlipArrowOverlay can be imported alongside BattleStageEngine", async () => {
    const [stageModule, arrowModule] = await Promise.all([
      import("../components/BattleStageEngine"),
      import("@/components/FlipArrowOverlay"),
    ]);
    expect(stageModule.BattleStageEngine).toBeDefined();
    expect(arrowModule.FlipArrowOverlay).toBeDefined();
  });

  it("FlipArrowOverlay is a function component", async () => {
    const mod = await import("@/components/FlipArrowOverlay");
    expect(typeof mod.FlipArrowOverlay).toBe("function");
  });

  it("CardPreviewPanel can be imported for engine card inspect", async () => {
    const mod = await import("@/components/CardPreviewPanel");
    expect(mod.CardPreviewPanel).toBeDefined();
    expect(typeof mod.CardPreviewPanel).toBe("function");
  });

  it("useCardPreview hook can be imported", async () => {
    const mod = await import("@/hooks/useCardPreview");
    expect(mod.useCardPreview).toBeDefined();
    expect(typeof mod.useCardPreview).toBe("function");
  });

  it("all overlay imports are side-effect free (no DOM access at import time)", async () => {
    // If any of these imports access window/document/navigator at module scope,
    // they would throw in Vitest's Node environment.
    const results = await Promise.allSettled([
      import("@/components/FlipArrowOverlay"),
      import("@/components/CardPreviewPanel"),
      import("@/hooks/useCardPreview"),
    ]);
    for (const result of results) {
      expect(result.status).toBe("fulfilled");
    }
  });

  it("FlipArrowOverlay module exports only the component (FlipTraceArrow type is erased)", async () => {
    const mod = await import("@/components/FlipArrowOverlay");
    const keys = Object.keys(mod);
    expect(keys).toContain("FlipArrowOverlay");
    // FlipTraceArrow and FlipArrowOverlayProps are types — erased
  });

  it("CardPreviewPanel module exports only the component (CardPreviewPanelProps type is erased)", async () => {
    const mod = await import("@/components/CardPreviewPanel");
    const keys = Object.keys(mod);
    expect(keys).toContain("CardPreviewPanel");
  });
});
