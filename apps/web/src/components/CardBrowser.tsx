import React from "react";
import type { GameIndexV1, JankenHand, CardSearchResult } from "@/lib/nyano/gameIndex";
import { searchCards } from "@/lib/nyano/gameIndex";
import { buildCardDataFromIndex } from "@/lib/demo_decks";
import { CardMini } from "@/components/CardMini";
import { CardPreviewPanel } from "@/components/CardPreviewPanel";
import { useCardPreview } from "@/hooks/useCardPreview";

const HAND_OPTIONS: { value: JankenHand | -1; label: string }[] = [
  { value: -1, label: "All" },
  { value: 0, label: "Rock" },
  { value: 1, label: "Scissors" },
  { value: 2, label: "Paper" },
];

const PAGE_SIZE = 50;

type Props = {
  index: GameIndexV1;
  onSelect?: (tokenId: string) => void;
  className?: string;
};

export function CardBrowser({ index, onSelect, className = "" }: Props) {
  const [handFilter, setHandFilter] = React.useState<JankenHand | -1>(-1);
  const [minEdgeSum, setMinEdgeSum] = React.useState(0);
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const inspect = useCardPreview();

  const results = React.useMemo<CardSearchResult[]>(() => {
    return searchCards(index, {
      hand: handFilter === -1 ? undefined : handFilter,
      minEdgeSum: minEdgeSum > 0 ? minEdgeSum : undefined,
    });
  }, [index, handFilter, minEdgeSum]);

  // Build CardData for visible cards only (avoids building all 10k)
  const visibleResults = results.slice(0, visibleCount);
  const cardDataMap = React.useMemo(() => {
    const ids = visibleResults.map((r) => r.tokenId);
    return buildCardDataFromIndex(index, ids);
  }, [index, visibleResults]);

  const hasMore = visibleCount < results.length;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <label className="text-[11px] font-medium text-slate-600">Hand</label>
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
            value={handFilter}
            onChange={(e) => {
              setHandFilter(Number(e.target.value) as JankenHand | -1);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {HAND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-1">
          <label className="text-[11px] font-medium text-slate-600">
            Min Edge Sum: {minEdgeSum}
          </label>
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={minEdgeSum}
            onChange={(e) => {
              setMinEdgeSum(Number(e.target.value));
              setVisibleCount(PAGE_SIZE);
            }}
            className="w-32"
          />
        </div>

        <div className="text-xs text-slate-500">
          {results.length} cards found
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-4 text-center text-sm text-slate-400">No cards match filters.</div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
            {visibleResults.map((r) => {
              const card = cardDataMap.get(BigInt(r.tokenId));
              if (!card) return null;
              const lp = inspect.longPressHandlers(card, 0);
              return (
                <button
                  key={r.tokenId}
                  className="group relative cursor-pointer rounded-xl transition-shadow hover:ring-2 hover:ring-emerald-400/60 hover:shadow-lg"
                  onClick={() => onSelect?.(r.tokenId)}
                  title={`#${r.tokenId} · edges ${r.edgeSum} · hand ${r.params.hand}`}
                  onTouchStart={lp.onTouchStart}
                  onTouchEnd={lp.onTouchEnd}
                  onTouchMove={lp.onTouchMove}
                  onContextMenu={lp.onContextMenu}
                >
                  <CardMini card={card} owner={0} subtle />
                  <div className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-gradient-to-t from-black/60 to-transparent px-1 py-0.5 text-center text-[9px] font-mono text-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                    #{r.tokenId}
                  </div>
                </button>
              );
            })}
          </div>

          {hasMore && (
            <div className="mt-3 flex justify-center">
              <button
                className="btn btn-sm"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Load More ({results.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {/* Card Inspect Panel (long-press / right-click) */}
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
