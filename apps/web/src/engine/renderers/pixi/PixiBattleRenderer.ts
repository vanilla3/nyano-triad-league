/**
 * PixiBattleRenderer — PixiJS v8 implementation of IBattleRenderer.
 *
 * Renders a 3×3 board grid with:
 * - Selectable cell highlights (cyan)
 * - Selected cell emphasis
 * - Owner-colored cards (blue / red) with edge numbers
 * - Cell coordinate labels (A1–C3)
 *
 * This file imports from "pixi.js" and must only be loaded via dynamic
 * import() inside useEffect — never at module scope in test-reachable files.
 */

import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import type { BoardCell } from "@nyano/triad-engine";
import type {
  IBattleRenderer,
  BattleRendererState,
  CellSelectCallback,
} from "../IBattleRenderer";

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const COLORS = {
  background: 0x1a1a2e,
  gridLine: 0x334155,
  cellEmpty: 0x0f172a,
  cellSelectableStroke: 0x22d3ee, // cyan-400
  cellSelectedFill: 0x164e63, // cyan-900
  cellSelectedStroke: 0x06b6d4, // cyan-500
  ownerA: 0x3b82f6, // blue-500
  ownerB: 0xef4444, // red-500
  edgeText: 0xffffff,
  coordText: 0x64748b, // slate-500
} as const;

const CELL_COORDS = [
  "A1",
  "B1",
  "C1",
  "A2",
  "B2",
  "C2",
  "A3",
  "B3",
  "C3",
] as const;

/** Layout rectangle for a single cell. */
interface CellLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Renderer
   ═══════════════════════════════════════════════════════════════════════════ */

export class PixiBattleRenderer implements IBattleRenderer {
  private app: Application | null = null;
  private boardContainer: Container | null = null;
  private cellGraphics: Graphics[] = [];
  private cellTextContainers: Container[] = [];
  private cellCoordTexts: Text[] = [];
  private layouts = new Map<number, CellLayout>();
  private state: BattleRendererState | null = null;
  private cellSelectCb: CellSelectCallback | null = null;

  /* ── Lifecycle ─────────────────────────────────────────────────────── */

