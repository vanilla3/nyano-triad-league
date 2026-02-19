export function resolveStageFocusEngineBoardMaxWidthCapPx(input: {
  isStageFocusRoute: boolean;
  showStageFocusHandDock: boolean;
  stageBoardMinHeightPx: number;
}): number | undefined {
  if (!input.isStageFocusRoute || !input.showStageFocusHandDock) return undefined;
  return Math.max(306, Math.round(input.stageBoardMinHeightPx - 58));
}

export function resolveMatchStageEngineBoardSizing(input: {
  isStageFocusRoute: boolean;
  showStageFocusHandDock: boolean;
  stageBoardMinHeightPx: number;
  stageEngineBoardMaxWidthPxBase: number | undefined;
  stageEngineBoardMinHeightPxBase: number | undefined;
}): {
  stageFocusEngineBoardMaxWidthCapPx: number | undefined;
  engineBoardMaxWidthPx: number | undefined;
  engineBoardMinHeightPx: number | undefined;
} {
  const stageFocusEngineBoardMaxWidthCapPx = resolveStageFocusEngineBoardMaxWidthCapPx({
    isStageFocusRoute: input.isStageFocusRoute,
    showStageFocusHandDock: input.showStageFocusHandDock,
    stageBoardMinHeightPx: input.stageBoardMinHeightPx,
  });

  const engineBoardMaxWidthPx =
    input.stageEngineBoardMaxWidthPxBase === undefined
      ? undefined
      : stageFocusEngineBoardMaxWidthCapPx === undefined
        ? input.stageEngineBoardMaxWidthPxBase
        : Math.min(input.stageEngineBoardMaxWidthPxBase, stageFocusEngineBoardMaxWidthCapPx);

  const engineBoardMinHeightPx =
    input.stageEngineBoardMinHeightPxBase === undefined
      ? undefined
      : stageFocusEngineBoardMaxWidthCapPx === undefined
        ? input.stageEngineBoardMinHeightPxBase
        : Math.min(input.stageEngineBoardMinHeightPxBase, Math.round(stageFocusEngineBoardMaxWidthCapPx * 0.84));

  return {
    stageFocusEngineBoardMaxWidthCapPx,
    engineBoardMaxWidthPx,
    engineBoardMinHeightPx,
  };
}
