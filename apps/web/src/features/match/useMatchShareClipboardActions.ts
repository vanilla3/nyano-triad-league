import React from "react";
import type { TranscriptV1 } from "@nyano/triad-engine";
import { stringifyWithBigInt } from "@/lib/json";
import { buildMatchSetupShareUrl } from "@/features/match/matchShareLinks";

type MatchShareClipboardToast = {
  success: (title: string, message: string) => void;
  warn: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
};

type CreateMatchShareClipboardActionsInput = {
  pathname: string;
  search: URLSearchParams;
  simOk: boolean;
  simError: string;
  transcript: TranscriptV1 | null;
  setError: (next: string | null) => void;
  toast: MatchShareClipboardToast;
  copyToClipboard: (text: string) => Promise<void>;
  writeSetupClipboardText: (text: string) => Promise<string | boolean | void>;
  resolveErrorMessage: (error: unknown) => string;
};

type CreateMatchShareClipboardActionsDeps = {
  buildSetupShareUrl?: typeof buildMatchSetupShareUrl;
  stringifyTranscript?: (value: unknown, space?: number) => string;
};

type MatchShareClipboardActions = {
  handleCopySetupLink: () => Promise<void>;
  copyTranscriptJson: () => Promise<void>;
};

export function createMatchShareClipboardActions(
  input: CreateMatchShareClipboardActionsInput,
  deps?: CreateMatchShareClipboardActionsDeps,
): MatchShareClipboardActions {
  const buildSetupShareUrl = deps?.buildSetupShareUrl ?? buildMatchSetupShareUrl;
  const stringifyTranscript = deps?.stringifyTranscript ?? stringifyWithBigInt;

  const handleCopySetupLink = async () => {
    const url = buildSetupShareUrl({
      pathname: input.pathname,
      search: input.search,
    });
    const copied = await input.writeSetupClipboardText(url);
    if (copied !== false) {
      input.toast.success("コピーしました", "セットアップURLをコピーしました。");
    } else {
      input.toast.warn("コピー失敗", "URLを手動でコピーしてください。");
    }
  };

  const copyTranscriptJson = async () => {
    input.setError(null);
    if (!input.simOk || !input.transcript) {
      input.setError(input.simError);
      return;
    }
    try {
      const json = stringifyTranscript(input.transcript, 2);
      await input.copyToClipboard(json);
      input.toast.success("コピーしました", "transcript JSON");
    } catch (error: unknown) {
      input.toast.error("コピーに失敗しました", input.resolveErrorMessage(error));
    }
  };

  return {
    handleCopySetupLink,
    copyTranscriptJson,
  };
}

export function useMatchShareClipboardActions(
  input: CreateMatchShareClipboardActionsInput,
): MatchShareClipboardActions {
  const {
    pathname,
    search,
    simOk,
    simError,
    transcript,
    setError,
    toast,
    copyToClipboard,
    writeSetupClipboardText,
    resolveErrorMessage,
  } = input;

  return React.useMemo(
    () =>
      createMatchShareClipboardActions({
        pathname,
        search,
        simOk,
        simError,
        transcript,
        setError,
        toast,
        copyToClipboard,
        writeSetupClipboardText,
        resolveErrorMessage,
      }),
    [
      pathname,
      search,
      simOk,
      simError,
      transcript,
      setError,
      toast,
      copyToClipboard,
      writeSetupClipboardText,
      resolveErrorMessage,
    ],
  );
}
