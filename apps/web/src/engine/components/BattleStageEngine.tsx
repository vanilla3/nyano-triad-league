/**
 * BattleStageEngine — React wrapper for the PixiJS battle renderer.
 *
 * Mounts the renderer once, pushes state updates via IBattleRenderer.setState(),
 * and cleans up on unmount. PixiJS is loaded via dynamic import() so it never
 * enters the main bundle or breaks Vitest (environment: "node").
 */

import React from "react";
import type { BoardState, PlayerIndex } from "@nyano/triad-engine";
import type { IBattleRenderer } from "../renderers/IBattleRenderer";
import { resolveVfxQuality } from "@/lib/visual/visualSettings";

/* ═══════════════════════════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════════════════════════ */

export interface BattleStageEngineProps {
  board: BoardState;
  selectedCell?: number | null;
  selectableCells?: Set<number>;
  onCellSelect?: (cell: number) => void;
  currentPlayer?: PlayerIndex | null;
  /** Cell index where a card was just placed (animation trigger). */
  placedCell?: number | null;
  /** Cell indices flipped this turn (animation trigger). */
  flippedCells?: readonly number[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Defaults
   ═══════════════════════════════════════════════════════════════════════════ */

const EMPTY_SET = new Set<number>();

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function BattleStageEngine({
  board,
  selectedCell = null,
  selectableCells,
  onCellSelect,
  currentPlayer = null,
  placedCell,
  flippedCells,
}: BattleStageEngineProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rendererRef = React.useRef<IBattleRenderer | null>(null);
  const callbackRef = React.useRef(onCellSelect);

  // Keep callback ref current without triggering effect re-runs
  React.useEffect(() => {
    callbackRef.current = onCellSelect;
  }, [onCellSelect]);

  // ── Mount: dynamically import + init renderer ──────────────────────
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    let renderer: IBattleRenderer | null = null;

    (async () => {
      const { PixiBattleRenderer } = await import(
        "../renderers/pixi/PixiBattleRenderer"
      );

      if (destroyed) return; // component unmounted during async import

      renderer = new PixiBattleRenderer();
      await renderer.init(container);

      if (destroyed) {
        renderer.destroy();
        return;
      }

      renderer.onCellSelect((cell) => {
        callbackRef.current?.(cell);
      });

      rendererRef.current = renderer;
    })();

    return () => {
      destroyed = true;
      if (renderer) {
        renderer.destroy();
      }
      rendererRef.current = null;
    };
    // Mount-only effect: renderer lifecycle is independent of React state.
  }, []);

  // ── Update: push state changes to renderer ─────────────────────────
  React.useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.setState({
      board,
      selectedCell: selectedCell ?? null,
      selectableCells: selectableCells ?? EMPTY_SET,
      currentPlayer: (currentPlayer ?? 0) as PlayerIndex,
      vfxQuality: resolveVfxQuality(),
      placedCell,
      flippedCells,
    });
  }, [board, selectedCell, selectableCells, currentPlayer, placedCell, flippedCells]);

  // ── Resize: ResizeObserver on container ─────────────────────────────
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          rendererRef.current?.resize(width, height);
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-square w-full max-w-md"
      style={{ minHeight: 280 }}
      aria-label="Game board (engine renderer)"
      role="img"
    />
  );
}
