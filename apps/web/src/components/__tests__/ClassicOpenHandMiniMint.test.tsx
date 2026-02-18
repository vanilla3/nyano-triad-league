import React from "react";
import type { CardData } from "@nyano/triad-engine";
import { describe, expect, it } from "vitest";
import { ClassicOpenHandMiniMint } from "../ClassicOpenHandMiniMint";

function makeCard(tokenId: bigint, edges: [number, number, number, number]): CardData {
  return {
    tokenId,
    edges: {
      up: edges[0],
      right: edges[1],
      down: edges[2],
      left: edges[3],
    },
    jankenHand: 0,
    combatStatSum: edges[0] + edges[1] + edges[2] + edges[3],
  };
}

describe("ClassicOpenHandMiniMint", () => {
  it("exports ClassicOpenHandMiniMint component", async () => {
    const mod = await import("../ClassicOpenHandMiniMint");
    expect(mod.ClassicOpenHandMiniMint).toBeDefined();
    expect(typeof mod.ClassicOpenHandMiniMint).toBe("function");
  });

  it("renders at least five slots and marks open/used states", () => {
    const tree = ClassicOpenHandMiniMint({
      sideLabel: "Player A",
      cards: [
        makeCard(1n, [1, 2, 3, 4]),
        makeCard(2n, [5, 6, 7, 8]),
        null,
      ],
      openCardIndices: new Set([0]),
      usedCardIndices: new Set([1]),
      modeLabel: "THREE OPEN",
    });

    expect(tree.type).toBe("section");
    expect(tree.props.className).toContain("mint-openhand-mini");

    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const header = children[0];
    expect(header.props.className).toBe("mint-openhand-mini__header");

    const slotsWrapper = children[1];
    const slots = React.Children.toArray(slotsWrapper.props.children) as React.ReactElement[];
    expect(slots).toHaveLength(5);
    expect(slots[0].props.className).toContain("mint-openhand-mini__slot--open");
    expect(slots[1].props.className).toContain("mint-openhand-mini__slot--used");
    expect(slots[2].props.className).toContain("mint-openhand-mini__slot--hidden");
  });
});

