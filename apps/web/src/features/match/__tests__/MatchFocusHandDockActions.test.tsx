import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MatchFocusHandDockActions } from "@/features/match/MatchFocusHandDockActions";

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

describe("features/match/MatchFocusHandDockActions", () => {
  it("filters warning cell options against selected draft cell", () => {
    const tree = MatchFocusHandDockActions({
      draftWarningMarkCell: null,
      onChangeDraftWarningMarkCell: () => {},
      currentWarnRemaining: 2,
      isAiTurn: false,
      availableCells: [0, 1, 2],
      draftCell: 1,
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

  it("forwards warning/select callbacks and button disabled states", () => {
    const onChangeDraftWarningMarkCell = vi.fn();
    const onCommitMove = vi.fn();
    const onUndoMove = vi.fn();
    const tree = MatchFocusHandDockActions({
      draftWarningMarkCell: 2,
      onChangeDraftWarningMarkCell,
      currentWarnRemaining: 1,
      isAiTurn: false,
      availableCells: [2],
      draftCell: null,
      canCommit: true,
      canUndo: false,
      onCommitMove,
      onUndoMove,
    });
    const select = collectElementsByType(tree, "select")[0];
    const buttons = collectElementsByType(tree, "button");
    select?.props.onChange({ target: { value: "2" } });
    select?.props.onChange({ target: { value: "" } });
    expect(onChangeDraftWarningMarkCell).toHaveBeenNthCalledWith(1, 2);
    expect(onChangeDraftWarningMarkCell).toHaveBeenNthCalledWith(2, null);
    expect(buttons[0]?.props.disabled).toBe(false);
    expect(buttons[1]?.props.disabled).toBe(true);
    expect(buttons[0]?.props.className).toContain("mint-pressable");
    expect(buttons[0]?.props.className).toContain("mint-hit");
    expect(buttons[1]?.props.className).toContain("mint-pressable");
    expect(buttons[1]?.props.className).toContain("mint-hit");
    buttons[0]?.props.onClick();
    buttons[1]?.props.onClick();
    expect(onCommitMove).toHaveBeenCalledTimes(1);
    expect(onUndoMove).toHaveBeenCalledTimes(1);
  });

  it("disables warning selector when ai turn or warnings depleted", () => {
    const tree = MatchFocusHandDockActions({
      draftWarningMarkCell: null,
      onChangeDraftWarningMarkCell: () => {},
      currentWarnRemaining: 0,
      isAiTurn: true,
      availableCells: [],
      draftCell: null,
      canCommit: false,
      canUndo: false,
      onCommitMove: () => {},
      onUndoMove: () => {},
    });
    const select = collectElementsByType(tree, "select")[0];
    expect(select?.props.disabled).toBe(true);
  });
});
