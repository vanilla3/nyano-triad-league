import { describe, expect, it, vi } from "vitest";
import {
  resolveIsStageFullscreen,
  toggleStageFullscreenCore,
} from "@/features/match/useMatchStageFullscreen";

describe("features/match/useMatchStageFullscreen", () => {
  it("resolves fullscreen state from document fullscreenElement", () => {
    expect(resolveIsStageFullscreen(null)).toBe(false);
    expect(resolveIsStageFullscreen({ fullscreenElement: null })).toBe(false);
    expect(resolveIsStageFullscreen({ fullscreenElement: {} as Element })).toBe(true);
  });

  it("ignores toggle when route is not stage focus", async () => {
    const documentLike = {
      fullscreenElement: null,
      exitFullscreen: vi.fn(),
    };
    const target = { requestFullscreen: vi.fn() };
    const result = await toggleStageFullscreenCore({
      isStageFocusRoute: false,
      documentLike,
      target,
    });
    expect(result).toBe("ignored");
    expect(documentLike.exitFullscreen).not.toHaveBeenCalled();
    expect(target.requestFullscreen).not.toHaveBeenCalled();
  });

  it("exits fullscreen when currently fullscreen", async () => {
    const documentLike = {
      fullscreenElement: {} as Element,
      exitFullscreen: vi.fn(async () => {}),
    };
    const target = { requestFullscreen: vi.fn() };
    const result = await toggleStageFullscreenCore({
      isStageFocusRoute: true,
      documentLike,
      target,
    });
    expect(result).toBe("exited");
    expect(documentLike.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(target.requestFullscreen).not.toHaveBeenCalled();
  });

  it("returns no_target when no viewport ref target exists", async () => {
    const documentLike = {
      fullscreenElement: null,
      exitFullscreen: vi.fn(),
    };
    const result = await toggleStageFullscreenCore({
      isStageFocusRoute: true,
      documentLike,
      target: null,
    });
    expect(result).toBe("no_target");
    expect(documentLike.exitFullscreen).not.toHaveBeenCalled();
  });

  it("requests fullscreen when stage focus route and target exists", async () => {
    const documentLike = {
      fullscreenElement: null,
      exitFullscreen: vi.fn(),
    };
    const target = { requestFullscreen: vi.fn(async () => {}) };
    const result = await toggleStageFullscreenCore({
      isStageFocusRoute: true,
      documentLike,
      target,
    });
    expect(result).toBe("entered");
    expect(target.requestFullscreen).toHaveBeenCalledTimes(1);
    expect(documentLike.exitFullscreen).not.toHaveBeenCalled();
  });
});
