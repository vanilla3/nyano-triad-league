import React from "react";
import { computeStageBoardSizing, type StageBoardSizing } from "@/lib/stage_layout";

function getRuntimeViewport(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 1366, height: 900 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

function subscribeResize(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}

export function resolveReplayStageBoardSizing(input: {
  viewportWidthPx: number;
  viewportHeightPx: number;
}): StageBoardSizing {
  return computeStageBoardSizing({
    viewportWidthPx: input.viewportWidthPx,
    viewportHeightPx: input.viewportHeightPx,
    kind: "replay",
  });
}

export function useReplayStageBoardSizing(input: {
  isReplayStageRoute: boolean;
  deps?: {
    getViewport?: () => { width: number; height: number };
    subscribeResize?: (handler: () => void) => () => void;
  };
}): StageBoardSizing {
  const getViewport = input.deps?.getViewport ?? getRuntimeViewport;
  const onResizeSubscribe = input.deps?.subscribeResize ?? subscribeResize;

  const [sizing, setSizing] = React.useState<StageBoardSizing>(() => {
    const viewport = getViewport();
    return resolveReplayStageBoardSizing({
      viewportWidthPx: viewport.width,
      viewportHeightPx: viewport.height,
    });
  });

  React.useEffect(() => {
    if (!input.isReplayStageRoute) return;
    const update = () => {
      const viewport = getViewport();
      setSizing(
        resolveReplayStageBoardSizing({
          viewportWidthPx: viewport.width,
          viewportHeightPx: viewport.height,
        }),
      );
    };
    update();
    return onResizeSubscribe(update);
  }, [getViewport, input.isReplayStageRoute, onResizeSubscribe]);

  return sizing;
}
