import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MatchSideColumnPanels } from "@/features/match/MatchSideColumnPanels";
import { MatchSideTurnLogPanel } from "@/features/match/MatchSideTurnLogPanel";
import { MatchResultSummaryPanel } from "@/features/match/MatchResultSummaryPanel";
import { MatchShareActionsRow } from "@/features/match/MatchShareActionsRow";
import { MatchGuestPostGamePanel } from "@/features/match/MatchGuestPostGamePanel";
import { MatchAiNotesPanel } from "@/features/match/MatchAiNotesPanel";

describe("features/match/MatchSideColumnPanels", () => {
  it("renders expected side-panel composition order", () => {
    const tree = MatchSideColumnPanels({
      className: "side-col",
      isRpg: false,
      isStageFocusRoute: false,
      rpgLogEntries: [],
      simOk: false,
      previewTurns: [],
      previewHistory: [],
      selectedTurnIndex: 0,
      onSelectTurn: () => {},
      resultSummary: null,
      canFinalize: false,
      onCopyTranscriptJson: () => {},
      onCopyShareUrl: () => {},
      onOpenReplay: () => {},
      isGuestPostGameVisible: false,
      guestDeckSaved: false,
      onRematch: () => {},
      onLoadNewGuestDeck: () => {},
      onSaveGuestDeck: () => {},
      onCopyShareTemplate: () => {},
      guestQrCode: null,
      aiNoteCount: 0,
      aiNotesContent: null,
    });
    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    expect(tree.type).toBe("div");
    expect(tree.props.className).toBe("side-col");
    expect(children[0]?.type).toBe(MatchSideTurnLogPanel);
    expect(children[1]?.type).toBe(MatchResultSummaryPanel);
    expect(children[2]?.type).toBe(MatchShareActionsRow);
    expect(children[3]?.type).toBe(MatchGuestPostGamePanel);
    expect(children[4]?.type).toBe(MatchAiNotesPanel);
  });

  it("forwards guest and share callbacks", () => {
    const onCopyTranscriptJson = vi.fn();
    const onCopyShareUrl = vi.fn();
    const onOpenReplay = vi.fn();
    const onRematch = vi.fn();
    const onLoadNewGuestDeck = vi.fn();
    const onSaveGuestDeck = vi.fn();
    const onCopyShareTemplate = vi.fn();
    const guestQrCode = <div>qr</div>;
    const tree = MatchSideColumnPanels({
      className: "x",
      isRpg: false,
      isStageFocusRoute: true,
      rpgLogEntries: [],
      simOk: true,
      previewTurns: [],
      previewHistory: [],
      selectedTurnIndex: 0,
      onSelectTurn: () => {},
      resultSummary: null,
      canFinalize: true,
      onCopyTranscriptJson,
      onCopyShareUrl,
      onOpenReplay,
      isGuestPostGameVisible: true,
      guestDeckSaved: true,
      onRematch,
      onLoadNewGuestDeck,
      onSaveGuestDeck,
      onCopyShareTemplate,
      guestQrCode,
      aiNoteCount: 0,
      aiNotesContent: null,
    });
    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const share = children[2];
    const guest = children[3];
    expect(share?.props.onCopyTranscriptJson).toBe(onCopyTranscriptJson);
    expect(share?.props.onCopyShareUrl).toBe(onCopyShareUrl);
    expect(share?.props.onOpenReplay).toBe(onOpenReplay);
    expect(guest?.props.isVisible).toBe(true);
    expect(guest?.props.isRpg).toBe(false);
    expect(guest?.props.onRematch).toBe(onRematch);
    expect(guest?.props.onLoadNewGuestDeck).toBe(onLoadNewGuestDeck);
    expect(guest?.props.onSaveGuestDeck).toBe(onSaveGuestDeck);
    expect(guest?.props.onCopyShareTemplate).toBe(onCopyShareTemplate);
    expect(guest?.props.qrCode).toBe(guestQrCode);
  });

  it("derives ai-notes visibility from note count", () => {
    const tree = MatchSideColumnPanels({
      className: "x",
      isRpg: true,
      isStageFocusRoute: true,
      rpgLogEntries: [],
      simOk: true,
      previewTurns: [],
      previewHistory: [],
      selectedTurnIndex: 0,
      onSelectTurn: () => {},
      resultSummary: null,
      canFinalize: false,
      onCopyTranscriptJson: () => {},
      onCopyShareUrl: () => {},
      onOpenReplay: () => {},
      isGuestPostGameVisible: false,
      guestDeckSaved: false,
      onRematch: () => {},
      onLoadNewGuestDeck: () => {},
      onSaveGuestDeck: () => {},
      onCopyShareTemplate: () => {},
      guestQrCode: null,
      aiNoteCount: 2,
      aiNotesContent: <div>notes</div>,
    });
    const children = React.Children.toArray(tree.props.children) as React.ReactElement[];
    const ai = children[4];
    expect(ai?.props.isVisible).toBe(true);
    expect(ai?.props.noteCount).toBe(2);
    expect(ai?.props.children).toEqual(<div>notes</div>);
  });
});
