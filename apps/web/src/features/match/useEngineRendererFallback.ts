import React from "react";

export type EngineRendererFallbackState = {
  engineRendererFailed: boolean;
  engineRendererError: string | null;
};

export const ENGINE_RENDERER_FALLBACK_WARN_TITLE = "Pixi renderer unavailable";
export const ENGINE_RENDERER_FALLBACK_WARN_MESSAGE = "Switched to Mint fallback board";

export function resolveUseEngineRenderer(
  isEngine: boolean,
  state: EngineRendererFallbackState,
): boolean {
  return isEngine && !state.engineRendererFailed;
}

export function resolveEngineRendererFallbackOnBoardUiChange(
  isEngine: boolean,
): EngineRendererFallbackState | null {
  if (isEngine) return null;
  return {
    engineRendererFailed: false,
    engineRendererError: null,
  };
}

export function resolveEngineRendererFallbackOnInitError(
  message: string,
): EngineRendererFallbackState {
  return {
    engineRendererFailed: true,
    engineRendererError: message,
  };
}

export function resolveEngineRendererFallbackOnRetry(): EngineRendererFallbackState {
  return {
    engineRendererFailed: false,
    engineRendererError: null,
  };
}

export function useEngineRendererFallback(input: {
  isEngine: boolean;
  onWarn?: (title: string, message: string) => void;
}): {
  engineRendererFailed: boolean;
  engineRendererError: string | null;
  useEngineRenderer: boolean;
  handleEngineRendererInitError: (message: string) => void;
  handleRetryEngineRenderer: () => void;
} {
  const { isEngine, onWarn } = input;
  const [state, setState] = React.useState<EngineRendererFallbackState>(
    () => resolveEngineRendererFallbackOnRetry(),
  );

  React.useEffect(() => {
    const next = resolveEngineRendererFallbackOnBoardUiChange(isEngine);
    if (!next) return;
    setState((prev) =>
      prev.engineRendererFailed || prev.engineRendererError !== null ? next : prev,
    );
  }, [isEngine]);

  const handleEngineRendererInitError = React.useCallback((message: string) => {
    setState(resolveEngineRendererFallbackOnInitError(message));
    onWarn?.(ENGINE_RENDERER_FALLBACK_WARN_TITLE, ENGINE_RENDERER_FALLBACK_WARN_MESSAGE);
  }, [onWarn]);

  const handleRetryEngineRenderer = React.useCallback(() => {
    setState(resolveEngineRendererFallbackOnRetry());
  }, []);

  const useEngineRenderer = resolveUseEngineRenderer(isEngine, state);
  return {
    engineRendererFailed: state.engineRendererFailed,
    engineRendererError: state.engineRendererError,
    useEngineRenderer,
    handleEngineRendererInitError,
    handleRetryEngineRenderer,
  };
}
