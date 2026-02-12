import { describe, it, expect } from "vitest";

/* ═══════════════════════════════════════════════════════════════════
   BattleStageEngine — module export contract tests

   Validates the React component is exported correctly. Since Vitest
   runs in `environment: "node"` (no DOM), we test module structure
   only — not rendering. PixiJS is loaded via dynamic import() inside
   useEffect, so importing BattleStageEngine here is safe.
   ═══════════════════════════════════════════════════════════════════ */

describe("BattleStageEngine", () => {
  it("exports BattleStageEngine as a named export", async () => {
    const mod = await import("../components/BattleStageEngine");
    expect(mod.BattleStageEngine).toBeDefined();
    expect(typeof mod.BattleStageEngine).toBe("function");
  });

  it("does not have a default export", async () => {
    const mod = await import("../components/BattleStageEngine");
    expect(
      "default" in mod ? (mod as Record<string, unknown>).default : undefined,
    ).toBeUndefined();
  });

  it("BattleStageEngine is the only runtime export (props type is erased)", async () => {
    const mod = await import("../components/BattleStageEngine");
    const keys = Object.keys(mod);
    expect(keys).toContain("BattleStageEngine");
    // BattleStageEngineProps is a type — erased at compile time
    expect(keys).toHaveLength(1);
  });
});
