import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import type { RulesetKey } from "@/lib/ruleset_registry";
import { base64UrlEncodeUtf8, tryGzipCompressUtf8ToBase64Url } from "@/lib/base64url";
import { buildReplayBundleV2, stringifyReplayBundle } from "@/lib/replay_bundle";
import { stringifyWithBigInt } from "@/lib/json";
import { buildReplayShareUrl } from "@/lib/appUrl";

export type ReplayShareDataPayload = { key: "z" | "t"; value: string };

export function buildReplayShareDataPayload(
  json: string,
  deps?: {
    compress?: (text: string) => string | null;
    encode?: (text: string) => string;
  },
): ReplayShareDataPayload {
  const compress = deps?.compress ?? tryGzipCompressUtf8ToBase64Url;
  const encode = deps?.encode ?? base64UrlEncodeUtf8;
  const compressed = compress(json);
  if (compressed) return { key: "z", value: compressed };
  return { key: "t", value: encode(json) };
}

export function buildMatchReplayJson(input: {
  transcript: TranscriptV1;
  cards: Map<bigint, CardData> | null;
}): string {
  if (input.cards) {
    return stringifyReplayBundle(buildReplayBundleV2(input.transcript, input.cards));
  }
  return stringifyWithBigInt(input.transcript, 0);
}

export function buildMatchReplayShareUrlFromJson(
  input: {
    json: string;
    step: number;
    eventId?: string;
    ui?: string;
    rulesetKey?: RulesetKey;
    classicMask?: string;
    absolute?: boolean;
  },
  deps?: {
    buildUrl?: typeof buildReplayShareUrl;
    compress?: (text: string) => string | null;
    encode?: (text: string) => string;
  },
): string {
  const buildUrl = deps?.buildUrl ?? buildReplayShareUrl;
  const data = buildReplayShareDataPayload(input.json, deps);
  return buildUrl({
    data,
    step: input.step,
    eventId: input.eventId,
    ui: input.ui,
    rulesetKey: input.rulesetKey,
    classicMask: input.classicMask,
    absolute: input.absolute,
  });
}

export function buildMatchReplayShareUrl(
  input: {
    transcript: TranscriptV1;
    cards: Map<bigint, CardData> | null;
    step: number;
    eventId?: string;
    ui?: string;
    rulesetKey?: RulesetKey;
    classicMask?: string;
    absolute?: boolean;
  },
  deps?: {
    buildUrl?: typeof buildReplayShareUrl;
    compress?: (text: string) => string | null;
    encode?: (text: string) => string;
  },
): string {
  const json = buildMatchReplayJson({
    transcript: input.transcript,
    cards: input.cards,
  });
  return buildMatchReplayShareUrlFromJson(
    {
      json,
      step: input.step,
      eventId: input.eventId,
      ui: input.ui,
      rulesetKey: input.rulesetKey,
      classicMask: input.classicMask,
      absolute: input.absolute,
    },
    deps,
  );
}
