import React from "react";
import type { BoardState, TurnSummary } from "@nyano/triad-engine";
import { FlipTraceBadges, FlipTraceDetailList } from "@/components/FlipTraceBadges";
import { flipTraceFull, flipTracesReadout, flipTracesSummary } from "@/components/flipTraceDescribe";
import type { MoveAnnotation } from "@/lib/ai/replay_annotations";
import { QUALITY_DISPLAY } from "@/lib/ai/replay_annotations";
import type { BoardAdvantage } from "@/lib/ai/board_advantage";
import { AdvantageBadge } from "@/components/AdvantageBadge";

const CELL_COORDS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

function cellCoord(cell: number): string {
  return CELL_COORDS[cell] ?? String(cell);
}

type Owner = 0 | 1;

type FlipDetail = {
  cell: number;
  tokenId: bigint;
  from: Owner;
  to: Owner;
  explain: string;
};

type TurnDelta = {
  placedCell: number | null;
  placedTokenId: bigint | null;
  placedOwner: Owner | null;
  flippedCells: number[];
  flipped: FlipDetail[];
};

const ownerLabel = (o: Owner): string => (o === 0 ? "A" : "B");

function formatCells(cells: number[]): string {
  if (cells.length === 0) return "—";
  const coords = cells.map(cellCoord);
  if (coords.length <= 4) return coords.join(",");
  return `${coords.slice(0, 4).join(",")}…(+${coords.length - 4})`;
}

function computeDelta(boardPrev: BoardState, boardNow: BoardState, turn: TurnSummary): TurnDelta {
  let placedCell: number | null = null;
  let placedTokenId: bigint | null = null;
  let placedOwner: Owner | null = null;

  const flippedCells: number[] = [];
  const flipped: FlipDetail[] = [];

  for (let i = 0; i < boardNow.length; i++) {
    const a = boardPrev[i];
    const b = boardNow[i];

    if (a === null && b !== null) {
      placedCell = i;
      placedTokenId = b.card.tokenId;
      placedOwner = b.owner as Owner;
      continue;
    }

    if (a !== null && b !== null && a.owner !== b.owner) {
      flippedCells.push(i);
    }
  }

  if (placedCell === null) {
    return { placedCell, placedTokenId, placedOwner, flippedCells, flipped };
  }

  const traces = turn.flipTraces ?? [];

  for (const c of flippedCells) {
    const before = boardPrev[c];
    const after = boardNow[c];
    if (!before || !after) continue;

    // Match flipTrace by target cell index
    const trace = traces.find((t) => t.to === c);
    const explain = trace ? flipTraceFull(trace) : `${cellCoord(c)}: (trace not available)`;

    flipped.push({
      cell: c,
      tokenId: after.card.tokenId,
      from: before.owner as Owner,
      to: after.owner as Owner,
      explain,
    });
  }

  return { placedCell, placedTokenId, placedOwner, flippedCells, flipped };
}

function formatFlipLine(f: FlipDetail): string {
  return `${cellCoord(f.cell)} (#${f.tokenId.toString()}) ${ownerLabel(f.from)}→${ownerLabel(f.to)}`;
}

