/**
 * panels.test.ts
 *
 * Smoke tests for extracted stream panel components.
 * These panels are purely presentational (React.memo) and receive all state/callbacks as props.
 * This file validates that the module exports are correctly structured.
 *
 * Full rendering tests would require @testing-library/react (not currently configured).
 */
import { describe, it, expect } from "vitest";

describe("WarudoBridgePanel", () => {
  it("exports WarudoBridgePanel component", async () => {
    const mod = await import("../WarudoBridgePanel");
    expect(mod.WarudoBridgePanel).toBeDefined();
    expect(typeof mod.WarudoBridgePanel).toBe("object"); // React.memo wraps as object
  });
});

describe("VoteControlPanel", () => {
  it("exports VoteControlPanel component", async () => {
    const mod = await import("../VoteControlPanel");
    expect(mod.VoteControlPanel).toBeDefined();
    expect(typeof mod.VoteControlPanel).toBe("object"); // React.memo wraps as object
  });

  it("VoteControlPanel type has a name starting with VoteControlPanel", async () => {
    const mod = await import("../VoteControlPanel");
    // React.memo components have a type property with the name
    // Bundlers may suffix with a number (e.g. "VoteControlPanel2") so match prefix
    const panel = mod.VoteControlPanel as unknown as { displayName?: string; type?: { name?: string } };
    const name = panel.type?.name ?? panel.displayName ?? "";
    expect(name).toMatch(/^VoteControlPanel/);
  });
});
