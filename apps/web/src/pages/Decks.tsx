import React from "react";
import { Link } from "react-router-dom";
import type { CardData } from "@nyano/triad-engine";
import { fetchNyanoCards } from "@/lib/nyano_rpc";
import { deleteDeck, exportDecksJson, importDecksJson, listDecks, upsertDeck, type DeckV1 } from "@/lib/deck_store";
import { CardMini } from "@/components/CardMini";

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

export function DecksPage() {
  const [decks, setDecks] = React.useState<DeckV1[]>(() => listDecks());

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState<string>("");
  const [tokenText, setTokenText] = React.useState<string>("");

  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewCards, setPreviewCards] = React.useState<Map<bigint, CardData> | null>(null);

  const refresh = () => setDecks(listDecks());

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setTokenText("");
    setPreviewCards(null);
    setError(null);
    setStatus(null);
  };

  const loadDeckToForm = (d: DeckV1) => {
    setEditingId(d.id);
    setName(d.name);
    setTokenText(d.tokenIds.join(", "));
    setPreviewCards(null);
    setError(null);
    setStatus(null);
  };

  const doPreview = async () => {
    setError(null);
    setStatus(null);
    setPreviewCards(null);

    let tokenIds: bigint[];
    try {
      tokenIds = parseTokenIds(tokenText);
    } catch (e: any) {
      setError(e?.message ?? String(e));
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
      setStatus("loaded");
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setPreviewLoading(false);
    }
  };

  const doSave = () => {
    setError(null);
    setStatus(null);

    let tokenIds: bigint[];
    try {
      tokenIds = parseTokenIds(tokenText);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      return;
    }
    const vErr = validateTokenIds(tokenIds);
    if (vErr) {
      setError(vErr);
      return;
    }

    const d = upsertDeck({ id: editingId ?? undefined, name, tokenIds });
    setStatus(`saved: ${d.name}`);
    refresh();
    setEditingId(d.id);
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setStatus("copied");
    window.setTimeout(() => setStatus(null), 900);
  };

  const [importText, setImportText] = React.useState<string>("");

  const doExportAll = async () => {
    await copy(exportDecksJson());
  };

  const doImport = () => {
    setError(null);
    setStatus(null);
    try {
      const { imported, skipped } = importDecksJson(importText);
      refresh();
      setStatus(`imported=${imported}, skipped=${skipped}`);
    } catch (e: any) {
      setError(e?.message ?? String(e));
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
          {status ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{status}</div>
          ) : null}

          {previewCards ? (
            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Preview</div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from(previewCards.values()).map((c) => (
                  <CardMini key={c.tokenId.toString()} card={c} owner={0} subtle />
                ))}
              </div>
            </div>
          ) : null}
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
            <div className="text-sm text-slate-600">まだデッキがありません。上で作成してください。</div>
          ) : (
            decks.map((d) => (
              <div key={d.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-slate-500">updated: {d.updatedAt}</div>
                </div>

                <div className="mt-1 text-xs text-slate-600 font-mono">{d.tokenIds.join(", ")}</div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button className="btn" onClick={() => loadDeckToForm(d)}>
                    Edit
                  </button>

                  <Link className="btn no-underline" to={`/match?a=${d.id}`}>
                    Set as A
                  </Link>
                  <Link className="btn no-underline" to={`/match?b=${d.id}`}>
                    Set as B
                  </Link>

                  <button className="btn" onClick={() => copy(JSON.stringify(d, null, 2))}>
                    Copy deck JSON
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      if (!window.confirm(`Delete deck: ${d.name}?`)) return;
                      deleteDeck(d.id);
                      refresh();
                      setStatus("deleted");
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
