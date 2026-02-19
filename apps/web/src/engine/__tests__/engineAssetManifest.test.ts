import { afterEach, describe, expect, it } from "vitest";
import {
  ENGINE_ASSET_MANIFEST_V1,
  buildEngineAssetUrlMap,
  listEngineAssetPaths,
  resolveEngineAssetUrl,
} from "../renderers/pixi/engineAssetManifest";

describe("engineAssetManifest", () => {
  const originalEnv = { ...import.meta.env };

  afterEach(() => {
    Object.keys(import.meta.env).forEach((key) => {
      if (!(key in originalEnv)) delete import.meta.env[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  it("exposes v1 manifest with board/cell/card/fx categories", () => {
    expect(ENGINE_ASSET_MANIFEST_V1.version).toBe(1);
    expect(ENGINE_ASSET_MANIFEST_V1.assets.board.length).toBeGreaterThan(0);
    expect(ENGINE_ASSET_MANIFEST_V1.assets.cell.length).toBeGreaterThan(0);
    expect(ENGINE_ASSET_MANIFEST_V1.assets.card.length).toBeGreaterThan(0);
    expect(ENGINE_ASSET_MANIFEST_V1.assets.fx.length).toBeGreaterThan(0);
  });

  it("lists unique relative asset paths", () => {
    const paths = listEngineAssetPaths();
    expect(paths.length).toBeGreaterThan(0);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((p) => !p.startsWith("/"))).toBe(true);
  });

  it("resolves asset url with BASE_URL subpath", () => {
    import.meta.env.BASE_URL = "/nyano-triad-league/";
    expect(resolveEngineAssetUrl("board/board_base.webp")).toBe(
      "/nyano-triad-league/assets/engine/board/board_base.webp",
    );
  });

  it("builds url map for all manifest entries", () => {
    import.meta.env.BASE_URL = "/";
    const paths = listEngineAssetPaths();
    const map = buildEngineAssetUrlMap();
    expect(Object.keys(map).length).toBe(paths.length);
    for (const path of paths) {
      expect(map[path]).toBe(`/assets/engine/${path}`);
    }
  });
});
