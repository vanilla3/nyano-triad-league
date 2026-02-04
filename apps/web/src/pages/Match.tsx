import React from "react";
import { Link, useSearchParams } from "react-router-dom";

import type { CardData, MatchResultWithHistory, PlayerIndex, RulesetConfigV1, TranscriptV1, Turn } from "@nyano/triad-engine";
import {
  computeRulesetIdV1,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
  simulateMatchV1WithHistory,
} from "@nyano/triad-engine";

import { BoardView } from "@/components/BoardView";
import { CardMini } from "@/components/CardMini";
import { TurnLog } from "@/components/TurnLog";
import { base64UrlEncodeUtf8, tryGzipCompressUtf8ToBase64Url } from "@/lib/base64url";
import { getDeck, listDecks, type DeckV1 } from "@/lib/deck_store";
import { stringifyWithBigInt } from "@/lib/json";
import { fetchNyanoCards, getNyanoAddress, getRpcUrl } from "@/lib/nyano_rpc";

type RulesetKey = "v1" | "v2";

type SimOk = {
  ok: true;
  transcript: TranscriptV1;
  ruleset: RulesetConfigV1;
  rulesetId: `0x${string}`;
  full: MatchResultWithHistory;
  // preview = slice to committed turns only
  previewTurns: MatchResultWithHistory["turns"];
  previewHistory: MatchResultWithHistory["boardHistory"];
};

type SimState = { ok: false; error: string } | SimOk;

const EMPTY_BOARD = Array.from({ length: 9 }, () => null) as any;

