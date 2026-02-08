import React from "react";
import type { AiReasonCode } from "@/lib/ai/nyano_ai";
import { reasonCodeLabel } from "@/lib/ai/nyano_ai";

type Props = {
  reasonCode: AiReasonCode;
  reason: string;
  turnIndex: number;
  className?: string;
};

const BADGE_COLORS: Record<AiReasonCode, string> = {
  FIRST_AVAILABLE: "bg-slate-100 text-slate-600 border-slate-200",
  MAXIMIZE_FLIPS: "bg-blue-100 text-blue-700 border-blue-200",
  BLOCK_CORNER: "bg-amber-100 text-amber-700 border-amber-200",
  SET_WARNING: "bg-orange-100 text-orange-700 border-orange-200",
  MINIMAX_D2: "bg-purple-100 text-purple-700 border-purple-200",
  MINIMAX_D3: "bg-red-100 text-red-700 border-red-200",
  FALLBACK: "bg-gray-100 text-gray-500 border-gray-200",
};

export function AiReasonDisplay({ reasonCode, reason, turnIndex, className = "" }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const badgeColor = BADGE_COLORS[reasonCode] ?? BADGE_COLORS.FALLBACK;

  return (
    <div className={`text-xs ${className}`}>
      <button
        className="flex items-center gap-1.5 text-left"
        onClick={() => setExpanded(!expanded)}
        title={reason}
      >
        <span className="text-surface-500">Turn {turnIndex + 1}:</span>
        <span className={`rounded-md border px-1.5 py-0.5 font-medium ${badgeColor}`}>
          {reasonCodeLabel(reasonCode)}
        </span>
        <span className="text-surface-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-1 rounded-md border border-surface-200 bg-surface-50 px-2 py-1 text-surface-600">
          {reason}
        </div>
      )}
    </div>
  );
}

type AiNotesProps = {
  notes: Record<number, { reason: string; reasonCode: AiReasonCode }>;
  className?: string;
};

export function AiNotesList({ notes, className = "" }: AiNotesProps) {
  const entries = Object.entries(notes).sort(([a], [b]) => Number(a) - Number(b));
  if (entries.length === 0) return null;

  return (
    <div className={`grid gap-1 ${className}`}>
      {entries.map(([turnIdx, note]) => (
        <AiReasonDisplay
          key={turnIdx}
          turnIndex={Number(turnIdx)}
          reasonCode={note.reasonCode}
          reason={note.reason}
        />
      ))}
    </div>
  );
}
