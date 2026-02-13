/**
 * PixiBattleRenderer — PixiJS v8 implementation of IBattleRenderer.
 *
 * Renders a 3×3 board grid with:
 * - NFT card art as Sprite textures (async loaded with Arweave fallback)
 * - Owner-colored tint overlays on card art
 * - Edge numbers with premium pill backgrounds and stronger typography
 * - Center R/P/S (janken) badge on each occupied card
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
  CellInspectCallback,
} from "../IBattleRenderer";
import { TextureResolver } from "./textureResolver";
import {
  animDurationsForQuality,
  vfxFeatureFlagsForQuality,
  computeCellFrame,
  animationProgress,
  computeBreatheFrame,
  type CellAnimRecord,
  type CellAnimFrame,
  type VfxFeatureFlags,
} from "./cellAnimations";
import { texturePreloadConcurrencyForQuality } from "./preloadPolicy";
import { errorMessage } from "@/lib/errorMessage";

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
  edgeTextStroke: 0x020617,
  edgeValueHigh: 0xfef08a,
  edgeValueMid: 0xe2e8f0,
  edgeValueLow: 0xbfdbfe,
  coordText: 0x64748b, // slate-500
  edgePillBg: 0x000000,
  edgePillTone: 0x0f172a,
  edgePillStroke: 0x7dd3fc,
  tokenIdBg: 0x000000,
  tokenIdText: 0xffffff,
  brightnessWhite: 0xffffff,
  brightnessBlack: 0x000000,
  breatheGlow: 0x34d399, // emerald-400 (matches --mint-cell-active-glow)
  boardPanel: 0x0b1220,
  boardPanelInner: 0x111c2f,
  boardFrame: 0x3e5b7f,
  boardHighlight: 0x9cc3ff,
  cellShadow: 0x030712,
  cardGlass: 0xffffff,
  cardVignette: 0x020617,
  holoA: 0x67e8f9,
  holoB: 0xa78bfa,
  jankenBadgeBg: 0x020617,
  jankenBadgeStroke: 0xffffff,
} as const;

const LAYOUT = {
  boardSizePercent: 0.85,
  cellGap: 4,
  cellRadius: 6,
  longPressMs: 400,
  smallFontSize: 10,
  edgeFontSizeMin: 12,
  edgeFontSizeScale: 0.18,
  edgePadding: 6,
  edgePillAlpha: 0.55,
  pillWidthScale: 1.3,
  pillHeightScale: 1.15,
  pillRadius: 3,
  edgeStrokeThicknessScale: 0.16,
  edgeLetterSpacing: 0.6,
  jankenBadgeMin: 24,
  jankenBadgeMax: 40,
  jankenBadgeScale: 0.23,
  jankenBadgeRadius: 6,
  jankenBadgeStrokeWidth: 1.2,
  tokenLabelPadX: 3,
  tokenLabelPadY: 2,
  coordOffsetX: 3,
  coordOffsetY: 2,
  ownerTintAlpha: 0.17,
  ownerFallbackAlpha: 0.28,
  selectedFillAlpha: 0.6,
  selectedStrokeWidth: 3,
  selectableStrokeWidth: 1.5,
  selectableStrokeAlpha: 0.6,
  glowMargin: 2,
  glowRadius: 8,
  glowStrokeWidth: 2,
  brightnessThreshold: 0.02,
  brightnessWhiteScale: 0.4,
  brightnessBlackScale: 0.6,
  boardRadius: 14,
  boardFrameInset: 6,
  boardShadowOffsetY: 6,
  boardShadowSpread: 10,
  boardPatternInset: 6,
  boardPatternSpacing: 26,
  boardPatternSpacingHigh: 20,
  boardPatternAlpha: 0.045,
  boardPatternAlphaHigh: 0.07,
  boardScanlineSpacing: 34,
  boardScanlineSpacingHigh: 26,
  boardScanlineAlpha: 0.03,
  boardScanlineAlphaHigh: 0.045,
  cellShadowOffsetY: 2,
  cellShadowSpread: 4,
  cardFrameOuterWidth: 2,
  cardFrameInnerWidth: 1,
  cardFrameCorner: 7,
  foilStripeWidth: 12,
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

const JANKEN_BADGES: Record<0 | 1 | 2, { short: "R" | "P" | "S"; accent: number }> = {
  0: { short: "R", accent: 0xf59e0b }, // rock
  1: { short: "P", accent: 0x10b981 }, // paper
  2: { short: "S", accent: 0x8b5cf6 }, // scissors
};

/** Layout rectangle for a single cell. */
interface CellLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

function edgeValueColor(value: number): number {
  if (value >= 8) return COLORS.edgeValueHigh;
  if (value >= 4) return COLORS.edgeValueMid;
  return COLORS.edgeValueLow;
}

