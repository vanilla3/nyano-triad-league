import { describe, expect, it } from "vitest";
import {
  resolveEngineRendererFallbackOnBoardUiChange,
  resolveEngineRendererFallbackOnInitError,
  resolveEngineRendererFallbackOnRetry,
  resolveUseEngineRenderer,
} from "@/features/match/useEngineRendererFallback";

describe("features/match/useEngineRendererFallback", () => {
  it("resolves useEngineRenderer from board-ui + failure state", () => {
    expect(resolveUseEngineRenderer(true, { engineRendererFailed: false, engineRendererError: null })).toBe(true);
    expect(resolveUseEngineRenderer(true, { engineRendererFailed: true, engineRendererError: "webgl unavailable" })).toBe(false);
    expect(resolveUseEngineRenderer(false, { engineRendererFailed: false, engineRendererError: null })).toBe(false);
  });

  it("returns reset patch when board ui leaves engine mode", () => {
    expect(resolveEngineRendererFallbackOnBoardUiChange(true)).toBeNull();
    expect(resolveEngineRendererFallbackOnBoardUiChange(false)).toEqual({
      engineRendererFailed: false,
      engineRendererError: null,
    });
  });

  it("builds init-error and retry state patches", () => {
    expect(resolveEngineRendererFallbackOnInitError("WebGL context unavailable")).toEqual({
      engineRendererFailed: true,
      engineRendererError: "WebGL context unavailable",
    });
    expect(resolveEngineRendererFallbackOnRetry()).toEqual({
      engineRendererFailed: false,
      engineRendererError: null,
    });
  });
});
