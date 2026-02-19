import React from "react";
import {
  computeStageBoardSizing,
  type StageBoardSizing,
} from "@/lib/stage_layout";

export type StageViewportSize = {
  width: number;
  height: number;
};

const DEFAULT_MATCH_STAGE_VIEWPORT: StageViewportSize = {
  width: 1366,
  height: 900,
};

function getRuntimeViewportSize(): StageViewportSize | null {
  if (typeof window === "undefined") return null;
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function subscribeRuntimeResize(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}

function resolveViewportOrDefault(
  viewportSize: StageViewportSize | null,
): StageViewportSize {
  return viewportSize ?? DEFAULT_MATCH_STAGE_VIEWPORT;
}

export function resolveMatchStageBoardSizing(
  viewportSize: StageViewportSize | null,
): StageBoardSizing {
  const resolvedViewport = resolveViewportOrDefault(viewportSize);
  return computeStageBoardSizing({
    viewportWidthPx: resolvedViewport.width,
    viewportHeightPx: resolvedViewport.height,
    kind: "battle",
  });
}

type UseMatchStageBoardSizingInput = {
  isBattleStageRoute: boolean;
  deps?: {
    getViewportSize?: () => StageViewportSize | null;
    subscribeResize?: (handler: () => void) => () => void;
  };
};

export function useMatchStageBoardSizing(
  input: UseMatchStageBoardSizingInput,
): StageBoardSizing {
  const getViewportSize = input.deps?.getViewportSize ?? getRuntimeViewportSize;
  const subscribeResize = input.deps?.subscribeResize ?? subscribeRuntimeResize;
  const [stageBoardSizing, setStageBoardSizing] = React.useState(() =>
    resolveMatchStageBoardSizing(getViewportSize()),
  );

  React.useEffect(() => {
    if (!input.isBattleStageRoute) return;
    const updateSizing = () => {
      setStageBoardSizing(resolveMatchStageBoardSizing(getViewportSize()));
    };
    updateSizing();
    return subscribeResize(updateSizing);
  }, [getViewportSize, input.isBattleStageRoute, subscribeResize]);

  return stageBoardSizing;
}
