import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BoardViewMint } from "../BoardViewMint";
import type { BoardState } from "@nyano/triad-engine";

const EMPTY_BOARD: BoardState = Array.from({ length: 9 }, () => null);

describe("BoardViewMint", () => {
  it("renders the round track and Japanese placement prompt", () => {
    const html = renderToStaticMarkup(
      <BoardViewMint
        board={EMPTY_BOARD}
        currentPlayer={0}
        selectableCells={new Set([0, 1, 2])}
        gamePhase="select_cell"
      />,
    );

    expect(html).toContain("mint-turn-track");
    expect(html).toContain("配置チャンス");
    expect(html).toContain("光っているマスにカードを置けます");
    expect(html).toContain("置く");
    expect(html).toContain("mint-board-frame--player-a");
  });
});
