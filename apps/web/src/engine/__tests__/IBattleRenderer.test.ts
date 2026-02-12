import { describe, it, expect } from "vitest";

/* ═══════════════════════════════════════════════════════════════════
   IBattleRenderer — module contract tests

   Validates the interface module can be imported in Node.js (no pixi.js
   dependency) and exposes only TypeScript types (erased at compile time).
   ═══════════════════════════════════════════════════════════════════ */

describe("IBattleRenderer interface module", () => {
  it("can be imported without errors (no pixi.js dependency)", async () => {
    const mod = await import("../renderers/IBattleRenderer");
    expect(mod).toBeDefined();
  });

  it("has no runtime exports (types only — including CellInspectCallback)", async () => {
    const mod = await import("../renderers/IBattleRenderer");
    // All exports are TypeScript interfaces/types — erased at compile time.
    // CellSelectCallback, CellInspectCallback, IBattleRenderer, BattleRendererState
    // are all type-only exports → zero runtime keys.
    const keys = Object.keys(mod);
    expect(keys).toHaveLength(0);
  });
});
