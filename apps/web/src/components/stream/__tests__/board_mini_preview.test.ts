import { describe, it, expect } from "vitest";
import type { BoardMiniPreviewProps } from "../BoardMiniPreview";
import type { BoardCellLite } from "@/lib/streamer_bus";

/* ═══════════════════════════════════════════════════════════════════
   board_mini_preview.test.ts

   Unit tests for BoardMiniPreview component types and data contracts.
   Since this is a purely presentational component, we test the data
   contract (props shape) and verify the component can be imported.
   ═══════════════════════════════════════════════════════════════════ */

/** Minimal mock cell — BoardMiniPreview only reads `owner`. */
function mkCell(owner: 0 | 1): BoardCellLite {
  return {
    owner,
    card: { tokenId: 1n, edges: { up: 5, right: 5, down: 5, left: 5 }, jankenHand: 0 },
  };
}

describe("BoardMiniPreview", () => {
  it("exports BoardMiniPreview component", async () => {
    const mod = await import("../BoardMiniPreview");
    expect(typeof mod.BoardMiniPreview).toBe("object"); // React.memo wraps as object
  });

  it("accepts an empty board (all nulls)", () => {
    const board: (BoardCellLite | null)[] = Array(9).fill(null);
    const props: BoardMiniPreviewProps = { board };
    expect(props.board.length).toBe(9);
    expect(props.board.every((c) => c === null)).toBe(true);
  });

  it("accepts a partially filled board with lastCell", () => {
    const board: (BoardCellLite | null)[] = [
      mkCell(0), null, null,
      null, mkCell(1), null,
      null, null, mkCell(0),
    ];
    const props: BoardMiniPreviewProps = { board, lastCell: 8 };
    expect(props.board.filter((c) => c !== null).length).toBe(3);
    expect(props.lastCell).toBe(8);
  });

  it("accepts a fully filled board", () => {
    const board: (BoardCellLite | null)[] = [
      mkCell(0), mkCell(1), mkCell(0),
      mkCell(1), mkCell(0), mkCell(1),
      mkCell(0), mkCell(1), mkCell(0),
    ];
    const props: BoardMiniPreviewProps = { board, lastCell: 7 };
    expect(props.board.filter((c) => c !== null).length).toBe(9);
  });
});
