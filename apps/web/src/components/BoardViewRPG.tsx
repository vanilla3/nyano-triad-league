import React from "react";
import type { BoardState, PlayerIndex, TraitType, CardData } from "@nyano/triad-engine";
import { NyanoImage } from "./NyanoImage";
import "../rpg-theme/rpg-theme.css";

/* ═══════════════════════════════════════════════════════════════════════════
   BoardViewRPG — Fantasy RPG Card Battle Board
   
   Drop-in replacement for BoardView with full backwards compatibility.
   Requires: rpg-theme.css loaded, Cinzel font (optional graceful fallback)
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Constants ──

const CELL_COORDS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

const JANKEN_EMOJI: Record<0 | 1 | 2, string> = { 0: "✊", 1: "✋", 2: "✌️" };

const TRAIT_CONFIG: Record<TraitType, { icon: string; glow: string }> = {
  flame:   { icon: "🔥", glow: "#FF4500" },
  aqua:    { icon: "💧", glow: "#00BFFF" },
  shadow:  { icon: "☾",  glow: "#6B5B95" },
  light:   { icon: "☀",  glow: "#FFD700" },
  cosmic:  { icon: "✦",  glow: "#9B59FF" },
  wind:    { icon: "🍃", glow: "#2ECC71" },
  thunder: { icon: "⚡", glow: "#F1C40F" },
  earth:   { icon: "🪨", glow: "#D4A017" },
  metal:   { icon: "⚙",  glow: "#95A5A6" },
  forest:  { icon: "🌿", glow: "#27AE60" },
  none:    { icon: "—",  glow: "#888" },
};

// ── Types (backwards compatible with BoardView) ──

export interface BoardViewRPGProps {
  board: BoardState;

  /** New API: selected cell */
  selectedCell?: number | null;
  /** Legacy API: focus cell */
  focusCell?: number | null;

  /** Highlight the placed cell (last move) */
  placedCell?: number | null;
  /** Highlight flipped cells this turn */
  flippedCells?: readonly number[] | null;

  /** Warning marks on cells */
  warningMarks?: readonly { cell: number; owner: PlayerIndex }[] | null;

  /** New API: handler when a cell is selected */
  onCellSelect?: (cell: number) => void;
  /** Legacy API */
  onClickCell?: (cell: number) => void;

  /** Selectable cells */
  selectableCells?: Set<number> | readonly number[] | null;

  /** Current player turn */
  currentPlayer?: PlayerIndex | null;

  /** Player names */
  playerNameA?: string;
  playerNameB?: string;

  /** Disable interaction */
  disabled?: boolean;

  /** Show coordinate labels */
  showCoordinates?: boolean;

  /** Show ambient particles */
  showParticles?: boolean;

  /** Show candles */
  showCandles?: boolean;

  className?: string;
}

// ── Helpers ──

function toSelectableSet(v?: Set<number> | readonly number[] | null): Set<number> {
  if (!v) return new Set();
  if (v instanceof Set) return v;
  return new Set(Array.from(v));
}

function calcScore(board: BoardState): { a: number; b: number } {
  let a = 0, b = 0;
  for (const cell of board) {
    if (!cell) continue;
    if (cell.owner === 0) a++;
    if (cell.owner === 1) b++;
  }
  return { a, b };
}

function edgeClass(value: number, owner: PlayerIndex): string {
  if (value >= 8) return "rpg-card__edge rpg-card__edge--high";
  if (value >= 6) return `rpg-card__edge rpg-card__edge--mid-${owner === 0 ? "a" : "b"}`;
  return "rpg-card__edge rpg-card__edge--low";
}

// ── Sub-Components ──

