import React from "react";
import { useToast } from "@/components/Toast";
import { Link, useSearchParams } from "react-router-dom";

import type { CardData, MatchResultWithHistory, PlayerIndex, RulesetConfigV1, TranscriptV1, Turn } from "@nyano/triad-engine";
import {
  computeRulesetIdV1,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
  simulateMatchV1WithHistory,
} from "@nyano/triad-engine";

import { BoardView } from "@/components/BoardView";
import { BoardViewRPG, HandDisplayRPG, GameResultOverlayRPG, TurnLogRPG } from "@/components/BoardViewRPG";
import type { TurnLogEntry } from "@/components/BoardViewRPG";
import { ScoreBar } from "@/components/ScoreBar";
import { LastMoveFeedback, useBoardFlipAnimation } from "@/components/BoardFlipAnimator";
import { NyanoImage } from "@/components/NyanoImage";
import { CardMini } from "@/components/CardMini";
import { TurnLog } from "@/components/TurnLog";
import { GameResultOverlay, type GameResult } from "@/components/GameResultOverlay";
import { NyanoReaction, type NyanoReactionInput } from "@/components/NyanoReaction";
import { flipTracesSummary } from "@/components/flipTraceDescribe";
import { base64UrlEncodeUtf8, tryGzipCompressUtf8ToBase64Url } from "@/lib/base64url";
import { getDeck, listDecks, type DeckV1 } from "@/lib/deck_store";
import { getEventById, getEventStatus, type EventV1 } from "@/lib/events";
import { stringifyWithBigInt } from "@/lib/json";
import { fetchMintedTokenIds, fetchNyanoCards } from "@/lib/nyano_rpc";
import { publishOverlayState, subscribeStreamCommand, type StreamCommandV1 } from "@/lib/streamer_bus";
import { pickAiMove as pickAiMoveNew, type AiDifficulty } from "@/lib/ai/nyano_ai";
import { NyanoAvatar } from "@/components/NyanoAvatar";
import { MiniTutorial } from "@/components/MiniTutorial";
import { fetchGameIndex } from "@/lib/nyano/gameIndex";
import { generateBalancedDemoPair, buildCardDataFromIndex } from "@/lib/demo_decks";

type RulesetKey = "v1" | "v2";
type OpponentMode = "pvp" | "vs_nyano_ai";
type DataMode = "fast" | "verified";

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

function looksLikeRpcError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("failed to fetch") || m.includes("http request failed") || m.includes("rpc接続") || m.includes("cors") || m.includes("429");
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

function countWarningMarks(turns: Turn[], firstPlayer: PlayerIndex): { A: number; B: number } {
  let A = 0;
  let B = 0;
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    if (t.warningMarkCell === undefined) continue;
    const p = turnPlayer(firstPlayer, i);
    if (p === 0) A++;
    else B++;
  }
  return { A, B };
}

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

// AI logic has been extracted to @/lib/ai/nyano_ai.ts

function parseOpponentMode(v: string | null): OpponentMode {
  if (!v) return "pvp";
  if (v === "vs_nyano_ai" || v === "ai" || v === "nyano") return "vs_nyano_ai";
  return "pvp";
}

function parseRulesetKey(v: string | null): RulesetKey {
  if (v === "v1") return "v1";
  return "v2";
}

function parseAiDifficulty(v: string | null): AiDifficulty {
  if (v === "easy") return "easy";
  if (v === "hard") return "hard";
  if (v === "expert") return "expert";
  return "normal";
}

function parseFirstPlayer(v: string | null): PlayerIndex {
  return v === "1" ? 1 : 0;
}

