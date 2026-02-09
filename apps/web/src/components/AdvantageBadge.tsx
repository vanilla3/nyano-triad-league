/**
 * AdvantageBadge — compact badge showing board advantage status.
 *
 * Phase 1 "Spectator Experience": 盤面の「優勢/不利」を一目で表示
 */

import type { BoardAdvantage } from "@/lib/ai/board_advantage";

const COLOR_MAP: Record<string, string> = {
  emerald: "border-emerald-300 bg-emerald-50 text-emerald-800",
  teal: "border-teal-300 bg-teal-50 text-teal-800",
  slate: "border-slate-300 bg-slate-100 text-slate-600",
  amber: "border-amber-300 bg-amber-50 text-amber-800",
  red: "border-red-300 bg-red-50 text-red-800",
};

type Props = {
  advantage: BoardAdvantage;
  /** "sm" = TurnLog row (10px), "md" = Overlay/Replay (12px) */
  size?: "sm" | "md";
  /** Show numeric score next to label */
  showScore?: boolean;
};

export function AdvantageBadge({ advantage, size = "md", showScore = false }: Props) {
  const colorClass = COLOR_MAP[advantage.badgeColor] ?? COLOR_MAP.slate;
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  const score = advantage.scoreA;
  const sign = score > 0 ? "+" : "";
  const scoreText = showScore ? ` ${sign}${score.toFixed(1)}` : "";

  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-medium ${textSize} ${colorClass}`}>
      {advantage.labelJa}{scoreText}
    </span>
  );
}