function normalizeJankenHand(value: number): 0 | 1 | 2 {
  if (value === 1 || value === 2) return value;
  return 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Renderer
   ═══════════════════════════════════════════════════════════════════════════ */

export class PixiBattleRenderer implements IBattleRenderer {
  private app: Application | null = null;
  private boardContainer: Container | null = null;
  private boardBackdrop: Graphics | null = null;
  private boardBackdropDetail: Graphics | null = null;

  // ── Per-cell visual objects (9 each) ──
  private cellShadowOverlays: Graphics[] = [];
  private cellGraphics: Graphics[] = [];
  private cellGlowOverlays: Graphics[] = [];         // ★ breathe glow ring
  private cellContentContainers: Container[] = [];   // ★ animated wrapper
  private cellMasks: Graphics[] = [];
  private cellSprites: (Sprite | null)[] = [];
  private cellTintOverlays: Graphics[] = [];
  private cellFrameOverlays: Graphics[] = [];
  private cellGlassOverlays: Graphics[] = [];
  private cellFoilOverlays: Graphics[] = [];
  private cellTextContainers: Container[] = [];
  private cellTokenLabels: Text[] = [];
  private cellBrightnessOverlays: Graphics[] = [];   // ★ brightness effect
  private cellCoordTexts: Text[] = [];

  private layouts = new Map<number, CellLayout>();
  private state: BattleRendererState | null = null;
  private cellSelectCb: CellSelectCallback | null = null;
  private cellInspectCb: CellInspectCallback | null = null;

  // ── Texture management ──
  private textureResolver = new TextureResolver();

  // ── Card inspect (long-press / right-click) ──
  private longPressTimers: (ReturnType<typeof setTimeout> | null)[] = Array.from({ length: 9 }, () => null);

  // ── Animation state ──
  private cellAnims: (CellAnimRecord | null)[] = Array.from({ length: 9 }, () => null);
  private prevPlacedCell: number | null | undefined = undefined;
  private prevFlippedCells: readonly number[] = [];
  private tickerBound = false;
  private visibilityBound = false;

  /* ── Lifecycle ─────────────────────────────────────────────────────── */

  async init(container: HTMLElement): Promise<void> {
    try {
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

      if (import.meta.env.DEV) console.debug("[PixiBattleRenderer] init OK");
    } catch (e: unknown) {
      if (import.meta.env.DEV) console.error("[PixiBattleRenderer] init failed:", errorMessage(e));
      throw e;
    }
  }

  setState(state: BattleRendererState): void {
    const prevState = this.state;
    this.state = state;
    this.preloadVisibleTextures(state);

    // ── Detect new animations ──
    this.detectAnimationTriggers(state, prevState);

    // ── Breathe glow runs only on medium/high tiers ──
    if (
      state.selectableCells.size > 0 &&
      vfxFeatureFlagsForQuality(state.vfxQuality).idleBreathe
    ) {
      this.ensureTicker();
    }

    this.redraw();
  }

  private preloadVisibleTextures(state: BattleRendererState): void {
    const tokenIds: string[] = [];
    for (const cell of state.board) {
      if (!cell) continue;
      tokenIds.push(cell.card.tokenId.toString());
    }
    if (state.preloadTokenIds) tokenIds.push(...state.preloadTokenIds);
    if (tokenIds.length === 0) return;
    this.textureResolver.preloadTextures(
      tokenIds,
      texturePreloadConcurrencyForQuality(state.vfxQuality),
    );
  }

  onCellSelect(cb: CellSelectCallback): void {
    this.cellSelectCb = cb;
  }

  onCellInspect(cb: CellInspectCallback): void {
    this.cellInspectCb = cb;
  }

  resize(width: number, height: number): void {
    if (!this.app) return;
    this.app.renderer.resize(width, height);
    this.layoutGrid();
    this.redraw();
  }

  destroy(): void {
    this.teardownTicker();
    this.teardownVisibilityListener();
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
    this.textureResolver.dispose();
    this.boardContainer = null;
    this.boardBackdrop = null;
    this.boardBackdropDetail = null;
    this.cellShadowOverlays = [];
    this.cellGraphics = [];
    this.cellGlowOverlays = [];
    this.cellContentContainers = [];
    this.cellMasks = [];
    this.cellSprites = [];
    this.cellTintOverlays = [];
    this.cellFrameOverlays = [];
    this.cellGlassOverlays = [];
    this.cellFoilOverlays = [];
    this.cellTextContainers = [];
    this.cellTokenLabels = [];
    this.cellBrightnessOverlays = [];
    this.cellCoordTexts = [];
    this.layouts.clear();
    this.state = null;
    this.cellSelectCb = null;
    this.cellInspectCb = null;
    this.longPressTimers.forEach(t => { if (t) clearTimeout(t); });
    this.longPressTimers = Array.from({ length: 9 }, () => null);
    this.cellAnims = Array.from({ length: 9 }, () => null);
    this.prevPlacedCell = undefined;
    this.prevFlippedCells = [];
  }

  /* ── Grid construction ─────────────────────────────────────────────── */

  private buildGrid(): void {
    if (!this.boardContainer || !this.app) return;

    this.boardBackdrop = new Graphics();
    this.boardContainer.addChild(this.boardBackdrop);
    this.boardBackdropDetail = new Graphics();
    this.boardContainer.addChild(this.boardBackdropDetail);

    for (let i = 0; i < 9; i++) {
      const shadowGfx = new Graphics();
      this.boardContainer.addChild(shadowGfx);
      this.cellShadowOverlays.push(shadowGfx);

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

      // ── Long-press for card inspect (400ms) ──
      let lpTimer: ReturnType<typeof setTimeout> | null = null;

      cellGfx.on("pointerdown", () => {
        if (lpTimer) clearTimeout(lpTimer);
        lpTimer = setTimeout(() => {
          const cell = this.state?.board[cellIndex];
          if (cell?.card && this.cellInspectCb) {
            const rect = this.getCellScreenRect(cellIndex);
            if (rect) this.cellInspectCb(cellIndex, rect);
          }
          lpTimer = null;
        }, LAYOUT.longPressMs);
        this.longPressTimers[cellIndex] = lpTimer;
      });

      cellGfx.on("pointerup", () => {
        if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
      });
      cellGfx.on("pointerupoutside", () => {
        if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
      });

      // ── Right-click for card inspect ──
      cellGfx.on("rightclick", () => {
        const cell = this.state?.board[cellIndex];
        if (cell?.card && this.cellInspectCb) {
          const rect = this.getCellScreenRect(cellIndex);
          if (rect) this.cellInspectCb(cellIndex, rect);
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
      tintOverlay.mask = maskGfx;
      contentContainer.addChild(tintOverlay);
      this.cellTintOverlays.push(tintOverlay);

      const frameOverlay = new Graphics();
      frameOverlay.visible = false;
      frameOverlay.mask = maskGfx;
      contentContainer.addChild(frameOverlay);
      this.cellFrameOverlays.push(frameOverlay);

      const glassOverlay = new Graphics();
      glassOverlay.visible = false;
      glassOverlay.mask = maskGfx;
      contentContainer.addChild(glassOverlay);
      this.cellGlassOverlays.push(glassOverlay);

      const foilOverlay = new Graphics();
      foilOverlay.visible = false;
      foilOverlay.mask = maskGfx;
      contentContainer.addChild(foilOverlay);
      this.cellFoilOverlays.push(foilOverlay);

      // 6. Edge text container (up to 4 Text + 4 pill bg Graphics)
      const textContainer = new Container();
      contentContainer.addChild(textContainer);
      this.cellTextContainers.push(textContainer);

      // 7. Token ID label (top-right, initially hidden)
      const tokenLabel = new Text({
        text: "",
        style: new TextStyle({
          fontSize: LAYOUT.smallFontSize,
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
          fontSize: LAYOUT.smallFontSize,
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
    const boardSize = Math.min(w, h) * LAYOUT.boardSizePercent;
    const cellSize = boardSize / 3;
    const gap = LAYOUT.cellGap;
    const offsetX = (w - boardSize) / 2;
    const offsetY = (h - boardSize) / 2;

    this.drawBoardBackdrop(offsetX, offsetY, boardSize);

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
      mask.roundRect(0, 0, cw, ch, LAYOUT.cellRadius);
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
      tokenLabel.x = cw - LAYOUT.tokenLabelPadX;
      tokenLabel.y = LAYOUT.tokenLabelPadY;

      // Position coordinate text (board-absolute, NOT animated)
      const coordTxt = this.cellCoordTexts[i];
      coordTxt.x = x + LAYOUT.coordOffsetX;
      coordTxt.y = y + LAYOUT.coordOffsetY;
    }
  }

  private drawBoardBackdrop(
    offsetX: number,
    offsetY: number,
    boardSize: number,
  ): void {
    const base = this.boardBackdrop;
    const detail = this.boardBackdropDetail;
    if (!base || !detail) return;

    const quality = this.state?.vfxQuality ?? "medium";
    const features = vfxFeatureFlagsForQuality(quality);
    const frameInset = LAYOUT.boardFrameInset;
    const innerSize = Math.max(0, boardSize - frameInset * 2);

    base.clear();
    detail.clear();

    if (features.boardDepth) {
      const shadowAlpha = quality === "high" ? 0.34 : quality === "medium" ? 0.28 : 0.2;
      base.roundRect(
        offsetX - LAYOUT.boardShadowSpread,
        offsetY - LAYOUT.boardShadowSpread + LAYOUT.boardShadowOffsetY,
        boardSize + LAYOUT.boardShadowSpread * 2,
        boardSize + LAYOUT.boardShadowSpread * 2,
        LAYOUT.boardRadius + 2,
      );
      base.fill({ color: COLORS.brightnessBlack, alpha: shadowAlpha });
    }

    base.roundRect(offsetX, offsetY, boardSize, boardSize, LAYOUT.boardRadius);
    base.fill({ color: features.boardDepth ? COLORS.boardPanel : COLORS.cellEmpty });

    base.roundRect(offsetX + frameInset, offsetY + frameInset, innerSize, innerSize, LAYOUT.boardRadius - 3);
    base.fill({ color: features.boardDepth ? COLORS.boardPanelInner : COLORS.background });

    base.roundRect(offsetX, offsetY, boardSize, boardSize, LAYOUT.boardRadius);
    base.stroke({
      color: features.boardDepth ? COLORS.boardFrame : COLORS.gridLine,
      width: features.boardDepth ? 2 : 1,
      alpha: features.boardDepth ? 0.9 : 0.75,
    });

    if (!features.boardDepth) return;

    detail.roundRect(
      offsetX + frameInset,
      offsetY + frameInset,
      innerSize,
      Math.max(14, boardSize * 0.16),
      LAYOUT.boardRadius - 3,
    );
    detail.fill({ color: COLORS.boardHighlight, alpha: quality === "high" ? 0.12 : 0.08 });

    const unit = boardSize / 3;
    for (let idx = 1; idx <= 2; idx++) {
      const px = offsetX + unit * idx;
      detail.moveTo(px, offsetY + frameInset);
      detail.lineTo(px, offsetY + boardSize - frameInset);
      detail.stroke({ color: COLORS.boardFrame, width: 1, alpha: 0.18 });

      const py = offsetY + unit * idx;
      detail.moveTo(offsetX + frameInset, py);
      detail.lineTo(offsetX + boardSize - frameInset, py);
      detail.stroke({ color: COLORS.boardFrame, width: 1, alpha: 0.18 });
    }

    if (features.boardPattern) {
      const left = offsetX + frameInset + LAYOUT.boardPatternInset;
      const top = offsetY + frameInset + LAYOUT.boardPatternInset;
      const right = offsetX + boardSize - frameInset - LAYOUT.boardPatternInset;
      const bottom = offsetY + boardSize - frameInset - LAYOUT.boardPatternInset;
      const size = Math.max(0, right - left);

      const diagonalSpacing = quality === "high" ? LAYOUT.boardPatternSpacingHigh : LAYOUT.boardPatternSpacing;
      const diagonalAlpha = quality === "high" ? LAYOUT.boardPatternAlphaHigh : LAYOUT.boardPatternAlpha;
      for (let start = left - size; start < right + size; start += diagonalSpacing) {
        const x1 = Math.max(left, start);
        const y1 = bottom - Math.max(0, x1 - start);
        const x2 = Math.min(right, start + size);
        const y2 = top + Math.max(0, start + size - x2);
        detail.moveTo(x1, y1);
        detail.lineTo(x2, y2);
        detail.stroke({ color: COLORS.boardHighlight, width: 1, alpha: diagonalAlpha });
      }

      const scanlineSpacing = quality === "high" ? LAYOUT.boardScanlineSpacingHigh : LAYOUT.boardScanlineSpacing;
      const scanlineAlpha = quality === "high" ? LAYOUT.boardScanlineAlphaHigh : LAYOUT.boardScanlineAlpha;
      for (let y = top; y < bottom; y += scanlineSpacing) {
        detail.moveTo(left, y);
        detail.lineTo(right, y);
        detail.stroke({ color: COLORS.edgeText, width: 1, alpha: scanlineAlpha });
      }
    }
  }

  private drawCellShadow(
    index: number,
    layout: CellLayout,
    hasCard: boolean,
    quality: BattleRendererState["vfxQuality"],
    features: VfxFeatureFlags,
  ): void {
    const shadow = this.cellShadowOverlays[index];
    if (!shadow) return;

    shadow.clear();
    if (!features.cellShadow) {
      shadow.visible = false;
      return;
    }

    const alphaBase = quality === "high" ? 0.22 : quality === "medium" ? 0.17 : 0.12;
    const alpha = hasCard ? alphaBase : alphaBase * 0.6;
    shadow.roundRect(
      layout.x - LAYOUT.cellShadowSpread,
      layout.y + LAYOUT.cellShadowOffsetY,
      layout.w + LAYOUT.cellShadowSpread * 2,
      layout.h + LAYOUT.cellShadowSpread * 2,
      LAYOUT.cellRadius + 2,
    );
    shadow.fill({ color: COLORS.cellShadow, alpha });
    shadow.visible = true;
  }

  private drawCardSurface(
    index: number,
    w: number,
    h: number,
    ownerColor: number,
    hasTexture: boolean,
    quality: BattleRendererState["vfxQuality"],
    features: VfxFeatureFlags,
  ): void {
    const frame = this.cellFrameOverlays[index];
    const glass = this.cellGlassOverlays[index];
    const foil = this.cellFoilOverlays[index];
    if (!frame || !glass || !foil) return;

    frame.clear();
    frame.roundRect(0, 0, w, h, LAYOUT.cardFrameCorner);
    frame.stroke({ color: ownerColor, width: LAYOUT.cardFrameOuterWidth });
    frame.roundRect(1, 1, Math.max(0, w - 2), Math.max(0, h - 2), LAYOUT.cardFrameCorner - 1);
    frame.stroke({
      color: COLORS.edgeText,
      width: LAYOUT.cardFrameInnerWidth,
      alpha: quality === "high" ? 0.32 : quality === "medium" ? 0.2 : 0.12,
    });
    frame.visible = true;

    glass.clear();
    if (features.cardGlass && hasTexture) {
      const topH = Math.max(10, h * 0.28);
      glass.roundRect(0, 0, w, topH, LAYOUT.cardFrameCorner);
      glass.fill({ color: COLORS.cardGlass, alpha: quality === "high" ? 0.085 : 0.06 });
      glass.roundRect(0, h * 0.54, w, h * 0.46, LAYOUT.cardFrameCorner);
      glass.fill({ color: COLORS.cardVignette, alpha: quality === "high" ? 0.22 : 0.16 });
      glass.roundRect(0, h * 0.58, w, h * 0.2, LAYOUT.cardFrameCorner);
      glass.fill({ color: COLORS.cardGlass, alpha: 0.02 });
      glass.visible = true;
    } else {
      glass.visible = false;
    }

    // Foil layer is animated only during place/flip in high tier.
    foil.visible = false;
  }

  private applyEventFoilFlash(
    index: number,
    frame: CellAnimFrame,
    w: number,
    h: number,
    animProgress: number,
  ): void {
    const foil = this.cellFoilOverlays[index];
    if (!foil) return;

    const rawIntensity = Math.max(0, Math.min(1, (frame.brightness - 1) / 0.45));
    const sweepProgress = Math.max(0, Math.min(1, animProgress));
    const pulse = Math.sin(Math.PI * sweepProgress);
    const intensity = rawIntensity * pulse;
    if (intensity < 0.01) {
      foil.visible = false;
      return;
    }

    const stripeW = Math.max(LAYOUT.foilStripeWidth, w * 0.14);
    const sweepStart = -stripeW * 1.8;
    const sweepEnd = w + stripeW * 1.2;
    const sweep = sweepStart + (sweepEnd - sweepStart) * sweepProgress;
    const counterSweep = w + stripeW - (w + stripeW * 2) * sweepProgress;

    foil.clear();
    foil.roundRect(0, 0, w, h, LAYOUT.cardFrameCorner);
    foil.stroke({ color: COLORS.cardGlass, width: 1, alpha: 0.2 * intensity });
    foil.rect(sweep, 0, stripeW, h);
    foil.fill({ color: COLORS.holoA, alpha: 0.16 * intensity });
    foil.rect(counterSweep, 0, stripeW * 0.8, h);
    foil.fill({ color: COLORS.holoB, alpha: 0.1 * intensity });
    foil.visible = true;
  }

  /* ── Redraw ────────────────────────────────────────────────────────── */

  private redraw(): void {
    if (!this.state) return;
    const quality = this.state.vfxQuality;
    const features = vfxFeatureFlagsForQuality(quality);
    const tl = this.layouts.get(0);
    const br = this.layouts.get(8);
    if (tl && br) {
      const boardSize = br.x + br.w - tl.x + LAYOUT.cellGap;
      this.drawBoardBackdrop(tl.x - LAYOUT.cellGap / 2, tl.y - LAYOUT.cellGap / 2, boardSize);
    }

    for (let i = 0; i < 9; i++) {
      const gfx = this.cellGraphics[i];
      const layout = this.layouts.get(i);
      if (!layout) continue;

      const { x, y, w, h } = layout;
      const cell: BoardCell | null = this.state.board[i] ?? null;
      const isSelectable = this.state.selectableCells.has(i);
      const isSelected = this.state.selectedCell === i;

      gfx.clear();
      this.drawCellShadow(i, layout, !!cell, quality, features);

      // ── Cell fill & stroke (board-absolute coordinates, NOT animated) ──
      if (cell) {
        const ownerColor =
          cell.owner === 0 ? COLORS.ownerA : COLORS.ownerB;
        const tokenIdStr = cell.card.tokenId.toString();
        const texture = this.textureResolver.getTexture(tokenIdStr);
        const hasTexture = texture !== null;

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
          const tintAlpha = quality === "high"
            ? LAYOUT.ownerTintAlpha + 0.05
            : quality === "medium"
              ? LAYOUT.ownerTintAlpha
              : 0.16;
          tint.clear();
          tint.roundRect(0, 0, w, h, LAYOUT.cellRadius);
          tint.fill({ color: ownerColor, alpha: tintAlpha });
          tint.visible = true;

          // Cell border only (board-absolute, transparent fill for hit area)
          gfx.roundRect(x, y, w, h, LAYOUT.cellRadius);
          gfx.fill({ color: 0x000000, alpha: 0 });
          gfx.roundRect(x, y, w, h, LAYOUT.cellRadius);
          gfx.stroke({ color: ownerColor, width: quality === "off" ? 1.4 : 2 });
        } else {
          // Texture not loaded yet — colored rectangle fallback
          gfx.roundRect(x, y, w, h, LAYOUT.cellRadius);
          gfx.fill({ color: ownerColor, alpha: LAYOUT.ownerFallbackAlpha });
          gfx.roundRect(x, y, w, h, LAYOUT.cellRadius);
          gfx.stroke({ color: ownerColor, width: quality === "off" ? 1.4 : 2 });

          // Hide sprite and tint
          const sprite = this.cellSprites[i];
          if (sprite) sprite.visible = false;
          this.cellTintOverlays[i].visible = false;

          // Kick off async load → re-render on completion
          this.textureResolver.loadTexture(tokenIdStr).then((tex) => {
            if (tex && this.state) this.redraw();
          });
        }

        this.drawCardSurface(i, w, h, ownerColor, hasTexture, quality, features);

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
        this.cellFrameOverlays[i].visible = false;
        this.cellGlassOverlays[i].visible = false;
        this.cellFoilOverlays[i].visible = false;
        this.cellTokenLabels[i].visible = false;

        if (isSelected) {
          // Selected empty cell — emphasized
          gfx.roundRect(x, y, w, h, LAYOUT.cellRadius);
          gfx.fill({ color: COLORS.cellSelectedFill, alpha: LAYOUT.selectedFillAlpha });
          gfx.roundRect(x, y, w, h, LAYOUT.cellRadius);
          gfx.stroke({ color: COLORS.cellSelectedStroke, width: LAYOUT.selectedStrokeWidth });
        } else if (isSelectable) {
          // Selectable empty cell — subtle highlight
          gfx.roundRect(x, y, w, h, LAYOUT.cellRadius);
          gfx.fill({ color: COLORS.cellEmpty });
          gfx.roundRect(x, y, w, h, LAYOUT.cellRadius);
          gfx.stroke({ color: COLORS.cellSelectableStroke, width: LAYOUT.selectableStrokeWidth, alpha: LAYOUT.selectableStrokeAlpha });
        } else {
          // Non-selectable empty cell
          gfx.roundRect(x, y, w, h, LAYOUT.cellRadius);
          gfx.fill({ color: COLORS.cellEmpty });
          gfx.roundRect(x, y, w, h, LAYOUT.cellRadius);
          gfx.stroke({ color: COLORS.gridLine, width: 1 });
        }
      }

      // Cursor
      gfx.cursor = isSelectable && !cell ? "pointer" : "default";

      // ── Edge numbers for occupied cells (container-relative) ──
      this.updateEdgeTexts(i, cell, w, h, features);
    }
  }

  private updateEdgeTexts(
    index: number,
    cell: BoardCell | null,
    w: number,
    h: number,
    features: VfxFeatureFlags,
  ): void {
    const container = this.cellTextContainers[index];
    container.removeChildren();

    if (!cell) return;

    const { edges } = cell.card;
    const fontSize = Math.max(LAYOUT.edgeFontSizeMin, w * LAYOUT.edgeFontSizeScale);
    const strokeThickness = Math.max(1.5, fontSize * LAYOUT.edgeStrokeThicknessScale);

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
      { val: edges.up, px: w / 2, py: LAYOUT.edgePadding, ax: 0.5, ay: 0 },
      { val: edges.right, px: w - LAYOUT.edgePadding, py: h / 2, ax: 1, ay: 0.5 },
      { val: edges.down, px: w / 2, py: h - LAYOUT.edgePadding, ax: 0.5, ay: 1 },
      { val: edges.left, px: LAYOUT.edgePadding, py: h / 2, ax: 0, ay: 0.5 },
    ];

    for (const { val, px, py, ax, ay } of edgeData) {
      const tone = edgeValueColor(val);

      // Dark pill background when texture is visible
      if (hasTexture && features.edgePill) {
        const pillW = fontSize * LAYOUT.pillWidthScale;
        const pillH = fontSize * LAYOUT.pillHeightScale;
        const toneAlpha = val >= 8 ? 0.34 : val >= 4 ? 0.26 : 0.2;
        const pillGfx = new Graphics();
        pillGfx.roundRect(
          px - pillW * ax,
          py - pillH * ay,
          pillW,
          pillH,
          LAYOUT.pillRadius,
        );
        pillGfx.fill({ color: COLORS.edgePillBg, alpha: LAYOUT.edgePillAlpha });
        pillGfx.roundRect(
          px - pillW * ax + 0.8,
          py - pillH * ay + 0.8,
          Math.max(0, pillW - 1.6),
          Math.max(0, pillH - 1.6),
          Math.max(2, LAYOUT.pillRadius - 1),
        );
        pillGfx.fill({ color: COLORS.edgePillTone, alpha: toneAlpha });
        pillGfx.roundRect(
          px - pillW * ax,
          py - pillH * ay,
          pillW,
          pillH,
          LAYOUT.pillRadius,
        );
        pillGfx.stroke({ color: COLORS.edgePillStroke, width: 1, alpha: 0.45 });
        container.addChild(pillGfx);
      }

      const t = new Text({
        text: String(val),
        style: new TextStyle({
          fontSize,
          fill: tone,
          fontFamily: "Trebuchet MS, Segoe UI, Arial Black, sans-serif",
          fontWeight: "900",
          stroke: { color: COLORS.edgeTextStroke, width: strokeThickness },
          letterSpacing: LAYOUT.edgeLetterSpacing,
        }),
      });
      t.anchor.set(ax, ay);
      t.x = px;
      t.y = py;
      container.addChild(t);
    }

    const hand = normalizeJankenHand(Number(cell.card.jankenHand));
    const badge = JANKEN_BADGES[hand];
    const badgeSize = Math.max(
      LAYOUT.jankenBadgeMin,
      Math.min(LAYOUT.jankenBadgeMax, Math.min(w, h) * LAYOUT.jankenBadgeScale),
    );
    const badgeX = w / 2 - badgeSize / 2;
    const badgeY = h / 2 - badgeSize / 2;
    const badgeGfx = new Graphics();
    badgeGfx.roundRect(badgeX, badgeY, badgeSize, badgeSize, LAYOUT.jankenBadgeRadius);
    badgeGfx.fill({ color: COLORS.jankenBadgeBg, alpha: hasTexture ? 0.66 : 0.86 });
    badgeGfx.roundRect(
      badgeX + 1,
      badgeY + 1,
      Math.max(0, badgeSize - 2),
      Math.max(0, badgeSize - 2),
      Math.max(2, LAYOUT.jankenBadgeRadius - 1),
    );
    badgeGfx.fill({ color: badge.accent, alpha: hasTexture ? 0.35 : 0.45 });
    badgeGfx.roundRect(badgeX, badgeY, badgeSize, badgeSize, LAYOUT.jankenBadgeRadius);
    badgeGfx.stroke({ color: COLORS.jankenBadgeStroke, width: LAYOUT.jankenBadgeStrokeWidth, alpha: 0.9 });
    container.addChild(badgeGfx);

    const badgeText = new Text({
      text: badge.short,
      style: new TextStyle({
        fontSize: Math.max(12, badgeSize * 0.52),
        fill: COLORS.edgeText,
        fontFamily: "Trebuchet MS, Segoe UI, Arial Black, sans-serif",
        fontWeight: "900",
        stroke: {
          color: COLORS.edgeTextStroke,
          width: Math.max(1.3, badgeSize * 0.08),
        },
      }),
    });
    badgeText.anchor.set(0.5, 0.5);
    badgeText.x = w / 2;
    badgeText.y = h / 2;
    container.addChild(badgeText);
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
    if (document.hidden) return; // Don't start ticker while tab is hidden
    this.app.ticker.add(this.onTick, this);
    this.tickerBound = true;
    this.ensureVisibilityListener();
  }

  private teardownTicker(): void {
    if (!this.tickerBound || !this.app) return;
    this.app.ticker.remove(this.onTick, this);
    this.tickerBound = false;
  }

  private ensureVisibilityListener(): void {
    if (this.visibilityBound) return;
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    this.visibilityBound = true;
  }

  private teardownVisibilityListener(): void {
    if (!this.visibilityBound) return;
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.visibilityBound = false;
  }

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.teardownTicker();
    } else if (
      this.state &&
      this.state.selectableCells.size > 0 &&
      vfxFeatureFlagsForQuality(this.state.vfxQuality).idleBreathe
    ) {
      this.ensureTicker();
    }
  };

  private onTick = (): void => {
    const nowMs = performance.now();
    let anyActive = false;
    const state = this.state;
    const quality = state?.vfxQuality ?? "medium";
    const features = vfxFeatureFlagsForQuality(quality);

    // ── Cell placement/flip animations ──
    for (let i = 0; i < 9; i++) {
      const record = this.cellAnims[i];
      if (!record) continue;

      const layout = this.layouts.get(i);
      if (!layout) continue;

      const frame = computeCellFrame(record, nowMs, layout.h);

      if (frame) {
        // Animation in progress — apply frame
        const progress = animationProgress(record, nowMs);
        this.applyCellFrame(i, frame, layout, quality, features, progress);
        anyActive = true;
      } else {
        // Animation complete — reset to identity
        this.cellAnims[i] = null;
        this.resetCellTransform(i);
      }
    }

    // ── Breathe glow for selectable empty cells (medium/high only) ──
    if (state && state.selectableCells.size > 0 && features.idleBreathe) {
      const breathe = computeBreatheFrame(nowMs, quality);
      for (let i = 0; i < 9; i++) {
        const isSelectable = state.selectableCells.has(i);
        const hasCard = !!state.board[i];
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
      // No selectable cells / low tiers — hide all glow overlays
      for (let i = 0; i < 9; i++) {
        this.cellGlowOverlays[i].visible = false;
        if (!this.cellAnims[i]) {
          const cc = this.cellContentContainers[i];
          if (cc) cc.scale.set(1, 1);
        }
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
    quality: BattleRendererState["vfxQuality"],
    features: VfxFeatureFlags,
    animProgress: number,
  ): void {
    const cc = this.cellContentContainers[i];
    if (!cc) return;

    const transformStrength = quality === "low" ? 0.55 : quality === "off" ? 0 : 1;
    const scaleX = 1 + (frame.scaleX - 1) * transformStrength;
    const scaleY = 1 + (frame.scaleY - 1) * transformStrength;
    const offsetY = frame.offsetY * (quality === "low" ? 0.5 : 1);

    cc.scale.set(scaleX, scaleY);
    cc.alpha = frame.alpha;
    // Offset Y: adjust position relative to layout center
    cc.position.set(layout.x + layout.w / 2, layout.y + layout.h / 2 + offsetY);

    if (features.brightnessPulse) {
      this.applyBrightness(i, frame.brightness, layout.w, layout.h);
    } else {
      this.cellBrightnessOverlays[i].visible = false;
    }

    if (features.eventFoilFlash) {
      this.applyEventFoilFlash(i, frame, layout.w, layout.h, animProgress);
    } else {
      this.cellFoilOverlays[i].visible = false;
    }
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
    this.cellFoilOverlays[i].visible = false;
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
    glow.roundRect(
      x - LAYOUT.glowMargin, y - LAYOUT.glowMargin,
      w + LAYOUT.glowMargin * 2, h + LAYOUT.glowMargin * 2,
      LAYOUT.glowRadius,
    );
    glow.stroke({ color: COLORS.breatheGlow, width: LAYOUT.glowStrokeWidth, alpha: frame.glowAlpha });
    glow.visible = true;

    // Apply breathe scale to content container (only if no cell animation active)
    const cc = this.cellContentContainers[i];
    if (cc && !this.cellAnims[i]) {
      cc.scale.set(frame.scale, frame.scale);
    }
  }

  /* ── Cell screen-space rect (for card inspect positioning) ──────── */

  private getCellScreenRect(cellIndex: number): DOMRect | null {
    const layout = this.layouts.get(cellIndex);
    if (!layout || !this.app) return null;
    const canvas = this.app.canvas as HTMLCanvasElement;
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / this.app.screen.width;
    const scaleY = canvasRect.height / this.app.screen.height;
    return new DOMRect(
      canvasRect.left + layout.x * scaleX,
      canvasRect.top + layout.y * scaleY,
      layout.w * scaleX,
      layout.h * scaleY,
    );
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
    if (Math.abs(brightness - 1) < LAYOUT.brightnessThreshold) {
      overlay.visible = false;
      return;
    }

    overlay.clear();
    overlay.roundRect(0, 0, w, h, LAYOUT.cellRadius);

    if (brightness > 1) {
      // Brighter: white overlay, alpha scaled by how far above 1
      overlay.fill({ color: COLORS.brightnessWhite, alpha: (brightness - 1) * LAYOUT.brightnessWhiteScale });
    } else {
      // Darker: black overlay, alpha scaled by how far below 1
      overlay.fill({ color: COLORS.brightnessBlack, alpha: (1 - brightness) * LAYOUT.brightnessBlackScale });
    }

    overlay.visible = true;
  }
}
