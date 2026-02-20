import type { SfxName } from "@/lib/sfx";
import type { StageActionFeedbackTone } from "@/features/match/matchStageFeedback";

export type ReplayStageActionFeedbackTone = StageActionFeedbackTone;

type PushStageActionFeedback = (
  message: string,
  tone?: ReplayStageActionFeedbackTone,
) => void;

type PlayReplaySfx = (name: SfxName) => void;

export function runReplayToggleStageFullscreenWithFeedback(input: {
  isStageFullscreen: boolean;
  exitFullscreenMessage: string;
  enterFullscreenMessage: string;
  pushStageActionFeedback: PushStageActionFeedback;
  playReplaySfx: PlayReplaySfx;
  toggleStageFullscreen: () => void | Promise<void>;
}): void {
  input.pushStageActionFeedback(
    input.isStageFullscreen
      ? input.exitFullscreenMessage
      : input.enterFullscreenMessage,
  );
  input.playReplaySfx("card_place");
  void input.toggleStageFullscreen();
}

export function runReplayToggleStageTransportWithFeedback(input: {
  showStageTransport: boolean;
  hideControlsMessage: string;
  showControlsMessage: string;
  pushStageActionFeedback: PushStageActionFeedback;
  playReplaySfx: PlayReplaySfx;
  toggleStageTransport: () => void;
}): void {
  input.pushStageActionFeedback(
    input.showStageTransport
      ? input.hideControlsMessage
      : input.showControlsMessage,
  );
  input.playReplaySfx("card_place");
  input.toggleStageTransport();
}

export function runReplayToggleStageSetupWithFeedback(input: {
  isStageFocus: boolean;
  nextShowStageSetup: boolean;
  setupShownMessage: string;
  setupHiddenMessage: string;
  pushStageActionFeedback: PushStageActionFeedback;
  playReplaySfx: PlayReplaySfx;
}): void {
  if (!input.isStageFocus) return;
  input.pushStageActionFeedback(
    input.nextShowStageSetup
      ? input.setupShownMessage
      : input.setupHiddenMessage,
  );
  input.playReplaySfx("card_place");
}

export function runReplayToggleStagePanelsWithFeedback(input: {
  isStageFocus: boolean;
  nextShowStagePanels: boolean;
  panelsShownMessage: string;
  panelsHiddenMessage: string;
  pushStageActionFeedback: PushStageActionFeedback;
  playReplaySfx: PlayReplaySfx;
}): void {
  if (!input.isStageFocus) return;
  input.pushStageActionFeedback(
    input.nextShowStagePanels
      ? input.panelsShownMessage
      : input.panelsHiddenMessage,
  );
  input.playReplaySfx("card_place");
}

export function runReplayExitFocusModeWithFeedback(input: {
  exitFocusMessage: string;
  pushStageActionFeedback: PushStageActionFeedback;
  setFocusMode: (next: boolean) => void;
}): void {
  input.pushStageActionFeedback(input.exitFocusMessage, "warn");
  input.setFocusMode(false);
}
