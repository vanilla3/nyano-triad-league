import { describe, expect, it } from "vitest";
import {
  resolveMatchStageIdleGuidanceTargets,
  shouldDisableMatchStageIdleGuidance,
} from "@/features/match/matchStageIdleGuidance";

describe("features/match/matchStageIdleGuidance", () => {
  describe("shouldDisableMatchStageIdleGuidance", () => {
    it("returns false for eligible mint stage state", () => {
      expect(shouldDisableMatchStageIdleGuidance({
        useMintUi: true,
        isRpg: false,
        hasCardSource: true,
        isAiTurn: false,
        isGameOver: false,
        isHandDragging: false,
        isBoardAnimating: false,
        hasInlineError: false,
      })).toBe(false);
    });

    it("returns true when any disabling condition is active", () => {
      expect(shouldDisableMatchStageIdleGuidance({
        useMintUi: false,
        isRpg: false,
        hasCardSource: true,
        isAiTurn: false,
        isGameOver: false,
        isHandDragging: false,
        isBoardAnimating: false,
        hasInlineError: false,
      })).toBe(true);
      expect(shouldDisableMatchStageIdleGuidance({
        useMintUi: true,
        isRpg: false,
        hasCardSource: true,
        isAiTurn: false,
        isGameOver: false,
        isHandDragging: false,
        isBoardAnimating: true,
        hasInlineError: false,
      })).toBe(true);
      expect(shouldDisableMatchStageIdleGuidance({
        useMintUi: true,
        isRpg: false,
        hasCardSource: true,
        isAiTurn: false,
        isGameOver: false,
        isHandDragging: false,
        isBoardAnimating: false,
        hasInlineError: true,
      })).toBe(true);
    });
  });

  describe("resolveMatchStageIdleGuidanceTargets", () => {
    it("guides hand selection when idle and no card selected", () => {
      expect(resolveMatchStageIdleGuidanceTargets({
        stageIdleGuidance: true,
        isStageFocusRoute: false,
        showStageControls: true,
        showFocusHandDock: false,
        draftCardIndex: null,
        draftCell: null,
      })).toEqual({
        idleGuideHand: true,
        idleGuideBoard: false,
      });
    });

    it("guides board placement when a card is selected but cell is not", () => {
      expect(resolveMatchStageIdleGuidanceTargets({
        stageIdleGuidance: true,
        isStageFocusRoute: false,
        showStageControls: true,
        showFocusHandDock: false,
        draftCardIndex: 1,
        draftCell: null,
      })).toEqual({
        idleGuideHand: false,
        idleGuideBoard: true,
      });
    });

    it("suppresses guidance when idle guidance is off", () => {
      expect(resolveMatchStageIdleGuidanceTargets({
        stageIdleGuidance: false,
        isStageFocusRoute: false,
        showStageControls: true,
        showFocusHandDock: false,
        draftCardIndex: null,
        draftCell: null,
      })).toEqual({
        idleGuideHand: false,
        idleGuideBoard: false,
      });
    });

    it("suppresses hand guidance when focus route controls are hidden or focus dock is shown", () => {
      expect(resolveMatchStageIdleGuidanceTargets({
        stageIdleGuidance: true,
        isStageFocusRoute: true,
        showStageControls: false,
        showFocusHandDock: false,
        draftCardIndex: null,
        draftCell: null,
      }).idleGuideHand).toBe(false);

      expect(resolveMatchStageIdleGuidanceTargets({
        stageIdleGuidance: true,
        isStageFocusRoute: false,
        showStageControls: true,
        showFocusHandDock: true,
        draftCardIndex: null,
        draftCell: null,
      }).idleGuideHand).toBe(false);
    });

    it("suppresses board guidance once a destination cell is selected", () => {
      expect(resolveMatchStageIdleGuidanceTargets({
        stageIdleGuidance: true,
        isStageFocusRoute: false,
        showStageControls: true,
        showFocusHandDock: false,
        draftCardIndex: 2,
        draftCell: 4,
      }).idleGuideBoard).toBe(false);
    });
  });
});
