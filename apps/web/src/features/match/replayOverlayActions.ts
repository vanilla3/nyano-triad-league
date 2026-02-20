import type { MatchResultWithHistory, TranscriptV1 } from "@nyano/triad-engine";
import { errorMessage } from "@/lib/errorMessage";
import { publishOverlayState } from "@/lib/streamer_bus";
import {
  buildReplayOverlayErrorState,
  buildReplayOverlayState,
} from "@/features/match/replayOverlayState";
import {
  resolveReplayOverlayLastMove,
  resolveReplayOverlayLastTurnSummary,
} from "@/features/match/replayOverlaySummary";

type ReplayOverlaySimState =
  | { ok: false; error: string }
  | { ok: true; transcript: TranscriptV1; current: MatchResultWithHistory };

type ReplayOverlayNotify = {
  success: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

type ReplayOverlayActionDeps = {
  now: () => number;
  errorMessage: (error: unknown) => string;
  publishOverlayState: typeof publishOverlayState;
};

const DEFAULT_DEPS: ReplayOverlayActionDeps = {
  now: () => Date.now(),
  errorMessage,
  publishOverlayState,
};

export function runReplayOverlayPublishAction(
  input: {
    sim: ReplayOverlaySimState;
    step: number;
    eventId?: string;
    eventTitle?: string;
    silent?: boolean;
    notify: ReplayOverlayNotify;
  },
  depsPartial?: Partial<ReplayOverlayActionDeps>,
): void {
  const deps: ReplayOverlayActionDeps = { ...DEFAULT_DEPS, ...(depsPartial ?? {}) };
  const updatedAtMs = deps.now();

  try {
    if (!input.sim.ok) {
      deps.publishOverlayState(buildReplayOverlayErrorState({
        updatedAtMs,
        eventId: input.eventId,
        eventTitle: input.eventTitle,
        error: input.sim.error || "リプレイが未読込です",
      }));
      if (!input.silent) input.notify.warn("リプレイが未読込状態です");
      return;
    }

    const result = input.sim.current;
    const transcript = input.sim.transcript;
    const lastIndex = input.step - 1;
    const last = lastIndex >= 0 ? (result.turns[lastIndex] ?? null) : null;
    const lastMove = resolveReplayOverlayLastMove({
      last,
      lastIndex,
      firstPlayer: transcript.header.firstPlayer as 0 | 1,
    });
    const lastTurnSummary = resolveReplayOverlayLastTurnSummary(last);

    deps.publishOverlayState(buildReplayOverlayState({
      updatedAtMs,
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      step: input.step,
      transcript,
      result,
      lastMove,
      lastTurnSummary,
    }));
    if (!input.silent) input.notify.success("OBS overlay へ送信しました");
  } catch (error: unknown) {
    const message = deps.errorMessage(error);
    deps.publishOverlayState(buildReplayOverlayErrorState({
      updatedAtMs,
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      error: message,
    }));
    if (!input.silent) input.notify.error(message);
  }
}
