import React from "react";
import type { BoardCell as BoardCellEngine, BoardState, PlayerIndex } from "@nyano/triad-engine";
import { CardNyanoCompact, CardSlot } from "./CardNyano";

/* ═══════════════════════════════════════════════════════════════════════════
   BOARD VIEW - REDESIGNED (Backwards compatible)

   This component is a more game-like, "Nyano-ish" board UI.
   It is intentionally written to be backwards compatible with the existing app:
   - supports `focusCell` (legacy) as well as `selectedCell`
   - supports `onClickCell` (legacy) as well as `onCellSelect`
   - accepts `selectableCells` as Set<number> or number[]
   ═══════════════════════════════════════════════════════════════════════════ */

export interface BoardViewProps {
  board: BoardState;

  /** New API: selected cell (mostly used for placement UI) */
  selectedCell?: number | null;
  /** Legacy API: focus cell (used by Replay focus, etc.) */
  focusCell?: number | null;

  /** Highlight the placed cell (typically: last move) */
  placedCell?: number | null;
  /** Highlight flipped cells this turn */
  flippedCells?: readonly number[] | null;

  /** Optional: warning marks placed on cells */
  warningMarks?: readonly { cell: number; owner: PlayerIndex }[] | null;

  /** New API: handler when a cell is selected */
  onCellSelect?: (cell: number) => void;
  /** Legacy API: handler when a cell is clicked */
  onClickCell?: (cell: number) => void;

  /** New API: Set of selectable cells */
  selectableCells?: Set<number> | readonly number[] | null;

  /** Optional: current player index */
  currentPlayer?: PlayerIndex | null;

  /** Disable interaction */
  disabled?: boolean;

  /** Size variant */
  size?: "sm" | "md" | "lg";

  /** Show A1..C3 labels */
  showCoordinates?: boolean;

  className?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

const CELL_COORDS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

function calcScore(board: BoardState): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (const cell of board) {
    if (!cell) continue;
    if (cell.owner === 0) a++;
    if (cell.owner === 1) b++;
  }
  return { a, b };
}

