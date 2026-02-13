/**
 * BattleStageEngine — React wrapper for the PixiJS battle renderer.
 *
 * Mounts the renderer once, pushes state updates via IBattleRenderer.setState(),
 * and cleans up on unmount. PixiJS is loaded via dynamic import() so it never
 * enters the main bundle or breaks Vitest (environment: "node").
 *
 * Also renders React UI layers around the canvas:
 * - Flip Causality Arrows (NIN-UX-030) — SVG overlay on board
 * - Card Inspect Panel (CardPreviewPanel) — long-press / right-click
 * - Action Prompt (NIN-UX-011) — bilingual instruction text
 * - Inline Error (NIN-UX-012) — error pill with auto-dismiss
 */

import React from "react";
import type { BoardState, PlayerIndex } from "@nyano/triad-engine";
import type {
  IBattleRenderer,
  BattleRendererState,
  BattleRendererTextureStatus,
} from "../renderers/IBattleRenderer";
import { resolveVfxQuality } from "@/lib/visual/visualSettings";
import { errorMessage } from "@/lib/errorMessage";
import { FlipArrowOverlay, type FlipTraceArrow } from "@/components/FlipArrowOverlay";
import { CardPreviewPanel } from "@/components/CardPreviewPanel";
import { useCardPreview } from "@/hooks/useCardPreview";
import "@/mint-theme/mint-theme.css";

/* ═══════════════════════════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════════════════════════ */

