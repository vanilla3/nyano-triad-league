import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { BoardViewMint } from "../BoardViewMint";

describe("BoardViewMint", () => {
  const emptyBoard = Array.from({ length: 9 }, () => null) as any;
  const demoCard = {
    tokenId: 1n,
    edges: { up: 5, right: 7, down: 3, left: 6 },
    jankenHand: 0,
    combatStatSum: 21,
    trait: "forest",
  } as any;

  it("adds mint-cell--idle-guide class to idle-guide selectable empty cells", () => {
    const html = renderToStaticMarkup(
      React.createElement(BoardViewMint, {
        board: emptyBoard,
        selectableCells: [0, 1],
        idleGuideSelectables: [0],
        currentPlayer: 0,
        showCoordinates: false,
        gamePhase: "select_cell",
      }),
    );

    const matches = html.match(/mint-cell--idle-guide/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("renders micro VFX overlay elements for placed/flipped cell markers", () => {
    const html = renderToStaticMarkup(
      React.createElement(BoardViewMint, {
        board: emptyBoard,
        selectableCells: [],
        placedCell: 0,
        flippedCells: [1],
        currentPlayer: 0,
        showCoordinates: false,
        gamePhase: "select_cell",
      }),
    );

    expect(html).toContain("mint-cell__ripple");
    expect(html).toContain("mint-cell__burst");
  });

  it("enables board spotlight during select_cell when a selected card is present", () => {
    const html = renderToStaticMarkup(
      React.createElement(BoardViewMint, {
        board: emptyBoard,
        selectableCells: [0, 1, 2],
        currentPlayer: 0,
        showCoordinates: false,
        gamePhase: "select_cell",
        selectedCardPreview: demoCard,
      }),
    );

    expect(html).toContain("mint-board-inner--spotlight");
    expect(html).toContain("mint-cell--spotlight");
  });
});
