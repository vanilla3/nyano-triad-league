/**
 * stream_command_generator.ts
 *
 * Generates sample viewer commands and Nightbot templates for stream participation.
 * Uses triad_viewer_command.ts as the single source of truth for command formatting.
 */

import { cellIndexToCoord, formatViewerMoveText } from "@/lib/triad_viewer_command";
import type { PlayerSide } from "@/lib/triad_viewer_command";

/**
 * Generate sample valid commands for the current game state.
 * Returns up to `maxCount` commands, picking diverse cell+card combos.
 */
export function generateSampleCommands(
  side: PlayerSide,
  emptyCells: number[],
  remainingCards: number[],
  maxCount = 5,
): string[] {
  if (emptyCells.length === 0 || remainingCards.length === 0) return [];

  const commands: string[] = [];

  // Pick diverse combinations: iterate diagonally through cells × cards
  const cellCount = emptyCells.length;
  const cardCount = remainingCards.length;
  const totalCombos = cellCount * cardCount;
  const step = Math.max(1, Math.floor(totalCombos / maxCount));

  for (let i = 0; i < totalCombos && commands.length < maxCount; i += step) {
    const cellIdx = i % cellCount;
    const cardIdx = Math.floor(i / cellCount) % cardCount;
    const cell = emptyCells[cellIdx]!;
    const cardIndex = remainingCards[cardIdx]!;
    const slot = cardIndex + 1;

    commands.push(formatViewerMoveText({ side, slot, cell }));
  }

  return commands;
}

/**
 * Generate a Nightbot-compatible template for viewer instructions.
 */
export function generateNightbotTemplate(side: PlayerSide): string {
  const sideChar = side === 0 ? "A" : "B";
  return [
    `【Nyano Triad League 投票コマンド】`,
    `フォーマット: #triad ${sideChar}<スロット>-><セル>`,
    `例: #triad ${sideChar}2->B2`,
    `Warning Mark付き: #triad ${sideChar}2->B2 wm=C1`,
    `スロット: ${sideChar}1~${sideChar}5 / セル: A1~C3`,
    `投票は制限時間内に1人1票！`,
  ].join(" | ");
}

/**
 * Format a cell list for display.
 */
export function formatEmptyCellsList(emptyCells: number[]): string {
  return emptyCells.map(cellIndexToCoord).join(", ");
}
