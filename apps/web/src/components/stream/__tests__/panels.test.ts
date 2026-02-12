/**
 * panels.test.ts
 *
 * Smoke tests for extracted stream panel components.
 * These panels are purely presentational (React.memo) and receive all state/callbacks as props.
 * This file validates that the module exports are correctly structured.
 *
 * Full rendering tests would require @testing-library/react (not currently configured).
 */
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

describe("WarudoBridgePanel", () => {
  it("exports WarudoBridgePanel component", async () => {
    const mod = await import("../WarudoBridgePanel");
    expect(mod.WarudoBridgePanel).toBeDefined();
    expect(typeof mod.WarudoBridgePanel).toBe("object"); // React.memo wraps as object
  });
});

describe("VoteControlPanel", () => {
  it("exports VoteControlPanel component", async () => {
    const mod = await import("../VoteControlPanel");
    expect(mod.VoteControlPanel).toBeDefined();
    expect(typeof mod.VoteControlPanel).toBe("object"); // React.memo wraps as object
  });

  it("VoteControlPanel type has a name starting with VoteControlPanel", async () => {
    const mod = await import("../VoteControlPanel");
    // React.memo components have a type property with the name
    // Bundlers may suffix with a number (e.g. "VoteControlPanel2") so match prefix
    const panel = mod.VoteControlPanel as unknown as { displayName?: string; type?: { name?: string } };
    const name = panel.type?.name ?? panel.displayName ?? "";
    expect(name).toMatch(/^VoteControlPanel/);
  });

  it("renders BASE_URL-aware host path guidance", async () => {
    const mod = await import("../VoteControlPanel");
    const originalBase = import.meta.env.BASE_URL;
    import.meta.env.BASE_URL = "/sub/";

    try {
      const html = renderToStaticMarkup(
        React.createElement(mod.VoteControlPanel, {
          controlledSide: 0,
          onChangeControlledSide: () => undefined,
          voteSeconds: 20,
          onChangeVoteSeconds: () => undefined,
          autoStartEachTurn: false,
          onChangeAutoStartEachTurn: () => undefined,
          settingsLocked: false,
          canVoteNow: true,
          voteOpen: false,
          timeLeft: null,
          onStartVote: () => undefined,
          onFinalizeVote: () => undefined,
          onResetVotes: () => undefined,
          userName: "",
          onChangeUserName: () => undefined,
          chatText: "",
          onChangeChatText: () => undefined,
          onAddVoteFromChat: () => undefined,
          counts: [],
          voteAudit: {
            attempts: 0,
            accepted: 0,
            duplicates: 0,
            rateLimited: 0,
            illegal: 0,
            usernameRejected: 0,
            changeExceeded: 0,
          },
          onCopyViewerInstructions: () => undefined,
          antiSpamRateLimitMs: 2000,
          onChangeAntiSpamRateLimitMs: () => undefined,
          antiSpamMaxVoteChanges: 2,
          onChangeAntiSpamMaxVoteChanges: () => undefined,
        }),
      );
      expect(html).toContain("/sub/match?stream=1");
    } finally {
      import.meta.env.BASE_URL = originalBase;
    }
  });
});

describe("StreamSharePanel", () => {
  it("exports StreamSharePanel component", async () => {
    const mod = await import("../StreamSharePanel");
    expect(mod.StreamSharePanel).toBeDefined();
    expect(typeof mod.StreamSharePanel).toBe("object"); // React.memo wraps as object
  });
});
