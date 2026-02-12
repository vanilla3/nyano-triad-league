import { describe, expect, it } from "vitest";

import {
  buildStreamModerationConfig,
  checkSlowMode,
  findBlockedWord,
  isUserBanned,
  normalizeModerationUser,
  parseModerationListText,
  recordSlowModeAcceptedVote,
} from "../stream_moderation";

describe("stream_moderation", () => {
  it("normalizes moderation username", () => {
    expect(normalizeModerationUser("  Viewer_01 ")).toBe("viewer_01");
  });

  it("parses moderation list from commas/newlines with dedupe", () => {
    const parsed = parseModerationListText(" foo,bar\nFoo \n baz ");
    expect(parsed).toEqual(["foo", "bar", "baz"]);
  });

  it("builds moderation config from raw texts", () => {
    const config = buildStreamModerationConfig({
      slowModeSeconds: 12,
      bannedUsersText: "alice,bob",
      blockedWordsText: "spam\nscam",
    });
    expect(config.slowModeSeconds).toBe(12);
    expect(config.bannedUsers).toEqual(["alice", "bob"]);
    expect(config.blockedWords).toEqual(["spam", "scam"]);
  });

  it("detects banned users case-insensitively", () => {
    const config = buildStreamModerationConfig({
      slowModeSeconds: 0,
      bannedUsersText: "bad_user",
      blockedWordsText: "",
    });
    expect(isUserBanned("BAD_USER", config)).toBe(true);
    expect(isUserBanned("good_user", config)).toBe(false);
  });

  it("finds blocked word in message", () => {
    const config = buildStreamModerationConfig({
      slowModeSeconds: 0,
      bannedUsersText: "",
      blockedWordsText: "spoiler,abuse",
    });
    expect(findBlockedWord("please no SPOILER text", config)).toBe("spoiler");
    expect(findBlockedWord("normal message", config)).toBeNull();
  });

  it("slow mode allows first vote and rejects too-fast repeat", () => {
    const map = new Map<string, number>();
    const first = checkSlowMode("alice", 1_000, map, 5);
    expect(first).toEqual({ ok: true });
    recordSlowModeAcceptedVote("alice", 1_000, map);

    const second = checkSlowMode("Alice", 4_000, map, 5);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.waitMs).toBe(2_000);
    }
  });

  it("slow mode disabled when seconds is 0", () => {
    const map = new Map<string, number>();
    recordSlowModeAcceptedVote("alice", 1_000, map);
    expect(checkSlowMode("alice", 1_001, map, 0)).toEqual({ ok: true });
  });
});
