import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MatchInfoColumn } from "@/features/match/MatchInfoColumn";
import { MatchMintDrawerPanels } from "@/features/match/MatchMintDrawerPanels";
import { MatchMintDrawerShell } from "@/features/match/MatchMintDrawerShell";
import { MatchSideColumnPanels } from "@/features/match/MatchSideColumnPanels";

function collectElementsByType(node: React.ReactNode, type: unknown): React.ReactElement[] {
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

function createTree(overrides?: Partial<Parameters<typeof MatchInfoColumn>[0]>): React.ReactElement {
  return MatchInfoColumn({
    isMintUi: true,
    drawerOpen: true,
    onOpenDrawer: () => {},
    onCloseDrawer: () => {},
    density: "minimal",
    onChangeDensity: () => {},
    simOk: true,
    previewTurns: [],
    previewHistory: [],
    selectedTurnIndex: 0,
    onSelectTurn: () => {},
    annotations: [],
    boardAdvantages: [],
    resultSummary: null,
    pendingMessage: "pending",
    canFinalize: true,
    onCopyTranscriptJson: () => {},
    onCopyShareUrl: () => {},
    onOpenReplay: () => {},
    aiNoteCount: 1,
    aiNotesContent: <div>notes</div>,
    sideColumnClassName: "side-col",
    isRpg: false,
    isStageFocusRoute: false,
    rpgLogEntries: [],
    isGuestPostGameVisible: false,
    guestDeckSaved: false,
    onRematch: () => {},
    onLoadNewGuestDeck: () => {},
    onSaveGuestDeck: () => {},
    onCopyShareTemplate: () => {},
    guestQrCode: <div>qr</div>,
    ...overrides,
  });
}

describe("features/match/MatchInfoColumn", () => {
  it("renders mint drawer panels when mint UI is enabled", () => {
    const onOpenDrawer = vi.fn();
    const onCloseDrawer = vi.fn();
    const tree = createTree({
      isMintUi: true,
      drawerOpen: false,
      onOpenDrawer,
      onCloseDrawer,
    });

    const shell = collectElementsByType(tree, MatchMintDrawerShell)[0];
    const mintPanels = collectElementsByType(tree, MatchMintDrawerPanels)[0];
    expect(shell).toBeTruthy();
    expect(shell?.props.open).toBe(false);
    expect(shell?.props.onOpen).toBe(onOpenDrawer);
    expect(shell?.props.onClose).toBe(onCloseDrawer);
    expect(mintPanels).toBeTruthy();
    expect(mintPanels?.props.pendingMessage).toBe("pending");
    expect(collectElementsByType(tree, MatchSideColumnPanels)).toHaveLength(0);
  });

  it("renders side column panels when mint UI is disabled", () => {
    const tree = createTree({
      isMintUi: false,
      isRpg: true,
      isStageFocusRoute: true,
      sideColumnClassName: "non-mint-side",
      isGuestPostGameVisible: true,
    });

    const sidePanels = collectElementsByType(tree, MatchSideColumnPanels)[0];
    expect(sidePanels).toBeTruthy();
    expect(sidePanels?.props.className).toBe("non-mint-side");
    expect(sidePanels?.props.isRpg).toBe(true);
    expect(sidePanels?.props.isStageFocusRoute).toBe(true);
    expect(sidePanels?.props.isGuestPostGameVisible).toBe(true);
    expect(collectElementsByType(tree, MatchMintDrawerShell)).toHaveLength(0);
    expect(collectElementsByType(tree, MatchMintDrawerPanels)).toHaveLength(0);
  });
});
