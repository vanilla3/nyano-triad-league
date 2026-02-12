/**
 * PixiBattleRenderer — PixiJS v8 implementation of IBattleRenderer.
 *
 * Renders a 3×3 board grid with:
 * - NFT card art as Sprite textures (async loaded with Arweave fallback)
 * - Owner-colored tint overlays on card art
 * - Edge numbers with dark pill backgrounds for readability
 * - Token ID labels (#XXX) in top-right corner
 * - Selectable cell highlights (cyan)
 * - Selected cell emphasis
 * - Cell coordinate labels (A1–C3)
 * - Placement animation (scale bounce + slam-down + brightness pulse)
 * - Flip animation (scaleX Y-rotation simulation + brightness pulse + cascade stagger)
 *
 * This file imports from "pixi.js" and must only be loaded via dynamic
 * import() inside useEffect — never at module scope in test-reachable files.
 */

import { Application, Container, Graphics, Sprite, Text, TextStyle } from "pixi.js";
import type { BoardCell } from "@nyano/triad-engine";
import type {
  IBattleRenderer,
  BattleRendererState,
  CellSelectCallback,
} from "../IBattleRenderer";
import { TextureResolver } from "./textureResolver";
import {
  animDurationsForQuality,
  computeCellFrame,
  computeBreatheFrame,
  type CellAnimRecord,
  type CellAnimFrame,
} from "./cellAnimations";

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
  edgePillBg: 0x000000,
  tokenIdBg: 0x000000,
  tokenIdText: 0xffffff,
  brightnessWhite: 0xffffff,
  brightnessBlack: 0x000000,
  breatheGlow: 0x34d399, // emerald-400 (matches --mint-cell-active-glow)
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

  // ── Per-cell visual objects (9 each) ──
  private cellGraphics: Graphics[] = [];
  private cellGlowOverlays: Graphics[] = [];         // ★ breathe glow ring
  private cellContentContainers: Container[] = [];   // ★ animated wrapper
  private cellMasks: Graphics[] = [];
  private cellSprites: (Sprite | null)[] = [];
  private cellTintOverlays: Graphics[] = [];
  private cellTextContainers: Container[] = [];
  private cellTokenLabels: Text[] = [];
  private cellBrightnessOverlays: Graphics[] = [];   // ★ brightness effect
  private cellCoordTexts: Text[] = [];

  private layouts = new Map<number, CellLayout>();
  private state: BattleRendererState | null = null;
  private cellSelectCb: CellSelectCallback | null = null;

  // ── Texture management ──
  private textureResolver = new TextureResolver();

  // ── Animation state ──
  private cellAnims: (CellAnimRecord | null)[] = Array.from({ length: 9 }, () => null);
  private prevPlacedCell: number | null | undefined = undefined;
  private prevFlippedCells: readonly number[] = [];
  private tickerBound = false;

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
    const prevState = this.state;
    this.state = state;

    // ── Detect new animations ──
    this.detectAnimationTriggers(state, prevState);

    // ── Breathe glow needs ticker when selectable cells exist ──
    if (state.selectableCells.size > 0 && state.vfxQuality !== "off") {
      this.ensureTicker();
    }

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
    this.teardownTicker();
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
    this.textureResolver.dispose();
    this.boardContainer = null;
    this.cellGraphics = [];
    this.cellGlowOverlays = [];
    this.cellContentContainers = [];
    this.cellMasks = [];
    this.cellSprites = [];
    this.cellTintOverlays = [];
    this.cellTextContainers = [];
    this.cellTokenLabels = [];
    this.cellBrightnessOverlays = [];
    this.cellCoordTexts = [];
    this.layouts.clear();
    this.state = null;
    this.cellSelectCb = null;
    this.cellAnims = Array.from({ length: 9 }, () => null);
    this.prevPlacedCell = undefined;
    this.prevFlippedCells = [];
  }

  /* ── Grid construction ─────────────────────────────────────────────── */

  private buildGrid(): void {
    if (!this.boardContainer || !this.app) return;

    for (let i = 0; i < 9; i++) {
      // 1. Cell graphics — background / stroke / hit area (NOT animated)
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

      // 1b. Glow overlay — ★ breathe glow ring for selectable empty cells
      const glowGfx = new Graphics();
      glowGfx.visible = false;
      this.boardContainer.addChild(glowGfx);
      this.cellGlowOverlays.push(glowGfx);

      // 2. Content container — ★ animation target
      //    All card visual content goes inside this container.
      //    pivot is set to center in layoutGrid().
      const contentContainer = new Container();
      this.boardContainer.addChild(contentContainer);
      this.cellContentContainers.push(contentContainer);

      // 3. Mask for sprite (rounded corners) — inside content container
      const maskGfx = new Graphics();
      contentContainer.addChild(maskGfx);
      this.cellMasks.push(maskGfx);

      // 4. NFT art sprite (initially hidden)
      const sprite = new Sprite();
      sprite.visible = false;
      sprite.mask = maskGfx;
      contentContainer.addChild(sprite);
      this.cellSprites.push(sprite);

      // 5. Owner tint overlay
      const tintOverlay = new Graphics();
      tintOverlay.visible = false;
      contentContainer.addChild(tintOverlay);
      this.cellTintOverlays.push(tintOverlay);

      // 6. Edge text container (up to 4 Text + 4 pill bg Graphics)
      const textContainer = new Container();
      contentContainer.addChild(textContainer);
      this.cellTextContainers.push(textContainer);

      // 7. Token ID label (top-right, initially hidden)
      const tokenLabel = new Text({
        text: "",
        style: new TextStyle({
          fontSize: 10,
          fill: COLORS.tokenIdText,
          fontFamily: "monospace",
          fontWeight: "bold",
        }),
      });
      tokenLabel.anchor.set(1, 0);
      tokenLabel.visible = false;
      contentContainer.addChild(tokenLabel);
      this.cellTokenLabels.push(tokenLabel);

      // 8. Brightness overlay — ★ white/black semi-transparent for brightness effect
      const brightnessOverlay = new Graphics();
      brightnessOverlay.visible = false;
      contentContainer.addChild(brightnessOverlay);
      this.cellBrightnessOverlays.push(brightnessOverlay);

      // 9. Cell coordinate label (A1–C3) — NOT animated
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

      // ── Content container: centered pivot for scale/rotation ──
      const cc = this.cellContentContainers[i];
      cc.position.set(x + cw / 2, y + ch / 2);
      cc.pivot.set(cw / 2, ch / 2);

      // ── Child coordinates are now relative to content container (0,0)=(cell top-left) ──

      // Update mask geometry (container-relative)
      const mask = this.cellMasks[i];
      mask.clear();
      mask.roundRect(0, 0, cw, ch, 6);
      mask.fill({ color: 0xffffff });

      // Update sprite position/size (container-relative)
      const sprite = this.cellSprites[i];
      if (sprite) {
        sprite.x = 0;
        sprite.y = 0;
        sprite.width = cw;
        sprite.height = ch;
      }

      // Update token label position (container-relative, top-right)
      const tokenLabel = this.cellTokenLabels[i];
      tokenLabel.x = cw - 3;
      tokenLabel.y = 2;

      // Position coordinate text (board-absolute, NOT animated)
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

      // ── Cell fill & stroke (board-absolute coordinates, NOT animated) ──
      if (cell) {
        const ownerColor =
          cell.owner === 0 ? COLORS.ownerA : COLORS.ownerB;
        const tokenIdStr = cell.card.tokenId.toString();
        const texture = this.textureResolver.getTexture(tokenIdStr);

        if (texture) {
          // NFT art loaded — show sprite + tint overlay
          const sprite = this.cellSprites[i];
          if (sprite) {
            sprite.texture = texture;
            sprite.x = 0;
            sprite.y = 0;
            sprite.width = w;
            sprite.height = h;
            sprite.visible = true;
          }

          // Owner tint overlay (container-relative)
          const tint = this.cellTintOverlays[i];
          tint.clear();
          tint.roundRect(0, 0, w, h, 6);
          tint.fill({ color: ownerColor, alpha: 0.25 });
          tint.visible = true;

          // Cell border only (board-absolute, transparent fill for hit area)
          gfx.roundRect(x, y, w, h, 6);
          gfx.fill({ color: 0x000000, alpha: 0 });
          gfx.roundRect(x, y, w, h, 6);
          gfx.stroke({ color: ownerColor, width: 2 });
        } else {
          // Texture not loaded yet — colored rectangle fallback
          gfx.roundRect(x, y, w, h, 6);
          gfx.fill({ color: ownerColor, alpha: 0.35 });
          gfx.roundRect(x, y, w, h, 6);
          gfx.stroke({ color: ownerColor, width: 2 });

          // Hide sprite and tint
          const sprite = this.cellSprites[i];
          if (sprite) sprite.visible = false;
          this.cellTintOverlays[i].visible = false;

          // Kick off async load → re-render on completion
          this.textureResolver.loadTexture(tokenIdStr).then((tex) => {
            if (tex && this.state) this.redraw();
          });
        }

        // Token ID label (container-relative)
        const tokenLabel = this.cellTokenLabels[i];
        tokenLabel.text = `#${tokenIdStr.slice(-3).padStart(3, "0")}`;
        tokenLabel.visible = true;
      } else {
        // ── Empty cell ──
        // Hide card-related objects
        const sprite = this.cellSprites[i];
        if (sprite) sprite.visible = false;
        this.cellTintOverlays[i].visible = false;
        this.cellTokenLabels[i].visible = false;

        if (isSelected) {
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
      }

      // Cursor
      gfx.cursor = isSelectable && !cell ? "pointer" : "default";

      // ── Edge numbers for occupied cells (container-relative) ──
      this.updateEdgeTexts(i, cell, w, h);
    }
  }

  private updateEdgeTexts(
    index: number,
    cell: BoardCell | null,
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

    // Check if texture is loaded (determines pill bg visibility)
    const hasTexture = this.textureResolver.getTexture(
      cell.card.tokenId.toString(),
    ) !== null;

    // Positions: container-relative (0,0 = cell top-left)
    const edgeData: Array<{
      val: number;
      px: number;
      py: number;
      ax: number;
      ay: number;
    }> = [
      { val: edges.up, px: w / 2, py: 6, ax: 0.5, ay: 0 },
      { val: edges.right, px: w - 6, py: h / 2, ax: 1, ay: 0.5 },
      { val: edges.down, px: w / 2, py: h - 6, ax: 0.5, ay: 1 },
      { val: edges.left, px: 6, py: h / 2, ax: 0, ay: 0.5 },
    ];

    for (const { val, px, py, ax, ay } of edgeData) {
      // Dark pill background when texture is visible
      if (hasTexture) {
        const pillW = fontSize * 1.3;
        const pillH = fontSize * 1.15;
        const pillGfx = new Graphics();
        pillGfx.roundRect(
          px - pillW * ax,
          py - pillH * ay,
          pillW,
          pillH,
          3,
        );
        pillGfx.fill({ color: COLORS.edgePillBg, alpha: 0.55 });
        container.addChild(pillGfx);
      }

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

  /* ── Animation trigger detection ──────────────────────────────────── */

  private detectAnimationTriggers(
    state: BattleRendererState,
    _prevState: BattleRendererState | null,
  ): void {
    const durations = animDurationsForQuality(state.vfxQuality);
    const nowMs = performance.now();

    // ── Placement animation ──
    const placedCell = state.placedCell ?? null;
    if (
      placedCell !== null &&
      placedCell !== this.prevPlacedCell &&
      durations.placeMs > 0
    ) {
      this.cellAnims[placedCell] = {
        kind: "place",
        startMs: nowMs,
        durationMs: durations.placeMs,
        staggerDelayMs: 0,
      };
      this.ensureTicker();
    }
    this.prevPlacedCell = placedCell;

    // ── Flip animation ──
    const flippedCells = state.flippedCells ?? [];
    if (
      flippedCells.length > 0 &&
      !this.arraysEqual(flippedCells, this.prevFlippedCells) &&
      durations.flipMs > 0
    ) {
      for (let idx = 0; idx < flippedCells.length; idx++) {
        const cellIdx = flippedCells[idx];
        this.cellAnims[cellIdx] = {
          kind: "flip",
          startMs: nowMs,
          durationMs: durations.flipMs,
          staggerDelayMs: idx * durations.flipStaggerMs,
        };
      }
      this.ensureTicker();
    }
    this.prevFlippedCells = flippedCells;
  }

  private arraysEqual(a: readonly number[], b: readonly number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /* ── Ticker (animation loop) ──────────────────────────────────────── */

  private ensureTicker(): void {
    if (this.tickerBound || !this.app) return;
    this.app.ticker.add(this.onTick, this);
    this.tickerBound = true;
  }

  private teardownTicker(): void {
    if (!this.tickerBound || !this.app) return;
    this.app.ticker.remove(this.onTick, this);
    this.tickerBound = false;
  }

  private onTick = (): void => {
    const nowMs = performance.now();
    let anyActive = false;

    // ── Cell placement/flip animations ──
    for (let i = 0; i < 9; i++) {
      const record = this.cellAnims[i];
      if (!record) continue;

      const layout = this.layouts.get(i);
      if (!layout) continue;

      const frame = computeCellFrame(record, nowMs, layout.h);

      if (frame) {
        // Animation in progress — apply frame
        this.applyCellFrame(i, frame, layout);
        anyActive = true;
      } else {
        // Animation complete — reset to identity
        this.cellAnims[i] = null;
        this.resetCellTransform(i);
      }
    }

    // ── Breathe glow for selectable empty cells ──
    if (this.state && this.state.selectableCells.size > 0) {
      const breathe = computeBreatheFrame(nowMs);
      for (let i = 0; i < 9; i++) {
        const isSelectable = this.state.selectableCells.has(i);
        const hasCard = !!this.state.board[i];
        if (isSelectable && !hasCard) {
          this.applyBreatheGlow(i, breathe);
          anyActive = true;
        } else {
          this.cellGlowOverlays[i].visible = false;
          // Reset breathe scale if no cell animation is active
          if (!this.cellAnims[i]) {
            const cc = this.cellContentContainers[i];
            if (cc) cc.scale.set(1, 1);
          }
        }
      }
    } else {
      // No selectable cells — hide all glow overlays
      for (let i = 0; i < 9; i++) {
        this.cellGlowOverlays[i].visible = false;
      }
    }

    // All animations done — remove ticker to save CPU
    if (!anyActive) {
      this.teardownTicker();
    }
  };

  private applyCellFrame(
    i: number,
    frame: CellAnimFrame,
    layout: CellLayout,
  ): void {
    const cc = this.cellContentContainers[i];
    if (!cc) return;

    cc.scale.set(frame.scaleX, frame.scaleY);
    cc.alpha = frame.alpha;
    // Offset Y: adjust position relative to layout center
    cc.position.set(layout.x + layout.w / 2, layout.y + layout.h / 2 + frame.offsetY);

    // Brightness
    this.applyBrightness(i, frame.brightness, layout.w, layout.h);
  }

  private resetCellTransform(i: number): void {
    const cc = this.cellContentContainers[i];
    if (!cc) return;

    const layout = this.layouts.get(i);
    if (!layout) return;

    cc.scale.set(1, 1);
    cc.alpha = 1;
    cc.position.set(layout.x + layout.w / 2, layout.y + layout.h / 2);

    // Hide brightness overlay
    const overlay = this.cellBrightnessOverlays[i];
    if (overlay) overlay.visible = false;
  }

  private applyBreatheGlow(
    i: number,
    frame: { scale: number; glowAlpha: number },
  ): void {
    const glow = this.cellGlowOverlays[i];
    const layout = this.layouts.get(i);
    if (!glow || !layout) return;

    const { x, y, w, h } = layout;

    // Draw glow ring (emerald, board-absolute coordinates)
    glow.clear();
    glow.roundRect(x - 2, y - 2, w + 4, h + 4, 8);
    glow.stroke({ color: COLORS.breatheGlow, width: 2, alpha: frame.glowAlpha });
    glow.visible = true;

    // Apply breathe scale to content container (only if no cell animation active)
    const cc = this.cellContentContainers[i];
    if (cc && !this.cellAnims[i]) {
      cc.scale.set(frame.scale, frame.scale);
    }
  }

  private applyBrightness(
    i: number,
    brightness: number,
    w: number,
    h: number,
  ): void {
    const overlay = this.cellBrightnessOverlays[i];
    if (!overlay) return;

    // Near identity brightness — hide overlay
    if (Math.abs(brightness - 1) < 0.02) {
      overlay.visible = false;
      return;
    }

    overlay.clear();
    overlay.roundRect(0, 0, w, h, 6);

    if (brightness > 1) {
      // Brighter: white overlay, alpha scaled by how far above 1
      overlay.fill({ color: COLORS.brightnessWhite, alpha: (brightness - 1) * 0.4 });
    } else {
      // Darker: black overlay, alpha scaled by how far below 1
      overlay.fill({ color: COLORS.brightnessBlack, alpha: (1 - brightness) * 0.6 });
    }

    overlay.visible = true;
  }
}