export function TurnLog(props: {
  turns: TurnSummary[];
  /** Optional: boardHistory[0]..[9] to derive "placed" and exact flipped cell indices per turn */
  boardHistory?: BoardState[];
  selectedTurnIndex: number;
  onSelect: (turnIndex: number) => void;
  /** Optional: AI-derived quality annotations per turn */
  annotations?: MoveAnnotation[];
  /** Optional: board advantage per board state (boardHistory indices 0..9) */
  boardAdvantages?: BoardAdvantage[];
}) {
  const deltas = React.useMemo(() => {
    if (!props.boardHistory) return null;
    if (props.boardHistory.length < props.turns.length + 1) return null;

    const out: TurnDelta[] = [];
    for (let i = 0; i < props.turns.length; i++) {
      out.push(computeDelta(props.boardHistory[i], props.boardHistory[i + 1], props.turns[i]));
    }
    return out;
  }, [props.boardHistory, props.turns]);

  return (
    <div className="grid gap-2">
      {props.turns.map((t) => {
        const selected = props.selectedTurnIndex === t.turnIndex;
        const d = deltas ? deltas[t.turnIndex] : null;
        const annotation = props.annotations?.find((a) => a.turnIndex === t.turnIndex);

        return (
          <button
            key={t.turnIndex}
            className={[
              "w-full rounded-lg border px-3 py-2 text-left text-sm",
              selected ? "border-surface-900 bg-surface-50" : "border-surface-200 bg-white hover:bg-surface-50",
            ].join(" ")}
            onClick={() => props.onSelect(t.turnIndex)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-medium">
                <span>Turn {t.turnIndex + 1} · {t.player === 0 ? "A" : "B"} · {cellCoord(t.cell)} (cell {t.cell}) · card {t.cardIndex + 1}</span>
                {annotation && (
                  <span
                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${QUALITY_DISPLAY[annotation.quality].color}`}
                    title={`${QUALITY_DISPLAY[annotation.quality].en} (delta: ${annotation.delta > 0 ? "+" : ""}${annotation.delta.toFixed(0)})`}
                  >
                    {QUALITY_DISPLAY[annotation.quality].ja} ({annotation.delta > 0 ? "+" : ""}{annotation.delta.toFixed(0)})
                  </span>
                )}
                {props.boardAdvantages?.[t.turnIndex + 1] && (
                  <AdvantageBadge advantage={props.boardAdvantages[t.turnIndex + 1]} size="sm" />
                )}
              </div>
              <div className="text-xs text-surface-500">token #{t.tokenId.toString()}</div>
            </div>

            <div className="mt-1 flex flex-wrap gap-2 text-xs text-surface-600">
              <span className="badge">奪取: {flipTracesSummary(t.flipTraces ?? [])}</span>
              <FlipTraceBadges flipTraces={t.flipTraces} />

              {d ? (
                <>
                  <span className="badge">placed: {d.placedCell === null ? "—" : cellCoord(d.placedCell)}</span>
                  <span className="badge badge-amber">flipped: {formatCells(d.flippedCells)}</span>
                </>
              ) : null}

              <span className="badge">comboCount: {t.comboCount}</span>
              <span className="badge">combo: {t.comboEffect}</span>
              <span className="badge">+triad: {t.appliedBonus.triadPlus}</span>
              <span className="badge">ignoreWarning: {t.appliedBonus.ignoreWarningMark ? "yes" : "no"}</span>

              {t.warningPlaced !== null ? (
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5">placed mark: {t.warningPlaced}</span>
              ) : null}

              {t.warningTriggered ? (
                <span className="badge badge-amber">stepped on warning</span>
              ) : null}
            </div>

            {selected ? (
              <div className="mt-2 grid gap-2">
                {/* Narrative readout — matches Overlay flipTracesReadout (Phase 0 consistency) */}
                {t.flipTraces && t.flipTraces.length > 0 && (
                  <div className="text-xs text-surface-500 italic">
                    {flipTracesReadout(t.flipTraces, t.player === 0 ? "A" : "B", t.cell)}
                  </div>
                )}

                {t.flipTraces && t.flipTraces.length ? (
                  <div className="rounded-lg border border-surface-200 bg-white p-2 text-xs text-surface-700">
                    <div className="font-medium">奪取理由（補正後）</div>
                    <FlipTraceDetailList flipTraces={t.flipTraces} />
                  </div>
                ) : null}

                {d ? (
                  <div className="rounded-lg border border-surface-200 bg-white p-2 text-xs text-surface-700">
                    <div className="font-medium">Δ (board diff)</div>
                    <div className="mt-1 grid gap-1 font-mono">
                      <div>
                        placed: {d.placedCell === null ? "—" : `${cellCoord(d.placedCell)} (cell ${d.placedCell})`} {" "}
                        {d.placedTokenId !== null ? `(#${d.placedTokenId.toString()})` : ""}{" "}
                        {d.placedOwner !== null ? `by ${ownerLabel(d.placedOwner)}` : ""}
                      </div>
                      <div>flipped: {d.flipped.length}</div>

                      {d.flipped.length ? (
                        <div className="mt-1 grid gap-1">
                          {d.flipped.map((f) => (
                            <div
                              key={`${t.turnIndex}-${f.cell}`}
                              className="rounded-md border border-surface-200 bg-surface-50 px-2 py-1"
                            >
                              <div className="font-mono">{formatFlipLine(f)}</div>
                              <div className="mt-0.5 text-surface-600">{f.explain}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
