import { describe, expect, it } from "vitest";
import { resolveMatchStagePresentationState } from "@/features/match/matchStagePresentationState";

function resolveState(
  input: Partial<Parameters<typeof resolveMatchStagePresentationState>[0]> = {},
) {
  return resolveMatchStagePresentationState({
    useMintUi: true,
    isRpg: false,
    turnCount: 0,
    currentDeckTokenCount: 5,
    isMint: true,
    showStageAssistUi: true,
    simOk: true,
    useMintPixiParity: false,
    usePixiPresentation: false,
    density: "comfortable",
    isStageFocusRoute: false,
    isAiTurn: false,
    draftCardIndex: null,
    draftCell: null,
    showStageControls: true,
    lastFlipSummaryText: null,
    isVsNyanoAi: false,
    aiAutoPlay: true,
    ...input,
  });
}

describe("features/match/matchStagePresentationState", () => {
  it("shows focus hand dock only when mint-ui hand conditions are met", () => {
    expect(resolveState().showFocusHandDock).toBe(true);
    expect(resolveState({ currentDeckTokenCount: 0 }).showFocusHandDock).toBe(false);
    expect(resolveState({ turnCount: 9 }).showFocusHandDock).toBe(false);
    expect(resolveState({ isRpg: true }).showFocusHandDock).toBe(false);
    expect(resolveState({ useMintUi: false }).showFocusHandDock).toBe(false);
  });

  it("resolves mint HUD visibility with focus hand dock and density rules", () => {
    const base = resolveState();
    expect(base.showMintTopHud).toBe(false);
    expect(base.showMintDetailHud).toBe(true);

    const minimal = resolveState({ density: "minimal", usePixiPresentation: false });
    expect(minimal.showMintDetailHud).toBe(false);

    const pixi = resolveState({ density: "minimal", usePixiPresentation: true });
    expect(pixi.showMintDetailHud).toBe(true);

    const noAssist = resolveState({ showStageAssistUi: false });
    expect(noAssist.showMintTopHud).toBe(false);
    expect(noAssist.showMintDetailHud).toBe(false);
  });

  it("gates desktop quick-commit by focus route, ai turn, and draft selection", () => {
    expect(resolveState({ draftCardIndex: 1 }).showDesktopQuickCommit).toBe(false);
    expect(resolveState({ isStageFocusRoute: true, draftCardIndex: 1 }).showDesktopQuickCommit).toBe(false);
    expect(resolveState({ currentDeckTokenCount: 0, draftCardIndex: 1 }).showDesktopQuickCommit).toBe(true);
    expect(resolveState({ currentDeckTokenCount: 0, isAiTurn: true, draftCardIndex: 1 }).showDesktopQuickCommit).toBe(false);
  });

  it("resolves focus toolbar action visibility and button enable states", () => {
    const focusNoDock = resolveState({
      isStageFocusRoute: true,
      currentDeckTokenCount: 0,
      draftCardIndex: 2,
      draftCell: 5,
      turnCount: 3,
    });
    expect(focusNoDock.showFocusToolbarActions).toBe(true);
    expect(focusNoDock.canCommitFromFocusToolbar).toBe(true);
    expect(focusNoDock.canUndoFromFocusToolbar).toBe(true);

    const aiTurn = resolveState({
      isStageFocusRoute: true,
      currentDeckTokenCount: 0,
      isAiTurn: true,
      draftCardIndex: 2,
      draftCell: 5,
      turnCount: 3,
    });
    expect(aiTurn.canCommitFromFocusToolbar).toBe(false);
    expect(aiTurn.canUndoFromFocusToolbar).toBe(false);
  });

  it("switches status summary slots between mint and legacy modes", () => {
    const mint = resolveState({ useMintUi: true, showStageAssistUi: true });
    expect(mint.showMintStatusSummarySlot).toBe(true);
    expect(mint.showLegacyStatusSummary).toBe(false);

    const legacy = resolveState({
      useMintUi: false,
      showStageAssistUi: true,
      lastFlipSummaryText: "A flipped 2",
    });
    expect(legacy.showMintStatusSummarySlot).toBe(false);
    expect(legacy.showLegacyStatusSummary).toBe(true);
  });

  it("shows manual ai move button only for non-autoplay ai turns", () => {
    expect(resolveState({ isVsNyanoAi: true, aiAutoPlay: false, isAiTurn: true }).canManualAiMoveFromFocusToolbar).toBe(true);
    expect(resolveState({ isVsNyanoAi: true, aiAutoPlay: true, isAiTurn: true }).canManualAiMoveFromFocusToolbar).toBe(false);
    expect(resolveState({ isVsNyanoAi: true, aiAutoPlay: false, isAiTurn: false }).canManualAiMoveFromFocusToolbar).toBe(false);
  });
});
