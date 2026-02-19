import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MatchQuickCommitBar } from "@/features/match/MatchQuickCommitBar";

function collectElementsByType(node: React.ReactNode, type: string): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  const walk = (value: React.ReactNode): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!React.isValidElement(value)) return;
    if (value.type === type) out.push(value);
    walk(value.props.children as React.ReactNode);
  };
  walk(node);
  return out;
}

describe("features/match/MatchQuickCommitBar", () => {
  it("filters warning options against selected draft cell", () => {
    const tree = MatchQuickCommitBar({
      draftCardIndex: null,
      draftCell: 1,
      draftWarningMarkCell: null,
      onChangeDraftWarningMarkCell: () => {},
      isBoardFull: false,
      isAiTurn: false,
      currentWarnRemaining: 2,
      availableCells: [0, 1, 2],
      canCommit: false,
      canUndo: false,
      onCommitMove: () => {},
      onUndoMove: () => {},
    });
    const select = collectElementsByType(tree, "select")[0];
    const options = collectElementsByType(select?.props.children, "option");
    const values = options.map((option) => option.props.value);
    expect(values).toEqual(["", "0", "2"]);
  });

  it("forwards warning/select callbacks and button actions", () => {
    const onChangeDraftWarningMarkCell = vi.fn();
    const onCommitMove = vi.fn();
    const onUndoMove = vi.fn();
    const tree = MatchQuickCommitBar({
      draftCardIndex: 2,
      draftCell: 4,
      draftWarningMarkCell: 3,
      onChangeDraftWarningMarkCell,
      isBoardFull: false,
      isAiTurn: false,
      currentWarnRemaining: 2,
      availableCells: [3, 4, 5],
      canCommit: true,
      canUndo: true,
      onCommitMove,
      onUndoMove,
    });

    const select = collectElementsByType(tree, "select")[0];
    const buttons = collectElementsByType(tree, "button");
    select?.props.onChange({ target: { value: "5" } });
    select?.props.onChange({ target: { value: "" } });
    expect(onChangeDraftWarningMarkCell).toHaveBeenNthCalledWith(1, 5);
    expect(onChangeDraftWarningMarkCell).toHaveBeenNthCalledWith(2, null);

    buttons[0]?.props.onClick();
    buttons[1]?.props.onClick();
    expect(onCommitMove).toHaveBeenCalledTimes(1);
    expect(onUndoMove).toHaveBeenCalledTimes(1);
  });

  it("disables select/commit/undo based on gating flags", () => {
    const tree = MatchQuickCommitBar({
      draftCardIndex: null,
      draftCell: null,
      draftWarningMarkCell: null,
      onChangeDraftWarningMarkCell: () => {},
      isBoardFull: true,
      isAiTurn: true,
      currentWarnRemaining: 0,
      availableCells: [],
      canCommit: false,
      canUndo: false,
      onCommitMove: () => {},
      onUndoMove: () => {},
    });
    const select = collectElementsByType(tree, "select")[0];
    const buttons = collectElementsByType(tree, "button");
    expect(select?.props.disabled).toBe(true);
    expect(buttons[0]?.props.disabled).toBe(true);
    expect(buttons[1]?.props.disabled).toBe(true);
  });
});
