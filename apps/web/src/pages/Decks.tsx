import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CardData } from "@nyano/triad-engine";
import { fetchNyanoCards } from "@/lib/nyano_rpc";
import { deleteDeck, exportDecksJson, importDecksJson, listDecks, upsertDeck, type DeckV1 } from "@/lib/deck_store";
import { CardMini } from "@/components/CardMini";
import { CardBrowserMint } from "@/components/CardBrowserMint";
import { useToast } from "@/components/Toast";
import { errorMessage } from "@/lib/errorMessage";
import { writeClipboardText } from "@/lib/clipboard";
import { fetchGameIndex, searchCards, type GameIndexV1, type JankenHand } from "@/lib/nyano/gameIndex";
import { buildCardDataFromIndex, generateRecommendedDeck, strategyLabel, type DeckStrategy } from "@/lib/demo_decks";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintTabNav } from "@/components/mint/MintTabNav";
import { MintTitleText } from "@/components/mint/MintTypography";
import { MintIcon } from "@/components/mint/icons/MintIcon";
import { appendThemeToPath, resolveAppTheme } from "@/lib/theme";

function parseTokenIds(text: string): bigint[] {
  const parts = text
    .split(/[^0-9]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.map((s) => BigInt(s));
}

function validateTokenIds(tokenIds: bigint[]): string | null {
  if (tokenIds.length !== 5) return "tokenId は 5 つ必要です（例: 123,456,789,...)";
  const uniq = new Set(tokenIds.map((t) => t.toString()));
  if (uniq.size !== 5) return "tokenId が重複しています（5つすべて異なる必要があります）";
  for (const t of tokenIds) {
    if (t <= 0n) return "tokenId は 1 以上である必要があります";
  }
  return null;
}

function toCardsMap(bundles: Map<bigint, { card: CardData }>): Map<bigint, CardData> {
  const map = new Map<bigint, CardData>();
  for (const [tokenId, bundle] of bundles.entries()) {
    map.set(tokenId, bundle.card);
  }
  return map;
}

const STRATEGIES: DeckStrategy[] = ["balanced", "aggressive", "defensive", "janken_mix"];

const FILTER_PRESETS = [
  {
    id: "all",
    label: "すべて",
    hand: -1 as const,
    minEdgeSum: 0,
    detail: "手札タイプを問わず表示",
    usage: "全体傾向を見たいとき",
  },
  {
    id: "attacker",
    label: "グー",
    hand: 0 as const,
    minEdgeSum: 0,
    detail: "手札タイプ: グー",
    usage: "同値時のじゃんけん有利を寄せたいとき",
  },
  {
    id: "defender",
    label: "パー",
    hand: 2 as const,
    minEdgeSum: 0,
    detail: "手札タイプ: パー",
    usage: "グー対策を増やしたいとき",
  },
  {
    id: "power",
    label: "高エッジ",
    hand: -1 as const,
    minEdgeSum: 27,
    detail: "辺合計 27 以上",
    usage: "序盤の取り合いで押し込みたいとき",
  },
  {
    id: "other",
    label: "チョキ",
    hand: 1 as const,
    minEdgeSum: 0,
    detail: "手札タイプ: チョキ",
    usage: "パー対策を増やしたいとき",
  },
] as const;

type FilterPresetId = (typeof FILTER_PRESETS)[number]["id"];

function formatDateShort(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return `${dt.getMonth() + 1}/${dt.getDate()} ${dt.getHours()}:${dt.getMinutes().toString().padStart(2, "0")}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function DecksPage() {
  const [searchParams] = useSearchParams();
  const theme = resolveAppTheme(searchParams);
  const themed = React.useCallback((path: string) => appendThemeToPath(path, theme), [theme]);

  const [decks, setDecks] = React.useState<DeckV1[]>(() => listDecks());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [tokenText, setTokenText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewCards, setPreviewCards] = React.useState<Map<bigint, CardData> | null>(null);
  const [importText, setImportText] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState<FilterPresetId>("all");

  const [gameIndex, setGameIndex] = React.useState<GameIndexV1 | null>(null);
  const [indexLoading, setIndexLoading] = React.useState(false);

  const toast = useToast();

  React.useEffect(() => {
    setIndexLoading(true);
    fetchGameIndex()
      .then((idx) => {
        setGameIndex(idx);
        setIndexLoading(false);
      })
      .catch(() => setIndexLoading(false));
  }, []);

  const refresh = () => setDecks(listDecks());

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setTokenText("");
    setPreviewCards(null);
    setError(null);
  };

  const loadDeckToForm = (deck: DeckV1) => {
    setEditingId(deck.id);
    setName(deck.name);
    setTokenText(deck.tokenIds.join(", "));
    setPreviewCards(null);
    setError(null);
  };

  const doPreview = async () => {
    setError(null);
    setPreviewCards(null);

    let tokenIds: bigint[];
    try {
      tokenIds = parseTokenIds(tokenText);
    } catch (e) {
      setError(errorMessage(e));
      return;
    }

    const validationError = validateTokenIds(tokenIds);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPreviewLoading(true);
    try {
      const bundles = await fetchNyanoCards(tokenIds);
      setPreviewCards(toCardsMap(bundles as Map<bigint, { card: CardData }>));
      toast.info("プレビューを読み込みました");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPreviewLoading(false);
    }
  };

  const doSave = () => {
    setError(null);
    let tokenIds: bigint[];
    try {
      tokenIds = parseTokenIds(tokenText);
    } catch (e) {
      setError(errorMessage(e));
      return;
    }

    const validationError = validateTokenIds(tokenIds);
    if (validationError) {
      setError(validationError);
      return;
    }

    const deck = upsertDeck({ id: editingId ?? undefined, name, tokenIds });
    toast.success("デッキを保存しました", deck.name);
    refresh();
    setEditingId(deck.id);
  };

  const copy = async (label: string, text: string) => {
    await writeClipboardText(text);
    toast.success("コピーしました", label);
  };

  const doExportAll = async () => {
    await copy("デッキJSON", exportDecksJson());
  };

  const doImport = () => {
    setError(null);
    try {
      const { imported, skipped } = importDecksJson(importText);
      refresh();
      toast.success("デッキを取り込みました", `imported=${imported}, skipped=${skipped}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const deckCardTotal = React.useMemo(() => decks.reduce((sum, deck) => sum + deck.tokenIds.length, 0), [decks]);
  const uniqueTokenCount = React.useMemo(() => {
    const ids = new Set<string>();
    for (const deck of decks) {
      for (const tokenId of deck.tokenIds) ids.add(tokenId);
    }
    return ids.size;
  }, [decks]);

  const filterPreset = FILTER_PRESETS.find((x) => x.id === selectedFilter) ?? FILTER_PRESETS[0];
  const filterPresetCounts = React.useMemo(() => {
    const counts = new Map<FilterPresetId, number>();
    if (!gameIndex) return counts;
    for (const preset of FILTER_PRESETS) {
      const matched = searchCards(gameIndex, {
        hand: preset.hand === -1 ? undefined : preset.hand,
        minEdgeSum: preset.minEdgeSum > 0 ? preset.minEdgeSum : undefined,
      }).length;
      counts.set(preset.id, matched);
    }
    return counts;
  }, [gameIndex]);
  const totalIndexCards = React.useMemo(() => (gameIndex ? Object.keys(gameIndex.tokens).length : 0), [gameIndex]);
  const selectedPresetCount = filterPresetCounts.get(filterPreset.id);
  const selectedPresetRatio = React.useMemo(() => {
    if (!gameIndex || !selectedPresetCount || totalIndexCards <= 0) return 0;
    return selectedPresetCount / totalIndexCards;
  }, [gameIndex, selectedPresetCount, totalIndexCards]);
  const selectedPresetDensity = React.useMemo(() => {
    if (!gameIndex || totalIndexCards <= 0) return null;
    if (selectedPresetRatio <= 0.08) return "絞り込み: 強め";
    if (selectedPresetRatio >= 0.45) return "絞り込み: 広め";
    return "絞り込み: 標準";
  }, [gameIndex, selectedPresetRatio, totalIndexCards]);

  const selectedTokenIds = React.useMemo(() => {
    try {
      return parseTokenIds(tokenText).map((value) => value.toString());
    } catch {
      return [];
    }
  }, [tokenText]);

  const selectedCardMap = React.useMemo(() => {
    if (!gameIndex || selectedTokenIds.length === 0) return null;
    return buildCardDataFromIndex(gameIndex, selectedTokenIds);
  }, [gameIndex, selectedTokenIds]);

  const tabs = React.useMemo(
    () => [
      { to: themed("/decks"), label: "デッキ", icon: "decks" as const, exact: true },
      { to: themed("/arena"), label: "アリーナ", icon: "arena" as const },
      { to: themed("/events"), label: "イベント", icon: "events" as const },
      { to: themed("/replay"), label: "リプレイ", icon: "replay" as const },
      { to: themed("/stream"), label: "配信", icon: "stream" as const },
      { to: themed("/"), label: "設定", icon: "settings" as const },
    ],
    [themed],
  );

  return (
    <div className="mint-decks-screen">
      <section className="mint-decks-header">
        <MintTitleText as="h2" className="mint-decks-header__title">
          Nyano Triad League - デッキビルダー
        </MintTitleText>
        <MintTabNav items={tabs} className="mint-decks-header__tabs" />
      </section>

      <section className="mint-decks-layout">
        <aside className="mint-decks-left">
          <GlassPanel variant="panel" className="mint-decks-panel">
            <MintTitleText as="h3" className="mint-decks-panel__title">デッキ統計</MintTitleText>
            <div className="mint-decks-stats">
              <div><span>デッキ数</span><strong>{decks.length}</strong></div>
              <div><span>カード総数</span><strong>{deckCardTotal}</strong></div>
              <div><span>ユニークカード数</span><strong>{uniqueTokenCount}</strong></div>
            </div>
          </GlassPanel>

          <GlassPanel variant="panel" className="mint-decks-panel">
            <MintTitleText as="h3" className="mint-decks-panel__title">フィルター</MintTitleText>
            <div className="mint-decks-filters">
              {FILTER_PRESETS.map((filter) => (
                <MintPressable
                  key={filter.id}
                  className={[
                    "mint-decks-filter",
                    selectedFilter === filter.id ? "mint-decks-filter--active" : "",
                  ].join(" ")}
                  tone={selectedFilter === filter.id ? "primary" : "soft"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.id)}
                >
                  {filter.label}
                  {gameIndex ? ` (${filterPresetCounts.get(filter.id) ?? 0})` : ""}
                </MintPressable>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-500">条件: {filterPreset.detail}</div>
            <div className="mt-1 text-xs text-slate-500">用途: {filterPreset.usage}</div>
            {gameIndex ? (
              <div className="mt-1 text-xs text-slate-500">
                候補: {selectedPresetCount ?? 0} / {totalIndexCards}（{formatPercent(selectedPresetRatio)}）
              </div>
            ) : null}
            {selectedPresetDensity ? (
              <div className="mt-1 text-xs text-slate-500">{selectedPresetDensity}</div>
            ) : null}
          </GlassPanel>

          {gameIndex ? (
            <GlassPanel variant="panel" className="mint-decks-panel">
              <MintTitleText as="h3" className="mint-decks-panel__title">おすすめデッキ</MintTitleText>
              <div className="mint-decks-quickdeck">
                {STRATEGIES.map((strategy) => (
                  <MintPressable
                    key={strategy}
                    size="sm"
                    tone="soft"
                    onClick={() => {
                      const deck = generateRecommendedDeck(gameIndex, strategy);
                      upsertDeck({
                        name: deck.name,
                        tokenIds: deck.tokenIds.map((tokenId) => BigInt(tokenId)),
                        origin: deck.origin,
                        memo: deck.memo,
                      });
                      refresh();
                      toast.success("デッキを作成しました", `${strategyLabel(strategy)} デッキ`);
                    }}
                  >
                    {strategyLabel(strategy)}
                  </MintPressable>
                ))}
              </div>
            </GlassPanel>
          ) : null}

          <GlassPanel variant="panel" className="mint-decks-panel">
            <MintTitleText as="h3" className="mint-decks-panel__title">取り込み / 書き出し</MintTitleText>
            <div className="mint-decks-import-export">
              <MintPressable size="sm" tone="soft" onClick={doExportAll}>
                JSONを書き出し
              </MintPressable>
              <textarea
                className="mint-decks-textarea"
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder='[{"id":"...","name":"...","tokenIds":["1","2","3","4","5"]}]'
              />
              <MintPressable size="sm" tone="primary" onClick={doImport}>
                取り込み
              </MintPressable>
            </div>
          </GlassPanel>
        </aside>

        <main className="mint-decks-main">
          <GlassPanel variant="panel" className="mint-decks-panel mint-decks-form-panel">
            <div className="mint-decks-form-grid">
              <label className="mint-decks-label">
                デッキ名
                <input
                  className="mint-decks-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="マイデッキ"
                />
              </label>

              <label className="mint-decks-label">
                tokenIds (5つ)
                <input
                  className="mint-decks-input"
                  value={tokenText}
                  onChange={(event) => setTokenText(event.target.value)}
                  placeholder="例: 123, 456, 789, 1011, 1213"
                />
              </label>

              <div className="mint-decks-form-actions">
                <MintPressable tone="primary" onClick={doSave}>
                  <MintIcon name="save" size={16} />
                  <span>デッキを保存</span>
                </MintPressable>
                <MintPressable tone="soft" onClick={doPreview} disabled={previewLoading}>
                  {previewLoading ? "読み込み中..." : "カードを確認"}
                </MintPressable>
                <MintPressable tone="ghost" onClick={resetForm}>
                  リセット
                </MintPressable>
              </div>
            </div>

            {error ? <div className="mint-decks-error">{error}</div> : null}

            {previewCards ? (
              <div className="mint-decks-preview-grid">
                {Array.from(previewCards.values()).map((card) => (
                  <CardMini key={card.tokenId.toString()} card={card} owner={0} />
                ))}
              </div>
            ) : null}
          </GlassPanel>

          <GlassPanel variant="panel" className="mint-decks-panel mint-decks-browser-panel">
            <div className="mint-decks-browser-header">
              <MintTitleText as="h3" className="mint-decks-panel__title">カードブラウザ</MintTitleText>
              <span className="mint-decks-browser-filter">
                フィルター: {filterPreset.label}
                （{filterPreset.detail}）
                {gameIndex ? `・${selectedPresetCount ?? 0}件・${formatPercent(selectedPresetRatio)}` : ""}
              </span>
            </div>
            {indexLoading ? (
              <div className="mint-decks-loading">カードインデックスを読み込み中...</div>
            ) : gameIndex ? (
              <CardBrowserMint
                key={`browser-${selectedFilter}`}
                index={gameIndex}
                presetHand={filterPreset.hand as JankenHand | -1}
                presetMinEdgeSum={filterPreset.minEdgeSum}
                onSelect={(tokenId) => {
                  setTokenText((previous) => {
                    const trimmed = previous.trim();
                    return trimmed.length > 0 ? `${trimmed}, ${tokenId}` : tokenId;
                  });
                  toast.info("追加しました", `Token #${tokenId} をフォームへ追加`);
                }}
              />
            ) : (
              <div className="mint-decks-loading">
                カードインデックスが利用できません。<code>/game/</code> に <code>index.v1.json</code> を配置してください。
              </div>
            )}
          </GlassPanel>
        </main>

        <aside className="mint-decks-right">
          <GlassPanel variant="panel" className="mint-decks-panel mint-decks-summary">
            <MintTitleText as="h3" className="mint-decks-panel__title">デッキ概要</MintTitleText>
            <div className="mint-decks-summary__cards">
              {selectedCardMap && selectedTokenIds.length > 0 ? (
                selectedTokenIds.map((tokenId) => {
                  const card = selectedCardMap.get(BigInt(tokenId));
                  return (
                    <div key={tokenId} className="mint-decks-summary__slot">
                      {card ? <CardMini card={card} owner={0} /> : <span>#{tokenId}</span>}
                    </div>
                  );
                })
              ) : (
                <div className="mint-decks-summary__empty">フォームに tokenId を入力するとここに表示されます。</div>
              )}
            </div>
            <MintPressable tone="primary" onClick={doSave} fullWidth>
              デッキを保存
            </MintPressable>
          </GlassPanel>

          <GlassPanel variant="panel" className="mint-decks-panel mint-decks-saved">
            <MintTitleText as="h3" className="mint-decks-panel__title">保存済みデッキ</MintTitleText>
            {decks.length === 0 ? (
              <div className="mint-decks-saved__empty">デッキがまだありません。</div>
            ) : (
              <div className="mint-decks-saved__list">
                {decks.map((deck) => (
                  <GlassPanel key={deck.id} variant="card" className="mint-decks-saved__item">
                    <div className="mint-decks-saved__name">{deck.name}</div>
                    <div className="mint-decks-saved__meta">{deck.tokenIds.join(", ")}</div>
                    <div className="mint-decks-saved__meta">更新: {formatDateShort(deck.updatedAt)}</div>
                    <div className="mint-decks-saved__actions">
                      <MintPressable size="sm" tone="soft" onClick={() => loadDeckToForm(deck)}>編集</MintPressable>
                      <MintPressable size="sm" tone="soft" to={themed(`/match?a=${deck.id}&ui=mint`)}>Aにセット</MintPressable>
                      <MintPressable size="sm" tone="soft" to={themed(`/match?b=${deck.id}&ui=mint`)}>Bにセット</MintPressable>
                      <MintPressable size="sm" tone="ghost" onClick={() => copy("デッキJSON", JSON.stringify(deck, null, 2))}>
                        JSONをコピー
                      </MintPressable>
                      <MintPressable
                        size="sm"
                        tone="ghost"
                        onClick={() => {
                          if (!window.confirm(`デッキを削除しますか: ${deck.name}`)) return;
                          deleteDeck(deck.id);
                          refresh();
                          toast.success("デッキを削除しました", deck.name);
                          if (editingId === deck.id) resetForm();
                        }}
                      >
                        削除
                      </MintPressable>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            )}
            <Link className="mint-decks-saved__quickplay" to={themed("/match?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint")}>
              クイック対戦（デッキ不要）
            </Link>
          </GlassPanel>
        </aside>
      </section>
    </div>
  );
}
