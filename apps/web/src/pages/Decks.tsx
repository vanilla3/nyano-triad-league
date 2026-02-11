import React from "react";
import { Link } from "react-router-dom";
import type { CardData } from "@nyano/triad-engine";
import { fetchNyanoCards } from "@/lib/nyano_rpc";
import { deleteDeck, exportDecksJson, importDecksJson, listDecks, upsertDeck, type DeckV1 } from "@/lib/deck_store";
import { CardMini } from "@/components/CardMini";
import { CardBrowser } from "@/components/CardBrowser";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { errorMessage } from "@/lib/errorMessage";
import { fetchGameIndex, type GameIndexV1 } from "@/lib/nyano/gameIndex";
import { generateRecommendedDeck, strategyLabel, type DeckStrategy } from "@/lib/demo_decks";

function parseTokenIds(text: string): bigint[] {
  const parts = text
    .split(/[^0-9]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const out = parts.map((s) => BigInt(s));
  return out;
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

function toCardsMap(bundles: Map<bigint, any>): Map<bigint, CardData> {
  const m = new Map<bigint, CardData>();
  for (const [tid, b] of bundles.entries()) {
    m.set(tid, b.card as CardData);
  }
  return m;
}

const STRATEGIES: DeckStrategy[] = ["balanced", "aggressive", "defensive", "janken_mix"];

export function DecksPage() {
  const [decks, setDecks] = React.useState<DeckV1[]>(() => listDecks());

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState<string>("");
  const [tokenText, setTokenText] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const toast = useToast();

  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewCards, setPreviewCards] = React.useState<Map<bigint, CardData> | null>(null);

  // Game index for CardBrowser and recommended decks
  const [gameIndex, setGameIndex] = React.useState<GameIndexV1 | null>(null);
  const [indexLoading, setIndexLoading] = React.useState(false);

  React.useEffect(() => {
    setIndexLoading(true);
    fetchGameIndex().then((idx) => {
      setGameIndex(idx);
      setIndexLoading(false);
    }).catch(() => setIndexLoading(false));
  }, []);

  const refresh = () => setDecks(listDecks());

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setTokenText("");
    setPreviewCards(null);
    setError(null);
  };

  const loadDeckToForm = (d: DeckV1) => {
    setEditingId(d.id);
    setName(d.name);
    setTokenText(d.tokenIds.join(", "));
    setPreviewCards(null);
    setError(null);
  };

  const doPreview = async () => {
    setError(null);
    setPreviewCards(null);

    let tokenIds: bigint[];
    try {
      tokenIds = parseTokenIds(tokenText);
    } catch (e: unknown) {
      setError(errorMessage(e));
      return;
    }
    const vErr = validateTokenIds(tokenIds);
    if (vErr) {
      setError(vErr);
      return;
    }

    setPreviewLoading(true);
    try {
      const bundles = await fetchNyanoCards(tokenIds);
      setPreviewCards(toCardsMap(bundles));
      toast.info("Preview loaded");
    } catch (e: unknown) {
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
    } catch (e: unknown) {
      setError(errorMessage(e));
      return;
    }
    const vErr = validateTokenIds(tokenIds);
    if (vErr) {
      setError(vErr);
      return;
    }

    const d = upsertDeck({ id: editingId ?? undefined, name, tokenIds });
    toast.success("Saved deck", d.name);
    refresh();
    setEditingId(d.id);
  };

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied", label);
  };

  const [importText, setImportText] = React.useState<string>("");

  const doExportAll = async () => {
    await copy("Decks JSON", exportDecksJson());
  };

  const doImport = () => {
    setError(null);
    try {
      const { imported, skipped } = importDecksJson(importText);
      refresh();
      toast.success("Imported decks", `imported=${imported}, skipped=${skipped}`);
    } catch (e: unknown) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">Deck Studio 🧩</div>
          <div className="text-xs text-slate-500">Nyano tokenId（5枚）を保存して、Match / Events へすばやく持ち込むための管理画面です（ローカル保存）。</div>
        </div>

        <div className="card-bd grid gap-4">
          <div className="callout callout-info">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-sky">TIP</span>
              <div className="text-sm font-medium">「5枚・重複なし」が基本ルールです</div>
            </div>
            <ul className="mt-2 list-disc pl-6 text-sm">
              <li>Preview は RPC 経由で Nyano を読み込み、カード性能に変換します</li>
              <li>デッキを保存したら <span className="font-medium">Set as A/B</span> で Match へ即投入できます</li>
            </ul>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2 md:col-span-1">
              <div className="text-xs font-medium text-slate-600">Deck name</div>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Deck" />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <div className="text-xs font-medium text-slate-600">tokenIds（5つ）</div>
              <input
                className="input"
                value={tokenText}
                onChange={(e) => setTokenText(e.target.value)}
                placeholder="例: 123, 456, 789, 1011, 1213"
              />
              <div className="text-xs text-slate-500">区切りはカンマ/スペース/改行など何でもOKです。</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" onClick={doSave}>
              Save deck
            </button>
            <button className="btn" onClick={doPreview} disabled={previewLoading}>
              {previewLoading ? "Loading…" : "Preview cards"}
            </button>
            <button className="btn" onClick={resetForm}>
              Reset
            </button>
          </div>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</div>
          ) : null}

          {previewCards ? (
            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Preview</div>
              <div className="deck-preview-grid grid grid-cols-5 gap-3">
                {Array.from(previewCards.values()).map((c) => (
                  <CardMini key={c.tokenId.toString()} card={c} owner={0} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* RM02-101: Quick Deck (Recommended Presets) */}
      {gameIndex && (
        <section className="card">
          <div className="card-hd">
            <div className="text-base font-semibold">Quick Deck</div>
            <div className="text-xs text-slate-500">戦略別のおすすめデッキをワンタップで生成・保存できます</div>
          </div>
          <div className="card-bd">
            <div className="flex flex-wrap gap-2">
              {STRATEGIES.map((s) => (
                <button
                  key={s}
                  className="btn btn-sm"
                  onClick={() => {
                    const deck = generateRecommendedDeck(gameIndex, s);
                    upsertDeck({
                      name: deck.name,
                      tokenIds: deck.tokenIds.map((t) => BigInt(t)),
                      origin: deck.origin,
                      memo: deck.memo,
                    });
                    refresh();
                    toast.success("Deck created", `${strategyLabel(s)} Deck`);
                  }}
                >
                  {strategyLabel(s)}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RM02-100: Card Browser */}
      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">Card Browser</div>
          <div className="text-xs text-slate-500">カードを検索・フィルタリングして、クリックでtokenIdをデッキフォームに追加できます</div>
        </div>
        <div className="card-bd">
          {indexLoading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading game index...</div>
          ) : gameIndex ? (
            <CardBrowser
              index={gameIndex}
              onSelect={(tokenId) => {
                setTokenText((prev) => {
                  const existing = prev.trim();
                  if (!existing) return tokenId;
                  return `${existing}, ${tokenId}`;
                });
                toast.info("Added", `Token #${tokenId} added to form`);
              }}
            />
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              Game index not available. Place <span className="font-mono">index.v1.json</span> in <span className="font-mono">/game/</span> directory.
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-hd flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-base font-semibold">Saved decks</div>
            <div className="text-xs text-slate-500">ブラウザの localStorage に保存されています</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn" onClick={doExportAll}>
              Copy export JSON
            </button>
          </div>
        </div>

        <div className="card-bd grid gap-3">
          {decks.length === 0 ? (
            <EmptyState
              expression="calm"
              title="デッキがまだありません"
              description="上のフォームでtokenIdを5つ入力してデッキを作成してください。"
              action={{ label: "Quick Play (デッキ不要)", to: "/match?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint" }}
            />
          ) : (
            decks.map((d) => (
              <div key={d.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{d.name}</span>
                    {d.origin && (
                      <span className={[
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        d.origin === "guest" ? "bg-nyano-100 text-nyano-700" :
                        d.origin === "recommended" ? "bg-sky-100 text-sky-700" :
                        d.origin === "imported" ? "bg-emerald-100 text-emerald-700" :
                        "bg-slate-100 text-slate-600",
                      ].join(" ")}>
                        {d.origin}
                      </span>
                    )}
                    {d.difficulty && (
                      <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                        {d.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">updated: {d.updatedAt}</div>
                </div>

                {d.memo && <div className="mt-0.5 text-xs text-slate-400">{d.memo}</div>}
                <div className="mt-1 text-xs text-slate-600 font-mono">{d.tokenIds.join(", ")}</div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button className="btn" onClick={() => loadDeckToForm(d)}>
                    Edit
                  </button>

                  <Link className="btn no-underline" to={`/match?a=${d.id}&ui=mint`}>
                    Set as A
                  </Link>
                  <Link className="btn no-underline" to={`/match?b=${d.id}&ui=mint`}>
                    Set as B
                  </Link>

                  <button className="btn" onClick={() => copy("Deck JSON", JSON.stringify(d, null, 2))}>
                    Copy deck JSON
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      if (!window.confirm(`Delete deck: ${d.name}?`)) return;
                      deleteDeck(d.id);
                      refresh();
                      toast.success("Deleted deck", d.name);
                      if (editingId === d.id) resetForm();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">Import decks</div>
          <div className="text-xs text-slate-500">Export した JSON（配列）を貼り付けて取り込みます</div>
        </div>
        <div className="card-bd grid gap-3">
          <textarea
            className="input min-h-[140px] font-mono text-xs"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='[{"id":"...","name":"...","tokenIds":["1","2","3","4","5"],...}]'
          />
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" onClick={doImport}>
              Import
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
