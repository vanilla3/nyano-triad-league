/**
 * AdvantageBar — horizontal progress bar showing A vs B board advantage.
 *
 * Phase 1 "Spectator Experience": Prominent, glanceable advantage display
 * for OBS overlays and stream viewers.
 *
 * The bar fills from left (A advantage) to right (B advantage),
 * with the center representing "even" (互角).
 *
 * Optionally shows top 1-2 advantage reasons as pill badges below the bar.
 */

import type { BoardAdvantage, AdvantageReason } from "@/lib/ai/board_advantage";

const SIZE_CONFIG = {
  sm: { height: "h-5", font: "text-[10px]", labelFont: "text-[9px]" },
  md: { height: "h-7", font: "text-xs", labelFont: "text-[10px]" },
  lg: { height: "h-9", font: "text-sm", labelFont: "text-xs" },
} as const;

type Props = {
  advantage: BoardAdvantage;
  /** "sm" = compact, "md" = default, "lg" = full overlay */
  size?: "sm" | "md" | "lg";
  /** Optional advantage reasons to display as pill badges below the bar. */
  reasons?: AdvantageReason[];
};

/**
 * Clamp score to a percentage for visual bar display.
 * scoreA positive → A is ahead (bar shifts left-heavy).
 * scoreA negative → B is ahead (bar shifts right-heavy).
 *
 * We map scoreA to a 0-100% range where 50% = even.
 * Clamp so extreme scores don't fully fill the bar (min 10%, max 90%).
 */
function scoreToPercent(scoreA: number): number {
  // Map: -50 → 10%, 0 → 50%, +50 → 90%
  const normalized = 50 + (scoreA / 50) * 40;
  return Math.max(10, Math.min(90, normalized));
}

function barColors(scoreA: number): { left: string; right: string } {
  if (scoreA >= 12) return { left: "bg-emerald-400", right: "bg-slate-200" };
  if (scoreA >= 4) return { left: "bg-teal-400", right: "bg-slate-200" };
  if (scoreA <= -12) return { left: "bg-slate-200", right: "bg-amber-400" };
  if (scoreA <= -4) return { left: "bg-slate-200", right: "bg-amber-300" };
  return { left: "bg-slate-300", right: "bg-slate-200" };
}

const REASON_ICONS: Record<string, string> = {
  tile_lead: "🎴",
  corner_control: "📐",
  center_control: "🎯",
  edge_superiority: "⚔️",
  vulnerability: "⚠️",
};

function reasonColor(value: number): string {
  if (value > 0) return "bg-teal-50 border-teal-200 text-teal-700";
  if (value < 0) return "bg-amber-50 border-amber-200 text-amber-700";
  return "bg-slate-50 border-slate-200 text-slate-500";
}

/** Small pill badge showing a single advantage reason. */
function AdvantageReasonTag({ reason }: { reason: AdvantageReason }) {
  const icon = REASON_ICONS[reason.key] ?? "💡";
  const color = reasonColor(reason.value);
  const sign = reason.value > 0 ? "+" : "";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${color}`}
      title={`${reason.labelEn} (${sign}${reason.value.toFixed(1)})`}
    >
      <span>{icon}</span>
      <span>{reason.labelJa}</span>
    </span>
  );
}

export function AdvantageBar({ advantage, size = "md", reasons }: Props) {
  const cfg = SIZE_CONFIG[size];
  const pct = scoreToPercent(advantage.scoreA);
  const colors = barColors(advantage.scoreA);

  const sign = advantage.scoreA > 0 ? "+" : "";
  const scoreText = `${sign}${advantage.scoreA.toFixed(1)}`;

  // Show top 1-2 reasons for md/lg sizes
  const visibleReasons = size !== "sm" && reasons && reasons.length > 0
    ? reasons.slice(0, 2)
    : [];

  return (
    <div>
      <div
        className={`relative w-full ${cfg.height} rounded-full overflow-hidden border border-slate-200`}
        title={`${advantage.labelJa} (${scoreText})`}
      >
        {/* A-side fill */}
        <div
          className={`absolute inset-y-0 left-0 ${colors.left} transition-[width] duration-300 ease-out`}
          style={{ width: `${pct}%` }}
        />
        {/* B-side fill */}
        <div
          className={`absolute inset-y-0 right-0 ${colors.right} transition-[width] duration-300 ease-out`}
          style={{ width: `${100 - pct}%` }}
        />

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5">
          <span className={`${cfg.labelFont} font-semibold text-slate-500 drop-shadow-sm`}>A</span>
          <span className={`${cfg.font} font-display font-bold text-slate-800 drop-shadow-sm bg-white/70 rounded-full px-2 py-0.5`}>
            {advantage.labelJa}
          </span>
          <span className={`${cfg.labelFont} font-semibold text-slate-500 drop-shadow-sm`}>B</span>
        </div>
      </div>

      {/* Reason tags below bar */}
      {visibleReasons.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1 justify-center">
          {visibleReasons.map((r) => (
            <AdvantageReasonTag key={r.key} reason={r} />
          ))}
        </div>
      )}
    </div>
  );
}
