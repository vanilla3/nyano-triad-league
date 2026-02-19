import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MatchTurnActionPanel } from "@/features/match/MatchTurnActionPanel";

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

describe("features/match/MatchTurnActionPanel", () => {
  it("filters warning cell options and uses focus select class", () => {
    const tree = MatchTurnActionPanel({
      isRpg: false,
      isStageFocusRoute: true,
      currentWarnRemaining: 2,
      availableCells: [0, 1, 2],
      draftCell: 1,
      draftWarningMarkCell: null,
      isBoardFull: false,
      isAiTurn: false,
      canCommit: false,
      canUndo: true,
      showAiMoveAction: false,
      onChangeDraftWarningMarkCell: () => {},
      onCommitMove: () => {},
      onUndoMove: () => {},
      onAiMove: () => {},
    });
    const selects = collectElementsByType(tree, "select");
    expect(selects).toHaveLength(1);
    expect(selects[0]?.props.className).toContain("h-10");
    const options = collectElementsByType(selects[0]?.props.children, "option");
    const values = options.map((option) => option.props.value);
    expect(values).toEqual(["", "0", "2"]);
  });

  it("forwards callbacks and disabled states", () => {
    const onChangeDraftWarningMarkCell = vi.fn();
    const onCommitMove = vi.fn();
    const onUndoMove = vi.fn();
    const onAiMove = vi.fn();
    const tree = MatchTurnActionPanel({
      isRpg: false,
      isStageFocusRoute: false,
      currentWarnRemaining: 1,
      availableCells: [0, 1],
      draftCell: null,
      draftWarningMarkCell: 1,
      isBoardFull: false,
      isAiTurn: false,
      canCommit: true,
      canUndo: false,
      showAiMoveAction: true,
      onChangeDraftWarningMarkCell,
      onCommitMove,
      onUndoMove,
      onAiMove,
    });
    const select = collectElementsByType(tree, "select")[0];
    const buttons = collectElementsByType(tree, "button");
    select?.props.onChange({ target: { value: "0" } });
    select?.props.onChange({ target: { value: "" } });
    expect(onChangeDraftWarningMarkCell).toHaveBeenNthCalledWith(1, 0);
    expect(onChangeDraftWarningMarkCell).toHaveBeenNthCalledWith(2, null);
    expect(buttons[0]?.props.disabled).toBe(false);
    expect(buttons[1]?.props.disabled).toBe(true);
    buttons[0]?.props.onClick();
    buttons[1]?.props.onClick();
    buttons[2]?.props.onClick();
    expect(onCommitMove).toHaveBeenCalledTimes(1);
    expect(onUndoMove).toHaveBeenCalledTimes(1);
    expect(onAiMove).toHaveBeenCalledTimes(1);
  });

  it("uses rpg button classes and hides ai button when disabled", () => {
    const tree = MatchTurnActionPanel({
      isRpg: true,
      isStageFocusRoute: false,
      currentWarnRemaining: 0,
      availableCells: [],
      draftCell: null,
      draftWarningMarkCell: null,
      isBoardFull: true,
      isAiTurn: false,
      canCommit: false,
      canUndo: true,
      showAiMoveAction: false,
      onChangeDraftWarningMarkCell: () => {},
      onCommitMove: () => {},
      onUndoMove: () => {},
      onAiMove: () => {},
    });
    const select = collectElementsByType(tree, "select")[0];
    const buttons = collectElementsByType(tree, "button");
    expect(select?.props.disabled).toBe(true);
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.props.className).toBe("rpg-result__btn rpg-result__btn--primary");
    expect(buttons[1]?.props.className).toBe("rpg-result__btn");
  });
});
