import React from "react";
import { describe, expect, it, vi } from "vitest";
import { TurnLog } from "@/components/TurnLog";
import { MatchMintTurnLogPanel } from "@/features/match/MatchMintTurnLogPanel";

describe("features/match/MatchMintTurnLogPanel", () => {
  it("renders fallback label when sim is not ready", () => {
    const tree = MatchMintTurnLogPanel({
      simOk: false,
      turns: [],
      selectedTurnIndex: 0,
      onSelect: () => {},
    });
    expect(tree.type).toBe("div");
    expect(tree.props.children).toBe("Load cards to enable turn log.");
  });

  it("forwards turn-log props and clamps selected index", () => {
    const onSelect = vi.fn();
    const tree = MatchMintTurnLogPanel({
      simOk: true,
      turns: [],
      selectedTurnIndex: 5,
      onSelect,
      annotations: [],
      boardAdvantages: [],
    });
    expect(React.isValidElement(tree)).toBe(true);
    expect(tree.type).toBe(TurnLog);
    expect(tree.props.turns).toEqual([]);
    expect(tree.props.selectedTurnIndex).toBe(0);
    expect(tree.props.onSelect).toBe(onSelect);
  });

  it("supports custom empty label", () => {
    const tree = MatchMintTurnLogPanel({
      simOk: false,
      turns: [],
      selectedTurnIndex: 0,
      onSelect: () => {},
      emptyLabel: "custom empty",
    });
    expect(tree.props.children).toBe("custom empty");
  });
});
