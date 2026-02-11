import React from "react";
import type { FlipTraceV1 } from "@nyano/triad-engine";
import { flipTraceFull, flipTraceShort, flipBadgeVariant } from "@/components/flipTraceDescribe";

/**
 * FlipTraceBadges
 *
 * - TurnLog / overlay などで「なぜ奪取が起きたか」を短い文字列で見せる。
 * - 表示文言は flipTraceDescribe.ts に集約（日本語出力の一貫性）。
 * - バッジ色: 連鎖=violet, じゃんけん=sky, 斜め=emerald, 通常=amber
 *
 * commit-0072: P1-1 TurnLog の flipTraces 表示を日本語説明へ統合
 * Sprint 35: カラー分け強化
 */

export function FlipTraceBadges(props: {
  flipTraces?: readonly FlipTraceV1[] | null;
  /** show only first N traces as badges */
  limit?: number;
  className?: string;
}) {
  const { flipTraces, limit = 3, className = "" } = props;
  if (!flipTraces || flipTraces.length === 0) return null;

  const shown = flipTraces.slice(0, Math.max(0, limit));
  const rest = Math.max(0, flipTraces.length - shown.length);

  return (
    <div className={["flex flex-wrap items-center gap-1", className].join(" ")}>
      {shown.map((t, i) => (
        <span key={`${t.from}-${t.to}-${i}`} className={["badge", flipBadgeVariant(t)].join(" ")}>
          {flipTraceShort(t)}
        </span>
      ))}
      {rest > 0 ? <span className="badge">+{rest}</span> : null}
    </div>
  );
}

export function FlipTraceDetailList(props: { flipTraces?: readonly FlipTraceV1[] | null }) {
  const { flipTraces } = props;
  if (!flipTraces || flipTraces.length === 0) return null;

  return (
    <div className="mt-1 grid gap-1">
      {flipTraces.map((t, i) => (
        <div
          key={`${t.from}-${t.to}-${i}`}
          className="rounded-md border border-surface-200 bg-surface-50 px-2 py-1 text-xs text-surface-700"
        >
          {flipTraceFull(t)}
        </div>
      ))}
    </div>
  );
}
