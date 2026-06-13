import type { SfxName } from "@/lib/sfx";
import type { StageActionFeedbackTone } from "@/features/match/matchStageFeedback";

export type MatchStageActionFeedbackTone = StageActionFeedbackTone;

type PushStageActionFeedback = (
  message: string,
  tone?: MatchStageActionFeedbackTone,
) => void;

type PlayMatchUiSfx = (name: SfxName) => void;

export function runToggleStageControlsWithFeedback(input: {
  showStageControls: boolean;
  pushStageActionFeedback: PushStageActionFeedback;
  playMatchUiSfx: PlayMatchUiSfx;
  toggleStageControls: () => void;
}): void {
  input.pushStageActionFeedback(
    input.showStageControls ? "Controls hidden" : "Controls shown",
  );
  input.playMatchUiSfx("card_place");
  input.toggleStageControls();
}

export function runToggleStageAssistWithFeedback(input: {
  isStageFocusRoute: boolean;
  nextShowStageAssist: boolean;
  pushStageActionFeedback: PushStageActionFeedback;
  playMatchUiSfx: PlayMatchUiSfx;
}): void {
  if (!input.isStageFocusRoute) return;
  input.pushStageActionFeedback(
    input.nextShowStageAssist ? "HUD shown" : "HUD hidden",
  );
  input.playMatchUiSfx("card_place");
}

export function runToggleStageFullscreenWithFeedback(input: {
  isStageFullscreen: boolean;
  exitFullscreenMessage: string;
  enterFullscreenMessage: string;
  pushStageActionFeedback: PushStageActionFeedback;
  playMatchUiSfx: PlayMatchUiSfx;
  toggleStageFullscreen: () => void | Promise<void>;
}): void {
  input.pushStageActionFeedback(
    input.isStageFullscreen
      ? input.exitFullscreenMessage
      : input.enterFullscreenMessage,
  );
  input.playMatchUiSfx("card_place");
  void input.toggleStageFullscreen();
}

export function runExitFocusModeWithFeedback(input: {
  pushStageActionFeedback: PushStageActionFeedback;
  playMatchUiSfx: PlayMatchUiSfx;
  setFocusMode: (next: boolean) => void;
}): void {
  input.pushStageActionFeedback("Exiting focus mode", "warn");
  input.playMatchUiSfx("flip");
  input.setFocusMode(false);
}

export function runOpenReplayWithFeedback(input: {
  pushStageActionFeedback: PushStageActionFeedback;
  playMatchUiSfx: PlayMatchUiSfx;
  openReplay: () => void | Promise<void>;
}): void {
  input.pushStageActionFeedback("Opening replay");
  input.playMatchUiSfx("card_place");
  void input.openReplay();
}

export function runDoAiMoveWithFeedback(input: {
  pushStageActionFeedback: PushStageActionFeedback;
  playMatchUiSfx: PlayMatchUiSfx;
  doAiMove: () => void;
}): void {
  input.pushStageActionFeedback("Nyano move requested");
  input.playMatchUiSfx("card_place");
  input.doAiMove();
}
