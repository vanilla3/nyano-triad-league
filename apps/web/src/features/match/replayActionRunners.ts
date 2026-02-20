export async function runReplayShareCopyAction(input: {
  shareLabel: string;
  buildShareLink: () => string;
  copyWithToast: (label: string, value: string) => Promise<void>;
  onError: (error: unknown) => void;
}): Promise<boolean> {
  try {
    const link = input.buildShareLink();
    await input.copyWithToast(input.shareLabel, link);
    return true;
  } catch (error: unknown) {
    input.onError(error);
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