/** Ambient floating particles */
function AmbientParticles({ count = 8 }: { count?: number }) {
  const particles = React.useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${10 + Math.random() * 80}%`,
      bottom: `${Math.random() * 30}%`,
      duration: `${8 + Math.random() * 6}s`,
      delay: `${Math.random() * 8}s`,
      size: 2 + Math.random() * 2,
    })),
    [count],
  );

  return (
    <div className="rpg-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="rpg-particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            "--duration": p.duration,
            "--delay": p.delay,
          }}
        />
      ))}
    </div>
  );
}

/** Decorative candle */
function Candle({ className = "" }: { className?: string }) {
  return (
    <div className={`rpg-candle ${className}`}>
      <div className="rpg-candle__flame">
        <div className="rpg-candle__flame-inner" />
      </div>
      <div className="rpg-candle__glow" />
      <div className="rpg-candle__body" />
      <div className="rpg-candle__base" />
    </div>
  );
}

/** Turn banner ribbon */
function TurnBanner({ player }: { player: PlayerIndex }) {
  return (
    <div className={`rpg-turn-banner rpg-turn-banner--${player === 0 ? "a" : "b"}`}>
      {player === 0 ? "YOUR TURN" : "ENEMY TURN"}
    </div>
  );
}

/** Card rendered inside a board cell */
function CellCard({ card, owner }: { card: CardData; owner: PlayerIndex }) {
  const trait = card.trait ?? "none";
  const traitCfg = TRAIT_CONFIG[trait];
  const ownerKey = owner === 0 ? "a" : "b";

  return (
    <div className={`rpg-card rpg-card--owner-${ownerKey}`}>
      {/* Trait background glow */}
      {trait !== "none" && (
        <div
          className="rpg-card__trait-glow"
          style={{ background: `radial-gradient(circle, ${traitCfg.glow}40 0%, transparent 70%)` }}
        />
      )}

      {/* Token ID */}
      <span className="rpg-card__token-id">#{card.tokenId.toString().slice(-3)}</span>

      {/* Trait icon */}
      {trait !== "none" && <span className="rpg-card__trait-icon">{traitCfg.icon}</span>}

      {/* 3×3 grid: edges + center */}
      {/* Row 1: _ UP _ */}
      <div />
      <div className={edgeClass(Number(card.edges.up), owner)}>{Number(card.edges.up)}</div>
      <div />

      {/* Row 2: LEFT CENTER RIGHT */}
      <div className={edgeClass(Number(card.edges.left), owner)}>{Number(card.edges.left)}</div>
      <div className="rpg-card__center">{JANKEN_EMOJI[card.jankenHand]}</div>
      <div className={edgeClass(Number(card.edges.right), owner)}>{Number(card.edges.right)}</div>

      {/* Row 3: _ DOWN _ */}
      <div />
      <div className={edgeClass(Number(card.edges.down), owner)}>{Number(card.edges.down)}</div>
      <div />

      {/* Owner badge */}
      <span className={`rpg-card__owner-badge rpg-card__owner-badge--${ownerKey}`}>
        {ownerKey.toUpperCase()}
      </span>
    </div>
  );
}

/** Single board cell */
function RPGCell({
  cell,
  index: _index,
  coord,
  isSelected: _isSelected,
  isPlaced,
  isFlipped,
  flipDelayClass,
  isFocus: _isFocus,
  isSelectable,
  warningMark,
  onSelect,
  showCoordinates,
}: {
  cell: { owner: PlayerIndex; card: CardData } | null;
  index: number;
  coord: string;
  isSelected: boolean;
  isPlaced: boolean;
  isFlipped: boolean;
  flipDelayClass?: string;
  isFocus: boolean;
  isSelectable: boolean;
  warningMark: PlayerIndex | null;
  onSelect?: () => void;
  showCoordinates: boolean;
}) {
  const hasCard = !!cell?.card;
  const owner = hasCard ? cell!.owner : null;

  const classes = ["rpg-cell"];

  if (!hasCard) classes.push("rpg-cell--empty");
  if (isSelectable && !hasCard) classes.push("rpg-cell--selectable");
  if (isPlaced) classes.push("rpg-cell--placed");
  if (isFlipped) {
    classes.push("rpg-cell--flipped");
    if (flipDelayClass) classes.push(flipDelayClass);
  }
  if (hasCard && owner === 0) classes.push("rpg-cell--owner-a");
  if (hasCard && owner === 1) classes.push("rpg-cell--owner-b");

  return (
    <div
      className={classes.join(" ")}
      onClick={isSelectable && !hasCard ? onSelect : undefined}
    >
      {/* Coordinate label */}
      {showCoordinates && <span className="rpg-cell__coord">{coord}</span>}

      {/* Warning mark */}
      {typeof warningMark === "number" && (
        <div
          className={`rpg-cell__warning rpg-cell__warning--${warningMark === 0 ? "a" : "b"}`}
          title={`Warning: ${warningMark === 0 ? "A" : "B"}`}
        >
          !
        </div>
      )}

      {/* Card or empty */}
      {hasCard ? (
        <CellCard card={cell!.card} owner={cell!.owner} />
      ) : isSelectable ? (
        <div style={{ opacity: 0.4, fontSize: 20, color: "var(--rpg-frame-gold)" }}>✦</div>
      ) : null}
    </div>
  );
}

/** Player HUD bar */
function PlayerHUD({
  player,
  name,
  score,
  maxScore = 9,
  isActive,
}: {
  player: PlayerIndex;
  name: string;
  score: number;
  maxScore?: number;
  isActive: boolean;
}) {
  const key = player === 0 ? "a" : "b";
  const hpPct = Math.max(0, Math.min(100, (score / maxScore) * 100));
  const isDanger = hpPct <= 30;

  return (
    <div className={`rpg-hud rpg-hud--${key} ${isActive ? "rpg-hud--active" : ""}`} style={{ flex: 1 }}>
      {/* Avatar */}
      <div className={`rpg-hud__avatar rpg-hud__avatar--${key}`}>
        <NyanoImage size={48} className="rounded-none" />
      </div>

      {/* Info */}
      <div className="rpg-hud__info">
        <div className="rpg-hud__name">{name}</div>

        {/* HP-style score bar */}
        <div className="rpg-hud__hp-bar">
          <div
            className={`rpg-hud__hp-fill rpg-hud__hp-fill--${isDanger ? "danger" : key}`}
            style={{ width: `${hpPct}%` }}
          />
          <div className="rpg-hud__hp-label">{score} / {maxScore}</div>
        </div>

        {/* Score tiles */}
        <div className="rpg-hud__score" style={{ marginTop: 4 }}>
          {Array.from({ length: maxScore }, (_, i) => (
            <div
              key={i}
              className={`rpg-hud__score-tile ${
                i < score ? `rpg-hud__score-tile--filled-${key}` : "rpg-hud__score-tile--empty"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** VS emblem between player HUDs */
function VSEmblem() {
  return (
    <div className="rpg-vs">
      <span className="rpg-vs__text">VS</span>
    </div>
  );
}

// ── Main Component ──

export function BoardViewRPG({
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
  playerNameA = "Player A",
  playerNameB = "Player B",
  disabled = false,
  showCoordinates = true,
  showParticles = true,
  showCandles = true,
  className = "",
}: BoardViewRPGProps) {
  const selectableSet = toSelectableSet(selectableCells);
  const score = calcScore(board);
  const flippedSet = new Set<number>(Array.from(flippedCells ?? []));

  const warnMap = new Map<number, PlayerIndex>();
  for (const w of warningMarks ?? []) {
    if (w && Number.isFinite(w.cell)) warnMap.set(w.cell, w.owner);
  }

  // Backwards compatible: focus acts as selected if selectedCell not provided
  const focus = typeof focusCell === "number" ? focusCell : null;
  const selected = typeof selectedCell === "number" ? selectedCell : null;
  const effectiveSelected = selected ?? focus;

  const handleSelect = (cell: number) => {
    if (disabled) return;
    const fn = onCellSelect ?? onClickCell;
    if (fn) fn(cell);
  };

  return (
    <div className={`rpg-arena ${className}`} style={{ minHeight: "auto", padding: "16px 12px" }}>
      {/* Ambient particles */}
      {showParticles && <AmbientParticles />}

      {/* Player HUD bar */}
      <div className="rpg-arena__top-bar">
        <PlayerHUD
          player={0}
          name={playerNameA}
          score={score.a}
          isActive={currentPlayer === 0}
        />
        <VSEmblem />
        <PlayerHUD
          player={1}
          name={playerNameB}
          score={score.b}
          isActive={currentPlayer === 1}
        />
      </div>

      {/* Board frame */}
      <div className="rpg-arena__main">
        <div className="rpg-board-frame" style={{ position: "relative" }}>
          {/* Turn banner */}
          {typeof currentPlayer === "number" && (
            <TurnBanner player={currentPlayer} />
          )}

          {/* Candles */}
          {showCandles && (
            <>
              <div style={{ position: "absolute", left: -32, top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
                <Candle />
              </div>
              <div style={{ position: "absolute", right: -32, top: "50%", transform: "translateY(-50%)", zIndex: 5 }}>
                <Candle />
              </div>
            </>
          )}

          {/* Board inner */}
          <div className="rpg-board-inner">
            <div className="rpg-grid">
              {board.map((cell, idx) => {
                const coord = CELL_COORDS[idx] ?? String(idx);
                const isSelectable = !disabled && selectableSet.has(idx);
                const isPlaced = placedCell === idx;
                const isFlipped = flippedSet.has(idx);
                const flipIndex = isFlipped ? (flippedCells ?? []).indexOf(idx) : -1;
                const flipDelayClass = flipIndex > 0
                  ? `rpg-cell--flip-delay-${Math.min(flipIndex, 3)}`
                  : undefined;
                const isFocus = focus === idx;
                const isSelected = effectiveSelected === idx;
                const warning = warnMap.get(idx) ?? null;

                return (
                  <RPGCell
                    key={idx}
                    cell={cell as any}
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
                    showCoordinates={showCoordinates}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RPG HAND DISPLAY - Player's hand cards in fantasy style
   ═══════════════════════════════════════════════════════════════════════════ */

export interface HandDisplayRPGProps {
  cards: CardData[];
  owner: PlayerIndex;
  usedIndices: Set<number>;
  selectedIndex: number | null;
  onSelect?: (index: number) => void;
  disabled?: boolean;
}

export function HandDisplayRPG({
  cards,
  owner,
  usedIndices,
  selectedIndex,
  onSelect,
  disabled = false,
}: HandDisplayRPGProps) {
  const ownerKey = owner === 0 ? "a" : "b";

  return (
    <div className="rpg-arena__hand">
      {cards.map((card, idx) => {
        const isUsed = usedIndices.has(idx);
        const isSelected = selectedIndex === idx;
        const trait = card.trait ?? "none";
        const traitCfg = TRAIT_CONFIG[trait];

        const classes = [
          "rpg-hand-card",
          `rpg-hand-card--${ownerKey}`,
          isSelected && "rpg-hand-card--selected",
          isUsed && "rpg-hand-card--used",
        ].filter(Boolean).join(" ");

        return (
          <div key={idx} style={{ position: "relative" }}>
            <div
              className={classes}
              onClick={!isUsed && !disabled && onSelect ? () => onSelect(idx) : undefined}
            >
              <div className="rpg-hand-card__edges">
                {/* Row 1 */}
                <div />
                <div className="rpg-hand-card__edge-val">{Number(card.edges.up)}</div>
                <div />
                {/* Row 2 */}
                <div className="rpg-hand-card__edge-val">{Number(card.edges.left)}</div>
                <div className="rpg-hand-card__janken">{JANKEN_EMOJI[card.jankenHand]}</div>
                <div className="rpg-hand-card__edge-val">{Number(card.edges.right)}</div>
                {/* Row 3 */}
                <div />
                <div className="rpg-hand-card__edge-val">{Number(card.edges.down)}</div>
                <div />
              </div>

              {/* Trait icon */}
              {trait !== "none" && (
                <span className="rpg-hand-card__trait">{traitCfg.icon}</span>
              )}
            </div>

            {/* Slot number */}
            <div
              className="rpg-hand-card__slot-num"
              style={{
                background: isUsed
                  ? "var(--rpg-text-dim)"
                  : isSelected
                    ? "var(--rpg-frame-gold)"
                    : `var(--rpg-p${ownerKey})`,
              }}
            >
              {idx + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RPG RESULT OVERLAY - Victory/Defeat/Draw announcement
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GameResultRPG {
  winner: PlayerIndex | "draw";
  tilesA: number;
  tilesB: number;
  matchId?: string;
}

export interface GameResultOverlayRPGProps {
  result: GameResultRPG;
  perspective?: PlayerIndex | null;
  show: boolean;
  onDismiss?: () => void;
  onRematch?: () => void;
  onReplay?: () => void;
  onShare?: () => void;
}

export function GameResultOverlayRPG({
  result,
  perspective = null,
  show,
  onDismiss,
  onRematch,
  onReplay,
  onShare,
}: GameResultOverlayRPGProps) {
  if (!show) return null;

  const isWin =
    perspective !== null && result.winner !== "draw" && result.winner === perspective;
  const isLoss =
    perspective !== null && result.winner !== "draw" && result.winner !== perspective;
  const isDraw = result.winner === "draw";

  let titleText: string;
  let titleClass: string;
  let subtitle: string;

  if (isDraw) {
    titleText = "DRAW";
    titleClass = "rpg-result__title--draw";
    subtitle = "A battle of equals";
  } else if (isWin) {
    titleText = "VICTORY";
    titleClass = "rpg-result__title--victory";
    subtitle = "You have conquered!";
  } else if (isLoss) {
    titleText = "DEFEAT";
    titleClass = "rpg-result__title--defeat";
    subtitle = "Fight again, warrior";
  } else {
    // No perspective: just show winner
    titleText = result.winner === 0 ? "PLAYER A WINS" : "PLAYER B WINS";
    titleClass = result.winner === 0
      ? "rpg-result__title--victory"
      : "rpg-result__title--defeat";
    subtitle = `${result.tilesA} – ${result.tilesB}`;
  }

  return (
    <div className="rpg-result-overlay" onClick={onDismiss}>
      <div className="rpg-result-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className={`rpg-result__title ${titleClass}`}>{titleText}</h2>
        <p className="rpg-result__subtitle">{subtitle}</p>

        <div className="rpg-result__scores">
          <span className="rpg-result__score-val rpg-result__score-val--a">{result.tilesA}</span>
          <span className="rpg-result__divider">—</span>
          <span className="rpg-result__score-val rpg-result__score-val--b">{result.tilesB}</span>
        </div>

        {result.matchId && (
          <div style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--rpg-text-dim)",
            marginBottom: 16,
            wordBreak: "break-all",
          }}>
            Match: {result.matchId.slice(0, 10)}…
          </div>
        )}

        <div className="rpg-result__actions">
          {onRematch && (
            <button className="rpg-result__btn rpg-result__btn--primary" onClick={onRematch}>
              ⚔ Rematch
            </button>
          )}
          {onReplay && (
            <button className="rpg-result__btn" onClick={onReplay}>
              📼 Replay
            </button>
          )}
          {onShare && (
            <button className="rpg-result__btn" onClick={onShare}>
              📜 Share
            </button>
          )}
          {onDismiss && (
            <button className="rpg-result__btn" onClick={onDismiss}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RPG TURN LOG - Compact move history sidebar
   ═══════════════════════════════════════════════════════════════════════════ */

export interface TurnLogEntry {
  turnIndex: number;
  player: PlayerIndex;
  cell: number;
  janken: 0 | 1 | 2;
  flipCount: number;
}

export function TurnLogRPG({ entries }: { entries: TurnLogEntry[] }) {
  const logRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div className="rpg-turn-log" ref={logRef}>
      <div style={{
        fontSize: 10,
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        color: "var(--rpg-text-gold)",
        letterSpacing: 1,
        marginBottom: 4,
        textTransform: "uppercase",
      }}>
        Battle Log
      </div>

      {entries.map((entry, i) => {
        const key = entry.player === 0 ? "a" : "b";
        const coord = CELL_COORDS[entry.cell] ?? String(entry.cell);

        return (
          <div key={i} className="rpg-turn-log__item">
            <span className={`rpg-turn-log__player-badge rpg-turn-log__player-badge--${key}`}>
              {key.toUpperCase()}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
              {coord}
            </span>
            <span>{JANKEN_EMOJI[entry.janken]}</span>
            {entry.flipCount > 0 && (
              <span className="rpg-turn-log__flip">
                ⚔ ×{entry.flipCount}
              </span>
            )}
          </div>
        );
      })}

      {entries.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--rpg-text-dim)", fontStyle: "italic" }}>
          Awaiting first move…
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RPG MINI BOARD (for overlays / stream)
   ═══════════════════════════════════════════════════════════════════════════ */

export function BoardViewRPGMini({
  board,
  placedCell,
  flippedCells,
}: {
  board: BoardState;
  placedCell?: number | null;
  flippedCells?: number[];
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 3,
      padding: 8,
      borderRadius: 10,
      background: "var(--rpg-board-bg)",
      border: "2px solid var(--rpg-frame-gold)",
    }}>
      {board.map((cell, idx) => {
        const isPlaced = placedCell === idx;
        const isFlipped = flippedCells?.includes(idx);
        const owner = cell?.owner;

        return (
          <div
            key={idx}
            style={{
              width: 48,
              height: 48,
              borderRadius: 4,
              border: `1px solid ${
                owner === 0 ? "var(--rpg-pa)" : owner === 1 ? "var(--rpg-pb)" : "var(--rpg-cell-border)"
              }`,
              background: owner != null
                ? `var(--rpg-p${owner === 0 ? "a" : "b"}-bg-light)`
                : "var(--rpg-cell-stone)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              color: "var(--rpg-text-light)",
              boxShadow: isPlaced
                ? "0 0 8px var(--rpg-flip-glow)"
                : isFlipped
                  ? "0 0 8px var(--rpg-chain-glow)"
                  : "none",
            }}
          >
            {cell?.card ? (
              <div style={{ textAlign: "center", lineHeight: 1.2 }}>
                {Number(cell.card.edges.up)}<br />
                {Number(cell.card.edges.left)} {Number(cell.card.edges.right)}<br />
                {Number(cell.card.edges.down)}
              </div>
            ) : (
              <span style={{ color: "var(--rpg-text-dim)", fontSize: 8 }}>•</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RPG REPLAY BOARD VIEWER
   ═══════════════════════════════════════════════════════════════════════════ */

export function BoardReplayViewerRPG({
  history,
  currentStep,
  onStepChange,
  placedCell,
  flippedCells,
  playerNameA,
  playerNameB,
}: {
  history: BoardState[];
  currentStep: number;
  onStepChange: (step: number) => void;
  placedCell?: number | null;
  flippedCells?: number[];
  playerNameA?: string;
  playerNameB?: string;
}) {
  const maxStep = Math.max(0, history.length - 1);
  const board = history[Math.min(currentStep, maxStep)] ?? history[0];
  const pct = maxStep > 0 ? (currentStep / maxStep) * 100 : 0;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <BoardViewRPG
        board={board}
        placedCell={placedCell}
        flippedCells={flippedCells}
        playerNameA={playerNameA}
        playerNameB={playerNameB}
        showCandles={false}
        showParticles={false}
      />

      {/* Step slider */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.4)",
        border: "1px solid var(--rpg-frame-gold, rgba(201,168,76,0.3))",
      }}>
        <span style={{
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          color: "var(--rpg-text-dim)",
        }}>
          Step {currentStep}/{maxStep}
        </span>
        <input
          type="range"
          min={0}
          max={maxStep}
          value={currentStep}
          onChange={(e) => onStepChange(Number(e.target.value))}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            appearance: "none",
            background: `linear-gradient(to right, var(--rpg-frame-gold) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
}
