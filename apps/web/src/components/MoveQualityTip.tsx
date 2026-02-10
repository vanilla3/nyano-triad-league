/**
 * MoveQualityTip — compact, friendly badge showing why a move was interesting.
 *
 * Phase 1 "Spectator Experience": Shows heuristic tips like
 * "角を確保！", "連鎖コンボ！", "罠設置！" to help viewers understand the game.
 */

import type { MoveTip } from "@/lib/ai/move_tips";

const TIP_STYLES: Record<string, string> = {
  warning_dodge:     "bg-emerald-50 border-emerald-200 text-emerald-700",
  warning_triggered: "bg-amber-50 border-amber-200 text-amber-700",
  warning_trap:      "bg-orange-50 border-orange-200 text-orange-700",
  domination_combo:  "bg-rose-50 border-rose-200 text-rose-700",
  big_swing:         "bg-blue-50 border-blue-200 text-blue-700",
  chain_combo:       "bg-violet-50 border-violet-200 text-violet-700",
  corner_control:    "bg-teal-50 border-teal-200 text-teal-700",
  center_hold:       "bg-slate-50 border-slate-200 text-slate-600",
  no_flip:           "bg-slate-50 border-slate-200 text-slate-500",
};

const TIP_ICONS: Record<string, string> = {
  warning_dodge:     "🛡️",
  warning_triggered: "⚡",
  warning_trap:      "🪤",
  domination_combo:  "🔥",
  big_swing:         "💥",
  chain_combo:       "⛓️",
  corner_control:    "📐",
  center_hold:       "🎯",
  no_flip:           "—",
};

type Props = {
  tip: MoveTip;
  size?: "sm" | "md";
};

export function MoveQualityTip({ tip, size = "md" }: Props) {
  const style = TIP_STYLES[tip.key] ?? TIP_STYLES.no_flip;
  const icon = TIP_ICONS[tip.key] ?? "💡";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${textSize} ${style}`}
      title={tip.narrativeJa ?? tip.labelEn}
    >
      <span>{icon}</span>
      <span>{tip.labelJa}</span>
      {tip.narrativeJa && size !== "sm" && (
        <span className="text-[9px] opacity-70 font-normal ml-0.5">{tip.narrativeJa}</span>
      )}
    </span>
  );
}
