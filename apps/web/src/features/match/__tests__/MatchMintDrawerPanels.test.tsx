import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MatchMintDrawerPanels } from "@/features/match/MatchMintDrawerPanels";
import { MatchMintDensityToggle } from "@/features/match/MatchMintDensityToggle";
import { MatchMintTurnLogPanel } from "@/features/match/MatchMintTurnLogPanel";
import { MatchMintResultSummaryPanel } from "@/features/match/MatchMintResultSummaryPanel";
import { MatchShareActionsRow } from "@/features/match/MatchShareActionsRow";
import { MatchMintAiNotesPanel } from "@/features/match/MatchMintAiNotesPanel";

describe("features/match/MatchMintDrawerPanels", () => {
  it("renders expected mint-drawer composition order", () => {
    const tree = MatchMintDrawerPanels({
      density: "standard",
      onChangeDensity: () => {},
      simOk: false,
      previewTurns: [],
      previewHistory: [],
      selectedTurnIndex: 0,
      onSelectTurn: () => {},
      annotations: [],
      boardAdvantages: [],
      resultSummary: null,
      pendingMessage: "pending",
      canFinalize: false,
      onCopyTranscriptJson: () => {},
      onCopyShareUrl: () => {},
      onOpenReplay: () => {},
      aiNoteCount: 0,
      aiNotesContent: null,
    });
    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    expect(children[0]?.type).toBe(MatchMintDensityToggle);
    expect(children[1]?.type).toBe(MatchMintTurnLogPanel);
    expect(children[2]?.type).toBe(MatchMintResultSummaryPanel);
    expect(children[3]?.type).toBe(MatchShareActionsRow);
    expect(children[4]?.type).toBe(MatchMintAiNotesPanel);
  });

  it("forwards density and share callbacks", () => {
    const onChangeDensity = vi.fn();
    const onCopyTranscriptJson = vi.fn();
    const onCopyShareUrl = vi.fn();
    const onOpenReplay = vi.fn();
    const tree = MatchMintDrawerPanels({
      density: "full",
      onChangeDensity,
      simOk: true,
      previewTurns: [],
      previewHistory: [],
      selectedTurnIndex: 0,
      onSelectTurn: () => {},
      resultSummary: null,
      pendingMessage: "pending",
      canFinalize: true,
      onCopyTranscriptJson,
      onCopyShareUrl,
      onOpenReplay,
      aiNoteCount: 0,
      aiNotesContent: null,
    });
    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const density = children[0];
    const share = children[3];
    expect(density?.props.value).toBe("full");
    expect(density?.props.onChange).toBe(onChangeDensity);
    expect(share?.props.isRpg).toBe(false);
    expect(share?.props.onCopyTranscriptJson).toBe(onCopyTranscriptJson);
    expect(share?.props.onCopyShareUrl).toBe(onCopyShareUrl);
    expect(share?.props.onOpenReplay).toBe(onOpenReplay);
  });

  it("derives ai-notes visibility from note count", () => {
    const notes = <div>notes</div>;
    const tree = MatchMintDrawerPanels({
      density: "minimal",
      onChangeDensity: () => {},
      simOk: true,
      previewTurns: [],
      previewHistory: [],
      selectedTurnIndex: 0,
      onSelectTurn: () => {},
      resultSummary: null,
      pendingMessage: "pending",
      canFinalize: false,
      onCopyTranscriptJson: () => {},
      onCopyShareUrl: () => {},
      onOpenReplay: () => {},
      aiNoteCount: 2,
      aiNotesContent: notes,
    });
    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const ai = children[4];
    expect(ai?.props.isVisible).toBe(true);
    expect(ai?.props.noteCount).toBe(2);
    expect(ai?.props.children).toEqual(notes);
  });
});
