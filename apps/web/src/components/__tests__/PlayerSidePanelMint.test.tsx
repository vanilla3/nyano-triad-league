import React from "react";
import { describe, expect, it } from "vitest";
import { PlayerSidePanelMint } from "../PlayerSidePanelMint";

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
    expect(tree.props["aria-label"]).toBe("Player A status");

    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const nameNode = children.find((child) => (child.props as { className?: string }).className === "mint-player-panel__name");
    const remainingNode = children.find((child) => (child.props as { className?: string }).className === "mint-player-panel__remaining");

    expect(nameNode?.props.children).toBe("Player A");
    expect(remainingNode?.props["aria-label"]).toBe("Player A の残りカード 3");
  });
});
