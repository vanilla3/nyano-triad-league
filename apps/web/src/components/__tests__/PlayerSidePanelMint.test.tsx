import React from "react";
import { describe, expect, it } from "vitest";
import { PlayerSidePanelMint } from "../PlayerSidePanelMint";
import { ClassicOpenHandMiniMint } from "../ClassicOpenHandMiniMint";

describe("PlayerSidePanelMint", () => {
  it("exports PlayerSidePanelMint component", async () => {
    const mod = await import("../PlayerSidePanelMint");
    expect(mod.PlayerSidePanelMint).toBeDefined();
    expect(typeof mod.PlayerSidePanelMint).toBe("function");
  });

  it("renders player label and remaining cards", () => {
    const tree = PlayerSidePanelMint({
      side: "left",
      playerIndex: 0,
      isActive: true,
      remainingCards: 3,
    });

    expect(tree.type).toBe("aside");
    expect(tree.props.className).toContain("mint-player-panel");
    expect(tree.props.className).toContain("mint-player-panel--active");
    expect(tree.props["aria-label"]).toBe("プレイヤーA ステータス (Player A status)");

    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const nameNode = children.find((child) => (child.props as { className?: string }).className === "mint-player-panel__name");
    const remainingNode = children.find((child) => (child.props as { className?: string }).className === "mint-player-panel__remaining");

    expect(nameNode?.props.children).toBe("プレイヤーA");
    expect(remainingNode?.props["aria-label"]).toBe("プレイヤーA 残りカード 3 (Player A remaining cards 3)");
  });

  it("renders open hand mini when openHand prop is provided", () => {
    const tree = PlayerSidePanelMint({
      side: "right",
      playerIndex: 1,
      isActive: false,
      remainingCards: 4,
      openHand: {
        cards: [],
        openCardIndices: new Set<number>([0, 2]),
        usedCardIndices: new Set<number>([1]),
        modeLabel: "THREE OPEN",
      },
    });

    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const openHandNode = children.find((child) => child.type === ClassicOpenHandMiniMint);
    expect(openHandNode).toBeDefined();
    expect(openHandNode?.props.className).toContain("mint-player-panel__openhand");
  });
});
