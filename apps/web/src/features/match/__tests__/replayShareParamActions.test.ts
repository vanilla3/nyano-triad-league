import { describe, expect, it } from "vitest";
import { base64UrlEncodeUtf8 } from "@/lib/base64url";
import {
  resolveReplayClearShareParamsMutation,
  resolveReplayRetryPayload,
} from "@/features/match/replayShareParamActions";

describe("features/match/replayShareParamActions", () => {
  it("returns none payload when replay URL has no t/z share params", () => {
    const payload = resolveReplayRetryPayload(new URLSearchParams("ui=engine"));
    expect(payload.kind).toBe("none");
  });

  it("returns ok payload when replay URL has encoded t payload", () => {
    const payload = resolveReplayRetryPayload(new URLSearchParams(`t=${base64UrlEncodeUtf8("{\"hello\":1}")}`));
    expect(payload.kind).toBe("ok");
    if (payload.kind !== "ok") return;
    expect(payload.text).toBe("{\"hello\":1}");
  });

  it("clears replay share params while preserving unrelated params", () => {
    const next = resolveReplayClearShareParamsMutation(new URLSearchParams("z=abc&t=def&ui=engine&step=3"));
    expect(next).not.toBeNull();
    expect(next?.has("z")).toBe(false);
    expect(next?.has("t")).toBe(false);
    expect(next?.get("ui")).toBe("engine");
    expect(next?.has("step")).toBe(false);
  });

  it("returns null when there are no share params to clear", () => {
    const next = resolveReplayClearShareParamsMutation(new URLSearchParams("ui=engine"));
    expect(next).toBeNull();
  });
});
