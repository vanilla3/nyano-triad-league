import { beforeEach, describe, expect, it, vi } from "vitest";

type MockTexture = { destroyed?: boolean };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const mockAssetsLoad = vi.fn<(url: string) => Promise<MockTexture>>();
const mockBuildTokenImageUrls = vi.fn<(tokenId: string, config: unknown) => string[]>();
const mockGetCachedGameIndexMetadata = vi.fn();
const mockGetMetadataConfig = vi.fn();

vi.mock("pixi.js", () => ({
  Assets: {
    load: (url: string) => mockAssetsLoad(url),
  },
  Texture: class {},
}));

vi.mock("../renderers/pixi/tokenImageUrls", () => ({
  buildTokenImageUrls: (tokenId: string, config: unknown) =>
    mockBuildTokenImageUrls(tokenId, config as never),
}));

vi.mock("@/lib/nyano/gameIndex", () => ({
  getCachedGameIndexMetadata: () => mockGetCachedGameIndexMetadata(),
}));

vi.mock("@/lib/nyano/metadata", () => ({
  getMetadataConfig: (metadata: unknown) => mockGetMetadataConfig(metadata),
}));

import { TextureResolver } from "../renderers/pixi/textureResolver";

async function flushMicrotasks(rounds = 4): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

describe("TextureResolver preload queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCachedGameIndexMetadata.mockReturnValue(null);
    mockGetMetadataConfig.mockReturnValue({ baseUrlPattern: "https://img.example/{id}.png" });
    mockBuildTokenImageUrls.mockImplementation((tokenId: string) => [`https://img.example/${tokenId}.png`]);
  });

  it("deduplicates concurrent loadTexture calls and caches result", async () => {
    const resolver = new TextureResolver();
    const tex: MockTexture = { destroyed: false };
    mockAssetsLoad.mockResolvedValue(tex);

    const [a, b] = await Promise.all([
      resolver.loadTexture("42"),
      resolver.loadTexture("42"),
    ]);

    expect(mockAssetsLoad).toHaveBeenCalledTimes(1);
    expect(a).toBe(tex);
    expect(b).toBe(tex);
    expect(resolver.getTexture("42")).toBe(a);
  });

  it("does not repopulate cache from loads started before dispose", async () => {
    const resolver = new TextureResolver();
    const d = deferred<MockTexture>();
    mockAssetsLoad.mockReturnValueOnce(d.promise);

    const pending = resolver.loadTexture("7");
    resolver.dispose();

    d.resolve({ destroyed: false });
    const loaded = await pending;

    expect(loaded).toBeNull();
    expect(resolver.getTexture("7")).toBeNull();
  });

  it("preloads in queue order with max concurrency and normalized token ids", async () => {
    const resolver = new TextureResolver();
    const d1 = deferred<MockTexture>();
    const d2 = deferred<MockTexture>();
    const d3 = deferred<MockTexture>();
    mockAssetsLoad
      .mockReturnValueOnce(d1.promise)
      .mockReturnValueOnce(d2.promise)
      .mockReturnValueOnce(d3.promise);

    resolver.preloadTextures(["1", " 1 ", "", "2", "2", "3"], 1);
    expect(mockAssetsLoad).toHaveBeenCalledTimes(1);
    expect(mockAssetsLoad.mock.calls[0]?.[0]).toBe("https://img.example/1.png");

    d1.resolve({ destroyed: false });
    await flushMicrotasks();
    expect(mockAssetsLoad).toHaveBeenCalledTimes(2);
    expect(mockAssetsLoad.mock.calls[1]?.[0]).toBe("https://img.example/2.png");

    d2.resolve({ destroyed: false });
    await flushMicrotasks();
    expect(mockAssetsLoad).toHaveBeenCalledTimes(3);
    expect(mockAssetsLoad.mock.calls[2]?.[0]).toBe("https://img.example/3.png");

    d3.resolve({ destroyed: false });
    await flushMicrotasks();
    expect(mockAssetsLoad).toHaveBeenCalledTimes(3);
  });
});
