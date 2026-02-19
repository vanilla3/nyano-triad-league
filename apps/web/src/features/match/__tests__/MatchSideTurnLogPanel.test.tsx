import React from "react";
import { describe, expect, it, vi } from "vitest";
import { TurnLog } from "@/components/TurnLog";
import { TurnLogRPG } from "@/components/BoardViewRPG";
import { MatchSideTurnLogPanel } from "@/features/match/MatchSideTurnLogPanel";

describe("features/match/MatchSideTurnLogPanel", () => {
  it("renders RPG turn log when rpg mode is enabled", () => {
    const tree = MatchSideTurnLogPanel({
      isRpg: true,
      rpgEntries: [],
      simOk: false,
      turns: [],
      selectedTurnIndex: 0,
      onSelect: () => {},
    });
    expect(tree.type).toBe(TurnLogRPG);
  });

  it("renders fallback when standard mode has no simulation", () => {
    const tree = MatchSideTurnLogPanel({
      isRpg: false,
      rpgEntries: [],
      simOk: false,
      turns: [],
      selectedTurnIndex: 0,
      onSelect: () => {},
    });
    expect(tree.type).toBe("div");
    expect(tree.props.children).toBe("Load cards to enable turn log.");
  });

  it("forwards to standard TurnLog and clamps selected index", () => {
    const onSelect = vi.fn();
    const tree = MatchSideTurnLogPanel({
      isRpg: false,
      rpgEntries: [],
      simOk: true,
      turns: [],
      selectedTurnIndex: 8,
      onSelect,
    });
    expect(React.isValidElement(tree)).toBe(true);
    expect(tree.type).toBe(TurnLog);
    expect(tree.props.selectedTurnIndex).toBe(0);
    expect(tree.props.onSelect).toBe(onSelect);
  });
});
