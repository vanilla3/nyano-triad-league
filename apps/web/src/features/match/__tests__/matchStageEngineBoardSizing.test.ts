import { describe, expect, it } from "vitest";
import {
  resolveMatchStageEngineBoardSizing,
  resolveStageFocusEngineBoardMaxWidthCapPx,
} from "@/features/match/matchStageEngineBoardSizing";

describe("features/match/matchStageEngineBoardSizing", () => {
  it("returns undefined cap outside stage-focus hand-dock mode", () => {
    expect(
      resolveStageFocusEngineBoardMaxWidthCapPx({
        isStageFocusRoute: false,
        showStageFocusHandDock: true,
        stageBoardMinHeightPx: 520,
      }),
    ).toBeUndefined();
    expect(
      resolveStageFocusEngineBoardMaxWidthCapPx({
        isStageFocusRoute: true,
        showStageFocusHandDock: false,
        stageBoardMinHeightPx: 520,
      }),
    ).toBeUndefined();
  });

  it("applies minimum cap floor for stage-focus hand-dock mode", () => {
    expect(
      resolveStageFocusEngineBoardMaxWidthCapPx({
        isStageFocusRoute: true,
        showStageFocusHandDock: true,
        stageBoardMinHeightPx: 300,
      }),
    ).toBe(306);
  });

  it("keeps base sizing unchanged when cap is not active", () => {
    const sizing = resolveMatchStageEngineBoardSizing({
      isStageFocusRoute: false,
      showStageFocusHandDock: true,
      stageBoardMinHeightPx: 560,
      stageEngineBoardMaxWidthPxBase: 700,
      stageEngineBoardMinHeightPxBase: 540,
    });
    expect(sizing.stageFocusEngineBoardMaxWidthCapPx).toBeUndefined();
    expect(sizing.engineBoardMaxWidthPx).toBe(700);
    expect(sizing.engineBoardMinHeightPx).toBe(540);
  });

  it("caps max width and min height in stage-focus hand-dock mode", () => {
    const sizing = resolveMatchStageEngineBoardSizing({
      isStageFocusRoute: true,
      showStageFocusHandDock: true,
      stageBoardMinHeightPx: 450,
      stageEngineBoardMaxWidthPxBase: 420,
      stageEngineBoardMinHeightPxBase: 360,
    });
    expect(sizing.stageFocusEngineBoardMaxWidthCapPx).toBe(392);
    expect(sizing.engineBoardMaxWidthPx).toBe(392);
    expect(sizing.engineBoardMinHeightPx).toBe(329);
  });

  it("keeps undefined base dimensions as undefined", () => {
    const sizing = resolveMatchStageEngineBoardSizing({
      isStageFocusRoute: true,
      showStageFocusHandDock: true,
      stageBoardMinHeightPx: 560,
      stageEngineBoardMaxWidthPxBase: undefined,
      stageEngineBoardMinHeightPxBase: undefined,
    });
    expect(sizing.stageFocusEngineBoardMaxWidthCapPx).toBe(502);
    expect(sizing.engineBoardMaxWidthPx).toBeUndefined();
    expect(sizing.engineBoardMinHeightPx).toBeUndefined();
  });
});
