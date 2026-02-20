import React from "react";
import type { TranscriptV1 } from "@nyano/triad-engine";
import { stringifyWithBigInt } from "@/lib/json";
import { buildMatchSetupShareUrl } from "@/features/match/matchShareLinks";
import { tryNativeShare, type NativeShareResult } from "@/lib/webShare";

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
  shareSetupUrlWithNative?: (url: string) => Promise<NativeShareResult>;
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
  const shareSetupUrlWithNative =
    deps?.shareSetupUrlWithNative ??
    ((url: string) =>
      tryNativeShare({
        url,
        title: "Nyano Triad League",
        text: "Match setup share link",
      }));

  const handleCopySetupLink = async () => {
    const url = buildSetupShareUrl({
      pathname: input.pathname,
      search: input.search,
    });

    try {
      const nativeResult = await shareSetupUrlWithNative(url);
      if (nativeResult === "shared") {
        input.toast.success("Shared", "Setup share URL opened in native share sheet.");
        return;
      }
      if (nativeResult === "cancelled") {
        return;
      }
    } catch {
      // Native share failure falls back to clipboard copy.
    }

    const copied = await input.writeSetupClipboardText(url);
    if (copied !== false) {
      input.toast.success("Copied", "Setup share URL copied to clipboard.");
    } else {
      input.toast.warn("Copy failed", "Could not copy URL to clipboard.");
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
      input.toast.success("Copied", "transcript JSON");
    } catch (error: unknown) {
      input.toast.error("Copy failed", input.resolveErrorMessage(error));
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
