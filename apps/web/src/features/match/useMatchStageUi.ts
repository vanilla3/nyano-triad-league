import React from "react";
import { shouldShowStageSecondaryControls } from "@/lib/stage_layout";

export function resolveStageAssistVisibility(isStageFocusRoute: boolean): boolean {
  return !isStageFocusRoute;
}

export function resolveStageControlsVisibility(input: {
  isStageFocusRoute: boolean;
  viewportWidth: number | null;
  resolveShouldShowStageSecondaryControls?: (viewportWidth: number) => boolean;
}): boolean {
  if (!input.isStageFocusRoute) return true;
  if (input.viewportWidth === null) return true;
  const resolveShouldShowStageSecondaryControls =
    input.resolveShouldShowStageSecondaryControls ?? shouldShowStageSecondaryControls;
  return resolveShouldShowStageSecondaryControls(input.viewportWidth);
}

type UseMatchStageUiDeps = {
  getViewportWidth?: () => number | null;
  resolveShouldShowStageSecondaryControls?: (viewportWidth: number) => boolean;
  subscribeResize?: (handler: () => void) => () => void;
};

function defaultGetViewportWidth(): number | null {
  if (typeof window === "undefined") return null;
  return window.innerWidth;
}

function defaultSubscribeResize(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}

export function useMatchStageUi(input: {
  isStageFocusRoute: boolean;
  deps?: UseMatchStageUiDeps;
}): {
  showStageAssist: boolean;
  setShowStageAssist: React.Dispatch<React.SetStateAction<boolean>>;
  showStageAssistUi: boolean;
  showStageControls: boolean;
  toggleStageControls: () => void;
} {
  const { isStageFocusRoute } = input;
  const getViewportWidth = input.deps?.getViewportWidth ?? defaultGetViewportWidth;
  const resolveShouldShowStageSecondaryControls =
    input.deps?.resolveShouldShowStageSecondaryControls ?? shouldShowStageSecondaryControls;
  const subscribeResize = input.deps?.subscribeResize ?? defaultSubscribeResize;

  const [showStageAssist, setShowStageAssist] = React.useState(() =>
    resolveStageAssistVisibility(isStageFocusRoute),
  );
  const showStageAssistUi = !isStageFocusRoute || showStageAssist;

  const stageControlsManualOverrideRef = React.useRef(false);
  const [showStageControls, setShowStageControls] = React.useState(() =>
    resolveStageControlsVisibility({
      isStageFocusRoute,
      viewportWidth: getViewportWidth(),
      resolveShouldShowStageSecondaryControls,
    }),
  );

  React.useEffect(() => {
    setShowStageAssist(resolveStageAssistVisibility(isStageFocusRoute));
  }, [isStageFocusRoute]);

  React.useEffect(() => {
    stageControlsManualOverrideRef.current = false;
    setShowStageControls(
      resolveStageControlsVisibility({
        isStageFocusRoute,
        viewportWidth: getViewportWidth(),
        resolveShouldShowStageSecondaryControls,
      }),
    );
  }, [isStageFocusRoute, getViewportWidth, resolveShouldShowStageSecondaryControls]);

  React.useEffect(() => {
    if (!isStageFocusRoute) return;
    return subscribeResize(() => {
      if (stageControlsManualOverrideRef.current) return;
      setShowStageControls(
        resolveStageControlsVisibility({
          isStageFocusRoute: true,
          viewportWidth: getViewportWidth(),
          resolveShouldShowStageSecondaryControls,
        }),
      );
    });
  }, [
    getViewportWidth,
    isStageFocusRoute,
    resolveShouldShowStageSecondaryControls,
    subscribeResize,
  ]);

  const toggleStageControls = React.useCallback(() => {
    stageControlsManualOverrideRef.current = true;
    setShowStageControls((prev) => !prev);
  }, []);

  return {
    showStageAssist,
    setShowStageAssist,
    showStageAssistUi,
    showStageControls,
    toggleStageControls,
  };
}
