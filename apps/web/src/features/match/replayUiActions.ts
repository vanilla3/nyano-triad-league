import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import { verifyReplayV1 } from "@nyano/triad-engine";
import type { SfxName } from "@/lib/sfx";
import { writeClipboardText } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errorMessage";

type ReplayVerifyStatus = "idle" | "ok" | "mismatch";

type ReplayVerifyDeps = {
  verifyReplayV1: typeof verifyReplayV1;
};

const DEFAULT_VERIFY_DEPS: ReplayVerifyDeps = {
  verifyReplayV1,
};

type ReplayCopyDeps = {
  writeClipboardText: typeof writeClipboardText;
  errorMessage: typeof errorMessage;
};

const DEFAULT_COPY_DEPS: ReplayCopyDeps = {
  writeClipboardText,
  errorMessage,
};

type ReplayCopyToast = {
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
};

export function resolveReplayVerifyStatus(ok: boolean): Exclude<ReplayVerifyStatus, "idle"> {
  return ok ? "ok" : "mismatch";
}

export function resolveReplayVerifySfx(ok: boolean): SfxName {
  return ok ? "victory_fanfare" : "error_buzz";
}

export function runReplayVerifyAction(
  input: {
    payload:
      | {
          transcript: TranscriptV1;
          cards: Map<bigint, CardData>;
          matchId: string;
        }
      | null;
    setVerifyStatus: (status: ReplayVerifyStatus) => void;
    playReplaySfx: (name: SfxName) => void;
  },
  depsPartial?: Partial<ReplayVerifyDeps>,
): boolean {
  if (!input.payload) return false;
  const deps: ReplayVerifyDeps = { ...DEFAULT_VERIFY_DEPS, ...(depsPartial ?? {}) };
  const result = deps.verifyReplayV1(
    input.payload.transcript,
    input.payload.cards,
    input.payload.matchId,
  );
  input.setVerifyStatus(resolveReplayVerifyStatus(result.ok));
  input.playReplaySfx(resolveReplayVerifySfx(result.ok));
  return true;
}

export async function copyReplayValueWithToast(
  input: {
    label: string;
    value: string;
    toast: ReplayCopyToast;
  },
  depsPartial?: Partial<ReplayCopyDeps>,
): Promise<void> {
  const deps: ReplayCopyDeps = { ...DEFAULT_COPY_DEPS, ...(depsPartial ?? {}) };
  try {
    await deps.writeClipboardText(input.value);
    input.toast.success("コピーしました", input.label);
  } catch (error: unknown) {
    input.toast.error("コピー失敗", deps.errorMessage(error));
  }
}
