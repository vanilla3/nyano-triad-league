import React from "react";
import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import type { RulesetKey } from "@/lib/ruleset_registry";
import { tryNativeShare, type NativeShareResult } from "@/lib/webShare";
import { buildMatchReplayLink, buildMatchShareTemplateMessage } from "@/features/match/matchShareLinks";

type MatchReplayToast = {
  warn: (title: string, message: string) => void;
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
};

type CreateMatchReplayActionsInput = {
  transcript: TranscriptV1 | null;
  cards: Map<bigint, CardData> | null;
  eventId?: string;
  ui?: string;
  rulesetKey?: RulesetKey;
  classicMask?: string;
  setError: (next: string | null) => void;
  setStatus: (next: string | null) => void;
  navigate: (nextUrl: string) => void;
  toast: MatchReplayToast;
  copyToClipboard: (text: string) => Promise<void>;
  resolveErrorMessage: (error: unknown) => string;
};

type CreateMatchReplayActionsDeps = {
  buildReplayLink?: typeof buildMatchReplayLink;
  buildShareTemplateMessage?: typeof buildMatchShareTemplateMessage;
  shareUrlWithNative?: (url: string) => Promise<NativeShareResult>;
};

type MatchReplayActions = {
  buildReplayUrl: (absolute?: boolean) => string | null;
  copyShareUrl: () => Promise<void>;
  openReplay: () => Promise<void>;
  copyShareTemplate: () => Promise<void>;
};

export function createMatchReplayActions(
  input: CreateMatchReplayActionsInput,
  deps?: CreateMatchReplayActionsDeps,
): MatchReplayActions {
  const buildReplayLink = deps?.buildReplayLink ?? buildMatchReplayLink;
  const buildShareTemplateMessage = deps?.buildShareTemplateMessage ?? buildMatchShareTemplateMessage;
  const shareUrlWithNative =
    deps?.shareUrlWithNative ??
    ((url: string) =>
      tryNativeShare({
        url,
        title: "Nyano Triad League",
        text: "Replay share link",
      }));

  const buildReplayUrl = (absolute?: boolean): string | null =>
    buildReplayLink({
      transcript: input.transcript,
      cards: input.cards,
      eventId: input.eventId,
      ui: input.ui,
      rulesetKey: input.rulesetKey,
      classicMask: input.classicMask,
      absolute,
    });

  const copyShareUrl = async () => {
    input.setError(null);
    try {
      const url = buildReplayUrl(true);
      if (!url) {
        input.toast.warn("Replay", "Match result is not ready yet. Play to turn 9 first.");
        return;
      }

      try {
        const nativeResult = await shareUrlWithNative(url);
        if (nativeResult === "shared") {
          input.toast.success("Shared", "Share URL opened in native share sheet.");
          return;
        }
        if (nativeResult === "cancelled") {
          return;
        }
      } catch {
        // Native share failed. Fall through to clipboard copy.
      }

      await input.copyToClipboard(url);
      input.toast.success("Copied", "Share URL copied to clipboard.");
    } catch (error: unknown) {
      input.toast.error("Share failed", input.resolveErrorMessage(error));
    }
  };

  const openReplay = async () => {
    input.setError(null);
    input.setStatus(null);
    try {
      const url = buildReplayUrl(false);
      if (!url) {
        input.toast.warn("Replay", "Match result is not ready yet. Play to turn 9 first.");
        return;
      }
      input.navigate(url);
    } catch (error: unknown) {
      input.toast.error("Open replay failed", input.resolveErrorMessage(error));
    }
  };

  const copyShareTemplate = async () => {
    try {
      const url = buildReplayUrl(true);
      if (!url) {
        input.toast.warn("Replay", "Match result is not ready yet.");
        return;
      }
      const message = buildShareTemplateMessage(url);
      await input.copyToClipboard(message);
      input.toast.success("Copied", "Share template copied to clipboard.");
    } catch (error: unknown) {
      input.toast.error("Share failed", input.resolveErrorMessage(error));
    }
  };

  return {
    buildReplayUrl,
    copyShareUrl,
    openReplay,
    copyShareTemplate,
  };
}

export function useMatchReplayActions(
  input: CreateMatchReplayActionsInput,
): MatchReplayActions {
  const {
    cards,
    classicMask,
    copyToClipboard,
    eventId,
    navigate,
    resolveErrorMessage,
    rulesetKey,
    setError,
    setStatus,
    toast,
    transcript,
    ui,
  } = input;

  return React.useMemo(
    () =>
      createMatchReplayActions({
        transcript,
        cards,
        eventId,
        ui,
        rulesetKey,
        classicMask,
        setError,
        setStatus,
        navigate,
        toast,
        copyToClipboard,
        resolveErrorMessage,
      }),
    [
      cards,
      classicMask,
      copyToClipboard,
      eventId,
      navigate,
      resolveErrorMessage,
      rulesetKey,
      setError,
      setStatus,
      toast,
      transcript,
      ui,
    ],
  );
}
