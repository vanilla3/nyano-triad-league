import React from "react";
import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import type { RulesetKey } from "@/lib/ruleset_registry";
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
        input.toast.warn("共有", "Match が未完了です。9手まで進めてください。");
        return;
      }
      await input.copyToClipboard(url);
      input.toast.success("コピーしました", "Share URL をクリップボードへコピーしました。");
    } catch (error: unknown) {
      input.toast.error("共有に失敗しました", input.resolveErrorMessage(error));
    }
  };

  const openReplay = async () => {
    input.setError(null);
    input.setStatus(null);
    try {
      const url = buildReplayUrl(false);
      if (!url) {
        input.toast.warn("Replay", "Match が未完了です。9手まで進めてください。");
        return;
      }
      input.navigate(url);
    } catch (error: unknown) {
      input.toast.error("リプレイ遷移に失敗しました", input.resolveErrorMessage(error));
    }
  };

  const copyShareTemplate = async () => {
    try {
      const url = buildReplayUrl(true);
      if (!url) {
        input.toast.warn("共有", "Match が未準備です");
        return;
      }
      const message = buildShareTemplateMessage(url);
      await input.copyToClipboard(message);
      input.toast.success("コピーしました", "共有テンプレート");
    } catch (error: unknown) {
      input.toast.error("共有に失敗しました", input.resolveErrorMessage(error));
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