export interface BattleStageEngineProps {
  board: BoardState;
  selectedCell?: number | null;
  selectableCells?: Set<number>;
  onCellSelect?: (cell: number) => void;
  /** Enable drag-drop hit layer for hand card placement. */
  dragDropActive?: boolean;
  /** Drop callback for drag-drop placement. */
  onCellDrop?: (cell: number) => void;
  /** Hover callback while dragging over a board cell. */
  onCellDragHover?: (cell: number | null) => void;
  currentPlayer?: PlayerIndex | null;
  /** Cell index where a card was just placed (animation trigger). */
  placedCell?: number | null;
  /** Cell indices flipped this turn (animation trigger). */
  flippedCells?: readonly number[];
  /** Optional extra tokenIds to preload (e.g. current hand cards). */
  preloadTokenIds?: readonly bigint[];
  /** Show the action prompt bar below the canvas. */
  showActionPrompt?: boolean;
  /** Current game phase for prompt text. */
  gamePhase?: "select_card" | "select_cell" | "ai_turn" | "game_over" | "idle";
  /** Inline error message (replaces toast for invalid actions). */
  inlineError?: string | null;
  /** Callback to dismiss inline error. */
  onDismissError?: () => void;
  /** Flip traces for causality arrow overlay (NIN-UX-030). */
  flipTraces?: readonly FlipTraceArrow[] | null;
  /** Whether board flip animation is currently running. */
  isFlipAnimating?: boolean;
  /** Optional board width cap override (px). */
  boardMaxWidthPx?: number;
  /** Optional board min height override (px). */
  boardMinHeightPx?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Defaults
   ═══════════════════════════════════════════════════════════════════════════ */

const EMPTY_SET = new Set<number>();
const CELL_INDEXES: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const ENGINE_BOARD_MAX_WIDTH_PX = 760;
const ENGINE_BOARD_MIN_HEIGHT_PX = 320;
const EMPTY_TEXTURE_STATUS: BattleRendererTextureStatus = {
  visibleTokenCount: 0,
  loadedTextureCount: 0,
  pendingTextureCount: 0,
  failedTextureCount: 0,
};

/* ═══════════════════════════════════════════════════════════════════════════
   Local UI Components — Action Prompt (NIN-UX-011) & Inline Error (NIN-UX-012)

   Mirrors the logic from BoardViewMint. Uses existing mint-theme.css classes.
   A future sprint may extract these into shared components.
   ═══════════════════════════════════════════════════════════════════════════ */

const PROMPTS: Record<string, { ja: string; en: string }> = {
  select_card: { ja: "カードを選んでください", en: "Choose a card" },
  select_cell: { ja: "置きたいマスをタップ", en: "Tap a cell to place" },
  ai_turn: { ja: "にゃーのの番…", en: "Nyano is thinking..." },
  game_over: { ja: "対戦終了！", en: "Game over!" },
  idle: { ja: "準備中…", en: "Getting ready..." },
};

function EngineActionPrompt({ gamePhase }: { gamePhase?: string }) {
  const prompt = PROMPTS[gamePhase ?? "idle"] ?? PROMPTS.idle;
  const isAi = gamePhase === "ai_turn";

  return (
    <div className="mint-prompt">
      <div
        className={[
          "mint-prompt__text",
          isAi && "mint-prompt__text--ai",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {prompt.ja}
        <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.6 }}>
          {prompt.en}
        </span>
      </div>
    </div>
  );
}

function EngineInlineError({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  React.useEffect(() => {
    if (!onDismiss) return;
    const t = setTimeout(() => {
      onDismiss();
    }, 3000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div className="mint-error-pill" role="alert">
      <span className="mint-error-pill__icon">✕</span>
      {message}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function BattleStageEngine({
  board,
  selectedCell = null,
  selectableCells,
  onCellSelect,
  dragDropActive = false,
  onCellDrop,
  onCellDragHover,
  currentPlayer = null,
  placedCell,
  flippedCells,
  preloadTokenIds,
  showActionPrompt,
  gamePhase,
  inlineError,
  onDismissError,
  flipTraces,
  isFlipAnimating,
  boardMaxWidthPx,
  boardMinHeightPx,
}: BattleStageEngineProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const gridOverlayRef = React.useRef<HTMLDivElement>(null);
  const rendererRef = React.useRef<IBattleRenderer | null>(null);
  const callbackRef = React.useRef(onCellSelect);
  const [initError, setInitError] = React.useState<string | null>(null);
  const [textureStatus, setTextureStatus] = React.useState<BattleRendererTextureStatus>(EMPTY_TEXTURE_STATUS);
  const resolvedBoardMaxWidthPx = boardMaxWidthPx ?? ENGINE_BOARD_MAX_WIDTH_PX;
  const resolvedBoardMinHeightPx = boardMinHeightPx ?? ENGINE_BOARD_MIN_HEIGHT_PX;
  const dropSelectableCells = selectableCells ?? EMPTY_SET;

  // ── Card inspect hook ──
  const inspect = useCardPreview();
  const inspectRef = React.useRef(inspect);
  React.useEffect(() => { inspectRef.current = inspect; }, [inspect]);

  // Keep board ref current for inspect callback
  const boardRef = React.useRef(board);
  React.useEffect(() => { boardRef.current = board; }, [board]);

  const rendererState = React.useMemo<BattleRendererState>(() => ({
    board,
    selectedCell: selectedCell ?? null,
    selectableCells: selectableCells ?? EMPTY_SET,
    currentPlayer: (currentPlayer ?? 0) as PlayerIndex,
    vfxQuality: resolveVfxQuality(),
    preloadTokenIds: preloadTokenIds?.map((tid) => tid.toString()),
    placedCell,
    flippedCells,
  }), [board, selectedCell, selectableCells, currentPlayer, preloadTokenIds, placedCell, flippedCells]);
  const rendererStateRef = React.useRef<BattleRendererState>(rendererState);
  rendererStateRef.current = rendererState;

  // Keep callback ref current without triggering effect re-runs
  React.useEffect(() => {
    callbackRef.current = onCellSelect;
  }, [onCellSelect]);

  const handleRetryTextureLoads = React.useCallback(() => {
    rendererRef.current?.retryTextureLoads?.();
  }, []);

  // ── Mount: dynamically import + init renderer ──────────────────────
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    let renderer: IBattleRenderer | null = null;

    if (import.meta.env.DEV) console.debug("[BattleStageEngine] mount");

    (async () => {
      const { PixiBattleRenderer } = await import(
        "../renderers/pixi/PixiBattleRenderer"
      );

      if (destroyed) return; // component unmounted during async import

      renderer = new PixiBattleRenderer();

      try {
        await renderer.init(container);
      } catch (e: unknown) {
        if (import.meta.env.DEV) console.error("[BattleStageEngine] init failed:", errorMessage(e));
        setInitError(errorMessage(e));
        return;
      }

      if (destroyed) {
        renderer.destroy();
        return;
      }

      renderer.onCellSelect((cell) => {
        callbackRef.current?.(cell);
      });

      // Card inspect: long-press / right-click → show CardPreviewPanel
      // NOTE: showImmediate only calls anchorEl.getBoundingClientRect() internally,
      // so a proxy object returning the screen rect is safe (verified useCardPreview.ts:81).
      renderer.onCellInspect((cellIndex, screenRect) => {
        const cell = boardRef.current[cellIndex];
        if (cell?.card) {
          const fakeAnchor = { getBoundingClientRect: () => screenRect } as HTMLElement;
          inspectRef.current.showImmediate(cell.card, cell.owner, fakeAnchor);
        }
      });

      renderer.onTextureStatus?.((status) => {
        if (destroyed) return;
        setTextureStatus(status);
      });

      // Prevent browser context menu on canvas (right-click → inspect instead)
      const canvasEl = container.querySelector("canvas");
      if (canvasEl) {
        canvasEl.addEventListener("contextmenu", (e) => e.preventDefault());
      }

      // Push the latest state once after init so first interaction works
      // even if no React prop changed during async renderer boot.
      renderer.setState(rendererStateRef.current);
      rendererRef.current = renderer;
    })();

    return () => {
      destroyed = true;
      if (renderer) {
        renderer.destroy();
      }
      rendererRef.current = null;
      if (import.meta.env.DEV) console.debug("[BattleStageEngine] unmount");
    };
    // Mount-only effect: renderer lifecycle is independent of React state.
  }, []);

  // ── Update: push state changes to renderer ─────────────────────────
  React.useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.setState(rendererState);
  }, [rendererState]);

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

  // ── Init error fallback UI ──
  if (initError) {
    return (
      <div className="grid gap-3">
        <div
          className="relative mx-auto flex aspect-square w-full flex-col items-center justify-center rounded-lg border border-red-800/40 bg-slate-900/80"
          style={{ minHeight: resolvedBoardMinHeightPx, maxWidth: resolvedBoardMaxWidthPx }}
          role="alert"
        >
          <p className="text-sm font-medium text-red-400">レンダラー初期化エラー</p>
          <p className="mt-1 text-xs text-slate-400">
            WebGL が利用できない可能性があります
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {/* PixiJS Canvas + overlays */}
      <div
        ref={containerRef}
        className="relative mx-auto aspect-square w-full"
        style={{ minHeight: resolvedBoardMinHeightPx, maxWidth: resolvedBoardMaxWidthPx }}
        aria-label="Game board (engine renderer)"
        role="img"
      >
        {/* Flip arrow overlay — transparent div matching PixiJS grid area (85% centered) */}
        <div
          ref={gridOverlayRef}
          className="absolute inset-0 m-auto pointer-events-none"
          style={{ width: "85%", height: "85%" }}
        >
          {flipTraces && flipTraces.length > 0 && (
            <FlipArrowOverlay
              traces={flipTraces}
              gridRef={gridOverlayRef}
              isAnimating={isFlipAnimating}
            />
          )}
        </div>

        {/* Drop target layer — always rendered for card-flight target rects.
            Interactions are enabled only while dragDropActive. */}
        <div
          className={[
            "engine-drop-grid",
            dragDropActive ? "engine-drop-grid--active" : "",
          ].join(" ")}
          style={{ width: "85%", height: "85%" }}
          onDragLeave={() => {
            if (!dragDropActive) return;
            onCellDragHover?.(null);
          }}
        >
          {CELL_INDEXES.map((cell) => {
            const droppable = dropSelectableCells.has(cell);
            return (
              <div
                key={`drop-${cell}`}
                data-board-cell={cell}
                className={[
                  "engine-drop-grid__cell",
                  droppable ? "engine-drop-grid__cell--droppable" : "",
                  dragDropActive && droppable ? "engine-drop-grid__cell--active" : "",
                ].filter(Boolean).join(" ")}
                onDragEnter={(e) => {
                  if (!dragDropActive || !droppable) return;
                  e.preventDefault();
                  onCellDragHover?.(cell);
                }}
                onDragOver={(e) => {
                  if (!dragDropActive || !droppable) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  onCellDragHover?.(cell);
                }}
                onDrop={(e) => {
                  if (!dragDropActive || !droppable) return;
                  e.preventDefault();
                  onCellDrop?.(cell);
                  onCellDragHover?.(null);
                }}
                onClick={() => {
                  if (!dragDropActive || !droppable) return;
                  callbackRef.current?.(cell);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Action Prompt (NIN-UX-011) */}
      {showActionPrompt && <EngineActionPrompt gamePhase={gamePhase} />}

      {(textureStatus.pendingTextureCount > 0 || textureStatus.failedTextureCount > 0) && (
        <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          <div className="leading-tight">
            {textureStatus.failedTextureCount > 0 ? (
              <span>
                カード画像の一部を読み込めませんでした（{textureStatus.failedTextureCount}/{textureStatus.visibleTokenCount}）。
                プレースホルダ表示で続行しています。
              </span>
            ) : (
              <span>カード画像を読み込み中です… ({textureStatus.loadedTextureCount}/{textureStatus.visibleTokenCount})</span>
            )}
          </div>
          {textureStatus.failedTextureCount > 0 && (
            <button
              type="button"
              className="btn btn-sm shrink-0"
              onClick={handleRetryTextureLoads}
              aria-label="Retry card art loading"
            >
              Retry card art
            </button>
          )}
        </div>
      )}

      {/* Inline Error (NIN-UX-012) */}
      {inlineError && (
        <div className="flex justify-center">
          <EngineInlineError message={inlineError} onDismiss={onDismissError} />
        </div>
      )}

      {/* Card Inspect Panel — portal to body */}
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
