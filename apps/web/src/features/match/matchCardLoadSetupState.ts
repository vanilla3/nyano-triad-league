import { resolveRpcLoadErrorToastKind } from "@/features/match/matchCardLoaders";

export type MatchCardLoadSetupState = {
  defaultOpen: boolean;
  error: string | null;
  showRpcSettingsCta: boolean;
};

export function resolveMatchCardLoadSetupState(input: {
  hasCards: boolean;
  error: string | null;
}): MatchCardLoadSetupState {
  const setupError = input.hasCards ? null : input.error;
  return {
    defaultOpen: !input.hasCards,
    error: setupError,
    showRpcSettingsCta: Boolean(
      setupError && resolveRpcLoadErrorToastKind(setupError) === "rpc",
    ),
  };
}
