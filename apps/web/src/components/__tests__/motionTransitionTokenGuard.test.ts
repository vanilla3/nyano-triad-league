import { describe, expect, it } from "vitest";

import mintThemeSource from "../../mint-theme/mint-theme.css?raw";
import rpgThemeSource from "../../rpg-theme/rpg-theme.css?raw";
import gameResultOverlaySource from "../GameResultOverlayMint.tsx?raw";
import nyanoReactionSource from "../NyanoReaction.tsx?raw";

const TRANSITION_BLOCK_PATTERN = /transition\s*:\s*([\s\S]*?);/gi;
const DURATION_LITERAL_PATTERN = /\b(?:\d+ms|(?:\d*\.)?\d+s)\b/i;

function collectHardcodedTransitionBlocks(source: string): string[] {
  return [...source.matchAll(TRANSITION_BLOCK_PATTERN)]
    .map((match) => match[1] ?? "")
    .filter((value) => DURATION_LITERAL_PATTERN.test(value))
    .map((value) => value.trim());
}

describe("motionTransitionTokenGuard", () => {
  const guardedSources = [
    { id: "mint-theme.css", source: mintThemeSource },
    { id: "rpg-theme.css", source: rpgThemeSource },
    { id: "GameResultOverlayMint.tsx", source: gameResultOverlaySource },
    { id: "NyanoReaction.tsx", source: nyanoReactionSource },
  ] as const;

  it.each(guardedSources)(
    "does not allow hard-coded transition durations in $id",
    ({ source }) => {
      expect(collectHardcodedTransitionBlocks(source)).toEqual([]);
    },
  );
});
