export function resolveMatchStagePresentationState(input: {
  useMintUi: boolean;
  isRpg: boolean;
  turnCount: number;
  currentDeckTokenCount: number;
  isMint: boolean;
  showStageAssistUi: boolean;
  simOk: boolean;
  useMintPixiParity: boolean;
  usePixiPresentation: boolean;
  density: string;
  isStageFocusRoute: boolean;
  isAiTurn: boolean;
  draftCardIndex: number | null;
  draftCell: number | null;
  showStageControls: boolean;
  lastFlipSummaryText: string | null;
  isVsNyanoAi: boolean;
  aiAutoPlay: boolean;
}): {
  showFocusHandDock: boolean;
  showMintTopHud: boolean;
  showMintDetailHud: boolean;
  showMintPlayerPanels: boolean;
  showDesktopQuickCommit: boolean;
  showStageFocusHandDock: boolean;
  showFocusToolbarActions: boolean;
  showMintStatusSummarySlot: boolean;
  showLegacyStatusSummary: boolean;
  canCommitFromFocusToolbar: boolean;
  canUndoFromFocusToolbar: boolean;
  canManualAiMoveFromFocusToolbar: boolean;
} {
  const showFocusHandDock =
    input.useMintUi
    && !input.isRpg
    && input.turnCount < 9
    && input.currentDeckTokenCount > 0;
  const showMintTopHud =
    input.isMint
    && input.showStageAssistUi
    && input.simOk
    && !showFocusHandDock
    && !input.useMintPixiParity;
  const showMintDetailHud =
    input.useMintUi
    && input.showStageAssistUi
    && input.simOk
    && (input.usePixiPresentation || input.density !== "minimal");
  const showMintPlayerPanels =
    input.isMint
    && !input.isStageFocusRoute
    && !showFocusHandDock
    && !input.useMintPixiParity;
  const showDesktopQuickCommit =
    input.useMintUi
    && !input.isRpg
    && !input.isAiTurn
    && input.turnCount < 9
    && (input.draftCardIndex !== null || input.draftCell !== null)
    && !showFocusHandDock
    && !input.isStageFocusRoute;
  const showStageFocusHandDock = input.isStageFocusRoute && showFocusHandDock;
  const showFocusToolbarActions = input.isStageFocusRoute && !showStageFocusHandDock && input.showStageControls;
  const showMintStatusSummarySlot = input.showStageAssistUi && input.useMintUi;
  const showLegacyStatusSummary = input.showStageAssistUi && !input.useMintUi && Boolean(input.lastFlipSummaryText);
  const canCommitFromFocusToolbar = !input.isAiTurn && input.draftCell !== null && input.draftCardIndex !== null;
  const canUndoFromFocusToolbar = !input.isAiTurn && input.turnCount > 0;
  const canManualAiMoveFromFocusToolbar = input.isVsNyanoAi && !input.aiAutoPlay && input.isAiTurn;

  return {
    showFocusHandDock,
    showMintTopHud,
    showMintDetailHud,
    showMintPlayerPanels,
    showDesktopQuickCommit,
    showStageFocusHandDock,
    showFocusToolbarActions,
    showMintStatusSummarySlot,
    showLegacyStatusSummary,
    canCommitFromFocusToolbar,
    canUndoFromFocusToolbar,
    canManualAiMoveFromFocusToolbar,
  };
}
