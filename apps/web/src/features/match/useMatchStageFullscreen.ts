import React from "react";
import { errorMessage } from "@/lib/errorMessage";

type StageFullscreenTargetLike = {
  requestFullscreen: () => void | Promise<void>;
};

type StageFullscreenDocumentLike = {
  fullscreenElement: Element | null;
  exitFullscreen: () => void | Promise<void>;
};

type StageFullscreenDocumentWithEvents = StageFullscreenDocumentLike & {
  addEventListener: (type: "fullscreenchange", listener: () => void) => void;
  removeEventListener: (type: "fullscreenchange", listener: () => void) => void;
};

export type StageFullscreenToggleResult =
  | "ignored"
  | "no_target"
  | "entered"
  | "exited";

export function resolveIsStageFullscreen(
  documentLike: Pick<StageFullscreenDocumentLike, "fullscreenElement"> | null,
): boolean {
  return Boolean(documentLike?.fullscreenElement);
}

export async function toggleStageFullscreenCore(input: {
  isStageFocusRoute: boolean;
  documentLike: StageFullscreenDocumentLike;
  target: StageFullscreenTargetLike | null;
}): Promise<StageFullscreenToggleResult> {
  if (!input.isStageFocusRoute) return "ignored";
  if (input.documentLike.fullscreenElement) {
    await input.documentLike.exitFullscreen();
    return "exited";
  }
  if (!input.target) return "no_target";
  await input.target.requestFullscreen();
  return "entered";
}

type UseMatchStageFullscreenInput = {
  isStageFocusRoute: boolean;
  stageViewportRef: React.RefObject<HTMLDivElement>;
  onWarn?: (title: string, message: string) => void;
  deps?: {
    getDocument?: () => StageFullscreenDocumentWithEvents | null;
  };
};

function getRuntimeDocument(): StageFullscreenDocumentWithEvents | null {
  if (typeof document === "undefined") return null;
  return document;
}

export function useMatchStageFullscreen(
  input: UseMatchStageFullscreenInput,
): {
  isStageFullscreen: boolean;
  toggleStageFullscreen: () => Promise<void>;
} {
  const { isStageFocusRoute, onWarn, stageViewportRef } = input;
  const getDocument = input.deps?.getDocument ?? getRuntimeDocument;
  const [isStageFullscreen, setIsStageFullscreen] = React.useState(() =>
    resolveIsStageFullscreen(getDocument()),
  );

  React.useEffect(() => {
    const documentLike = getDocument();
    if (!documentLike) return;
    const handleFullscreenChange = () => {
      setIsStageFullscreen(resolveIsStageFullscreen(documentLike));
    };
    documentLike.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => documentLike.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [getDocument]);

  const toggleStageFullscreen = React.useCallback(async () => {
    const documentLike = getDocument();
    if (!documentLike) return;
    try {
      await toggleStageFullscreenCore({
        isStageFocusRoute,
        documentLike,
        target: stageViewportRef.current,
      });
      setIsStageFullscreen(resolveIsStageFullscreen(documentLike));
    } catch (e: unknown) {
      onWarn?.("Fullscreen", errorMessage(e));
    }
  }, [getDocument, isStageFocusRoute, onWarn, stageViewportRef]);

  return { isStageFullscreen, toggleStageFullscreen };
}
