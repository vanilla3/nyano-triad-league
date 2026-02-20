import React from "react";

export function resolveReplayStagePanelVisibility(isStageFocusRoute: boolean): boolean {
  return !isStageFocusRoute;
}

export function syncReplayStagePanelVisibility(input: {
  isStageFocusRoute: boolean;
  setShowStagePanels: React.Dispatch<React.SetStateAction<boolean>>;
  setShowStageSetup: React.Dispatch<React.SetStateAction<boolean>>;
}): void {
  const nextVisible = resolveReplayStagePanelVisibility(input.isStageFocusRoute);
  input.setShowStagePanels(nextVisible);
  input.setShowStageSetup(nextVisible);
}

export function useReplayStagePanelVisibility(input: { isStageFocusRoute: boolean }) {
  const [showStagePanels, setShowStagePanels] = React.useState(() =>
    resolveReplayStagePanelVisibility(input.isStageFocusRoute),
  );
  const [showStageSetup, setShowStageSetup] = React.useState(() =>
    resolveReplayStagePanelVisibility(input.isStageFocusRoute),
  );

  React.useEffect(() => {
    syncReplayStagePanelVisibility({
      isStageFocusRoute: input.isStageFocusRoute,
      setShowStagePanels,
      setShowStageSetup,
    });
  }, [input.isStageFocusRoute]);

  return {
    showStagePanels,
    setShowStagePanels,
    showStageSetup,
    setShowStageSetup,
  };
}
