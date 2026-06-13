import { describe, expect, it } from "vitest";
import { base64UrlEncodeUtf8, tryGzipCompressUtf8ToBase64Url } from "@/lib/base64url";
import {
  decodeReplaySharePayload,
  hasReplaySharePayload,
  stripReplayShareParams,
} from "@/lib/replay_share_params";

describe("hasReplaySharePayload", () => {
  it("detects replay payload params", () => {
    expect(hasReplaySharePayload(new URLSearchParams("z=abc"))).toBe(true);
    expect(hasReplaySharePayload(new URLSearchParams("t=abc"))).toBe(true);
    expect(hasReplaySharePayload(new URLSearchParams("event=gp-1"))).toBe(false);
  });
});

describe("decodeReplaySharePayload", () => {
  it("returns none when no replay payload exists", () => {
    expect(decodeReplaySharePayload(new URLSearchParams("event=gp-1"))).toEqual({ kind: "none" });
  });

  it("decodes t payload", () => {
    const text = '{"header":{"version":1},"turns":[]}';
    const params = new URLSearchParams();
    params.set("t", base64UrlEncodeUtf8(text));

    expect(decodeReplaySharePayload(params)).toEqual({
      kind: "ok",
      param: "t",
      text,
    });
  });

  it("decodes z payload", () => {
    const text = '{"header":{"version":1},"turns":[{"cell":0,"cardIndex":0}]}';
    const compressed = tryGzipCompressUtf8ToBase64Url(text);
    if (!compressed) throw new Error("expected compression result");
    const params = new URLSearchParams();
    params.set("z", compressed);

    expect(decodeReplaySharePayload(params)).toEqual({
      kind: "ok",
      param: "z",
      text,
    });
  });

  it("prefers z payload when both z and t exist", () => {
    const text = '{"header":{"version":1},"turns":[{"cell":1,"cardIndex":2}]}';
    const compressed = tryGzipCompressUtf8ToBase64Url(text);
    if (!compressed) throw new Error("expected compression result");
    const params = new URLSearchParams();
    params.set("z", compressed);
    params.set("t", base64UrlEncodeUtf8("ignored"));

    expect(decodeReplaySharePayload(params)).toEqual({
      kind: "ok",
      param: "z",
      text,
    });
  });

  it("returns z error on invalid gzip payload", () => {
    const params = new URLSearchParams();
    params.set("z", "not-gzip");
    expect(decodeReplaySharePayload(params)).toEqual({
      kind: "error",
      param: "z",
      error: "Invalid share link (z parameter could not be decompressed).",
    });
  });

  it("returns t error on invalid base64 payload", () => {
    const params = new URLSearchParams();
    params.set("t", "!!invalid!!");
    expect(decodeReplaySharePayload(params)).toEqual({
      kind: "error",
      param: "t",
      error: "Invalid share link (t parameter could not be decoded).",
    });
  });
});

describe("stripReplayShareParams", () => {
  it("removes replay share/state params and preserves unrelated params", () => {
    const params = new URLSearchParams("z=abc&t=def&mode=auto&step=3&event=gp-1&broadcast=1&ui=rpg");
    const stripped = stripReplayShareParams(params);

    expect(stripped.get("event")).toBe("gp-1");
    expect(stripped.get("broadcast")).toBe("1");
    expect(stripped.get("ui")).toBe("rpg");
    expect(stripped.has("z")).toBe(false);
    expect(stripped.has("t")).toBe(false);
    expect(stripped.has("mode")).toBe(false);
    expect(stripped.has("step")).toBe(false);

    // original object remains unchanged
    expect(params.has("z")).toBe(true);
    expect(params.has("mode")).toBe(true);
  });
});