function toHexBytes32(bytes: Uint8Array): `0x${string}` {
  return ("0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}

function randomSalt(): `0x${string}` {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return toHexBytes32(b);
}

function turnPlayer(firstPlayer: PlayerIndex, turnIndex: number): PlayerIndex {
  return ((firstPlayer + (turnIndex % 2)) % 2) as PlayerIndex;
}

function shortAddr(a: string): string {
  if (!a.startsWith("0x") || a.length < 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function parseDeckTokenIds(d: DeckV1 | null): bigint[] {
  if (!d) return [];
  return d.tokenIds.map((x) => BigInt(x));
}

function computeUsed(turns: Turn[], firstPlayer: PlayerIndex): { cells: Set<number>; usedA: Set<number>; usedB: Set<number> } {
  const cells = new Set<number>();
  const usedA = new Set<number>();
  const usedB = new Set<number>();
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    cells.add(t.cell);
    const p = turnPlayer(firstPlayer, i);
    if (p === 0) usedA.add(t.cardIndex);
    else usedB.add(t.cardIndex);
  }
  return { cells, usedA, usedB };
}

/**
 * Build a full 9-turn transcript by filling remaining turns with placeholders.
 * This enables "progress preview" without changing the protocol-level engine.
 */
function fillTurns(partial: Turn[], firstPlayer: PlayerIndex): Turn[] {
  const { cells, usedA, usedB } = computeUsed(partial, firstPlayer);

  const remainingCells: number[] = [];
  for (let c = 0; c < 9; c++) if (!cells.has(c)) remainingCells.push(c);

  const remainingA: number[] = [];
  const remainingB: number[] = [];
  for (let i = 0; i < 5; i++) {
    if (!usedA.has(i)) remainingA.push(i);
    if (!usedB.has(i)) remainingB.push(i);
  }

  const out: Turn[] = [...partial];

  for (let i = partial.length; i < 9; i++) {
    const p = turnPlayer(firstPlayer, i);
    const cell = remainingCells.shift();
    if (cell === undefined) throw new Error("no remaining cells (internal)");
    const cardIndex = p === 0 ? remainingA.shift() : remainingB.shift();
    if (cardIndex === undefined) throw new Error(`no remaining cardIndex for player ${p}`);
    out.push({ cell, cardIndex });
  }

  return out;
}

async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function MatchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const decks = React.useMemo(() => listDecks(), []);

  const deckAId = searchParams.get("a") ?? "";
  const deckBId = searchParams.get("b") ?? "";

  const deckA = React.useMemo(() => (deckAId ? getDeck(deckAId) : null), [deckAId]);
  const deckB = React.useMemo(() => (deckBId ? getDeck(deckBId) : null), [deckBId]);

  const [rulesetKey, setRulesetKey] = React.useState<RulesetKey>("v2");
  const [seasonId, setSeasonId] = React.useState<number>(1);
  const [firstPlayer, setFirstPlayer] = React.useState<PlayerIndex>(0);

  const [salt, setSalt] = React.useState<`0x${string}`>(() => randomSalt());
  const [deadline, setDeadline] = React.useState<number>(() => Math.floor(Date.now() / 1000) + 24 * 3600);

  const [loading, setLoading] = React.useState(false);
  const [cards, setCards] = React.useState<Map<bigint, CardData> | null>(null);
  const [owners, setOwners] = React.useState<Map<bigint, `0x${string}`> | null>(null);

  const [playerA, setPlayerA] = React.useState<`0x${string}`>("0x0000000000000000000000000000000000000000");
  const [playerB, setPlayerB] = React.useState<`0x${string}`>("0x0000000000000000000000000000000000000000");

  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [draftCell, setDraftCell] = React.useState<number | null>(null);
  const [draftCardIndex, setDraftCardIndex] = React.useState<number | null>(null);
  const [draftWarningMarkCell, setDraftWarningMarkCell] = React.useState<number | null>(null);

  const [selectedTurnIndex, setSelectedTurnIndex] = React.useState<number>(0);

  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const resetMatch = React.useCallback(() => {
    setTurns([]);
    setDraftCell(null);
    setDraftCardIndex(null);
    setDraftWarningMarkCell(null);
    setSelectedTurnIndex(0);
    setSalt(randomSalt());
    setDeadline(Math.floor(Date.now() / 1000) + 24 * 3600);
  }, []);

  // If deck selection changes, reset the drafted match + reload requirement.
  React.useEffect(() => {
    resetMatch();
    setCards(null);
    setOwners(null);
    setStatus(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckAId, deckBId]);

  // If firstPlayer changes, reset drafted moves (but keep loaded cards).
  React.useEffect(() => {
    resetMatch();
    setStatus(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPlayer]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const deckATokens = React.useMemo(() => parseDeckTokenIds(deckA), [deckA]);
  const deckBTokens = React.useMemo(() => parseDeckTokenIds(deckB), [deckB]);

  const ruleset: RulesetConfigV1 = rulesetKey === "v1" ? ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1 : ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2;
  const rulesetId = React.useMemo(() => computeRulesetIdV1(ruleset), [ruleset]);

  const used = React.useMemo(() => computeUsed(turns, firstPlayer), [turns, firstPlayer]);
  const currentTurnIndex = turns.length;
  const currentPlayer = turnPlayer(firstPlayer, currentTurnIndex);
  const currentDeckTokens = currentPlayer === 0 ? deckATokens : deckBTokens;
  const currentUsed = currentPlayer === 0 ? used.usedA : used.usedB;

  const availableCells = React.useMemo(() => {
    const out: number[] = [];
    for (let c = 0; c < 9; c++) if (!used.cells.has(c)) out.push(c);
    return out;
  }, [used.cells]);

  const availableCardIndexes = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < 5; i++) if (!currentUsed.has(i)) out.push(i);
    return out;
  }, [currentUsed]);

  const canLoad = Boolean(deckA && deckB);

  const loadCards = async () => {
    setError(null);
    setStatus(null);

    if (!deckA || !deckB) {
      setError("Deck A / Deck B を選択してください");
      return;
    }

    setLoading(true);
    try {
      const tokenIds = [...deckATokens, ...deckBTokens];

      const bundles = await fetchNyanoCards(tokenIds);

      const cardsByTokenId = new Map<bigint, CardData>();
      const ownersByTokenId = new Map<bigint, `0x${string}`>();

      for (const [tid, b] of bundles.entries()) {
        cardsByTokenId.set(tid, b.card);
        ownersByTokenId.set(tid, b.owner);
      }

      setCards(cardsByTokenId);
      setOwners(ownersByTokenId);

      const a0 = deckATokens[0];
      const b0 = deckBTokens[0];
      if (a0 !== undefined) setPlayerA(ownersByTokenId.get(a0) ?? playerA);
      if (b0 !== undefined) setPlayerB(ownersByTokenId.get(b0) ?? playerB);

      setStatus(`loaded ${bundles.size} cards from mainnet`);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const sim: SimState = React.useMemo(() => {
    if (!cards) return { ok: false, error: "カードが未ロードです（Load Cards を実行してください）" };
    if (deckATokens.length !== 5 || deckBTokens.length !== 5) return { ok: false, error: "Deck A/B は 5 枚必要です" };

    try {
      const fullTurns = fillTurns(turns, firstPlayer);

      const transcript: TranscriptV1 = {
        header: {
          version: 1,
          rulesetId,
          seasonId,
          playerA,
          playerB,
          deckA: deckATokens,
          deckB: deckBTokens,
          firstPlayer,
          deadline,
          salt,
        },
        turns: fullTurns,
      };

      const full = simulateMatchV1WithHistory(transcript, cards, ruleset);

      const n = turns.length;
      const previewTurns = full.turns.slice(0, n);
      const previewHistory = full.boardHistory.slice(0, n + 1);

      return { ok: true, transcript, ruleset, rulesetId, full, previewTurns, previewHistory };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? String(e) };
    }
  }, [cards, deckATokens, deckBTokens, turns, firstPlayer, ruleset, rulesetId, seasonId, playerA, playerB, deadline, salt]);

  const boardNow = sim.ok ? sim.previewHistory[turns.length] ?? EMPTY_BOARD : EMPTY_BOARD;

  const commitMove = () => {
    setError(null);
    setStatus(null);

    if (turns.length >= 9) {
      setError("すでに 9 手が確定しています（Reset してください）");
      return;
    }

    if (draftCell === null) {
      setError("cell を選択してください");
      return;
    }
    if (used.cells.has(draftCell)) {
      setError(`cell ${draftCell} はすでに使用済みです`);
      return;
    }

    if (draftCardIndex === null) {
      setError("card を選択してください");
      return;
    }
    if (draftCardIndex < 0 || draftCardIndex > 4) {
      setError("cardIndex は 0..4 です");
      return;
    }
    if (currentUsed.has(draftCardIndex)) {
      setError(`cardIndex ${draftCardIndex} はすでに使用済みです`);
      return;
    }

    if (draftWarningMarkCell !== null) {
      if (draftWarningMarkCell === draftCell) {
        setError("warningMarkCell は placed cell と同じにできません");
        return;
      }
      if (used.cells.has(draftWarningMarkCell)) {
        setError(`warningMarkCell ${draftWarningMarkCell} はすでに使用済み cell です`);
        return;
      }
    }

    const next: Turn = {
      cell: draftCell,
      cardIndex: draftCardIndex,
      warningMarkCell: draftWarningMarkCell === null ? undefined : draftWarningMarkCell,
    };

    setTurns((prev) => [...prev, next]);
    setDraftCell(null);
    setDraftCardIndex(null);
    setDraftWarningMarkCell(null);
    setSelectedTurnIndex(Math.max(0, turns.length)); // focus the move we just added
  };

  const undoMove = () => {
    setError(null);
    setStatus(null);
    setTurns((prev) => prev.slice(0, -1));
    setDraftCell(null);
    setDraftCardIndex(null);
    setDraftWarningMarkCell(null);
    setSelectedTurnIndex((x) => Math.max(0, Math.min(x, Math.max(0, turns.length - 2))));
  };

  const canFinalize = turns.length === 9 && sim.ok;

  const copyTranscriptJson = async () => {
    setError(null);
    setStatus(null);
    if (!sim.ok) {
      setError(sim.error);
      return;
    }
    const json = stringifyWithBigInt(sim.transcript, 2);
    await copyToClipboard(json);
    setStatus("copied transcript JSON");
  };

  const copyShareUrl = async () => {
    setError(null);
    setStatus(null);
    if (!sim.ok) {
      setError(sim.error);
      return;
    }
    const json = stringifyWithBigInt(sim.transcript, 0);

    const z = await tryGzipCompressUtf8ToBase64Url(json);
    const origin = window.location.origin;
    const url = z ? `${origin}/replay?z=${z}` : `${origin}/replay?t=${base64UrlEncodeUtf8(json)}`;

    await copyToClipboard(url);
    setStatus("copied share URL");
  };

  const openReplay = async () => {
    setError(null);
    setStatus(null);
    if (!sim.ok) {
      setError(sim.error);
      return;
    }
    const json = stringifyWithBigInt(sim.transcript, 0);
    const z = await tryGzipCompressUtf8ToBase64Url(json);
    const url = z ? `/replay?z=${z}` : `/replay?t=${base64UrlEncodeUtf8(json)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">Match</div>
          <div className="text-xs text-slate-500">ローカル対戦（ドラフト）→ transcript → Replay（共有）</div>
        </div>

        <div className="card-bd grid gap-4 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Deck A</div>
              <select className="input" value={deckAId} onChange={(e) => setParam("a", e.target.value)}>
                <option value="">Select…</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {deckA ? (
                <div className="text-xs text-slate-500">
                  {deckA.tokenIds.join(", ")}
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  まずは <Link className="underline" to="/decks">Decks</Link> で作成してください
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Deck B</div>
              <select className="input" value={deckBId} onChange={(e) => setParam("b", e.target.value)}>
                <option value="">Select…</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {deckB ? (
                <div className="text-xs text-slate-500">
                  {deckB.tokenIds.join(", ")}
                </div>
              ) : (
                <div className="text-xs text-slate-400">Deck B を選択してください</div>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Ruleset</div>
              <select className="input" value={rulesetKey} onChange={(e) => setRulesetKey(e.target.value as RulesetKey)}>
                <option value="v1">v1 (core+tactics)</option>
                <option value="v2">v2 (shadow ignores warning mark)</option>
              </select>
              <div className="text-xs text-slate-500 font-mono">rulesetId: {rulesetId}</div>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Season</div>
              <input
                className="input"
                type="number"
                min={1}
                value={seasonId}
                onChange={(e) => setSeasonId(Number(e.target.value))}
              />
              <div className="text-[11px] text-slate-500">※ 今は 1 固定でもOK（将来リーグで拡張）</div>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">First Player</div>
              <select className="input" value={String(firstPlayer)} onChange={(e) => setFirstPlayer(Number(e.target.value) as PlayerIndex)}>
                <option value="0">A first</option>
                <option value="1">B first</option>
              </select>
              <div className="text-[11px] text-slate-500">firstPlayer を変えると drafted moves はリセットされます</div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Players (auto-filled from first token owner)</div>
              <div className="grid grid-cols-2 gap-2">
                <input className="input font-mono text-xs" value={playerA} onChange={(e) => setPlayerA(e.target.value as `0x${string}`)} />
                <input className="input font-mono text-xs" value={playerB} onChange={(e) => setPlayerB(e.target.value as `0x${string}`)} />
              </div>
              <div className="text-[11px] text-slate-500">
                A: {shortAddr(playerA)} / B: {shortAddr(playerB)}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Chain</div>
              <div className="text-xs text-slate-600">
                RPC: <span className="font-mono">{getRpcUrl()}</span>
              </div>
              <div className="text-xs text-slate-600">
                Nyano: <span className="font-mono">{getNyanoAddress()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" disabled={!canLoad || loading} onClick={loadCards}>
              {loading ? "Loading…" : "Load Cards"}
            </button>
            <button className="btn" onClick={resetMatch}>
              Reset Match
            </button>
            <button className="btn" onClick={() => setSalt(randomSalt())}>
              New Salt
            </button>
          </div>

          {status ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">{status}</div> : null}
          {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">{error}</div> : null}
        </div>
      </section>

      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">Draft Moves</div>
          <div className="text-xs text-slate-500">
            turn {currentTurnIndex}/9 · player {currentPlayer === 0 ? "A" : "B"} · cells remaining: {availableCells.length} · cards remaining:{" "}
            {availableCardIndexes.length}
          </div>
        </div>

        <div className="card-bd grid gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-3">
              <div className="text-xs font-medium text-slate-600">Board (click an empty cell)</div>

              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }, (_, idx) => {
                  const cell = (boardNow as any)[idx] as any;
                  const occupied = Boolean(cell);
                  const selected = draftCell === idx;
                  const disabled = occupied || used.cells.has(idx);

                  return (
                    <button
                      key={idx}
                      disabled={disabled || turns.length >= 9}
                      onClick={() => setDraftCell(idx)}
                      className={[
                        "aspect-square rounded-xl border p-2 text-left",
                        selected ? "border-slate-900" : "border-slate-200",
                        disabled ? "bg-slate-50" : "bg-white hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {cell ? (
                        <CardMini card={cell.card} owner={cell.owner} subtle />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">{idx}</div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">Warning mark (optional)</div>
                <select
                  className="input"
                  value={draftWarningMarkCell === null ? "" : String(draftWarningMarkCell)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraftWarningMarkCell(v === "" ? null : Number(v));
                  }}
                  disabled={turns.length >= 9}
                >
                  <option value="">None</option>
                  {availableCells
                    .filter((c) => c !== draftCell)
                    .map((c) => (
                      <option key={c} value={String(c)}>
                        cell {c}
                      </option>
                    ))}
                </select>
                <div className="text-[11px] text-slate-500">※ 置くと、相手がその cell に置いた時にペナルティが発生</div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="text-xs font-medium text-slate-600">Pick a card (index 0..4)</div>
              {!cards ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  まずは Load Cards を実行してください
                </div>
              ) : (
                <div className="grid gap-2">
                  <div className="flex flex-wrap gap-2">
                    {currentDeckTokens.map((tid, idx) => {
                      const c = cards.get(tid);
                      const usedHere = currentUsed.has(idx);
                      const selected = draftCardIndex === idx;
                      return (
                        <button
                          key={idx}
                          disabled={usedHere || turns.length >= 9}
                          onClick={() => setDraftCardIndex(idx)}
                          className={[
                            "w-[120px] rounded-xl border p-2",
                            selected ? "border-slate-900" : "border-slate-200",
                            usedHere ? "bg-slate-50 opacity-50" : "bg-white hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {c ? (
                            <CardMini card={c} owner={currentPlayer} subtle={!selected} />
                          ) : (
                            <div className="text-xs text-slate-500 font-mono">#{tid.toString()}</div>
                          )}
                          <div className="mt-1 text-[10px] text-slate-500">idx {idx}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button className="btn btn-primary" onClick={commitMove} disabled={turns.length >= 9}>
                      Commit Move
                    </button>
                    <button className="btn" onClick={undoMove} disabled={turns.length === 0}>
                      Undo
                    </button>
                  </div>

                  {!sim.ok ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                      engine error: {sim.error}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Progress</div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                <div className="grid gap-1">
                  <div>cells used: {[...used.cells.values()].sort((a, b) => a - b).join(", ") || "—"}</div>
                  <div>cards used (A): {[...used.usedA.values()].sort((a, b) => a - b).join(", ") || "—"}</div>
                  <div>cards used (B): {[...used.usedB.values()].sort((a, b) => a - b).join(", ") || "—"}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Share</div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="btn" onClick={copyTranscriptJson} disabled={!sim.ok}>
                  Copy transcript JSON
                </button>
                <button className="btn" onClick={copyShareUrl} disabled={!canFinalize}>
                  Copy share URL
                </button>
                <button className="btn" onClick={openReplay} disabled={!canFinalize}>
                  Open Replay
                </button>
              </div>
              <div className="text-[11px] text-slate-500">
                共有URLは <span className="font-medium">9手確定</span> 後に解放（途中は placeholder が入るため）
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">Turn Log</div>
          <div className="text-xs text-slate-500">コミット済みの手のみ表示（placeholderは非表示）</div>
        </div>

        <div className="card-bd grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            {sim.ok ? (
              <>
                <BoardView board={boardNow as any} focusCell={null} />
                {turns.length === 9 ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                    <div className="grid gap-1">
                      <div>
                        winner: <span className="font-medium">{sim.full.winner}</span> (tiles A/B = {sim.full.tiles.A}/{sim.full.tiles.B})
                      </div>
                      <div className="font-mono">matchId: {sim.full.matchId}</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    9手確定後に勝敗が確定します（いまは途中経過の盤面だけ表示）
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                まずはカードをロードして、1手コミットしてください
              </div>
            )}
          </div>

          <div className="grid gap-2">
            {sim.ok ? (
              <>
                <TurnLog
                  turns={sim.previewTurns}
                  boardHistory={sim.previewHistory}
                  selectedTurnIndex={Math.min(selectedTurnIndex, Math.max(0, sim.previewTurns.length - 1))}
                  onSelect={(i) => setSelectedTurnIndex(i)}
                />
              </>
            ) : (
              <div className="text-xs text-slate-600">—</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