function parseSeason(v: string | null): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseBool01(v: string | null, defaultValue: boolean): boolean {
  if (v === "1") return true;
  if (v === "0") return false;
  return defaultValue;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COLLAPSIBLE SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <section className="card">
      <div
        className="card-hd flex cursor-pointer items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <div>
          <div className="text-base font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
        <span className="text-sm text-slate-400">{open ? "▲" : "▼"}</span>
      </div>
      {open && <div className="card-bd grid gap-4 text-sm">{children}</div>}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MATCH PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export function MatchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ui = (searchParams.get("ui") || "").toLowerCase();
  const isRpg = ui === "rpg";
  const decks = React.useMemo(() => listDecks(), []);

  const isGuestMode = searchParams.get("mode") === "guest";
  const dataModeParam = (searchParams.get("dm") ?? "fast") as DataMode;
  const [dataMode, setDataMode] = React.useState<DataMode>(isGuestMode ? "fast" : dataModeParam);

  const eventId = searchParams.get("event") ?? "";
  const event: EventV1 | null = React.useMemo(() => (eventId ? getEventById(eventId) : null), [eventId]);
  const eventStatus = event ? getEventStatus(event) : null;

  const [eventNyanoDeckOverride, setEventNyanoDeckOverride] = React.useState<bigint[] | null>(null);
  React.useEffect(() => {
    setEventNyanoDeckOverride(null);
  }, [eventId]);

  const deckAId = searchParams.get("a") ?? "";
  const deckBId = searchParams.get("b") ?? "";

  const deckA = React.useMemo(() => (deckAId ? getDeck(deckAId) : null), [deckAId]);
  const deckB = React.useMemo(() => (deckBId ? getDeck(deckBId) : null), [deckBId]);

  const opponentModeParam = parseOpponentMode(searchParams.get("opp"));
  const aiDifficultyParam = parseAiDifficulty(searchParams.get("ai"));

  const aiAutoPlay = parseBool01(searchParams.get("auto"), true);
  const streamMode = parseBool01(searchParams.get("stream"), false);
  const streamCtrlParam = (searchParams.get("ctrl") ?? "A").toUpperCase();
  const streamControlledSide = (streamCtrlParam === "B" ? 1 : 0) as PlayerIndex;

  const rulesetKeyParam = parseRulesetKey(searchParams.get("rk"));
  const seasonIdParam = parseSeason(searchParams.get("season"));
  const firstPlayerParam = parseFirstPlayer(searchParams.get("fp"));

  const isEvent = Boolean(event);
  const opponentMode: OpponentMode = isEvent ? "vs_nyano_ai" : opponentModeParam;
  const isVsNyanoAi = opponentMode === "vs_nyano_ai";
  const aiPlayer: PlayerIndex = 1;
  const aiDifficulty: AiDifficulty = isEvent ? (event!.aiDifficulty as AiDifficulty) : aiDifficultyParam;

  const rulesetKey: RulesetKey = isEvent ? (event!.rulesetKey as RulesetKey) : rulesetKeyParam;
  const seasonId: number = isEvent ? event!.seasonId : seasonIdParam;
  const firstPlayer: PlayerIndex = isEvent ? (event!.firstPlayer as PlayerIndex) : firstPlayerParam;

  const [salt, setSalt] = React.useState<`0x${string}`>(() => randomSalt());
  const [deadline, setDeadline] = React.useState<number>(() => Math.floor(Date.now() / 1000) + 24 * 3600);

  const [loading, setLoading] = React.useState(false);
  const [cards, setCards] = React.useState<Map<bigint, CardData> | null>(null);
  const [_owners, setOwners] = React.useState<Map<bigint, `0x${string}`> | null>(null);

  const [playerA, setPlayerA] = React.useState<`0x${string}`>("0x0000000000000000000000000000000000000000");
  const [playerB, setPlayerB] = React.useState<`0x${string}`>("0x0000000000000000000000000000000000000000");

  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [showResultOverlay, setShowResultOverlay] = React.useState(false);
  const [draftCell, setDraftCell] = React.useState<number | null>(null);
  const [draftCardIndex, setDraftCardIndex] = React.useState<number | null>(null);
  const [draftWarningMarkCell, setDraftWarningMarkCell] = React.useState<number | null>(null);

  const [selectedTurnIndex, setSelectedTurnIndex] = React.useState<number>(0);

  const [status, setStatus] = React.useState<string | null>(null);
  const toast = useToast();
  const lastStreamCmdIdRef = React.useRef<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const [aiNotes, setAiNotes] = React.useState<Record<number, string>>({});

  const resetMatch = React.useCallback(() => {
    setTurns([]);
    setDraftCell(null);
    setDraftCardIndex(null);
    setDraftWarningMarkCell(null);
    setSelectedTurnIndex(0);
    setAiNotes({});
    setSalt(randomSalt());
    setDeadline(Math.floor(Date.now() / 1000) + 24 * 3600);
    try {
      boardAnim.clear();
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    resetMatch();
    setCards(null);
    setOwners(null);
    setStatus(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckAId, deckBId, eventId]);

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

  const clearEvent = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("event");
    setSearchParams(next, { replace: true });
  };

  const deckATokens = React.useMemo(() => parseDeckTokenIds(deckA), [deckA]);
  const deckBTokens = React.useMemo(() => {
    if (event) return (eventNyanoDeckOverride ?? event.nyanoDeckTokenIds.map((x) => BigInt(x)));
    return parseDeckTokenIds(deckB);
  }, [deckB, event, eventNyanoDeckOverride]);

  // Guest mode: store generated deck tokenIds so they persist across resets
  const [guestDeckATokens, setGuestDeckATokens] = React.useState<bigint[]>([]);
  const [guestDeckBTokens, setGuestDeckBTokens] = React.useState<bigint[]>([]);

  // Effective deck tokens: guest mode uses generated decks, normal mode uses selected decks
  const effectiveDeckATokens = isGuestMode && guestDeckATokens.length === 5 ? guestDeckATokens : deckATokens;
  const effectiveDeckBTokens = isGuestMode && guestDeckBTokens.length === 5 ? guestDeckBTokens : deckBTokens;

  const ruleset: RulesetConfigV1 = rulesetKey === "v1" ? ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1 : ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2;
  const rulesetId = React.useMemo(() => computeRulesetIdV1(ruleset), [ruleset]);

  const used = React.useMemo(() => computeUsed(turns, firstPlayer), [turns, firstPlayer]);
  const warnUsed = React.useMemo(() => countWarningMarks(turns, firstPlayer), [turns, firstPlayer]);
  const currentTurnIndex = turns.length;
  const currentPlayer = turnPlayer(firstPlayer, currentTurnIndex);
  const isAiTurn = isVsNyanoAi && currentPlayer === aiPlayer;

  const currentDeckTokens = currentPlayer === 0 ? effectiveDeckATokens : effectiveDeckBTokens;
  const currentUsed = currentPlayer === 0 ? used.usedA : used.usedB;
  const currentWarnRemaining = currentPlayer === 0 ? Math.max(0, 3 - warnUsed.A) : Math.max(0, 3 - warnUsed.B);

  const availableCells = React.useMemo(() => {
    const out: number[] = [];
    for (let c = 0; c < 9; c++) if (!used.cells.has(c)) out.push(c);
    return out;
  }, [used.cells]);

  // P0-1: selectableCells for BoardView (only empty cells when it's not AI turn and game isn't over)
  const selectableCells = React.useMemo(() => {
    if (!cards || turns.length >= 9 || isAiTurn) return new Set<number>();
    return new Set(availableCells);
  }, [cards, turns.length, isAiTurn, availableCells]);

  const _availableCardIndexes = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < 5; i++) if (!currentUsed.has(i)) out.push(i);
    return out;
  }, [currentUsed]);

  const canLoad = isGuestMode || Boolean(deckA && deckATokens.length === 5 && deckBTokens.length === 5);

  const loadCardsFromIndex = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);

    try {
      const index = await fetchGameIndex();
      if (!index) {
        setError("Game Index の読み込みに失敗しました。ネットワーク接続を確認してください。");
        return;
      }

      if (isGuestMode) {
        // Generate balanced demo pair
        const pair = generateBalancedDemoPair(index);
        const aTokens = pair.deckA.tokenIds.map((x) => BigInt(x));
        const bTokens = pair.deckB.tokenIds.map((x) => BigInt(x));
        setGuestDeckATokens(aTokens);
        setGuestDeckBTokens(bTokens);

        const allTokenIds = [...pair.deckA.tokenIds, ...pair.deckB.tokenIds];
        const cardMap = buildCardDataFromIndex(index, allTokenIds);
        setCards(cardMap);
        setOwners(null);
        setPlayerA("0x0000000000000000000000000000000000000001" as `0x${string}`);
        setPlayerB("0x0000000000000000000000000000000000000002" as `0x${string}`);
        setStatus(`Guest mode: loaded ${cardMap.size} cards from game index`);
      } else {
        // Fast mode for normal play
        const allTokenIds = [...deckATokens, ...deckBTokens].map((t) => t.toString());
        const cardMap = buildCardDataFromIndex(index, allTokenIds);

        if (cardMap.size < allTokenIds.length) {
          const missing = allTokenIds.filter((id) => !cardMap.has(BigInt(id)));
          setError(`Game Index に存在しない tokenId: ${missing.join(", ")}. Verified mode をお試しください。`);
          return;
        }

        setCards(cardMap);
        setOwners(null);
        setStatus(`Fast mode: loaded ${cardMap.size} cards from game index`);
      }
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setError(`Game Index load failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCardsFromRpc = async () => {
    setError(null);
    setStatus(null);

    if (!deckA || deckATokens.length !== 5) {
      setError("Deck A を選択してください（5枚）");
      return;
    }
    if (deckBTokens.length !== 5) {
      setError("Deck B が不正です（5枚）");
      return;
    }

    setLoading(true);
    try {
      let deckBForLoad = deckBTokens;

      if (event && !eventNyanoDeckOverride) {
        const raw = event.nyanoDeckTokenIds.join(",");
        const looksPlaceholder = raw === "1,2,3,4,5";

        if (looksPlaceholder) {
          const minted = await fetchMintedTokenIds(5, 0);
          deckBForLoad = minted;
          setEventNyanoDeckOverride(minted);

          toast.success(
            "Nyano deck auto-selected",
            minted.map((t) => `#${t.toString()}`).join(", ")
          );
        }
      }

      const tokenIds = [...deckATokens, ...deckBForLoad];
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

      setStatus(`Verified: loaded ${bundles.size} cards from mainnet`);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setError(msg);

      if (msg.includes("存在しない tokenId")) {
        toast.warn("カード読込失敗", "存在しない tokenId が含まれています。/nyano で確認してください。");
      } else if (looksLikeRpcError(msg)) {
        toast.warn("カード読込失敗", "RPC 接続に失敗しました。/nyano の RPC Settings で切替できます。");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCards = () => {
    if (isGuestMode || dataMode === "fast") {
      return loadCardsFromIndex();
    }
    return loadCardsFromRpc();
  };

  // Auto-load cards in guest mode
  React.useEffect(() => {
    if (isGuestMode && !cards && !loading) {
      void loadCardsFromIndex();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuestMode]);

  const sim: SimState = React.useMemo(() => {
    if (!cards) return { ok: false, error: "カードが未ロードです（Load Cards を実行してください）" };
    if (effectiveDeckATokens.length !== 5 || effectiveDeckBTokens.length !== 5) return { ok: false, error: "Deck A/B は 5 枚必要です" };

    try {
      const fullTurns = fillTurns(turns, firstPlayer);

      const transcript: TranscriptV1 = {
        header: {
          version: 1,
          rulesetId,
          seasonId,
          playerA,
          playerB,
          deckA: effectiveDeckATokens,
          deckB: effectiveDeckBTokens,
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
  }, [cards, effectiveDeckATokens, effectiveDeckBTokens, turns, firstPlayer, ruleset, rulesetId, seasonId, playerA, playerB, deadline, salt]);

  const matchId = sim.ok ? sim.full.matchId : null;

  const gameResult: GameResult | null = sim.ok
    ? {
        winner: sim.full.winner === 0 || sim.full.winner === 1 ? sim.full.winner : "draw",
        tilesA: Number(sim.full.tiles.A),
        tilesB: Number(sim.full.tiles.B),
        matchId: sim.full.matchId,
      }
    : null;

  React.useEffect(() => {
    if (turns.length >= 9 && sim.ok) {
      setShowResultOverlay(true);
    } else {
      setShowResultOverlay(false);
    }
  }, [turns.length, sim.ok, matchId]);

  const boardNow = sim.ok ? sim.previewHistory[turns.length] ?? EMPTY_BOARD : EMPTY_BOARD;
  const boardAnim = useBoardFlipAnimation(boardNow as any[], sim.ok);

  // --- Overlay state publishing (unchanged) ---
  React.useEffect(() => {
    try {
      const updatedAtMs = Date.now();

      if (!sim.ok) {
        publishOverlayState({
          version: 1,
          updatedAtMs,
          mode: "live",
          eventId: event?.id,
          eventTitle: event?.title,
          error: sim.error,
        });
        return;
      }

      const lastIndex = turns.length - 1;
      const last = lastIndex >= 0 ? turns[lastIndex] : null;

      const lastMove =
        last && typeof last.cell === "number"
          ? {
              turnIndex: lastIndex,
              by: turnPlayer(firstPlayer, lastIndex),
              cell: Number(last.cell),
              cardIndex: Number((last as any).cardIndex ?? 0),
              warningMarkCell: typeof (last as any).warningMarkCell === "number" ? Number((last as any).warningMarkCell) : null,
            }
          : undefined;

      const lastSummary = lastIndex >= 0 ? (sim.previewTurns[lastIndex] as any) : null;
      const lastTurnSummary =
        lastSummary
          ? {
              flipCount: Number(lastSummary.flipCount ?? 0),
              comboCount: Number(lastSummary.comboCount ?? 0),
              comboEffect: (lastSummary.comboEffect ?? "none") as "none" | "momentum" | "domination" | "fever",
              triadPlus: Number(lastSummary.appliedBonus?.triadPlus ?? 0),
              ignoreWarningMark: Boolean(lastSummary.appliedBonus?.ignoreWarningMark),
              warningTriggered: Boolean(lastSummary.warningTriggered),
              warningPlaced: typeof lastSummary.warningPlaced === "number" ? Number(lastSummary.warningPlaced) : null,
              flips: Array.isArray(lastSummary.flipTraces)
                ? lastSummary.flipTraces.map((f: any) => ({
                    from: Number(f.from),
                    to: Number(f.to),
                    isChain: Boolean(f.isChain),
                    kind: f.kind === "diag" ? "diag" : "ortho",
                    dir: typeof f.dir === "string" ? f.dir : undefined,
                    vert: typeof f.vert === "string" ? f.vert : undefined,
                    horiz: typeof f.horiz === "string" ? f.horiz : undefined,
                    aVal: Number(f.aVal ?? 0),
                    dVal: Number(f.dVal ?? 0),
                    tieBreak: Boolean(f.tieBreak),
                  }))
                : undefined,
            }
          : undefined;

      const protocolV1 =
        sim.ok
          ? {
              header: {
                version: Number(sim.transcript.header.version),
                rulesetId: String(sim.transcript.header.rulesetId),
                seasonId: Number(sim.transcript.header.seasonId),
                playerA: String(sim.transcript.header.playerA),
                playerB: String(sim.transcript.header.playerB),
                deckA: sim.transcript.header.deckA.map((x) => x.toString()),
                deckB: sim.transcript.header.deckB.map((x) => x.toString()),
                firstPlayer: sim.transcript.header.firstPlayer as 0 | 1,
                deadline: Number(sim.transcript.header.deadline),
                salt: String(sim.transcript.header.salt),
              },
              turns: turns.map((t) => ({
                cell: Number(t.cell),
                cardIndex: Number(t.cardIndex),
                ...(typeof t.warningMarkCell === "number" ? { warningMarkCell: Number(t.warningMarkCell) } : {}),
              })),
            }
          : undefined;

      publishOverlayState({
        version: 1,
        updatedAtMs,
        mode: "live",
        eventId: event?.id,
        eventTitle: event?.title,
        turn: turns.length,
        firstPlayer,
        playerA,
        playerB,
        rulesetId,
        seasonId,
        deckA: effectiveDeckATokens.map((t) => t.toString()),
        deckB: effectiveDeckBTokens.map((t) => t.toString()),
        protocolV1,
        usedCells: Array.from(used.cells).sort((a, b) => a - b),
        usedCardIndicesA: Array.from(used.usedA).sort((a, b) => a - b),
        usedCardIndicesB: Array.from(used.usedB).sort((a, b) => a - b),
        warningMarksUsedA: warnUsed.A,
        warningMarksUsedB: warnUsed.B,
        board: boardNow,
        lastMove,
        lastTurnSummary,
        aiNote: lastIndex >= 0 ? aiNotes[lastIndex] : undefined,
        status: sim.full
          ? {
              finished: turns.length >= 9,
              winner: sim.full.winner === "draw" ? "draw" : sim.full.winner === 0 ? "A" : "B",
              tilesA: Number(sim.full.tiles.A),
              tilesB: Number(sim.full.tiles.B),
              matchId: sim.full.matchId,
            }
          : undefined,
      });
    } catch {
      // ignore
    }
  }, [
    sim,
    turns,
    boardNow,
    event?.id,
    event?.title,
    firstPlayer,
    playerA,
    playerB,
    rulesetId,
    seasonId,
    effectiveDeckATokens,
    effectiveDeckBTokens,
    aiNotes,
  ]);

  const commitTurn = React.useCallback(
    (next: Turn) => {
      setError(null);
      setStatus(null);

      if (turns.length >= 9) {
        setError("すでに 9 手が確定しています（Reset してください）");
        return;
      }

      if (next.cell < 0 || next.cell > 8) {
        setError("cell は 0..8 です");
        return;
      }
      if (used.cells.has(next.cell)) {
        setError(`cell ${next.cell} はすでに使用済みです`);
        return;
      }

      if (next.cardIndex < 0 || next.cardIndex > 4) {
        setError("cardIndex は 0..4 です");
        return;
      }
      if (currentUsed.has(next.cardIndex)) {
        setError(`cardIndex ${next.cardIndex} はすでに使用済みです`);
        return;
      }

      if (next.warningMarkCell !== undefined) {
        if (currentWarnRemaining <= 0) {
          setError("warning mark の使用回数上限（3回）に達しています");
          return;
        }
        if (next.warningMarkCell === next.cell) {
          setError("warningMarkCell は placed cell と同じにできません");
          return;
        }
        if (next.warningMarkCell < 0 || next.warningMarkCell > 8) {
          setError("warningMarkCell は 0..8 です");
          return;
        }
        if (used.cells.has(next.warningMarkCell)) {
          setError(`warningMarkCell ${next.warningMarkCell} はすでに使用済み cell です`);
          return;
        }
      }

      setTurns((prev) => [...prev, next]);
      setDraftCell(null);
      setDraftCardIndex(null);
      setDraftWarningMarkCell(null);
      setSelectedTurnIndex(Math.max(0, turns.length));
    },
    [turns.length, used.cells, currentUsed, currentWarnRemaining]
  );

  const commitMove = () => {
    if (isAiTurn) return;

    if (draftCell === null) {
      setError("cell を選択してください（盤面をクリック）");
      return;
    }
    if (draftCardIndex === null) {
      setError("card を選択してください");
      return;
    }

    commitTurn({
      cell: draftCell,
      cardIndex: draftCardIndex,
      warningMarkCell: draftWarningMarkCell === null ? undefined : draftWarningMarkCell,
    });
  };

  const undoMove = () => {
    setError(null);
    setStatus(null);
    setTurns((prev) => prev.slice(0, -1));
    setAiNotes((prev) => {
      const next = { ...prev };
      delete next[turns.length - 1];
      return next;
    });
    setDraftCell(null);
    setDraftCardIndex(null);
    setDraftWarningMarkCell(null);
    setSelectedTurnIndex((x) => Math.max(0, Math.min(x, Math.max(0, turns.length - 2))));
  };

  const doAiMove = React.useCallback(() => {
    if (!isVsNyanoAi) return;
    if (!cards) return;
    if (turns.length >= 9) return;
    if (currentPlayer !== aiPlayer) return;

    const move = pickAiMoveNew({
      difficulty: aiDifficulty,
      boardNow: boardNow as any,
      deckTokens: effectiveDeckBTokens,
      usedCardIndexes: used.usedB,
      usedCells: used.cells,
      cards,
      my: aiPlayer,
      warningMarksRemaining: Math.max(0, 3 - warnUsed.B),
    });

    const tid = effectiveDeckBTokens[move.cardIndex];
    const note = `Nyano chose cell ${move.cell}, cardIndex ${move.cardIndex}${tid !== undefined ? ` (#${tid.toString()})` : ""} — ${move.reason}`;
    setAiNotes((prev) => ({ ...prev, [turns.length]: note }));
    setStatus(note);

    commitTurn({
      cell: move.cell,
      cardIndex: move.cardIndex,
      warningMarkCell: move.warningMarkCell,
    });
  }, [isVsNyanoAi, cards, turns.length, currentPlayer, aiPlayer, aiDifficulty, boardNow, effectiveDeckBTokens, used.usedB, used.cells, commitTurn]);

  React.useEffect(() => {
    if (!isVsNyanoAi || !aiAutoPlay) return;
    if (!cards) return;
    if (turns.length >= 9) return;
    if (currentPlayer !== aiPlayer) return;
    const t = window.setTimeout(() => doAiMove(), 180);
    return () => window.clearTimeout(t);
  }, [isVsNyanoAi, aiAutoPlay, cards, turns.length, currentPlayer, aiPlayer, doAiMove]);

  // Stream commands (from /stream)
  React.useEffect(() => {
    if (!streamMode) return;

    return subscribeStreamCommand((cmd: StreamCommandV1) => {
      try {
        if (!cmd || cmd.version !== 1) return;
        if (cmd.id === lastStreamCmdIdRef.current) return;
        lastStreamCmdIdRef.current = cmd.id;

        if (cmd.type !== "commit_move_v1") return;
        if (turns.length >= 9) return;

        if (cmd.by !== streamControlledSide) return;
        if (isVsNyanoAi && currentPlayer === aiPlayer) return;
        if (cmd.forTurn !== turns.length) return;
        if (cmd.by !== currentPlayer) return;

        const wm = cmd.move.warningMarkCell;
        commitTurn({
          cell: cmd.move.cell,
          cardIndex: cmd.move.cardIndex,
          warningMarkCell: typeof wm === "number" ? wm : undefined,
        });

        toast.success("Stream move", `cell ${cmd.move.cell} · cardIndex ${cmd.move.cardIndex}`);
      } catch {
        // ignore
      }
    });
  }, [streamMode, streamControlledSide, turns.length, currentPlayer, isVsNyanoAi, aiPlayer, commitTurn, toast]);

  const canFinalize = turns.length === 9 && sim.ok;

  const copyTranscriptJson = async () => {
    setError(null);
    if (!sim.ok) {
      setError(sim.error);
      return;
    }
    const json = stringifyWithBigInt(sim.transcript, 2);
    await copyToClipboard(json);
    toast.success("Copied", "transcript JSON");
  };

  const copyShareUrl = async () => {
    setError(null);
    if (!sim.ok) {
      setError(sim.error);
      return;
    }
    const json = stringifyWithBigInt(sim.transcript, 0);

    const z = await tryGzipCompressUtf8ToBase64Url(json);
    const origin = window.location.origin;
    const qp = `&step=9${event ? `&event=${encodeURIComponent(event.id)}` : ""}`;
    const url = z ? `${origin}/replay?z=${z}${qp}` : `${origin}/replay?t=${base64UrlEncodeUtf8(json)}${qp}`;

    await copyToClipboard(url);
    toast.success("Copied", "share URL");
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
    const qp = `&step=9${event ? `&event=${encodeURIComponent(event.id)}` : ""}`;
    const url = z ? `/replay?z=${z}${qp}` : `/replay?t=${base64UrlEncodeUtf8(json)}${qp}`;
    window.open(url, "_blank");
  };

  // P0-1: Cell select handler for BoardView / BoardViewRPG
  const handleCellSelect = React.useCallback(
    (cell: number) => {
      if (isAiTurn || turns.length >= 9) return;
      setDraftCell(cell);
    },
    [isAiTurn, turns.length],
  );

  // P1-2: Build NyanoReaction input from last turn
  const nyanoReactionInput: NyanoReactionInput | null = React.useMemo(() => {
    if (!sim.ok) return null;

    const lastIdx = turns.length - 1;
    const lastSummary = lastIdx >= 0 ? sim.previewTurns[lastIdx] : null;

    // Count current tiles
    let tilesA = 0;
    let tilesB = 0;
    for (const cell of boardNow) {
      if (!cell) continue;
      if ((cell as any).owner === 0) tilesA++;
      else tilesB++;
    }

    return {
      flipCount: lastSummary ? Number(lastSummary.flipCount ?? 0) : 0,
      hasChain: lastSummary?.flipTraces ? lastSummary.flipTraces.some((t: any) => t.isChain) : false,
      comboEffect: (lastSummary?.comboEffect ?? "none") as any,
      warningTriggered: Boolean(lastSummary?.warningTriggered),
      tilesA,
      tilesB,
      perspective: 0 as PlayerIndex,
      finished: turns.length >= 9,
      winner: turns.length >= 9 ? sim.full.winner : null,
    };
  }, [sim, turns.length, boardNow]);

  // P1-1: flipTraces summary for last turn
  const lastFlipSummaryText: string | null = React.useMemo(() => {
    if (!sim.ok || turns.length === 0) return null;
    const lastSummary = sim.previewTurns[turns.length - 1];
    if (!lastSummary?.flipTraces || lastSummary.flipTraces.length === 0) return null;
    return flipTracesSummary(lastSummary.flipTraces);
  }, [sim, turns.length]);

  // P0-2: Build TurnLogRPG entries from sim
  const rpgLogEntries: TurnLogEntry[] = React.useMemo(() => {
    if (!sim.ok) return [];
    return sim.previewTurns.map((t) => ({
      turnIndex: t.turnIndex,
      player: t.player,
      cell: t.cell,
      janken: cards?.get(t.tokenId)?.jankenHand ?? 0,
      flipCount: t.flipCount,
    }));
  }, [sim, cards]);

  // P0-2: Build cards array for HandDisplayRPG
  const currentHandCards: CardData[] = React.useMemo(() => {
    if (!cards) return [];
    return currentDeckTokens.map((tid) => cards.get(tid)).filter(Boolean) as CardData[];
  }, [cards, currentDeckTokens]);

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="grid gap-6">
      {/* ── Result Overlay ── */}
      {gameResult && (
        isRpg ? (
          <GameResultOverlayRPG
            show={showResultOverlay && turns.length >= 9}
            result={gameResult}
            onDismiss={() => setShowResultOverlay(false)}
            onReplay={() => { void openReplay(); }}
            onShare={() => { void copyShareUrl(); }}
          />
        ) : (
          <GameResultOverlay
            show={showResultOverlay && turns.length >= 9}
            result={gameResult}
            onDismiss={() => setShowResultOverlay(false)}
            onReplay={() => { void openReplay(); }}
            onShare={() => { void copyShareUrl(); }}
          />
        )
      )}

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col items-start gap-4 p-4 md:flex-row md:items-center md:p-6">
          <NyanoImage size={96} className="shadow-sm" alt="Nyano" />
          <div className="min-w-0">
            <div className="text-xl font-semibold">Nyano Triad League</div>
            <div className="mt-1 text-sm text-slate-600">
              Nyano NFTで遊ぶ、コミュニティ主導のトライアド対戦。対局ログ（transcript）を共有して、配信・投票にも繋げられます。
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">ETH on-chain</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Replay share</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">Twitch voting</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Event ── */}
      {event ? (
        <section className="card">
          <div className="card-hd flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-base font-semibold">Event: {event.title}</div>
              <div className="text-xs text-slate-500">
                status: <span className="font-medium">{eventStatus}</span> · ruleset={event.rulesetKey} · ai={event.aiDifficulty}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link className="btn no-underline" to="/events">All events</Link>
              <button className="btn" onClick={clearEvent}>Leave event</button>
            </div>
          </div>
          <div className="card-bd grid gap-2 text-sm text-slate-700">
            <p>{event.description}</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Nyano deck tokenIds: <span className="font-mono">{event.nyanoDeckTokenIds.join(", ")}</span>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Guest mode banner ── */}
      {isGuestMode && (
        <section className="rounded-2xl border border-nyano-200 bg-nyano-50 p-4">
          <div className="flex items-center gap-3">
            <NyanoAvatar size={48} expression="playful" />
            <div>
              <div className="font-semibold text-nyano-800">Guest Quick Play</div>
              <div className="text-xs text-nyano-600">
                ランダムデッキでお試しプレイ中。自分のデッキで遊ぶには <Link className="font-medium underline" to="/decks">Decks</Link> でデッキを作成してください。
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Mini Tutorial (guest mode, first visit only) ── */}
      {isGuestMode && <MiniTutorial />}

      {/* ── Match Setup (collapsed in guest mode, collapsible after cards are loaded) ── */}
      {!isGuestMode && (
      <CollapsibleSection
        title="Match Setup"
        subtitle="デッキ選択・ルールセット・対戦設定"
        defaultOpen={!cards}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <div className="text-xs font-medium text-slate-600">Deck A</div>
            <select className="input" value={deckAId} onChange={(e) => setParam("a", e.target.value)}>
              <option value="">Select…</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {deckA ? (
              <div className="text-xs text-slate-500">{deckA.tokenIds.join(", ")}</div>
            ) : (
              <div className="text-xs text-slate-400">
                まずは <Link className="underline" to="/decks">Decks</Link> で作成してください
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <div className="text-xs font-medium text-slate-600">Deck B</div>
            {event ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                Event deck (fixed): <span className="font-mono">{event.nyanoDeckTokenIds.join(", ")}</span>
              </div>
            ) : (
              <>
                <select className="input" value={deckBId} onChange={(e) => setParam("b", e.target.value)}>
                  <option value="">Select…</option>
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {deckB ? <div className="text-xs text-slate-500">{deckB.tokenIds.join(", ")}</div> : <div className="text-xs text-slate-400">Deck B を選択してください</div>}
              </>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <div className="text-xs font-medium text-slate-600">Opponent</div>
            <select className="input" value={opponentMode} disabled={isEvent} onChange={(e) => setParam("opp", e.target.value)}>
              <option value="pvp">Human vs Human（両方手動）</option>
              <option value="vs_nyano_ai">Vs Nyano（AIがBを操作）</option>
            </select>
          </div>

          {isVsNyanoAi ? (
            <>
              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">AI Difficulty</div>
                <select className="input" value={aiDifficulty} disabled={isEvent} onChange={(e) => setParam("ai", e.target.value)}>
                  <option value="easy">Easy（最小手）</option>
                  <option value="normal">Normal（即時flip最大）</option>
                  <option value="hard">Hard（minimax d2）</option>
                  <option value="expert">Expert（alpha-beta d3）</option>
                </select>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-slate-600">AI Auto</div>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={aiAutoPlay} onChange={(e) => setParam("auto", e.target.checked ? "1" : "0")} />
                  Nyano turn を自動で進める
                </label>
              </div>
            </>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <div className="text-xs font-medium text-slate-600">Stream mode</div>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={streamMode} onChange={(e) => setParam("stream", e.target.checked ? "1" : "0")} />
              /stream からの投票結果を反映
            </label>
            {streamMode ? (
              <select className="input" value={streamCtrlParam} onChange={(e) => setParam("ctrl", e.target.value)}>
                <option value="A">Chat controls A</option>
                <option value="B">Chat controls B</option>
              </select>
            ) : null}
          </div>

          <div className="grid gap-2">
            <div className="text-xs font-medium text-slate-600">Ruleset</div>
            <select className="input" value={rulesetKey} disabled={isEvent} onChange={(e) => setParam("rk", e.target.value)}>
              <option value="v1">v1 (core+tactics)</option>
              <option value="v2">v2 (shadow ignores warning mark)</option>
            </select>
            <div className="text-xs text-slate-500 font-mono truncate">rulesetId: {rulesetId}</div>
          </div>

          <div className="grid gap-2">
            <div className="text-xs font-medium text-slate-600">First Player</div>
            <select className="input" value={String(firstPlayer)} disabled={isEvent} onChange={(e) => setParam("fp", e.target.value)}>
              <option value="0">A first</option>
              <option value="1">B first</option>
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="grid gap-2">
            <div className="text-xs font-medium text-slate-600">Data Mode</div>
            <div className="flex items-center gap-2">
              <select className="input w-auto" value={dataMode} onChange={(e) => setDataMode(e.target.value as DataMode)}>
                <option value="fast">Fast (Game Index)</option>
                <option value="verified">Verified (on-chain RPC)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-primary" disabled={!canLoad || loading} onClick={loadCards}>
            {loading ? "Loading…" : dataMode === "fast" ? "Load Cards (Fast)" : "Load Cards (Verified)"}
          </button>
          <button className="btn" onClick={resetMatch}>Reset Match</button>
          <button className="btn" onClick={() => setSalt(randomSalt())}>New Salt</button>
          <a
            className="btn"
            href={`${window.location.origin}/overlay?controls=0`}
            target="_blank"
            rel="noreferrer noopener"
          >
            Open Overlay
          </a>
        </div>

        {status ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">{status}</div> : null}
        {error && !cards ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
            <div>{error}</div>
            {looksLikeRpcError(error) ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <Link className="btn btn-sm" to="/nyano">RPC Settings</Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </CollapsibleSection>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         GAME ARENA — unified play section (P0-1 / P0-2)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className={isRpg ? "rounded-2xl" : "card"} style={isRpg ? { background: "#0A0A0A" } : undefined}>
        {!isRpg && (
          <div className="card-hd">
            <div className="text-base font-semibold">
              Game · turn {currentTurnIndex}/9
              {isAiTurn ? " · Nyano AI" : ` · Player ${currentPlayer === 0 ? "A" : "B"}`}
            </div>
            <div className="text-xs text-slate-500">
              warning marks left: {currentWarnRemaining}
              {streamMode ? " · stream mode ON" : ""}
              {isGuestMode ? " · guest" : ""}
              {!isGuestMode && (
                <span className={`ml-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${dataMode === "fast" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                  {dataMode === "fast" ? "Fast (index)" : "Verified (on-chain)"}
                </span>
              )}
            </div>
          </div>
        )}

        <div className={isRpg ? "p-4" : "card-bd"}>
          {!cards ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              {loading ? (
                "Loading cards…"
              ) : isGuestMode ? (
                <button className="btn btn-primary" onClick={() => void loadCardsFromIndex()}>Start Guest Match</button>
              ) : (
                <>まずは Match Setup でデッキを選択し、<strong>Load Cards</strong> を実行してください</>
              )}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              {/* ── Left: Board + Hand ── */}
              <div className="grid gap-4">
                {/* ScoreBar */}
                {sim.ok && (
                  <ScoreBar
                    board={boardNow as any}
                    moveCount={turns.length}
                    maxMoves={9}
                    winner={turns.length >= 9 ? sim.full.winner : null}
                  />
                )}

                {/* AI turn notice */}
                {isAiTurn && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Nyano の手番です。{aiAutoPlay ? "自動で進みます…" : "「Nyano Move」を押してください。"}
                  </div>
                )}

                {/* ────────────────────────────────────────────
                    P0-1: Interactive Board (unified input)
                    
                    BoardView / BoardViewRPG with:
                    - selectableCells = empty cells (when it's your turn)
                    - selectedCell = draftCell
                    - onCellSelect = handleCellSelect
                    ──────────────────────────────────────────── */}
                {sim.ok ? (
                  isRpg ? (
                    <BoardViewRPG
                      board={boardNow as any}
                      selectedCell={draftCell}
                      placedCell={boardAnim.placedCell}
                      flippedCells={boardAnim.flippedCells}
                      selectableCells={selectableCells}
                      onCellSelect={handleCellSelect}
                      currentPlayer={currentPlayer}
                      showCoordinates
                      showCandles
                      showParticles
                    />
                  ) : (
                    <BoardView
                      board={boardNow as any}
                      selectedCell={draftCell}
                      placedCell={boardAnim.placedCell}
                      flippedCells={boardAnim.flippedCells}
                      selectableCells={selectableCells}
                      onCellSelect={handleCellSelect}
                      currentPlayer={currentPlayer}
                      showCoordinates
                    />
                  )
                ) : (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                    engine error: {(sim as any).error}
                  </div>
                )}

                {/* Last move feedback */}
                {boardAnim.isAnimating && (
                  <LastMoveFeedback
                    placedCell={boardAnim.placedCell}
                    flippedCells={boardAnim.flippedCells}
                    turnPlayer={turns.length > 0 ? (turnPlayer(firstPlayer as any, turns.length - 1) === 0 ? "A" : "B") : "A"}
                  />
                )}

                {/* P1-1: Flip summary in Japanese */}
                {lastFlipSummaryText && (
                  <div className={
                    isRpg
                      ? "rounded-lg px-3 py-2 text-xs font-semibold"
                      : "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                  }
                  style={isRpg ? { background: "rgba(245,166,35,0.15)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" } : undefined}
                  >
                    ⚔ {lastFlipSummaryText}
                  </div>
                )}

                {/* P1-2: Nyano Reaction */}
                {nyanoReactionInput && (
                  <NyanoReaction
                    input={nyanoReactionInput}
                    turnIndex={turns.length}
                    rpg={isRpg}
                  />
                )}

                {/* ────────────────────────────────────────────
                    P0-2: Hand Display (RPG or standard)
                    ──────────────────────────────────────────── */}
                <div className="grid gap-3">
                  <div className={isRpg ? "text-xs font-bold uppercase tracking-wider" : "text-xs font-medium text-slate-600"}
                    style={isRpg ? { fontFamily: "'Cinzel', serif", color: "var(--rpg-text-gold, #E8D48B)" } : undefined}
                  >
                    {currentPlayer === 0 ? "Player A" : "Player B"} Hand
                    {draftCell !== null && <span className={isRpg ? "" : " text-slate-400"}> · placing on cell {draftCell}</span>}
                  </div>

                  {isRpg && currentHandCards.length > 0 ? (
                    /* P0-2: RPG Hand Display */
                    <HandDisplayRPG
                      cards={currentHandCards}
                      owner={currentPlayer}
                      usedIndices={currentUsed}
                      selectedIndex={draftCardIndex}
                      onSelect={(idx) => setDraftCardIndex(idx)}
                      disabled={turns.length >= 9 || isAiTurn}
                    />
                  ) : (
                    /* Standard card buttons */
                    <div className="flex flex-wrap gap-2">
                      {currentDeckTokens.map((tid, idx) => {
                        const c = cards.get(tid);
                        const usedHere = currentUsed.has(idx);
                        const selected = draftCardIndex === idx;
                        return (
                          <button
                            key={idx}
                            disabled={usedHere || turns.length >= 9 || isAiTurn}
                            onClick={() => setDraftCardIndex(idx)}
                            className={[
                              "w-[120px] rounded-xl border p-2",
                              selected ? "border-slate-900 ring-2 ring-nyano-400/60" : "border-slate-200",
                              usedHere || isAiTurn ? "bg-slate-50 opacity-50" : "bg-white hover:bg-slate-50",
                            ].join(" ")}
                          >
                            {c ? <CardMini card={c} owner={currentPlayer} subtle={!selected} /> : <div className="text-xs text-slate-500 font-mono">#{tid.toString()}</div>}
                            <div className="mt-1 text-[10px] text-slate-500">idx {idx}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Warning mark + Commit/Undo */}
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="grid gap-1">
                      <div className={isRpg ? "text-[10px] uppercase tracking-wider" : "text-[11px] text-slate-600"}
                        style={isRpg ? { fontFamily: "'Cinzel', serif", color: "var(--rpg-text-dim, #8A7E6B)" } : undefined}
                      >
                        Warning Mark ({currentWarnRemaining} left)
                      </div>
                      <select
                        className="input"
                        value={draftWarningMarkCell === null ? "" : String(draftWarningMarkCell)}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraftWarningMarkCell(v === "" ? null : Number(v));
                        }}
                        disabled={turns.length >= 9 || isAiTurn || currentWarnRemaining <= 0}
                      >
                        <option value="">None</option>
                        {availableCells
                          .filter((c) => c !== draftCell)
                          .map((c) => (
                            <option key={c} value={String(c)}>cell {c}</option>
                          ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className={isRpg ? "rpg-result__btn rpg-result__btn--primary" : "btn btn-primary"}
                        onClick={commitMove}
                        disabled={turns.length >= 9 || isAiTurn || draftCell === null || draftCardIndex === null}
                      >
                        Commit Move
                      </button>
                      <button
                        className={isRpg ? "rpg-result__btn" : "btn"}
                        onClick={undoMove}
                        disabled={turns.length === 0}
                      >
                        Undo
                      </button>
                      {isVsNyanoAi && !aiAutoPlay && isAiTurn ? (
                        <button className={isRpg ? "rpg-result__btn rpg-result__btn--primary" : "btn btn-primary"} onClick={doAiMove}>
                          Nyano Move
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Error display */}
                {error && cards ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">{error}</div>
                ) : null}
              </div>

              {/* ── Right: Turn Log + Info ── */}
              <div className="grid gap-4 content-start">
                {/* P0-2: RPG or standard Turn Log */}
                {isRpg ? (
                  <TurnLogRPG entries={rpgLogEntries} />
                ) : (
                  sim.ok ? (
                    <TurnLog
                      turns={sim.previewTurns}
                      boardHistory={sim.previewHistory}
                      selectedTurnIndex={Math.min(selectedTurnIndex, Math.max(0, sim.previewTurns.length - 1))}
                      onSelect={(i) => setSelectedTurnIndex(i)}
                    />
                  ) : (
                    <div className="text-xs text-slate-600">—</div>
                  )
                )}

                {/* Winner / Match info */}
                {turns.length === 9 && sim.ok ? (
                  <div className={
                    isRpg
                      ? "rounded-lg p-3 text-xs"
                      : "rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700"
                  }
                  style={isRpg ? { background: "rgba(0,0,0,0.4)", color: "#F5F0E1", border: "1px solid rgba(201,168,76,0.2)" } : undefined}
                  >
                    <div>winner: <span className="font-medium">{sim.full.winner}</span> (tiles A/B = {sim.full.tiles.A}/{sim.full.tiles.B})</div>
                    <div className="font-mono mt-1 truncate">matchId: {sim.full.matchId}</div>
                  </div>
                ) : (
                  <div className={
                    isRpg
                      ? "rounded-lg p-3 text-xs"
                      : "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                  }
                  style={isRpg ? { background: "rgba(0,0,0,0.3)", color: "var(--rpg-text-dim, #8A7E6B)" } : undefined}
                  >
                    9手確定後に勝敗が確定します
                  </div>
                )}

                {/* Share buttons */}
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button className={isRpg ? "rpg-result__btn" : "btn"} onClick={copyTranscriptJson} disabled={!sim.ok}>
                      Copy JSON
                    </button>
                    <button className={isRpg ? "rpg-result__btn" : "btn"} onClick={copyShareUrl} disabled={!canFinalize}>
                      Share URL
                    </button>
                    <button className={isRpg ? "rpg-result__btn" : "btn"} onClick={openReplay} disabled={!canFinalize}>
                      Replay
                    </button>
                  </div>
                </div>

                {/* Guest mode post-game CTA */}
                {isGuestMode && turns.length >= 9 && (
                  <div className="grid gap-2 rounded-lg border border-nyano-200 bg-nyano-50 p-3">
                    <div className="text-sm font-medium text-nyano-800">Ready for the real thing?</div>
                    <div className="flex flex-wrap gap-2">
                      <Link className="btn btn-primary no-underline text-xs" to="/decks">Create Your Own Deck</Link>
                      <button className="btn text-xs" onClick={() => { resetMatch(); void loadCardsFromIndex(); }}>
                        Play Again (new decks)
                      </button>
                    </div>
                  </div>
                )}

                {/* AI debug notes (collapsed) */}
                {Object.keys(aiNotes).length > 0 ? (
                  <details className={
                    isRpg
                      ? "rounded-lg p-2 text-xs"
                      : "rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700"
                  }
                  style={isRpg ? { background: "rgba(0,0,0,0.3)", color: "var(--rpg-text-dim, #8A7E6B)" } : undefined}
                  >
                    <summary className="cursor-pointer font-medium">Nyano decisions ({Object.keys(aiNotes).length})</summary>
                    <div className="mt-2 grid gap-1 font-mono">
                      {Object.entries(aiNotes)
                        .sort((a, b) => Number(a[0]) - Number(b[0]))
                        .map(([k, v]) => (
                          <div key={k}>turn {k}: {v}</div>
                        ))}
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
