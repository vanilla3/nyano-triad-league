import type { NativeShareResult } from "@/lib/webShare";

export async function runReplayShareCopyAction(input: {
  shareLabel: string;
  buildShareLink: () => string;
  copyWithToast: (label: string, value: string) => Promise<void>;
  onError: (error: unknown) => void;
  shareWithNative?: (url: string) => Promise<NativeShareResult>;
  onShared?: () => void;
}): Promise<boolean> {
  try {
    const link = input.buildShareLink();

    if (input.shareWithNative) {
      try {
        const result = await input.shareWithNative(link);
        if (result === "shared") {
          input.onShared?.();
          return true;
        }
        if (result === "cancelled") {
          return false;
        }
      } catch {
        // Fall back to clipboard copy.
      }
    }

    await input.copyWithToast(input.shareLabel, link);
    return true;
  } catch (error: unknown) {
    input.onError(error);
    return false;
  }
}

export async function runReplayCopyAction(input: {
  label: string;
  resolveValue: () => string;
  copyWithToast: (label: string, value: string) => Promise<void>;
  onError?: (error: unknown) => void;
}): Promise<boolean> {
  try {
    const value = input.resolveValue();
    await input.copyWithToast(input.label, value);
    return true;
  } catch (error: unknown) {
    input.onError?.(error);
    return false;
  }
}

export async function runReplaySaveAttemptAction(input: {
  saveToMyAttempts: () => Promise<void>;
  onSuccess: () => void;
  onError: (error: unknown) => void;
}): Promise<boolean> {
  try {
    await input.saveToMyAttempts();
    input.onSuccess();
    return true;
  } catch (error: unknown) {
    input.onError(error);
    return false;
  }
}
