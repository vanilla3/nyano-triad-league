import { describe, expect, it, vi } from "vitest";
import type { ReplayShareLinkBaseInput } from "@/features/match/replayShareLinkBuilders";
import {
  buildReplayCanonicalShareLink,
  buildReplayCurrentShareLink,
} from "@/features/match/replayShareLinkBuilders";

function makeBaseInput(): ReplayShareLinkBaseInput {
  return {
    text: "{\"foo\":1}",
    transcript: null,
    emptyError: "empty",
    eventId: "evt_1",
    pointsDeltaA: -3,
    ui: "engine",
    rulesetKey: "rk_1",
    classicMask: "cm_1",
    absolute: true,
  };
}

describe("features/match/replayShareLinkBuilders", () => {
  it("builds canonical share link with fixed mode/step", () => {
    const buildReplayShareLinkMock = vi.fn(() => "https://example.invalid/canonical");
    const url = buildReplayCanonicalShareLink(makeBaseInput(), {
      buildReplayShareLink: buildReplayShareLinkMock,
    });

    expect(url).toBe("https://example.invalid/canonical");
    expect(buildReplayShareLinkMock).toHaveBeenCalledWith({
      ...makeBaseInput(),
      mode: "auto",
      step: 9,
    });
  });

  it("builds current share link with caller mode/step", () => {
    const buildReplayShareLinkMock = vi.fn(() => "https://example.invalid/current");
    const url = buildReplayCurrentShareLink(
      {
        ...makeBaseInput(),
        mode: "compare",
        step: 5,
      },
      {
        buildReplayShareLink: buildReplayShareLinkMock,
      },
    );

    expect(url).toBe("https://example.invalid/current");
    expect(buildReplayShareLinkMock).toHaveBeenCalledWith({
      ...makeBaseInput(),
      mode: "compare",
      step: 5,
    });
  });

  it("builds current share link with undefined mode/step when omitted", () => {
    const buildReplayShareLinkMock = vi.fn(() => "https://example.invalid/current");
    buildReplayCurrentShareLink(makeBaseInput(), {
      buildReplayShareLink: buildReplayShareLinkMock,
    });

    expect(buildReplayShareLinkMock).toHaveBeenCalledWith({
      ...makeBaseInput(),
      mode: undefined,
      step: undefined,
    });
  });
});
