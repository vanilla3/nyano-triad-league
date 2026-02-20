import type { ReplaySharePayloadDecodeResult } from "@/lib/replay_share_params";
import { resolveReplayRetryPayload } from "@/features/match/replayShareParamActions";
import type { ReplayMode } from "@/features/match/replayModeParams";

export type ReplayLoadFn = (override?: { text?: string; mode?: ReplayMode; step?: number }) => Promise<void>;

export async function runReplayRetryLoadFlow(
  input: {
    searchParams: URLSearchParams;
    mode: ReplayMode;
    step: number;
    load: ReplayLoadFn;
    setText: (text: string) => void;
    setReplayError: (error: string) => void;
  },
): Promise<"error" | "shared" | "current"> {
  const decoded = resolveReplayRetryPayload(input.searchParams);
  if (decoded.kind === "error") {
    input.setReplayError(decoded.error);
    return "error";
  }
  if (decoded.kind === "ok") {
    input.setText(decoded.text);
    await input.load({ text: decoded.text, mode: input.mode, step: input.step });
    return "shared";
  }
  await input.load();
  return "current";
}

export async function runReplayInitialAutoLoadFlow(
  input: {
    initialSharePayload: ReplaySharePayloadDecodeResult;
    initialMode: ReplayMode;
    initialStep: number;
    load: ReplayLoadFn;
    setText: (text: string) => void;
    setReplayError: (error: string) => void;
  },
): Promise<"none" | "error" | "loaded"> {
  if (input.initialSharePayload.kind === "none") return "none";
  if (input.initialSharePayload.kind === "error") {
    input.setReplayError(input.initialSharePayload.error);
    return "error";
  }
  input.setText(input.initialSharePayload.text);
  await input.load({
    text: input.initialSharePayload.text,
    mode: input.initialMode,
    step: input.initialStep,
  });
  return "loaded";
}
