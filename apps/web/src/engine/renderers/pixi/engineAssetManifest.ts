import { appPath } from "@/lib/appUrl";

export type EngineAssetCategory = "board" | "cell" | "card" | "fx";

export type EngineAssetManifestV1 = {
  version: 1;
  assets: Record<EngineAssetCategory, readonly string[]>;
};

/**
 * Pixi battle asset manifest scaffold for WO003-A.
 * Asset files can be replaced incrementally while keeping stable paths.
 */
export const ENGINE_ASSET_MANIFEST_V1: EngineAssetManifestV1 = {
  version: 1,
  assets: {
    board: [
      "board/board_base.webp",
      "board/board_grid_overlay.webp",
      "board/board_shadow_overlay.webp",
    ],
    cell: [
      "cell/cell_slot_base.webp",
      "cell/cell_slot_highlight.webp",
    ],
    card: [
      "card/card_frame_base.webp",
      "card/card_frame_holo.webp",
    ],
    fx: [
      "fx/fx_place_spark.webp",
      "fx/fx_flip_burst.webp",
    ],
  },
};

export function resolveEngineAssetUrl(assetPath: string): string {
  const clean = assetPath.replace(/^\/+/, "");
  return appPath(`assets/engine/${clean}`);
}

export function listEngineAssetPaths(
  manifest: EngineAssetManifestV1 = ENGINE_ASSET_MANIFEST_V1,
): string[] {
  return (Object.keys(manifest.assets) as EngineAssetCategory[]).flatMap((category) => [
    ...manifest.assets[category],
  ]);
}

export function buildEngineAssetUrlMap(
  manifest: EngineAssetManifestV1 = ENGINE_ASSET_MANIFEST_V1,
): Record<string, string> {
  const paths = listEngineAssetPaths(manifest);
  const out: Record<string, string> = {};
  for (const path of paths) out[path] = resolveEngineAssetUrl(path);
  return out;
}
