import { afterEach, describe, expect, it } from "vitest";
import { buildStreamUrls } from "../stream_urls";

describe("buildStreamUrls", () => {
  const originalEnv = { ...import.meta.env };

  afterEach(() => {
    Object.keys(import.meta.env).forEach((key) => {
      if (!(key in originalEnv)) delete import.meta.env[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  it("builds root URLs when BASE_URL is /", () => {
    import.meta.env.BASE_URL = "/";
    const urls = buildStreamUrls("event-1");

    expect(urls.matchUrl).toBe("/match?event=event-1&ui=mint");
    expect(urls.hostMatchUrl).toBe("/match?event=event-1&ui=mint&stream=1&ctrl=A");
    expect(urls.overlayUrl).toBe("/overlay?controls=0");
    expect(urls.overlayTransparentUrl).toBe("/overlay?controls=0&bg=transparent");
    expect(urls.replayBroadcastUrl).toBe("/replay?broadcast=1");
  });

  it("builds subpath URLs when BASE_URL is /game/", () => {
    import.meta.env.BASE_URL = "/game/";
    const urls = buildStreamUrls("event-1");

    expect(urls.matchUrl).toBe("/game/match?event=event-1&ui=mint");
    expect(urls.hostMatchUrl).toBe("/game/match?event=event-1&ui=mint&stream=1&ctrl=A");
    expect(urls.overlayUrl).toBe("/game/overlay?controls=0");
    expect(urls.overlayTransparentUrl).toBe("/game/overlay?controls=0&bg=transparent");
    expect(urls.replayBroadcastUrl).toBe("/game/replay?broadcast=1");
  });

  it("omits event query param when eventId is empty", () => {
    import.meta.env.BASE_URL = "/";
    const urls = buildStreamUrls("  ");
    expect(urls.matchUrl).toBe("/match?ui=mint");
    expect(urls.hostMatchUrl).toBe("/match?ui=mint&stream=1&ctrl=A");
  });
});

