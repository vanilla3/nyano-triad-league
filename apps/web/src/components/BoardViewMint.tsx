import React from "react";
import type { BoardCell, BoardState, CardData, PlayerIndex } from "@nyano/triad-engine";
import { CardNyanoDuel } from "./CardNyanoDuel";
import { CardPreviewPanel } from "./CardPreviewPanel";
import { useCardPreview } from "@/hooks/useCardPreview";
import { FlipArrowOverlay, type FlipTraceArrow } from "./FlipArrowOverlay";
import "../mint-theme/mint-theme.css";

/* ═══════════════════════════════════════════════════════════════════════════
   BOARD VIEW MINT — Nintendo-level UX Board (NIN-UX-010/011/012/021)

   Features:
   - Selectable cells: puffy + breathe glow (NIN-UX-010)
   - Non-selectable cells: flat + sunken
   - Action prompt: 1-line instruction always visible (NIN-UX-011)
   - Inline error: short hint near board, not Toast (NIN-UX-012)
   - Mode visualization: place=green, warning=amber (NIN-UX-021)

   Backwards compatible with BoardViewProps.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Types ──────────────────────────────────────────────────────────────

export interface BoardViewMintProps {
  board: BoardState;
  selectedCell?: number | null;
  focusCell?: number | null;
  placedCell?: number | null;
  flippedCells?: readonly number[] | null;
  warningMarks?: readonly { cell: number; owner: PlayerIndex }[] | null;
  onCellSelect?: (cell: number) => void;
  onClickCell?: (cell: number) => void;
  selectableCells?: Set<number> | readonly number[] | null;
  currentPlayer?: PlayerIndex | null;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  showCoordinates?: boolean;
  className?: string;

  // ── Mint-specific ──
  /** Show the action prompt bar below the board */
  showActionPrompt?: boolean;
  /** Current game phase for prompt text & mode visualization */
  gamePhase?: "select_card" | "select_cell" | "warning" | "ai_turn" | "game_over" | "idle";
  /** Inline error message (replaces toast for invalid actions) */
  inlineError?: string | null;
  /** Callback to dismiss inline error */
  onDismissError?: () => void;
  /** Flip traces for causality arrow overlay (NIN-UX-030) */
  flipTraces?: readonly FlipTraceArrow[] | null;
  /** Whether board flip animation is running */
  isFlipAnimating?: boolean;
  /** Enable hand-card drag drop to cells */
  dragDropEnabled?: boolean;
  /** Called when a hand card is dropped onto a cell */
  onCellDrop?: (cell: number) => void;
  /** Called when dragging over a cell (or null when leaving) */
  onCellDragHover?: (cell: number | null) => void;
  /** Optional selected-card preview for mouse hover ghost placement hint */
  selectedCardPreview?: CardData | null;
  /** Idle-only hint for selectable cells */
  idleGuideSelectables?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────

const CELL_COORDS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

function toSelectableSet(v?: Set<number> | readonly number[] | null): Set<number> {
  if (!v) return new Set();
  if (v instanceof Set) return v;
  return new Set(Array.from(v));
}

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

// ── Prompt messages ────────────────────────────────────────────────────

const PROMPTS: Record<string, { ja: string; en: string }> = {
  select_card: { ja: "カードを選んでください", en: "Choose a card" },
  select_cell: { ja: "置きたいマスをタップ", en: "Tap a cell to place" },
  warning: { ja: "警戒マークを置くマスをタップ", en: "Tap a cell for warning mark" },
  ai_turn: { ja: "にゃーのの番…", en: "Nyano is thinking..." },
  game_over: { ja: "対戦終了！", en: "Game over!" },
  idle: { ja: "準備中…", en: "Getting ready..." },
};

// ── MintCell ───────────────────────────────────────────────────────────

interface MintCellProps {
  cell: BoardCell | null;
  index: number;
  coord: string;
  isSelected: boolean;
  isPressed: boolean;
  isPlaced: boolean;
  isFlipped: boolean;
  flipDelayClass?: string;
  isFocus: boolean;
  isSelectable: boolean;
  warningMark?: PlayerIndex | null;
  onSelect?: () => void;
  onPressStart?: () => void;
  onPressEnd?: () => void;
  /** Long-press / right-click inspect handlers for cards on board */
  inspectHandlers?: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onTouchMove: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
  };
  showCoordinates: boolean;
  isWarningMode: boolean;
  dragDropEnabled: boolean;
  onDropCard?: (cell: number) => void;
  onDragHover?: (cell: number | null) => void;
  onHoverStart?: (cell: number) => void;
  onHoverEnd?: () => void;
  ghostCard?: CardData | null;
  ghostOwner?: PlayerIndex | null;
  idleGuide?: boolean;
}