  async init(container: HTMLElement): Promise<void> {
    const app = new Application();
    await app.init({
      preference: "webgl",
      background: COLORS.background,
      resizeTo: container,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    container.appendChild(app.canvas as HTMLCanvasElement);
    this.app = app;

    this.boardContainer = new Container();
    app.stage.addChild(this.boardContainer);

    this.buildGrid();
  }

  setState(state: BattleRendererState): void {
    this.state = state;
    this.redraw();
  }

  onCellSelect(cb: CellSelectCallback): void {
    this.cellSelectCb = cb;
  }

  resize(width: number, height: number): void {
    if (!this.app) return;
    this.app.renderer.resize(width, height);
    this.layoutGrid();
    this.redraw();
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
    this.boardContainer = null;
    this.cellGraphics = [];
    this.cellTextContainers = [];
    this.cellCoordTexts = [];
    this.layouts.clear();
    this.state = null;
    this.cellSelectCb = null;
  }

  /* ── Grid construction ─────────────────────────────────────────────── */

  private buildGrid(): void {
    if (!this.boardContainer || !this.app) return;

    for (let i = 0; i < 9; i++) {
      // Cell graphics (background / stroke)
      const cellGfx = new Graphics();
      cellGfx.eventMode = "static";
      cellGfx.cursor = "pointer";

      const cellIndex = i;
      cellGfx.on("pointertap", () => {
        if (this.state?.selectableCells.has(cellIndex)) {
          this.cellSelectCb?.(cellIndex);
        }
      });

      this.boardContainer.addChild(cellGfx);
      this.cellGraphics.push(cellGfx);

      // Edge text container (will hold up to 4 Text children)
      const textContainer = new Container();
      this.boardContainer.addChild(textContainer);
      this.cellTextContainers.push(textContainer);

      // Cell coordinate label (A1–C3)
      const coordText = new Text({
        text: CELL_COORDS[i],
        style: new TextStyle({
          fontSize: 10,
          fill: COLORS.coordText,
          fontFamily: "monospace",
        }),
      });
      coordText.anchor.set(0, 0);
      this.boardContainer.addChild(coordText);
      this.cellCoordTexts.push(coordText);
    }

    this.layoutGrid();
  }

  private layoutGrid(): void {
    if (!this.app) return;

    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const boardSize = Math.min(w, h) * 0.85;
    const cellSize = boardSize / 3;
    const gap = 4;
    const offsetX = (w - boardSize) / 2;
    const offsetY = (h - boardSize) / 2;

    for (let i = 0; i < 9; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = offsetX + col * cellSize + gap / 2;
      const y = offsetY + row * cellSize + gap / 2;
      const cw = cellSize - gap;
      const ch = cellSize - gap;

      this.layouts.set(i, { x, y, w: cw, h: ch });

      // Position coordinate text
      const coordTxt = this.cellCoordTexts[i];
      coordTxt.x = x + 3;
      coordTxt.y = y + 2;
    }
  }

  /* ── Redraw ────────────────────────────────────────────────────────── */

  private redraw(): void {
    if (!this.state) return;

    for (let i = 0; i < 9; i++) {
      const gfx = this.cellGraphics[i];
      const layout = this.layouts.get(i);
      if (!layout) continue;

      const { x, y, w, h } = layout;
      const cell: BoardCell | null = this.state.board[i] ?? null;
      const isSelectable = this.state.selectableCells.has(i);
      const isSelected = this.state.selectedCell === i;

      gfx.clear();

      // ── Cell fill & stroke ──
      if (cell) {
        // Occupied cell — color by owner
        const ownerColor =
          cell.owner === 0 ? COLORS.ownerA : COLORS.ownerB;
        gfx.roundRect(x, y, w, h, 6);
        gfx.fill({ color: ownerColor, alpha: 0.35 });
        gfx.roundRect(x, y, w, h, 6);
        gfx.stroke({ color: ownerColor, width: 2 });
      } else if (isSelected) {
        // Selected empty cell — emphasized
        gfx.roundRect(x, y, w, h, 6);
        gfx.fill({ color: COLORS.cellSelectedFill, alpha: 0.6 });
        gfx.roundRect(x, y, w, h, 6);
        gfx.stroke({ color: COLORS.cellSelectedStroke, width: 3 });
      } else if (isSelectable) {
        // Selectable empty cell — subtle highlight
        gfx.roundRect(x, y, w, h, 6);
        gfx.fill({ color: COLORS.cellEmpty });
        gfx.roundRect(x, y, w, h, 6);
        gfx.stroke({ color: COLORS.cellSelectableStroke, width: 1.5, alpha: 0.6 });
      } else {
        // Non-selectable empty cell
        gfx.roundRect(x, y, w, h, 6);
        gfx.fill({ color: COLORS.cellEmpty });
        gfx.roundRect(x, y, w, h, 6);
        gfx.stroke({ color: COLORS.gridLine, width: 1 });
      }

      // Cursor
      gfx.cursor = isSelectable && !cell ? "pointer" : "default";

      // ── Edge numbers for occupied cells ──
      this.updateEdgeTexts(i, cell, x, y, w, h);
    }
  }

  private updateEdgeTexts(
    index: number,
    cell: BoardCell | null,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    const container = this.cellTextContainers[index];
    container.removeChildren();

    if (!cell) return;

    const { edges } = cell.card;
    const fontSize = Math.max(12, w * 0.18);
    const style = new TextStyle({
      fontSize,
      fill: COLORS.edgeText,
      fontFamily: "monospace",
      fontWeight: "bold",
    });

    // Positions: up (top-center), right (right-center), down (bottom-center), left (left-center)
    const edgeData: Array<{
      val: number;
      px: number;
      py: number;
      ax: number;
      ay: number;
    }> = [
      { val: edges.up, px: x + w / 2, py: y + 6, ax: 0.5, ay: 0 },
      { val: edges.right, px: x + w - 6, py: y + h / 2, ax: 1, ay: 0.5 },
      { val: edges.down, px: x + w / 2, py: y + h - 6, ax: 0.5, ay: 1 },
      { val: edges.left, px: x + 6, py: y + h / 2, ax: 0, ay: 0.5 },
    ];

    for (const { val, px, py, ax, ay } of edgeData) {
      const t = new Text({
        text: String(val),
        style,
      });
      t.anchor.set(ax, ay);
      t.x = px;
      t.y = py;
      container.addChild(t);
    }
  }
}