function toSelectableSet(v?: Set<number> | readonly number[] | null): Set<number> {
  if (!v) return new Set();
  if (v instanceof Set) return v;
  return new Set(Array.from(v));
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOARD CELL
   ═══════════════════════════════════════════════════════════════════════════ */

interface BoardCellProps {
  cell: BoardCellEngine | null;
  index: number;
  coord: string;
  isSelected: boolean;
  isPlaced: boolean;
  isFlipped: boolean;
  /** Optional CSS class to stagger flip animations for chain effects */
  flipDelayClass?: string;
  isFocus: boolean;
  isSelectable: boolean;
  warningMark?: PlayerIndex | null;
  onSelect?: () => void;
  size: "sm" | "md" | "lg";
  showCoordinates: boolean;
}

function BoardCell({
  cell,
  coord,
  isSelected,
  isPlaced,
  isFlipped,
  flipDelayClass,
  isFocus,
  isSelectable,
  warningMark,
  onSelect,
  size,
  showCoordinates,
}: BoardCellProps) {
  const hasCard = !!cell?.card;
  const owner = hasCard ? (cell.owner as PlayerIndex) : null;

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const baseClasses = [
    "relative rounded-2xl border-2 transition-all duration-200",
    "flex items-center justify-center",
    sizeClasses[size],
    hasCard ? "bg-white" : "bg-surface-100",
  ];

  // Border / interaction states
  if (hasCard && owner === 0) baseClasses.push("border-player-a-300");
  if (hasCard && owner === 1) baseClasses.push("border-player-b-300");
  if (!hasCard) baseClasses.push("border-surface-200");

  if (isSelectable && !hasCard) {
    baseClasses.push("cursor-pointer hover:border-nyano-400 hover:bg-nyano-50");
  } else {
    baseClasses.push("cursor-default");
  }

  if (isPlaced) baseClasses.push("ring-4 ring-flip/40 shadow-flip animate-cell-place");
  if (isFlipped) {
    baseClasses.push("ring-4 ring-chain/40 shadow-chain animate-cell-flip animate-flip-glow");
    if (flipDelayClass) baseClasses.push(flipDelayClass);
  }

  // Focus highlight (works even when the cell already has a card)
  if (isFocus && !isPlaced) baseClasses.push("ring-2 ring-nyano-400/70 ring-offset-2");

  // Selected highlight: emphasize empty cell selection
  if (isSelected && !hasCard) baseClasses.push("ring-4 ring-nyano-400/60 ring-offset-2");

  return (
    <div className={baseClasses.join(" ")} onClick={isSelectable && !hasCard ? onSelect : undefined}>
      {/* Coordinate label */}
      {showCoordinates && (
        <div className="absolute top-1 left-2 text-3xs font-mono text-surface-400">{coord}</div>
      )}

      {/* Warning mark indicator */}
      {typeof warningMark === "number" && (
        <div
          className={[
            "absolute top-1 right-1 w-5 h-5 rounded-full",
            "flex items-center justify-center text-2xs font-bold",
            warningMark === 0 ? "bg-player-a-500 text-white" : "bg-player-b-500 text-white",
          ].join(" ")}
          title={`Warning mark: ${warningMark === 0 ? "A" : "B"}`}
        >
          !
        </div>
      )}

      {/* Card / Empty slot */}
      {hasCard ? (
        <CardNyanoCompact
          card={cell.card}
          owner={cell.owner}
          isPlaced={isPlaced}
          isFlipped={isFlipped}
          className={size === "lg" ? "scale-110" : ""}
        />
      ) : (
        <CardSlot
          empty
          label={isSelectable ? "Place" : ""}
          className={[
            size === "lg" ? "w-22 h-22" : "w-18 h-18",
            isSelectable ? "border-nyano-200 text-nyano-500" : "border-surface-200 text-surface-300",
          ].join(" ")}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN BOARD VIEW
   ═══════════════════════════════════════════════════════════════════════════ */

export function BoardView({
  board,
  selectedCell,
  focusCell,
  placedCell = null,
  flippedCells = [],
  warningMarks = [],
  selectableCells,
  onCellSelect,
  onClickCell,
  currentPlayer,
  disabled = false,
  size = "md",
  showCoordinates = false,
  className = "",
}: BoardViewProps) {
  const selectableSet = toSelectableSet(selectableCells);
  const score = calcScore(board);

  // Backwards compatible behavior:
  const focus = typeof focusCell === "number" ? focusCell : null;
  const selected = typeof selectedCell === "number" ? selectedCell : null;
  const effectiveSelected = selected ?? focus; // legacy focus acts as "selected" if new prop not provided

  const flippedSet = new Set<number>(Array.from(flippedCells ?? []));
  const warnMap = new Map<number, PlayerIndex>();
  for (const w of warningMarks ?? []) {
    if (w && Number.isFinite(w.cell)) warnMap.set(w.cell, w.owner);
  }

  const handleSelect = (cell: number) => {
    if (disabled) return;
    const fn = onCellSelect ?? onClickCell;
    if (fn) fn(cell);
  };

  return (
    <div className={["grid gap-3", className].join(" ")}>
      {/* Score bar */}
      <div className="flex items-center justify-between rounded-2xl border border-surface-200 bg-white px-4 py-3 shadow-soft-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-player-a-500" />
          <span className="text-sm font-display font-bold text-player-a-700">A</span>
          <span className="text-sm font-mono text-surface-700">{score.a}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500 font-body">
            {typeof currentPlayer === "number" ? `Turn: ${currentPlayer === 0 ? "A" : "B"}` : "—"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-surface-700">{score.b}</span>
          <span className="text-sm font-display font-bold text-player-b-700">B</span>
          <div className="w-3 h-3 rounded-full bg-player-b-500" />
        </div>
      </div>

      {/* Board grid */}
      <div className="grid grid-cols-3 gap-2 rounded-3xl bg-surface-50 p-4 border border-surface-200 shadow-soft">
        {board.map((cell, idx) => {
          const coord = CELL_COORDS[idx] ?? String(idx);
          const isSelectable = !disabled && selectableSet.has(idx);
          const isPlaced = placedCell === idx;
          const isFlipped = flippedSet.has(idx);
          const flipIndex = isFlipped ? (flippedCells ?? []).indexOf(idx) : -1;
          const flipDelayClass = flipIndex > 0 ? `flip-delay-${Math.min(flipIndex, 3)}` : undefined;
          const isFocus = focus === idx;
          const isSelected = effectiveSelected === idx;
          const warning = warnMap.get(idx) ?? null;

          return (
            <BoardCell
              key={idx}
              cell={cell}
              index={idx}
              coord={coord}
              isSelected={!!isSelected}
              isPlaced={!!isPlaced}
              isFlipped={!!isFlipped}
              flipDelayClass={flipDelayClass}
              isFocus={!!isFocus}
              isSelectable={isSelectable}
              warningMark={warning}
              onSelect={() => handleSelect(idx)}
              size={size}
              showCoordinates={showCoordinates}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MINI BOARD VIEW (for overlays)
   ═══════════════════════════════════════════════════════════════════════════ */

export function BoardViewMini({ board, placedCell, flippedCells }: { board: BoardState; placedCell?: number | null; flippedCells?: number[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-100 p-2 border border-surface-200 shadow-soft-sm">
      {board.map((cell, idx) => (
        <div
          key={idx}
          className={[
            "relative w-14 h-14 rounded-xl border flex items-center justify-center",
            cell?.owner === 0 ? "border-player-a-300 bg-player-a-50" : "",
            cell?.owner === 1 ? "border-player-b-300 bg-player-b-50" : "",
            !cell ? "border-surface-200 bg-white" : "",
            placedCell === idx ? "ring-2 ring-flip/60" : "",
            flippedCells?.includes(idx) ? "ring-2 ring-chain/60" : "",
          ].join(" ")}
        >
          {cell?.card ? (
            <div className="text-center text-2xs font-display font-bold text-surface-700">
              {Number(cell.card.edges.up)}
              <br />
              {Number(cell.card.edges.left)} {Number(cell.card.edges.right)}
              <br />
              {Number(cell.card.edges.down)}
            </div>
          ) : (
            <div className="text-3xs text-surface-300">•</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REPLAY BOARD VIEWER (step slider)
   ═══════════════════════════════════════════════════════════════════════════ */

export function BoardReplayViewer({
  history,
  currentStep,
  onStepChange,
  placedCell,
  flippedCells,
}: {
  history: BoardState[];
  currentStep: number;
  onStepChange: (step: number) => void;
  placedCell?: number | null;
  flippedCells?: number[];
}) {
  const maxStep = Math.max(0, history.length - 1);
  const board = history[Math.min(currentStep, maxStep)] ?? history[0];
  const pct = maxStep > 0 ? (currentStep / maxStep) * 100 : 0;

  return (
    <div className="grid gap-3">
      <BoardView board={board} placedCell={placedCell} flippedCells={flippedCells} size="md" />

      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-surface-500">Step</span>
        <input
          type="range"
          min={0}
          max={maxStep}
          value={currentStep}
          onChange={(e) => onStepChange(Number(e.target.value))}
          className="flex-1 h-2 rounded-full bg-surface-200 cursor-pointer appearance-none"
          style={{
            background: `linear-gradient(to right, #FF8A50 ${pct}%, #E7E5E4 ${pct}%, #E7E5E4 100%)`,
          }}
        />
      </div>
    </div>
  );
}
