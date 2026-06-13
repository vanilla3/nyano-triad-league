import React from "react";
import { describe, expect, it } from "vitest";
import { BattleTopHudMint } from "../BattleTopHudMint";

describe("BattleTopHudMint", () => {
  it("exports BattleTopHudMint component", async () => {
    const mod = await import("../BattleTopHudMint");
    expect(mod.BattleTopHudMint).toBeDefined();
    expect(typeof mod.BattleTopHudMint).toBe("function");
  });

  it("renders logo, score, and turn from board state", () => {
    const tree = BattleTopHudMint({
      board: [
        {
          owner: 0,
          card: { tokenId: 1n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 4 },
          state: { forestShield: 0 },
        },
        {
          owner: 1,
          card: { tokenId: 2n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 4 },
          state: { forestShield: 0 },
        },
        {
          owner: 1,
          card: { tokenId: 3n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 4 },
          state: { forestShield: 0 },
        },
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      turnCount: 3,
      maxTurns: 9,
      currentPlayer: 1,
    });

    expect(tree.type).toBe("div");
    expect(tree.props.className).toContain("mint-top-hud");
    expect(tree.props["aria-label"]).toBe("Match top HUD");

    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const score = children.find((child) => (child.props as { className?: string }).className === "mint-top-hud__score");
    const turn = children.find((child) => (child.props as { className?: string }).className === "mint-top-hud__turn");

    expect(score).toBeTruthy();
    expect(turn).toBeTruthy();
    expect(score?.props["aria-label"]).toBe("Score A 1, B 2");
    expect(turn?.props["aria-label"]).toBe("Turn 3 of 9");
  });
});
