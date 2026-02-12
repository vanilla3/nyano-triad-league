/**
 * IBattleRenderer — Abstraction for match-scene canvas renderers.
 *
 * React owns the lifecycle (mount/resize/destroy).
 * Renderer owns the draw loop.
 * Communication is one-way: React calls setState(), renderer updates visuals.
 *
 * IMPORTANT: This file must NOT import from "pixi.js" — it is consumed by
 * test files running in Vitest `environment: "node"` where WebGL is unavailable.
 */

import type { BoardState, PlayerIndex } from "@nyano/triad-engine";
import type { VfxQuality } from "@/lib/visual/visualSettings";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

/** State snapshot pushed from React to renderer each frame. */
export interface BattleRendererState {
  /** Current 3×3 board (length 9, nullable cells). */
  board: BoardState;
  /** Currently selected cell index (0-8), or null. */
  selectedCell: number | null;
  /** Set of cell indices the player can tap. */
  selectableCells: ReadonlySet<number>;
  /** Which player's turn it is. */
  currentPlayer: PlayerIndex;
  /** VFX quality tier for animation scaling. */
  vfxQuality: VfxQuality;
  /** Optional extra tokenIds to preload (e.g. current hand). */
  preloadTokenIds?: readonly string[];
  /** Cell index where a card was just placed (Sprint 49). */
  placedCell?: number | null;
  /** Cell indices flipped this turn (Sprint 49). */
  flippedCells?: readonly number[];
}

/** Callback from renderer to React when a cell is tapped/clicked. */
export type CellSelectCallback = (cellIndex: number) => void;

/** Callback from renderer to React when a cell card is inspected (long-press / right-click). */
export type CellInspectCallback = (cellIndex: number, screenRect: DOMRect) => void;

/* ═══════════════════════════════════════════════════════════════════════════
   Interface
   ═══════════════════════════════════════════════════════════════════════════ */

export interface IBattleRenderer {
  /**
   * Initialize the renderer and attach to a container element.
   * Returns a promise that resolves when the Application is ready.
   */
  init(container: HTMLElement): Promise<void>;

  /**
   * Push new state to the renderer. Called on every React re-render
   * that changes board-related props. The renderer is responsible for
   * diffing and only re-drawing what changed.
   */
  setState(state: BattleRendererState): void;

  /**
   * Register a callback for cell tap/click events.
   * Only one callback is active at a time (last call wins).
   */
  onCellSelect(cb: CellSelectCallback): void;

  /**
   * Register a callback for cell inspect events (long-press / right-click on card cells).
   * Provides the cell index and its screen-space bounding rect for positioning UI.
   */
  onCellInspect(cb: CellInspectCallback): void;

  /**
   * Handle container resize. Called by ResizeObserver.
   * The renderer should resize its canvas to fit the new dimensions.
   */
  resize(width: number, height: number): void;

  /**
   * Tear down the renderer, release GPU resources, remove canvas.
   * After calling destroy(), the renderer instance must not be reused.
   */
  destroy(): void;
}
