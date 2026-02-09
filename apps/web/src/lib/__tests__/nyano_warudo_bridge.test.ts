import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeBaseUrl,
  postNyanoWarudoSnapshot,
  type NyanoWarudoSnapshotRequest,
} from "../nyano_warudo_bridge";

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

function mockResponse(ok: boolean, status: number, body: string): Response {
  return { ok, status, text: () => Promise.resolve(body) } as any as Response;
}

function makeReq(overrides: Partial<NyanoWarudoSnapshotRequest> = {}): NyanoWarudoSnapshotRequest {
  return {
    source: "triad_league",
    kind: "ai_prompt",
    content: "test content",
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* normalizeBaseUrl                                                     */
/* ------------------------------------------------------------------ */

describe("normalizeBaseUrl", () => {
  it("strips trailing slash", () => {
    expect(normalizeBaseUrl("https://warudo.example.com/")).toBe("https://warudo.example.com");
  });

  it("returns as-is when no trailing slash", () => {
    expect(normalizeBaseUrl("https://warudo.example.com")).toBe("https://warudo.example.com");
  });

  it("trims whitespace and strips trailing slash", () => {
    expect(normalizeBaseUrl("  https://x.com/  ")).toBe("https://x.com");
  });

  it("returns empty for empty string", () => {
    expect(normalizeBaseUrl("")).toBe("");
  });

  it("returns empty for undefined (coerced via ??)", () => {
    expect(normalizeBaseUrl(undefined as any)).toBe("");
  });

  it("returns empty for whitespace-only string", () => {
    expect(normalizeBaseUrl("   ")).toBe("");
  });
});

/* ------------------------------------------------------------------ */
/* postNyanoWarudoSnapshot                                             */
/* ------------------------------------------------------------------ */

describe("postNyanoWarudoSnapshot", () => {
  it("returns early when baseUrl normalizes to empty", async () => {
    const result = await postNyanoWarudoSnapshot("", makeReq());
    expect(result).toEqual({ ok: false, status: 0, text: "NYANO_WARUDO_BASE_URL is empty" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns early for whitespace-only baseUrl", async () => {
    const result = await postNyanoWarudoSnapshot("   ", makeReq());
    expect(result).toEqual({ ok: false, status: 0, text: "NYANO_WARUDO_BASE_URL is empty" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns ok:true for successful 200 response", async () => {
    mockFetch.mockResolvedValue(mockResponse(true, 200, "OK"));
    const result = await postNyanoWarudoSnapshot("https://base", makeReq());
    expect(result).toEqual({ ok: true, status: 200, text: "OK" });
  });

  it("constructs correct URL with /v1/snapshots", async () => {
    mockFetch.mockResolvedValue(mockResponse(true, 200, "OK"));
    await postNyanoWarudoSnapshot("https://base", makeReq());
    expect(mockFetch).toHaveBeenCalledWith(
      "https://base/v1/snapshots",
      expect.anything(),
    );
  });

  it("sends POST with JSON content-type", async () => {
    mockFetch.mockResolvedValue(mockResponse(true, 200, "OK"));
    await postNyanoWarudoSnapshot("https://base", makeReq());
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe("POST");
    expect(opts.headers["content-type"]).toBe("application/json");
  });

  it("serializes request body as JSON", async () => {
    mockFetch.mockResolvedValue(mockResponse(true, 200, "OK"));
    const req = makeReq({ kind: "state_json", content: '{"foo":1}' });
    await postNyanoWarudoSnapshot("https://base", req);
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.body).toBe(JSON.stringify(req));
  });

  it("returns ok:false for non-ok 500 response", async () => {
    mockFetch.mockResolvedValue(mockResponse(false, 500, "Internal Server Error"));
    const result = await postNyanoWarudoSnapshot("https://base", makeReq());
    expect(result).toEqual({ ok: false, status: 500, text: "Internal Server Error" });
  });

  it("returns ok:false with status 0 on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));
    const result = await postNyanoWarudoSnapshot("https://base", makeReq());
    expect(result).toEqual({ ok: false, status: 0, text: "Network failure" });
  });

  it("handles trailing slash in baseUrl", async () => {
    mockFetch.mockResolvedValue(mockResponse(true, 200, "OK"));
    await postNyanoWarudoSnapshot("https://base/", makeReq());
    expect(mockFetch).toHaveBeenCalledWith(
      "https://base/v1/snapshots",
      expect.anything(),
    );
  });

  it("handles text() rejection gracefully", async () => {
    const res = {
      ok: true,
      status: 200,
      text: () => Promise.reject(new Error("text parse error")),
    } as any as Response;
    mockFetch.mockResolvedValue(res);
    const result = await postNyanoWarudoSnapshot("https://base", makeReq());
    expect(result).toEqual({ ok: true, status: 200, text: "" });
  });

  it("accepts optional AbortSignal", async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValue(mockResponse(true, 200, "OK"));
    const result = await postNyanoWarudoSnapshot("https://base", makeReq(), { signal: controller.signal });
    expect(result.ok).toBe(true);
    // Verify signal was passed through
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.signal).toBe(controller.signal);
  });
});

/* ------------------------------------------------------------------ */
/* Retry behavior                                                      */
/* ------------------------------------------------------------------ */

describe("postNyanoWarudoSnapshot retry", () => {
  it("retries on 500 and succeeds on second attempt", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(false, 500, "Server Error"))
      .mockResolvedValueOnce(mockResponse(true, 200, "OK"));

    const result = await postNyanoWarudoSnapshot("https://base", makeReq());
    expect(result).toEqual({ ok: true, status: 200, text: "OK" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 4xx errors", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, 400, "Bad Request"));

    const result = await postNyanoWarudoSnapshot("https://base", makeReq());
    expect(result).toEqual({ ok: false, status: 400, text: "Bad Request" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry on 404 errors", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(false, 404, "Not Found"));

    const result = await postNyanoWarudoSnapshot("https://base", makeReq());
    expect(result).toEqual({ ok: false, status: 404, text: "Not Found" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("retries on network error and succeeds", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("Connection refused"))
      .mockResolvedValueOnce(mockResponse(true, 200, "OK"));

    const result = await postNyanoWarudoSnapshot("https://base", makeReq());
    expect(result).toEqual({ ok: true, status: 200, text: "OK" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("returns error after exhausting all retries (network)", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockRejectedValueOnce(new Error("fail3"));

    const result = await postNyanoWarudoSnapshot("https://base", makeReq());
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.text).toBe("fail3");
    expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("returns last 500 response after exhausting all retries", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(false, 500, "Error 1"))
      .mockResolvedValueOnce(mockResponse(false, 502, "Error 2"))
      .mockResolvedValueOnce(mockResponse(false, 503, "Error 3"));

    const result = await postNyanoWarudoSnapshot("https://base", makeReq());
    expect(result.ok).toBe(false);
    expect(result.status).toBe(503);
    expect(result.text).toBe("Error 3");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