function MintCell({
  cell,
  index,
  coord,
  isSelected,
  isPressed,
  isPlaced,
  isFlipped,
  flipDelayClass,
  isFocus,
  isSelectable,
  warningMark,
  onSelect,
  onPressStart,
  onPressEnd,
  inspectHandlers,
  showCoordinates,
  isWarningMode,
  dragDropEnabled,
  onDropCard,
  onDragHover,
  onHoverStart,
  onHoverEnd,
  ghostCard,
  ghostOwner,
  idleGuide,
}: MintCellProps) {
  const hasCard = !!cell?.card;
  const owner = hasCard ? (cell.owner as PlayerIndex) : null;
  const isInteractive = isSelectable && !hasCard;

  const classes = ["mint-cell"];

  if (hasCard) {
    classes.push(owner === 0 ? "mint-cell--owner-a" : "mint-cell--owner-b");
  } else if (isSelectable) {
    classes.push("mint-cell--selectable");
    classes.push("mint-pressable", "mint-pressable--cell");
    if (isWarningMode) classes.push("mint-cell--warning-mode");
  } else {
    classes.push("mint-cell--flat");
  }

  if (isSelected && !hasCard) classes.push("mint-cell--selected");
  if (isPressed && !hasCard) classes.push("mint-cell--pressed");
  if (ghostCard && isSelectable && !hasCard) classes.push("mint-cell--hover-ghost");
  if (idleGuide && isSelectable && !hasCard) classes.push("mint-cell--idle-guide");
  if (dragDropEnabled && !hasCard && isSelectable) classes.push("mint-cell--drop-ready");
  if (isPlaced) classes.push("mint-cell--placed");
  if (isFlipped) {
    classes.push("mint-cell--flipped");
    if (flipDelayClass) classes.push(flipDelayClass);
  }
  if (isFocus && !isPlaced) classes.push("mint-cell--focus");

  const cellLabel = hasCard
    ? `${coord}: Player ${owner === 0 ? "A" : "B"} card, edges ${cell.card.edges.up}/${cell.card.edges.right}/${cell.card.edges.down}/${cell.card.edges.left}`
    : `${coord}: ${isSelectable ? "empty, available" : "empty"}`;

  return (
    <div
      role="gridcell"
      aria-label={cellLabel}
      aria-selected={isSelected || undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={classes.join(" ")}
      data-board-cell={index}
      onClick={isSelectable && !hasCard ? onSelect : undefined}
      onKeyDown={(e) => {
        if (!isInteractive || !onSelect) return;
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onSelect();
      }}
      onDragEnter={(e) => {
        if (!dragDropEnabled || hasCard || !isSelectable) return;
        e.preventDefault();
        onDragHover?.(index);
      }}
      onDragOver={(e) => {
        if (!dragDropEnabled || hasCard || !isSelectable) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragHover?.(index);
      }}
      onDragLeave={() => {
        if (!dragDropEnabled) return;
        onDragHover?.(null);
      }}
      onPointerDown={() => {
        if (!isInteractive) return;
        onPressStart?.();
      }}
      onPointerUp={() => {
        onPressEnd?.();
      }}
      onPointerCancel={() => {
        onPressEnd?.();
      }}
      onPointerLeave={() => {
        onPressEnd?.();
        onHoverEnd?.();
      }}
      onPointerEnter={(e) => {
        if (!isInteractive) return;
        if (e.pointerType !== "mouse") return;
        onHoverStart?.(index);
      }}
      onDrop={(e) => {
        if (!dragDropEnabled || hasCard || !isSelectable) return;
        e.preventDefault();
        onDropCard?.(index);
        onDragHover?.(null);
      }}
      {...(hasCard && inspectHandlers ? inspectHandlers : {})}
    >
      {/* Coordinate label */}
      {showCoordinates && (
        <div className="mint-cell__coord">{coord}</div>
      )}

      {/* Warning mark indicator */}
      {typeof warningMark === "number" && (
        <div
          className={[
            "mint-cell__warning",
            warningMark === 0 ? "mint-cell__warning--a" : "mint-cell__warning--b",
          ].join(" ")}
          title={`Warning: ${warningMark === 0 ? "A" : "B"}`}
        >
          !
        </div>
      )}

      {/* Card or empty slot */}
      {hasCard ? (
        <CardNyanoDuel
          card={cell.card}
          owner={cell.owner}
          isPlaced={isPlaced}
          isFlipped={isFlipped}
        />
      ) : ghostCard && isSelectable ? (
        <div className="mint-cell__ghost" aria-hidden="true">
          <CardNyanoDuel
            card={ghostCard}
            owner={ghostOwner ?? 0}
          />
        </div>
      ) : (
        <div className="mint-cell__empty-label">
          {isSelectable ? (isWarningMode ? "⚠" : "＋") : ""}
        </div>
      )}

      {isPlaced ? <span className="mint-cell__ripple" aria-hidden="true" /> : null}
      {isFlipped ? <span className="mint-cell__burst" aria-hidden="true" /> : null}
    </div>
  );
}

// ── Action Prompt (NIN-UX-011) ─────────────────────────────────────────

function ActionPrompt({
  gamePhase,
  isWarningMode,
}: {
  gamePhase: string;
  isWarningMode: boolean;
}) {
  const prompt = PROMPTS[gamePhase] ?? PROMPTS.idle;
  const isAi = gamePhase === "ai_turn";

  return (
    <div className={["mint-prompt", isWarningMode && "mint-prompt--warning"].filter(Boolean).join(" ")} role="status" aria-live="polite">
      <div className={["mint-prompt__ja", isAi && "mint-prompt__ja--ai"].filter(Boolean).join(" ")}>
        {prompt.ja}
      </div>
      <div className={["mint-prompt__en", isAi && "mint-prompt__en--ai"].filter(Boolean).join(" ")}>
        {prompt.en}
      </div>
    </div>
  );
}

// ── Inline Error (NIN-UX-012) ──────────────────────────────────────────

function InlineError({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  // Auto-dismiss after 3 seconds
  React.useEffect(() => {
    const t = setTimeout(() => { onDismiss?.(); }, 3000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div className="mint-error-pill" role="alert">
      <span className="mint-error-pill__icon">✕</span>
      {message}
    </div>
  );
}

// ── Main Board ─────────────────────────────────────────────────────────

export function BoardViewMint({
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
  showCoordinates = false,
  className = "",
  showActionPrompt = true,
  gamePhase = "idle",
  inlineError = null,
  onDismissError,
  flipTraces = null,
  isFlipAnimating = false,
  dragDropEnabled = false,
  onCellDrop,
  onCellDragHover,
  selectedCardPreview = null,
  idleGuideSelectables = false,
}: BoardViewMintProps) {
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [pressedCell, setPressedCell] = React.useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = React.useState<number | null>(null);
  const selectableSet = toSelectableSet(selectableCells);
  const score = calcScore(board);
  const inspect = useCardPreview();

  const focus = typeof focusCell === "number" ? focusCell : null;
  const selected = typeof selectedCell === "number" ? selectedCell : null;
  const effectiveSelected = selected ?? focus;

  const flippedSet = new Set<number>(Array.from(flippedCells ?? []));
  const warnMap = new Map<number, PlayerIndex>();
  for (const w of warningMarks ?? []) {
    if (w && Number.isFinite(w.cell)) warnMap.set(w.cell, w.owner);
  }

  const isWarningMode = gamePhase === "warning";

  const handleSelect = (cell: number) => {
    if (disabled) return;
    setPressedCell(null);
    const fn = onCellSelect ?? onClickCell;
    if (fn) fn(cell);
  };

  React.useEffect(() => {
    if (disabled) setPressedCell(null);
  }, [disabled]);

  React.useEffect(() => {
    if (disabled || !selectedCardPreview) setHoveredCell(null);
  }, [disabled, selectedCardPreview]);

  return (
    <div className={["grid gap-3", className].join(" ")}>
      {/* ── Score Bar ── */}
      <div className="mint-scorebar">
        <div className="mint-scorebar__player">
          <div className="mint-scorebar__dot mint-scorebar__dot--a" />
          <span className="mint-scorebar__label mint-scorebar__label--a">A</span>
          <span className="mint-scorebar__count">{score.a}</span>
        </div>

        <div className="mint-scorebar__turn">
          {typeof currentPlayer === "number"
            ? `${currentPlayer === 0 ? "A" : "B"} のターン`
            : "—"}
        </div>

        <div className="mint-scorebar__player">
          <span className="mint-scorebar__count">{score.b}</span>
          <span className="mint-scorebar__label mint-scorebar__label--b">B</span>
          <div className="mint-scorebar__dot mint-scorebar__dot--b" />
        </div>
      </div>

      {/* ── Board Grid ── */}
      <div className="mint-board-frame">
        <div className="mint-board-inner">
          <div className="mint-grid" ref={gridRef} role="grid" aria-label="Game board">
            {board.map((cell, idx) => {
              const coord = CELL_COORDS[idx] ?? String(idx);
              const isSelectable = !disabled && selectableSet.has(idx);
              const isPlaced = placedCell === idx;
              const isFlipped = flippedSet.has(idx);
              const flipIndex = isFlipped ? (flippedCells ?? []).indexOf(idx) : -1;
              const flipDelay = flipIndex > 0 ? `mint-cell--flip-delay-${Math.min(flipIndex, 3)}` : undefined;
              const isFocus = focus === idx;
              const isSel = effectiveSelected === idx;
              const warning = warnMap.get(idx) ?? null;

              // Inspect handlers for placed cards (long-press / right-click)
              const cellInspect = cell?.card
                ? inspect.longPressHandlers(cell.card, cell.owner)
                : undefined;

              return (
                <MintCell
                  key={idx}
                  cell={cell}
                  index={idx}
                  coord={coord}
                  isSelected={!!isSel}
                  isPressed={pressedCell === idx}
                  isPlaced={!!isPlaced}
                  isFlipped={!!isFlipped}
                  flipDelayClass={flipDelay}
                  isFocus={!!isFocus}
                  isSelectable={isSelectable}
                  warningMark={warning}
                  onSelect={() => handleSelect(idx)}
                  onPressStart={() => setPressedCell(idx)}
                  onPressEnd={() => setPressedCell((prev) => (prev === idx ? null : prev))}
                  inspectHandlers={cellInspect}
                  showCoordinates={showCoordinates}
                  isWarningMode={isWarningMode}
                  dragDropEnabled={dragDropEnabled}
                  onDropCard={onCellDrop}
                  onDragHover={onCellDragHover}
                  onHoverStart={setHoveredCell}
                  onHoverEnd={() => setHoveredCell((prev) => (prev === idx ? null : prev))}
                  ghostCard={hoveredCell === idx ? selectedCardPreview : null}
                  ghostOwner={typeof currentPlayer === "number" ? currentPlayer : 0}
                  idleGuide={idleGuideSelectables}
                />
              );
            })}
          </div>

          {/* ── Flip Causality Arrows (NIN-UX-030) ── */}
          {flipTraces && flipTraces.length > 0 && (
            <FlipArrowOverlay
              traces={flipTraces}
              gridRef={gridRef}
              isAnimating={isFlipAnimating}
            />
          )}
        </div>
      </div>

      {/* ── Action Prompt (NIN-UX-011) ── */}
      <div className={["mint-prompt-slot", !showActionPrompt && "mint-prompt-slot--hidden"].filter(Boolean).join(" ")}>
        {showActionPrompt && (
          <ActionPrompt gamePhase={gamePhase} isWarningMode={isWarningMode} />
        )}
      </div>

      {/* ── Inline Error (NIN-UX-012) ── */}
      {inlineError && (
        <div className="flex justify-center">
          <InlineError message={inlineError} onDismiss={onDismissError} />
        </div>
      )}

      {/* ── Board Card Inspect (Phase 1-010) ── */}
      {inspect.state.visible && inspect.state.card && inspect.state.anchorRect && (
        <CardPreviewPanel
          card={inspect.state.card}
          owner={inspect.state.owner!}
          anchorRect={inspect.state.anchorRect}
          position={inspect.state.position}
          onClose={inspect.hide}
        />
      )}
    </div>
  );
}

// ── Mini Board (overlay) ───────────────────────────────────────────────

export function BoardViewMintMini({
  board,
  placedCell,
  flippedCells,
}: {
  board: BoardState;
  placedCell?: number | null;
  flippedCells?: number[];
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl p-2"
      style={{ background: "var(--mint-bg)", border: "1px solid var(--mint-accent-muted)" }}
    >
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
            <div className="text-3xs text-surface-300">&bull;</div>
          )}
        </div>
      ))}
    </div>
  );
}
