type ReplayTransportStateInput = {
  step: number;
  stepMax: number;
  simOk: boolean;
  isStageFocus: boolean;
  showStageTransport: boolean;
  viewportWidth: number | null;
  resolveShouldShowStageSecondaryControls: (viewportWidth: number) => boolean;
};

export type ReplayTransportState = {
  canStepBack: boolean;
  canStepForward: boolean;
  canPlay: boolean;
  showStageToolbarTransport: boolean;
  replayTransportButtonClass: string;
  replayTransportPrimaryButtonClass: string;
  replaySpeedSelectClass: string;
};

export function resolveReplayTransportState(input: ReplayTransportStateInput): ReplayTransportState {
  const canStepBack = input.step > 0;
  const canStepForward = input.step < input.stepMax;
  const canPlay = input.simOk && input.stepMax > 0;
  const showStageToolbarTransport = input.isStageFocus
    && input.simOk
    && input.showStageTransport
    && (
      input.viewportWidth === null
      || input.resolveShouldShowStageSecondaryControls(input.viewportWidth)
    );

  return {
    canStepBack,
    canStepForward,
    canPlay,
    showStageToolbarTransport,
    replayTransportButtonClass: input.isStageFocus ? "btn h-10 px-4" : "btn btn-sm",
    replayTransportPrimaryButtonClass: input.isStageFocus ? "btn btn-primary h-10 px-4" : "btn btn-sm btn-primary",
    replaySpeedSelectClass: input.isStageFocus
      ? "rounded-md border border-surface-300 bg-white h-10 px-2 text-sm"
      : "rounded-md border border-surface-300 bg-white px-2 py-1 text-xs",
  };
}
