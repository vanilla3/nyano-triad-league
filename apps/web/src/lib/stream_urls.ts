import { appAbsoluteUrl } from "./appUrl";

export type StreamUrls = {
  matchUrl: string;
  hostMatchUrl: string;
  overlayUrl: string;
  overlayTransparentUrl: string;
  replayBroadcastUrl: string;
};

function buildUrl(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return appAbsoluteUrl(query ? `${path}?${query}` : path);
}

export function buildStreamUrls(eventId?: string | null): StreamUrls {
  const event = eventId?.trim();

  const matchParams = new URLSearchParams();
  if (event) matchParams.set("event", event);
  matchParams.set("ui", "mint");

  const hostParams = new URLSearchParams(matchParams);
  hostParams.set("stream", "1");
  hostParams.set("ctrl", "A");

  const overlayParams = new URLSearchParams();
  overlayParams.set("controls", "0");

  const overlayTransparentParams = new URLSearchParams(overlayParams);
  overlayTransparentParams.set("bg", "transparent");

  const replayParams = new URLSearchParams();
  replayParams.set("broadcast", "1");

  return {
    matchUrl: buildUrl("match", matchParams),
    hostMatchUrl: buildUrl("match", hostParams),
    overlayUrl: buildUrl("overlay", overlayParams),
    overlayTransparentUrl: buildUrl("overlay", overlayTransparentParams),
    replayBroadcastUrl: buildUrl("replay", replayParams),
  };
}

