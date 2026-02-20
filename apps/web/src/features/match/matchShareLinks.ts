import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import type { RulesetKey } from "@/lib/ruleset_registry";
import { appAbsoluteUrl } from "@/lib/appUrl";
import { buildMatchReplayShareUrl } from "@/features/match/matchReplayShare";

export function buildMatchSetupShareUrl(
  input: { pathname: string; search: URLSearchParams | string },
  deps?: { toAbsoluteUrl?: (pathOrUrl: string) => string },
): string {
  const toAbsoluteUrl = deps?.toAbsoluteUrl ?? appAbsoluteUrl;
  const query = typeof input.search === "string" ? input.search : input.search.toString();
  const path = input.pathname.replace(/^\//, "");
  return toAbsoluteUrl(query ? `${path}?${query}` : path);
}

export function buildMatchReplayLink(
  input: {
    transcript: TranscriptV1 | null;
    cards: Map<bigint, CardData> | null;
    eventId?: string;
    ui?: string;
    rulesetKey?: RulesetKey;
    classicMask?: string;
    absolute?: boolean;
  },
  deps?: {
    buildReplayShareUrl?: typeof buildMatchReplayShareUrl;
  },
): string | null {
  if (!input.transcript) return null;
  const buildReplayShareUrl = deps?.buildReplayShareUrl ?? buildMatchReplayShareUrl;
  return buildReplayShareUrl({
    transcript: input.transcript,
    cards: input.cards,
    step: 9,
    eventId: input.eventId,
    ui: input.ui,
    rulesetKey: input.rulesetKey,
    classicMask: input.classicMask,
    absolute: input.absolute,
  });
}

export function buildMatchShareTemplateMessage(url: string): string {
  return `Nyano Triad Replay\n${url}`;
}
