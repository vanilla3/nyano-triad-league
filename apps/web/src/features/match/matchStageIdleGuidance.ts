export interface MatchStageIdleGuidanceDisableInput {
  useMintUi: boolean;
  isRpg: boolean;
  hasCardSource: boolean;
  isAiTurn: boolean;
  isGameOver: boolean;
  isHandDragging: boolean;
  isBoardAnimating: boolean;
  hasInlineError: boolean;
}

export function shouldDisableMatchStageIdleGuidance(
  input: MatchStageIdleGuidanceDisableInput,
): boolean {
  return (
    !input.useMintUi
    || input.isRpg
    || !input.hasCardSource
    || input.isAiTurn
    || input.isGameOver
    || input.isHandDragging
    || input.isBoardAnimating
    || input.hasInlineError
  );
}

export interface MatchStageIdleGuidanceTargetsInput {
  stageIdleGuidance: boolean;
  isStageFocusRoute: boolean;
  showStageControls: boolean;
  showFocusHandDock: boolean;
  draftCardIndex: number | null;
  draftCell: number | null;
}

export interface MatchStageIdleGuidanceTargets {
  idleGuideHand: boolean;
  idleGuideBoard: boolean;
}

export function resolveMatchStageIdleGuidanceTargets(
  input: MatchStageIdleGuidanceTargetsInput,
): MatchStageIdleGuidanceTargets {
  const idleGuideHand = input.stageIdleGuidance
    && (!input.isStageFocusRoute || input.showStageControls)
    && !input.showFocusHandDock
    && input.draftCardIndex === null;

  const idleGuideBoard = input.stageIdleGuidance
    && input.draftCardIndex !== null
    && input.draftCell === null;

  return { idleGuideHand, idleGuideBoard };
}
