import React from "react";
import type { CardSearchResult, GameIndexV1, JankenHand } from "@/lib/nyano/gameIndex";
import { searchCards } from "@/lib/nyano/gameIndex";
import { buildCardDataFromIndex } from "@/lib/demo_decks";
import { CardMini } from "@/components/CardMini";
import { CardPreviewPanel } from "@/components/CardPreviewPanel";
import { MintPressable } from "@/components/mint/MintPressable";
import { useCardPreview } from "@/hooks/useCardPreview";

const HAND_OPTIONS: { value: JankenHand | -1; label: string }[] = [
  { value: -1, label: "すべて" },
  { value: 0, label: "グー" },
  { value: 1, label: "チョキ" },
  { value: 2, label: "パー" },
];

const PAGE_SIZE = 50;

type CardBrowserMintProps = {
  index: GameIndexV1;
  onSelect?: (tokenId: string) => void;
  className?: string;
  presetHand?: JankenHand | -1;
  presetMinEdgeSum?: number;
};

function handToText(hand: JankenHand): string {
  if (hand === 0) return "グー";
  if (hand === 1) return "チョキ";
  return "パー";
}

export function CardBrowserMint({
  index,
  onSelect,
  className = "",
  presetHand = -1,
  presetMinEdgeSum = 0,
}: CardBrowserMintProps) {
  const [handFilter, setHandFilter] = React.useState<JankenHand | -1>(presetHand);
  const [minEdgeSum, setMinEdgeSum] = React.useState(presetMinEdgeSum);
  const [query, setQuery] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const inspect = useCardPreview();

  React.useEffect(() => {
    setHandFilter(presetHand);
    setVisibleCount(PAGE_SIZE);
  }, [presetHand]);

  React.useEffect(() => {
    setMinEdgeSum(presetMinEdgeSum);
    setVisibleCount(PAGE_SIZE);
  }, [presetMinEdgeSum]);

  const rawResults = React.useMemo<CardSearchResult[]>(
    () =>
      searchCards(index, {
        hand: handFilter === -1 ? undefined : handFilter,
        minEdgeSum: minEdgeSum > 0 ? minEdgeSum : undefined,
      }),
    [index, handFilter, minEdgeSum],
  );

  const queryNormalized = query.trim().toLowerCase();

  const results = React.useMemo<CardSearchResult[]>(() => {
    if (queryNormalized.length === 0) return rawResults;
    return rawResults.filter((result) => {
      const tokenLabel = result.tokenId.toLowerCase();
      const handLabel = handToText(result.params.hand).toLowerCase();
      return tokenLabel.includes(queryNormalized) || handLabel.includes(queryNormalized);
    });
  }, [rawResults, queryNormalized]);

  const visibleResults = results.slice(0, visibleCount);
  const cardDataMap = React.useMemo(() => {
    const ids = visibleResults.map((entry) => entry.tokenId);
    return buildCardDataFromIndex(index, ids);
  }, [index, visibleResults]);

  const hasMore = visibleCount < results.length;

  return (
    <div className={["mint-card-browser", className].join(" ").trim()}>
      <div className="mint-card-browser__filters">
        <label className="mint-card-browser__field">
          <span className="mint-card-browser__label">手札タイプ</span>
          <select
            className="mint-card-browser__select"
            value={handFilter}
            onChange={(event) => {
              setHandFilter(Number(event.target.value) as JankenHand | -1);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {HAND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mint-card-browser__field">
          <span className="mint-card-browser__label">最低エッジ合計: {minEdgeSum}</span>
          <input
            className="mint-card-browser__range"
            type="range"
            min={0}
            max={40}
            step={1}
            value={minEdgeSum}
            onChange={(event) => {
              setMinEdgeSum(Number(event.target.value));
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </label>

        <label className="mint-card-browser__field">
          <span className="mint-card-browser__label">検索</span>
          <input
            className="mint-card-browser__input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="tokenId または 手札タイプ"
          />
        </label>
      </div>

      <div className="mint-card-browser__chips">
        <span className="mint-card-browser__chip">手札: {handFilter === -1 ? "すべて" : handToText(handFilter)}</span>
        <span className="mint-card-browser__chip">最低エッジ: {minEdgeSum}</span>
        {queryNormalized ? <span className="mint-card-browser__chip">検索: {queryNormalized}</span> : null}
        <span className="mint-card-browser__count">{results.length} 枚</span>
      </div>

      {results.length === 0 ? (
        <div className="mint-card-browser__empty">条件に一致するカードがありません。</div>
      ) : (
        <>
          <div className="mint-card-browser__grid">
            {visibleResults.map((result) => {
              const card = cardDataMap.get(BigInt(result.tokenId));
              if (!card) return null;
              const handlers = inspect.longPressHandlers(card, 0);
              return (
                <button
                  key={result.tokenId}
                  className="mint-card-browser__card"
                  onClick={() => onSelect?.(result.tokenId)}
                  title={`#${result.tokenId} · edge=${result.edgeSum} · ${handToText(result.params.hand)}`}
                  onTouchStart={handlers.onTouchStart}
                  onTouchEnd={handlers.onTouchEnd}
                  onTouchMove={handlers.onTouchMove}
                  onContextMenu={handlers.onContextMenu}
                >
                  <CardMini card={card} owner={0} subtle />
                  <span className="mint-card-browser__token">#{result.tokenId}</span>
                </button>
              );
            })}
          </div>

          {hasMore ? (
            <div className="mint-card-browser__load-more">
              <MintPressable tone="soft" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                さらに表示（残り {results.length - visibleCount}）
              </MintPressable>
            </div>
          ) : null}
        </>
      )}

      {inspect.state.visible && inspect.state.card && inspect.state.anchorRect ? (
        <CardPreviewPanel
          card={inspect.state.card}
          owner={inspect.state.owner!}
          anchorRect={inspect.state.anchorRect}
          position={inspect.state.position}
          onClose={inspect.hide}
        />
      ) : null}
    </div>
  );
}
