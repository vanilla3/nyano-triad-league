import React from "react";
import { Link } from "react-router-dom";

import { CopyField } from "@/components/CopyField";
import { NyanoImage } from "@/components/NyanoImage";
import { useToast } from "@/components/Toast";
import { EVENTS, getEventStatus, type EventV1 } from "@/lib/events";
import { postNyanoWarudoSnapshot } from "@/lib/nyano_warudo_bridge";
import { publishStreamCommand, makeStreamCommandId, publishStreamVoteState, readStoredOverlayState, subscribeOverlayState, type OverlayStateV1 } from "@/lib/streamer_bus";

function origin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function pickDefaultEvent(events: EventV1[]): string {
  const now = Date.now();
  const active = events.find((e) => {
    const st = getEventStatus(e, now);
    return st === "active" || st === "always";
  });
  return (active ?? events[0])?.id ?? "";
}

function ageLabel(updatedAtMs?: number): string {
  if (!updatedAtMs) return "—";
  const delta = Math.max(0, Date.now() - updatedAtMs);
  const s = Math.floor(delta / 1000);
  if (s < 1) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}



function fnv1a32Hex(input: string): string {
  // Non-cryptographic stable hash for allowlists (for strictAllowed dedupe).
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // 32-bit multiply: h *= 16777619
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return "0x" + h.toString(16).padStart(8, "0");
}

function currentPlayer(firstPlayer?: 0 | 1, turn?: number): 0 | 1 | null {
  if (typeof firstPlayer !== "number") return null;
  if (typeof turn !== "number") return null;
  return ((firstPlayer + (turn % 2)) % 2) as 0 | 1;
}

// Board coordinates:
//   A1 B1 C1
//   A2 B2 C2
//   A3 B3 C3
function cellCoordToIndex(coord: string): number | null {
  const t = coord.trim().toUpperCase();
  const m = t.match(/^([ABC])([123])$/);
  if (!m) return null;
  const col = m[1] === "A" ? 0 : m[1] === "B" ? 1 : 2;
  const row = Number(m[2]) - 1; // 0..2
  return row * 3 + col; // 0..8
}

function cellIndexToCoord(cell: number): string {
  const c = Math.max(0, Math.min(8, cell));
  const row = Math.floor(c / 3); // 0..2
  const col = c % 3; // 0..2
  const colCh = col === 0 ? "A" : col === 1 ? "B" : "C";
  return `${colCh}${row + 1}`;
}

function parseCardIndexHuman(raw: string): number | null {
  const t = raw.trim().replace(/^#/, "");
  // allow: "0..4" (dev), "1..5" (viewer), "A1..A5" (viewer hand slot)
  const m = t.match(/^A?([0-9]+)$/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;

  // viewer-friendly 1..5 → 0..4
  if (n >= 1 && n <= 5) return n - 1;
  if (n >= 0 && n <= 4) return n;
  return null;
}

function parseCellAny(raw: string): number | null {
  const t = raw.trim();
  if (/^\d$/.test(t)) {
    const n = Number(t);
    if (n >= 0 && n <= 8) return n;
    return null;
  }
  const c = cellCoordToIndex(t);
  if (c === null) return null;
  return c;
}

function toViewerMoveText(m: ParsedMove): string {
  const cardHuman = (m.cardIndex + 1).toString();
  const cellCoord = cellIndexToCoord(m.cell);
  const wm = typeof m.warningMarkCell === "number" ? ` wm=${cellIndexToCoord(m.warningMarkCell)}` : "";
  // canonical: "#triad A<cardSlot>-><cell>"
  return `#triad A${cardHuman}->${cellCoord}${wm}`;
}


type ParsedMove = {
  cell: number;
  cardIndex: number;
  warningMarkCell?: number | null;
};

function parseChatMove(text: string): ParsedMove | null {
  const raw = text.trim();
  if (!raw) return null;

  // Supported formats:
  //  1) Legacy numeric:
  //     - "!move 4 2"
  //     - "4 2 wm=6"
  //  2) Viewer-friendly coordinate:
  //     - "#triad B2 3"          (cellCoord cardSlot)
  //     - "#triad A2->B2"       (cardSlot -> cellCoord)  ※ A2 means "hand slot 2"
  //     - "#triad 3->B2"        (cardSlot -> cellCoord)
  //     - "#triad B2 3 wm=C1"   (wm accepts coord too)
  //
  // Notes:
  //   - cardSlot is 1..5 (viewer) or 0..4 (dev)
  //   - cellCoord is A1..C3, or 0..8
  //   - warning mark is optional (wm=... / w ...)

  // strip prefixes
  const t = raw
    .replace(/^(?:#|!)(?:triad|move|m)\s+/i, "")
    .trim()
    .replace(/　/g, " ") // fullwidth space
    .replace(/[→➡⇒➔⟶⟹⮕]/g, "->")
    .replace(/[‐‑‒–—−]/g, "-") // hyphen variants
    .replace(/＝/g, "=");

  // Extract optional wm first (accept coord or digit)
  let main = t;
  let wm: number | null = null;
  const wmRe = /\s+(?:wm|w)\s*=?\s*([A-C][1-3]|\d)\s*$/i;
  const wmM = main.match(wmRe);
  if (wmM) {
    const c = parseCellAny(wmM[1]);
    if (c === null) return null;
    wm = c;
    main = main.replace(wmRe, "").trim();
  }

  // Arrow style: "<card>-><cell>"
  const arrow = main.match(/^(.*?)\s*->\s*([A-C][1-3]|\d)\s*$/i);
  if (arrow) {
    const cardIndex = parseCardIndexHuman(arrow[1]);
    const cell = parseCellAny(arrow[2]);
    if (cardIndex === null || cell === null) return null;
    return { cell, cardIndex, warningMarkCell: wm };
  }

  // Space style: "<cell> <card>" or "<card> <cell>"
  const parts = main.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    // 1) cell first
    const cell = parseCellAny(parts[0]);
    const cardIndex = parseCardIndexHuman(parts[1]);
    if (cell !== null && cardIndex !== null) return { cell, cardIndex, warningMarkCell: wm };

    // 2) swap (card first) - allows: "#triad 3 B2"
    const cardIndex2 = parseCardIndexHuman(parts[0]);
    const cell2 = parseCellAny(parts[1]);
    if (cell2 !== null && cardIndex2 !== null) return { cell: cell2, cardIndex: cardIndex2, warningMarkCell: wm };

    return null;
  }

  // Fallback legacy numeric without prefix:
  const legacy = raw.match(/^(?<cell>\d)\s+(?<card>\d)(?:\s+(?:wm|w)\s*=?\s*(?<wm>\d))?$/i);
  if (legacy && (legacy as any).groups) {
    const cell = Number((legacy as any).groups.cell);
    const cardIndex = Number((legacy as any).groups.card);
    if (!Number.isFinite(cell) || cell < 0 || cell > 8) return null;
    if (!Number.isFinite(cardIndex) || cardIndex < 0 || cardIndex > 4) return null;
    const wmRaw = (legacy as any).groups.wm;
    const w = typeof wmRaw === "string" && wmRaw.length > 0 ? Number(wmRaw) : null;
    if (w !== null && (!Number.isFinite(w) || w < 0 || w > 8)) return null;
    return { cell, cardIndex, warningMarkCell: w };
  }

  return null;
}

function moveKey(m: ParsedMove): string {
  const wm = typeof m.warningMarkCell === "number" ? ` wm=${m.warningMarkCell}` : "";
  const legacy = `cell ${m.cell} · card ${m.cardIndex}${wm}`;
  const viewer = toViewerMoveText(m);
  return `${legacy}  (${viewer})`;
}


export function StreamPage() {
  const toast = useToast();

  const [eventId, setEventId] = React.useState<string>(() => pickDefaultEvent(EVENTS));
  const e = React.useMemo(() => EVENTS.find((x) => x.id === eventId) ?? null, [eventId]);

  // viewer link (safe)
  const matchUrl = e ? `${origin()}/match?event=${encodeURIComponent(e.id)}` : `${origin()}/match`;
  // host link (accepts /stream commands)
  const hostMatchUrl = e ? `${origin()}/match?event=${encodeURIComponent(e.id)}&stream=1&ctrl=A` : `${origin()}/match?stream=1&ctrl=A`;

  const overlayUrl = `${origin()}/overlay?controls=0`;
  const overlayTransparentUrl = `${origin()}/overlay?controls=0&bg=transparent`;
  const replayBroadcastUrl = `${origin()}/replay?broadcast=1`;

  const copy = async (label: string, v: string) => {
    await navigator.clipboard.writeText(v);
    toast.success("Copied", label);
  };


function downloadTextFile(filename: string, content: string, mime: string) {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    toast.error("Download failed", String(err));
  }
}

function safeFileStem(): string {
  const parts = [
    e?.id ?? "event",
    typeof live?.turn === "number" ? `turn${live.turn}` : null,
    new Date().toISOString().replace(/[:.]/g, "-"),
  ].filter(Boolean);
  return parts.join("_");
}


  // live state from Match/Replay via overlay bus
  const [live, setLive] = React.useState<OverlayStateV1 | null>(() => readStoredOverlayState());

  React.useEffect(() => {
    return subscribeOverlayState((s) => setLive(s));
  }, []);


  // Ensure the overlay is not stuck in OPEN state after refresh
  React.useEffect(() => {
    publishStreamVoteState({ version: 1, updatedAtMs: Date.now(), status: "closed" });
  }, []);

  // chat vote console (prototype)
  const [controlledSide, setControlledSide] = React.useState<0 | 1>(0); // A by default
  const [voteSeconds, setVoteSeconds] = React.useState<number>(15);
  const [autoStartEachTurn, setAutoStartEachTurn] = React.useState<boolean>(false);

  const [voteOpen, setVoteOpen] = React.useState<boolean>(false);
  const [voteTurn, setVoteTurn] = React.useState<number | null>(null);
  const [voteEndsAtMs, setVoteEndsAtMs] = React.useState<number | null>(null);

  const [userName, setUserName] = React.useState<string>("viewer");
  const [chatText, setChatText] = React.useState<string>("!move 4 2");


// Nyano Warudo bridge (Triad League → nyano-warudo)
const [warudoBaseUrl, setWarudoBaseUrl] = React.useState<string>(() => {
  const saved = localStorage.getItem("nyanoWarudo.baseUrl");
  const env = (import.meta as any)?.env?.VITE_NYANO_WARUDO_BASE_URL as string | undefined;
  return (saved ?? env ?? "").toString();
});
const [autoSendPromptOnVoteStart, setAutoSendPromptOnVoteStart] = React.useState<boolean>(false);
const [autoResendStateDuringVoteOpen, setAutoResendStateDuringVoteOpen] = React.useState<boolean>(false);
const [autoSendStateOnVoteEnd, setAutoSendStateOnVoteEnd] = React.useState<boolean>(false);
const [lastBridgePayload, setLastBridgePayload] = React.useState<string>("");
const [lastBridgeResult, setLastBridgeResult] = React.useState<string>("");

React.useEffect(() => {
  // persist for convenience (stream ops)
  try {
    localStorage.setItem("nyanoWarudo.baseUrl", warudoBaseUrl);
  } catch {
    // ignore
  }
}, [warudoBaseUrl]);

function computeEmptyCells(state: OverlayStateV1 | null): number[] {
  if (!state) return [];
  if (Array.isArray(state.usedCells)) {
    const used = new Set(state.usedCells);
    return Array.from({ length: 9 }, (_, i) => i).filter((i) => !used.has(i));
  }
  if (Array.isArray(state.board)) {
    const b = state.board as any[];
    return Array.from({ length: 9 }, (_, i) => i).filter((i) => b[i] == null);
  }
  return Array.from({ length: 9 }, (_, i) => i);
}

function computeUsedCardIndices(state: OverlayStateV1 | null, side: 0 | 1): number[] {
  if (!state) return [];
  const arr = side === 0 ? state.usedCardIndicesA : state.usedCardIndicesB;
  if (Array.isArray(arr)) return arr.map((x) => Number(x)).filter((n) => Number.isFinite(n));

  // fallback: derive from protocolV1
  const p = (state as any).protocolV1 as any;
  if (!p?.header || !Array.isArray(p.turns)) return [];
  const firstPlayer = typeof p.header.firstPlayer === "number" ? (p.header.firstPlayer as 0 | 1) : null;
  if (firstPlayer === null) return [];
  const used: number[] = [];
  for (let i = 0; i < p.turns.length; i++) {
    const by = ((firstPlayer + (i % 2)) % 2) as 0 | 1;
    if (by !== side) continue;
    const ci = Number(p.turns[i]?.cardIndex);
    if (Number.isFinite(ci)) used.push(ci);
  }
  return used;
}

function computeWarningMarksUsed(state: OverlayStateV1 | null, side: 0 | 1): number {
  if (!state) return 0;
  const v = side === 0 ? state.warningMarksUsedA : state.warningMarksUsedB;
  if (typeof v === "number" && Number.isFinite(v)) return v;

  // fallback: derive from protocolV1
  const p = (state as any).protocolV1 as any;
  if (!p?.header || !Array.isArray(p.turns)) return 0;
  const firstPlayer = typeof p.header.firstPlayer === "number" ? (p.header.firstPlayer as 0 | 1) : null;
  if (firstPlayer === null) return 0;
  let used = 0;
  for (let i = 0; i < p.turns.length; i++) {
    const by = ((firstPlayer + (i % 2)) % 2) as 0 | 1;
    if (by !== side) continue;
    if (typeof p.turns[i]?.warningMarkCell === "number") used += 1;
  }
  return used;
}

function computeRemainingCardIndices(state: OverlayStateV1 | null, side: 0 | 1): number[] {
  const used = new Set(computeUsedCardIndices(state, side));
  return [0, 1, 2, 3, 4].filter((i) => !used.has(i));
}

function bestEffortBoardToProtocolBoard(state: OverlayStateV1 | null): Array<any | null> {
  // For nyano-warudo display/aggregation: keep it simple.
  const out: Array<any | null> = Array.from({ length: 9 }, () => null);
  if (!state || !Array.isArray(state.board)) return out;

  const deckA = Array.isArray(state.deckA) ? state.deckA.map(String) : [];
  const deckB = Array.isArray(state.deckB) ? state.deckB.map(String) : [];

  const b = state.board as any[];
  for (let i = 0; i < 9; i++) {
    const cell = b[i];
    if (!cell) continue;
    const ownerRaw = (cell as any).owner;
    const owner = ownerRaw === 0 || ownerRaw === "0" || ownerRaw === "A" ? "A" : ownerRaw === 1 || ownerRaw === "1" || ownerRaw === "B" ? "B" : null;
    if (!owner) continue;

    const tokenId = (cell as any)?.card?.tokenId != null ? String((cell as any).card.tokenId) : null;
    const deck = owner === "A" ? deckA : deckB;
    const slot = tokenId ? deck.findIndex((x) => x === tokenId) : -1;

    out[i] = {
      owner,
      cardSlot: slot >= 0 ? slot : undefined,
      tokenId: tokenId ?? undefined,
    };
  }
  return out;
}

function buildStateJsonContent(state: OverlayStateV1 | null, controlled: 0 | 1): any {
  const now = Date.now();
  const first = typeof state?.firstPlayer === "number" ? (state!.firstPlayer as 0 | 1) : null;
  const turn = typeof state?.turn === "number" ? Number(state!.turn) : null;
  const toPlay = first !== null && turn !== null ? ((first + (turn % 2)) % 2) as 0 | 1 : null;

  const emptyCells = computeEmptyCells(state);
  const remainA = computeRemainingCardIndices(state, 0);
  const remainB = computeRemainingCardIndices(state, 1);
  const remainToPlay = toPlay === 0 ? remainA : toPlay === 1 ? remainB : [];

  const wUsed = toPlay === 0 ? computeWarningMarksUsed(state, 0) : toPlay === 1 ? computeWarningMarksUsed(state, 1) : 0;
  const wRemain = Math.max(0, 3 - wUsed);
  const wmCandidates = wRemain > 0 ? emptyCells.map(cellIndexToCoord) : [];

  const legalMoves: any[] = [];
  for (const cell of emptyCells) {
    for (const cardIndex of remainToPlay) {
      legalMoves.push({
        cell,
        cardIndex,
        viewer: toViewerMoveText({ cell, cardIndex }),
      });
    }
  }

  const allowlist = legalMoves.map((m) => String(m.viewer)).sort();
  const allowlistHash = fnv1a32Hex(allowlist.join("\n"));

  return {
    protocol: "triad_league_state_json_v1",
    sentAtMs: now,
    eventId: state?.eventId ?? null,
    eventTitle: state?.eventTitle ?? null,
    mode: state?.mode ?? null,
    status: (state as any).status ?? null,
    turn,
    toPlay: toPlay === 0 ? "A" : toPlay === 1 ? "B" : null,
    controlledSide: controlled === 0 ? "A" : "B",
    viewerCommandFormat: "#triad A2->B2 wm=C1",

    // Protocol snapshot (best-effort)
    protocolV1: (state as any)?.protocolV1 ?? null,

    // Board in a minimal & stable shape
    board: bestEffortBoardToProtocolBoard(state),

    // Hand slots (tokenIds only, stable)
    hands: {
      A: Array.isArray(state?.deckA)
        ? state!.deckA.map((t, i) => ({ slot: i, tokenId: String(t), used: computeUsedCardIndices(state, 0).includes(i) }))
        : [],
      B: Array.isArray(state?.deckB)
        ? state!.deckB.map((t, i) => ({ slot: i, tokenId: String(t), used: computeUsedCardIndices(state, 1).includes(i) }))
        : [],
    },

    // Turn-local legal action space
    legalMoves,
    strictAllowed: {
      allowlist,
      hash: allowlistHash,
    },
    warningMark: {
      used: wUsed,
      remaining: wRemain,
      candidates: wmCandidates,
    },
  };
}

function buildAiPrompt(state: OverlayStateV1 | null, controlled: 0 | 1): string {
  const first = typeof state?.firstPlayer === "number" ? (state!.firstPlayer as 0 | 1) : null;
  const turn = typeof state?.turn === "number" ? Number(state!.turn) : null;
  const toPlay = first !== null && turn !== null ? ((first + (turn % 2)) % 2) as 0 | 1 : null;

  const emptyCells = computeEmptyCells(state);
  const remain = computeRemainingCardIndices(state, toPlay === 1 ? 1 : 0);
  const wUsed = computeWarningMarksUsed(state, toPlay === 1 ? 1 : 0);
  const wRemain = Math.max(0, 3 - wUsed);

  const boardMini = bestEffortBoardToProtocolBoard(state);

  const lines: string[] = [];
  lines.push("Nyano Triad League snapshot (ai_prompt)");
  lines.push(`event: ${state?.eventTitle ?? state?.eventId ?? "—"}`);
  lines.push(`mode: ${state?.mode ?? "—"}  turn: ${turn ?? "—"}/9`);
  lines.push(`to_play: ${toPlay === 0 ? "A" : toPlay === 1 ? "B" : "—"}  controlled: ${controlled === 0 ? "A" : "B"}`);
  lines.push("");
  lines.push("Objective:");
  lines.push("- Choose ONE strong move for the side to_play. Return ONLY the viewer command.");
  lines.push("");
  lines.push("Viewer command format:");
  lines.push("- #triad A<slot>-><cell> wm=<cell> (wm optional)");
  lines.push("  examples: #triad A2->B2   /   #triad A3->C3 wm=A1");
  lines.push("");
  lines.push("Board (A1..C3): each cell = owner+slot (tokenId if known)");
  // render grid
  const cellLabel = (i: number): string => {
    const c = boardMini[i];
    if (!c) return "--";
    const owner = c.owner ?? "?";
    const slot = typeof c.cardSlot === "number" ? `A${c.cardSlot + 1}` : "A?";
    return `${owner}${slot}`;
  };
  lines.push(`A1 ${cellLabel(0)} | B1 ${cellLabel(1)} | C1 ${cellLabel(2)}`);
  lines.push(`A2 ${cellLabel(3)} | B2 ${cellLabel(4)} | C2 ${cellLabel(5)}`);
  lines.push(`A3 ${cellLabel(6)} | B3 ${cellLabel(7)} | C3 ${cellLabel(8)}`);
  lines.push("");
  lines.push(`Empty cells: ${emptyCells.map(cellIndexToCoord).join(", ")}`);
  lines.push(`Remaining hand slots for to_play: ${remain.map((i) => `A${i + 1}`).join(", ") || "—"}`);
  lines.push(`WarningMark: remaining=${wRemain} (used=${wUsed}) candidates=${wRemain > 0 ? emptyCells.map(cellIndexToCoord).join(", ") : "—"}`);
  lines.push("");
  lines.push("Legal moves (cell+slot):");
  // Print up to 30 moves to keep prompt readable
  const max = 30;
  let printed = 0;
  for (const cell of emptyCells) {
    for (const cardIndex of remain) {
      if (printed >= max) break;
      lines.push(`- #triad A${cardIndex + 1}->${cellIndexToCoord(cell)}`);
      printed += 1;
    }
    if (printed >= max) break;
  }
  if (emptyCells.length * remain.length > max) lines.push(`... (${emptyCells.length * remain.length} total)`);
  lines.push("");
  lines.push("Return format: ONLY one line, e.g. '#triad A2->B2' or '#triad A2->B2 wm=C1'");

  return lines.join("\n");
}

const sendNyanoWarudo = React.useCallback(
  async (kind: "ai_prompt" | "state_json", opts?: { silent?: boolean }) => {
    const state = live;
    if (!state) {
      const msg = "No live state yet (open /match or /replay with broadcast=1).";
      setLastBridgeResult(msg);
      if (!opts?.silent) toast.warn("Nyano Warudo", msg);
      return;
    }

    const content =
      kind === "ai_prompt"
        ? buildAiPrompt(state, controlledSide)
        : JSON.stringify(buildStateJsonContent(state, controlledSide), null, 2);

    setLastBridgePayload(content);

    const res = await postNyanoWarudoSnapshot(warudoBaseUrl, {
      source: "triad_league",
      kind,
      content,
    });

    const summary = `ok=${res.ok} status=${res.status} ${res.text ? `\n${res.text}` : ""}`;
    setLastBridgeResult(summary);
    if (!opts?.silent) {
      if (res.ok) toast.success("Nyano Warudo", `Sent ${kind}`);
      else toast.error("Nyano Warudo", `Failed to send ${kind}`);
    }
  },
  [live, controlledSide, warudoBaseUrl, toast]
);


const downloadStateJson = React.useCallback(() => {
  const state = live;
  if (!state) {
    toast.warn("Download", "No live state yet.");
    return;
  }
  const contentObj = buildStateJsonContent(state, controlledSide);
  const content = JSON.stringify(contentObj, null, 2);
  setLastBridgePayload(content);
  downloadTextFile(`triad_state_json_${safeFileStem()}.json`, content, "application/json");
}, [live, controlledSide, toast]);

const downloadTranscript = React.useCallback(() => {
  const state = live;
  if (!state) {
    toast.warn("Download", "No live state yet.");
    return;
  }
  const protocolV1 = (state as any)?.protocolV1 ?? null;
  const content = JSON.stringify(
    {
      protocol: "triad_league_transcript_v1",
      exportedAtMs: Date.now(),
      eventId: state.eventId ?? null,
      eventTitle: state.eventTitle ?? null,
      result: (state as any).status ?? null,
      protocolV1,
    },
    null,
    2
  );
  setLastBridgePayload(content);
  downloadTextFile(`triad_transcript_${safeFileStem()}.json`, content, "application/json");
}, [live, toast]);

const downloadAiPrompt = React.useCallback(() => {
  const state = live;
  if (!state) {
    toast.warn("Download", "No live state yet.");
    return;
  }
  const content = buildAiPrompt(state, controlledSide);
  setLastBridgePayload(content);
  downloadTextFile(`triad_ai_prompt_${safeFileStem()}.txt`, content, "text/plain");
}, [live, controlledSide, toast]);


  // Quick move picker (error prevention + faster stream ops)
  const [pickCell, setPickCell] = React.useState<number | null>(null);
  const [pickCardIndex, setPickCardIndex] = React.useState<number | null>(null);
  const [pickWarningMarkCell, setPickWarningMarkCell] = React.useState<number | null>(null);

  const [votesByUser, setVotesByUser] = React.useState<Record<string, ParsedMove>>({});

  const liveTurn = typeof live?.turn === "number" ? live.turn : null;
  const liveFirst = typeof live?.firstPlayer === "number" ? (live.firstPlayer as 0 | 1) : null;
  const liveCurrent = currentPlayer(liveFirst ?? undefined, liveTurn ?? undefined);

const canVoteNow =
  live?.mode === "live" &&
  typeof liveTurn === "number" &&
  typeof liveCurrent === "number" &&
  liveCurrent === controlledSide;

// Best-effort "legal move" hints from the host (/match) via overlay bus.
const usedCellsLive = React.useMemo(() => {
  const arr = Array.isArray((live as any)?.usedCells) ? ((live as any).usedCells as number[]) : null;
  if (arr && arr.length >= 0) return new Set(arr.filter((x) => Number.isFinite(x)));
  // fallback: derive from board occupancy
  const b: any[] = Array.isArray((live as any)?.board) ? ((live as any).board as any[]) : [];
  const s = new Set<number>();
  for (let i = 0; i < 9; i++) if (b[i]?.card) s.add(i);
  return s;
}, [live?.updatedAtMs]);

const remainingCellsLive = React.useMemo(() => {
  const out: number[] = [];
  for (let c = 0; c < 9; c++) if (!usedCellsLive.has(c)) out.push(c);
  return out;
}, [usedCellsLive]);

const usedCardsLive = React.useMemo(() => {
  const a = Array.isArray((live as any)?.usedCardIndicesA) ? ((live as any).usedCardIndicesA as number[]) : [];
  const b = Array.isArray((live as any)?.usedCardIndicesB) ? ((live as any).usedCardIndicesB as number[]) : [];
  const s = controlledSide === 0 ? a : b;
  return new Set(s.filter((x) => Number.isFinite(x)));
}, [live?.updatedAtMs, controlledSide]);

const remainingCardsLive = React.useMemo(() => {
  const out: number[] = [];
  for (let i = 0; i < 5; i++) if (!usedCardsLive.has(i)) out.push(i);
  return out;
}, [usedCardsLive]);

const remainingWarningMarks = React.useMemo(() => {
  const usedA = typeof (live as any)?.warningMarksUsedA === "number" ? (live as any).warningMarksUsedA : 0;
  const usedB = typeof (live as any)?.warningMarksUsedB === "number" ? (live as any).warningMarksUsedB : 0;
  const used = controlledSide === 0 ? usedA : usedB;
  return Math.max(0, 3 - used);
}, [live?.updatedAtMs, controlledSide]);

  const resetVotes = React.useCallback(() => {
    setVotesByUser({});
  }, []);

  const startVote = React.useCallback(() => {
    if (!canVoteNow) {
      toast.warn("Vote", "Live match is not ready or it's not the controlled side's turn.");
      return;
    }
    const sec = Math.max(5, Math.min(60, Math.floor(voteSeconds || 15)));
    const now = Date.now();
    setVoteOpen(true);
    if (autoSendPromptOnVoteStart) {
      // best-effort (do not block stream ops)
      // IMPORTANT: Send state_json first so nyano-warudo strictAllowed can lock an up-to-date allowlist during the vote.
      sendNyanoWarudo("state_json", { silent: true }).catch(() => {});
      sendNyanoWarudo("ai_prompt", { silent: true }).catch(() => {});
    }
    setVoteTurn(liveTurn);
    setVoteEndsAtMs(now + sec * 1000);
    resetVotes();
    toast.success("Vote", `Started (${sec}s) for turn ${liveTurn}`);
  }, [canVoteNow, voteSeconds, liveTurn, resetVotes, toast, autoSendPromptOnVoteStart, sendNyanoWarudo]);

  const pickWinner = React.useCallback((): ParsedMove | null => {
    const entries = Object.values(votesByUser);
    if (entries.length === 0) return null;

    const counts = new Map<string, { move: ParsedMove; count: number }>();
    for (const mv of entries) {
      const k = JSON.stringify(mv);
      const prev = counts.get(k);
      if (prev) prev.count += 1;
      else counts.set(k, { move: mv, count: 1 });
    }

    // pick highest count; break ties by (cell asc, cardIndex asc, warningMarkCell asc/null last)
    const sorted = Array.from(counts.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (a.move.cell !== b.move.cell) return a.move.cell - b.move.cell;
      if (a.move.cardIndex !== b.move.cardIndex) return a.move.cardIndex - b.move.cardIndex;
      const aw = typeof a.move.warningMarkCell === "number" ? a.move.warningMarkCell : 999;
      const bw = typeof b.move.warningMarkCell === "number" ? b.move.warningMarkCell : 999;
      return aw - bw;
    });

    return sorted[0]?.move ?? null;
  }, [votesByUser]);

  const finalizeVote = React.useCallback(() => {
    if (!voteOpen) return;

    const mv = pickWinner();
    if (!mv) {
      toast.warn("Vote", "No votes.");
      setVoteOpen(false);
      setVoteTurn(null);
      setVoteEndsAtMs(null);
      return;
    }

    if (!canVoteNow || liveTurn === null) {
      toast.warn("Vote", "Live match is not ready.");
      setVoteOpen(false);
      setVoteTurn(null);
      setVoteEndsAtMs(null);
      return;
    }

    publishStreamCommand({
      version: 1,
      id: makeStreamCommandId("move"),
      issuedAtMs: Date.now(),
      type: "commit_move_v1",
      by: controlledSide,
      forTurn: liveTurn,
      move: mv,
      source: "stream_vote_console",
    });


if (autoSendStateOnVoteEnd) {
  sendNyanoWarudo("state_json", { silent: true }).catch(() => {});
}

    toast.success("Sent", moveKey(mv));
    setVoteOpen(false);
    setVoteTurn(null);
    setVoteEndsAtMs(null);
    resetVotes();
  }, [voteOpen, pickWinner, canVoteNow, liveTurn, controlledSide, resetVotes, toast, autoSendStateOnVoteEnd, sendNyanoWarudo]);

// keep nyano-warudo strictAllowed allowlist fresh during an open vote (optional)
const resendTimerRef = React.useRef<number | null>(null);
const lastResendSigRef = React.useRef<string>("");

React.useEffect(() => {
  if (!autoResendStateDuringVoteOpen) return;
  if (!voteOpen) return;
  if (!live) return;

  // Signature of "things that affect legal moves" (keep tiny to avoid noise)
  const sigObj = {
    updatedAtMs: live.updatedAtMs ?? null,
    turn: typeof live.turn === "number" ? live.turn : null,
    firstPlayer: typeof live.firstPlayer === "number" ? live.firstPlayer : null,
    usedCells: Array.isArray(live.usedCells) ? live.usedCells : null,
    usedA: Array.isArray(live.usedCardIndicesA) ? live.usedCardIndicesA : null,
    usedB: Array.isArray(live.usedCardIndicesB) ? live.usedCardIndicesB : null,
    wA: typeof live.warningMarksUsedA === "number" ? live.warningMarksUsedA : null,
    wB: typeof live.warningMarksUsedB === "number" ? live.warningMarksUsedB : null,
  };
  const sig = JSON.stringify(sigObj);
  if (sig === lastResendSigRef.current) return;
  lastResendSigRef.current = sig;

  if (resendTimerRef.current) window.clearTimeout(resendTimerRef.current);
  resendTimerRef.current = window.setTimeout(() => {
    sendNyanoWarudo("state_json", { silent: true }).catch(() => {});
  }, 250);

  return () => {
    if (resendTimerRef.current) window.clearTimeout(resendTimerRef.current);
    resendTimerRef.current = null;
  };
}, [autoResendStateDuringVoteOpen, voteOpen, live?.updatedAtMs, controlledSide, sendNyanoWarudo]);

  // timer tick
  React.useEffect(() => {
    if (!voteOpen || !voteEndsAtMs) return;
    const t = window.setInterval(() => {
      if (Date.now() >= voteEndsAtMs) {
        window.clearInterval(t);
        finalizeVote();
      }
    }, 250);
    return () => window.clearInterval(t);
  }, [voteOpen, voteEndsAtMs, finalizeVote]);

  // auto start on each turn if enabled
  React.useEffect(() => {
    if (!autoStartEachTurn) return;
    if (!canVoteNow) return;
    // if turn changed, restart
    if (typeof liveTurn !== "number") return;
    if (voteOpen && voteTurn === liveTurn) return;
    startVote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartEachTurn, canVoteNow, liveTurn]);

  // keep vote scoped to the correct turn
  React.useEffect(() => {
    if (!voteOpen) return;
    if (voteTurn === null || liveTurn === null) return;
    if (voteTurn !== liveTurn) {
      // turn advanced; close vote silently (next vote may auto-start)
      setVoteOpen(false);
      setVoteTurn(null);
      setVoteEndsAtMs(null);
      resetVotes();
    }
  }, [voteOpen, voteTurn, liveTurn, resetVotes]);

  const addVoteFromChat = React.useCallback(() => {
    const mv = parseChatMove(chatText);
    if (!mv) {
      toast.error("Vote", "Could not parse. Example: !move 4 2 wm=6");
      return;
    }
    const u = userName.trim() || "viewer";
    setVotesByUser((prev) => ({ ...prev, [u]: mv }));
  }, [chatText, userName, toast]);

  const counts = React.useMemo(() => {
    const entries = Object.values(votesByUser);
    const map = new Map<string, { move: ParsedMove; count: number }>();
    for (const mv of entries) {
      const k = JSON.stringify(mv);
      const prev = map.get(k);
      if (prev) prev.count += 1;
      else map.set(k, { move: mv, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [votesByUser]);

  const timeLeft = React.useMemo(() => {
    if (!voteOpen || !voteEndsAtMs) return null;
    return Math.max(0, Math.ceil((voteEndsAtMs - Date.now()) / 1000));
  }, [voteOpen, voteEndsAtMs]);

// Broadcast vote state to the overlay (OBS) so viewers can see countdown + top votes.
React.useEffect(() => {
  const now = Date.now();
  const totalVotes = Object.keys(votesByUser).length;
  const top = counts.slice(0, 3).map((x) => ({ move: x.move, count: x.count }));

  if (!voteOpen) {
    publishStreamVoteState({
      version: 1,
      updatedAtMs: now,
      status: "closed",
      eventId: live?.eventId,
      eventTitle: live?.eventTitle,
      turn: typeof liveTurn === "number" ? liveTurn : undefined,
      controlledSide,
      totalVotes,
      top,
    });
    return;
  }

  publishStreamVoteState({
    version: 1,
    updatedAtMs: now,
    status: "open",
    eventId: live?.eventId,
    eventTitle: live?.eventTitle,
    turn: voteTurn ?? (typeof liveTurn === "number" ? liveTurn : undefined),
    controlledSide,
    endsAtMs: voteEndsAtMs ?? undefined,
    totalVotes,
    top,
    note: canVoteNow ? "Voting…" : "Waiting for the host to be ready…",
  });
}, [voteOpen, voteEndsAtMs, voteTurn, votesByUser, counts, controlledSide, live?.eventId, live?.eventTitle, liveTurn, canVoteNow]);


function buildMoveText(cell: number, cardIndex: number, wm: number | null): string {
  const base = `!move ${cell} ${cardIndex}`;
  if (typeof wm === "number") return `${base} wm=${wm}`;
  return base;
}

const applyPickerToChatText = React.useCallback(() => {
  if (pickCell === null || pickCardIndex === null) {
    toast.warn("Picker", "Select a cell and a card first.");
    return;
  }
  const wm = pickWarningMarkCell;
  const txt = buildMoveText(pickCell, pickCardIndex, wm);
  setChatText(txt);
  toast.success("Picker", "Filled chat command");
}, [pickCell, pickCardIndex, pickWarningMarkCell, toast]);

const addVoteFromPicker = React.useCallback(() => {
  if (!voteOpen) {
    toast.warn("Vote", "Start vote first.");
    return;
  }
  if (pickCell === null || pickCardIndex === null) {
    toast.warn("Vote", "Select a cell and a card first.");
    return;
  }
  const u = userName.trim() || "viewer";
  setVotesByUser((prev) => ({
    ...prev,
    [u]: { cell: pickCell, cardIndex: pickCardIndex, warningMarkCell: pickWarningMarkCell },
  }));
  toast.success("Vote", "Added vote from picker");
}, [voteOpen, pickCell, pickCardIndex, pickWarningMarkCell, userName, toast]);

const clearPicker = React.useCallback(() => {
  setPickCell(null);
  setPickCardIndex(null);
  setPickWarningMarkCell(null);
}, []);

return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-hd">
          <div>
            <div className="flex items-center gap-3">
              <NyanoImage size={56} className="shrink-0" alt="Nyano" />
              <div className="text-lg font-semibold">🎥 Nyano Stream Studio</div>
            </div>
            <div className="text-sm text-slate-600">
              Twitch配信に向けた「導線・見せ方・共有」を整えます。まずは OBS Overlay → その次に Chat voting。
            </div>
          </div>
        </div>

        <div className="card-bd space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold text-slate-800">Step 1 · Feature an Event</div>
              <div className="mt-2 flex flex-col gap-2">
                <label className="text-xs text-slate-600">Event</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={eventId}
                  onChange={(ev) => setEventId(ev.target.value)}
                >
                  {EVENTS.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.title}
                    </option>
                  ))}
                </select>

                {e ? <div className="text-xs text-slate-500 mt-2">{e.description}</div> : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button className="btn btn-sm btn-primary" onClick={() => copy("Challenge link", matchUrl)}>
                    Copy challenge link
                  </button>
                  <a className="btn btn-sm no-underline" href={matchUrl} target="_blank" rel="noreferrer noopener">
                    Open (viewer)
                  </a>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button className="btn btn-sm" onClick={() => copy("Host match (stream)", hostMatchUrl)}>
                    Copy host match (stream)
                  </button>
                  <a className="btn btn-sm no-underline" href={hostMatchUrl} target="_blank" rel="noreferrer noopener">
                    Open (host)
                  </a>
                </div>

                <div className="text-[11px] text-slate-500">
                  Host側は <span className="font-mono">stream=1</span> で投票結果を反映できます。
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold text-slate-800">Step 2 · Add OBS Overlay</div>
              <div className="mt-2 space-y-3">
                <CopyField label="Overlay URL (no controls)" value={overlayUrl} href={overlayUrl} />
                <CopyField label="Overlay URL (transparent)" value={overlayTransparentUrl} href={overlayTransparentUrl} />
                <div className="text-xs text-slate-500">
                  OBSのBrowser Sourceに貼るだけで、<span className="font-mono">/match</span> や <span className="font-mono">/replay</span> の進行が表示されます。
                </div>
              </div>
            </div>
          </div>

          <div className="callout callout-info">
            <div className="text-xs font-semibold">配信の“最短”の回し方（暫定）</div>
            <div className="mt-1 text-sm text-slate-800">
              視聴者には <span className="font-mono">challenge link</span> を配り、勝ったリプレイURLをチャットに貼ってもらいます。
              <br />
              配信側は <Link to="/replay">Replay</Link> で拾って、解説・採点・ランキング化へ。
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
            <div className="text-xs font-semibold text-slate-800">Step 3 · Review replays on stream</div>
            <div className="mt-1 text-sm text-slate-700">
              <span className="font-mono">/replay</span> で共有URLを開き、<span className="font-semibold">Broadcast to overlay</span> をONにすると、
              overlayが step と一緒に追随します（解説がしやすい）。
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button className="btn btn-sm btn-primary" onClick={() => copy("Replay (broadcast)", replayBroadcastUrl)}>
                Copy replay (broadcast)
              </button>
              <a className="btn btn-sm no-underline" href={replayBroadcastUrl} target="_blank" rel="noreferrer noopener">
                Open
              </a>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              ※ OBS側は <span className="font-mono">/overlay</span> を表示しておけばOK
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-800">Step 4 · Nyano vs Chat (prototype)</div>
                <div className="mt-1 text-xs text-slate-600">
                  Twitch連携の前に、まずは <span className="font-mono">/stream</span> で投票集計 → <span className="font-mono">/match</span> に反映する最小ループを作ります。
                </div>
              </div>

              <div className="text-xs text-slate-500">
                live: <span className="font-mono">{live?.mode ?? "—"}</span> · updated: <span className="font-mono">{ageLabel(live?.updatedAtMs)}</span>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-slate-700">Live status (from overlay bus)</div>
                <div className="mt-1 text-xs text-slate-700">
                  Event: <span className="font-mono">{live?.eventId ?? "—"}</span>
                </div>
                <div className="mt-1 text-xs text-slate-700">
                  Turn: <span className="font-mono">{typeof liveTurn === "number" ? liveTurn : "—"}</span> · to play:{" "}
                  <span className="font-mono">{liveCurrent === 0 ? "A" : liveCurrent === 1 ? "B" : "—"}</span>
                </div>
                {live?.lastMove ? (
                  <div className="mt-1 text-xs text-slate-700">
                    Last: <span className="font-mono">{live.lastMove.by === 0 ? "A" : "B"}</span> cell{" "}
                    <span className="font-mono">{live.lastMove.cell}</span> card{" "}
                    <span className="font-mono">{live.lastMove.cardIndex}</span>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-slate-700">Vote control</div>

                <div className="mt-2 grid gap-2">
                  <label className="text-[11px] text-slate-600">Controlled side</label>

<label className="flex items-center gap-2 text-xs text-slate-700">
  <input
    type="checkbox"
    checked={autoResendStateDuringVoteOpen}
    onChange={(e) => setAutoResendStateDuringVoteOpen(e.target.checked)}
  />
  vote open → refresh state_json on state updates (strictAllowed)
</label>
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    value={String(controlledSide)}
                    onChange={(e) => setControlledSide((Number(e.target.value) === 1 ? 1 : 0) as 0 | 1)}
                  >
                    <option value="0">A</option>
                    <option value="1">B</option>
                  </select>

                  <label className="text-[11px] text-slate-600">Vote seconds</label>
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    type="number"
                    min={5}
                    max={60}
                    value={voteSeconds}
                    onChange={(e) => setVoteSeconds(Number(e.target.value))}
                  />

                  <label className="text-[11px] text-slate-600">Auto start each turn</label>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={autoStartEachTurn} onChange={(e) => setAutoStartEachTurn(e.target.checked)} />
                    enable
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button className="btn btn-sm btn-primary" onClick={startVote} disabled={!canVoteNow}>
                    Start vote
                  </button>
                  <button className="btn btn-sm" onClick={finalizeVote} disabled={!voteOpen}>
                    End & send
                  </button>
                  <button className="btn btn-sm" onClick={resetVotes}>
                    Clear votes
                  </button>
                  {voteOpen ? (
                    <span className="badge badge-emerald">OPEN · {timeLeft ?? "?"}s</span>
                  ) : (
                    <span className="badge">CLOSED</span>
                  )}
                </div>

                <div className="mt-2 text-[11px] text-slate-500">
                  ※ <span className="font-mono">/match</span> は <span className="font-mono">stream=1</span>（Host link）で開いてください。
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-slate-700">Simulated chat input</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="viewer"
                  />
                  <input
                    className="col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="!move 4 2 wm=6"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button className="btn btn-sm btn-primary" onClick={addVoteFromChat} disabled={!voteOpen}>
                    Add vote
                  </button>
                  <div className="text-[11px] text-slate-500">example: <span className="font-mono">!move 4 2</span> / <span className="font-mono">4 2 wm=6</span></div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-slate-700">Top votes</div>
                {counts.length === 0 ? (
                  <div className="mt-2 text-xs text-slate-500">No votes yet.</div>
                ) : (
                  <div className="mt-2 space-y-1">
                    {counts.slice(0, 5).map((x, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono">{moveKey(x.move)}</span>
                        <span className="badge badge-sky">{x.count}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 text-[11px] text-slate-500">
                  tie-break: cell→cardIndex→wm（小さい方が勝ち）
                </div>
              </div>
            </div>


<div className="mt-3 grid gap-3 md:grid-cols-2">
  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
    <div className="flex items-center justify-between gap-2">
      <div className="text-[11px] font-semibold text-slate-700">Nyano Warudo Bridge</div>
      <div className="text-[11px] text-slate-500 font-mono">POST /v1/snapshots</div>
    </div>
    <div className="mt-2 space-y-2">
      <label className="text-[11px] text-slate-600">nyano-warudo Base URL</label>
      <input
        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
        value={warudoBaseUrl}
        onChange={(e) => setWarudoBaseUrl(e.target.value)}
        placeholder="http://localhost:8787"
      />
      <div className="text-[11px] text-slate-500">
        ※ CORSで失敗する場合は nyano-warudo 側で localhost を許可してください。
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={autoSendPromptOnVoteStart}
            onChange={(e) => setAutoSendPromptOnVoteStart(e.target.checked)}
          />
          vote start → state_json + ai_prompt
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={autoSendStateOnVoteEnd}
            onChange={(e) => setAutoSendStateOnVoteEnd(e.target.checked)}
          />
          vote end → state_json
        </label>
      </div>

<div className="mt-1 text-[11px] text-slate-500">
  strictAllowed 用に、投票開始時点で state_json（合法手 allowlist）も送ります。
</div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button className="btn btn-sm btn-primary" onClick={() => sendNyanoWarudo("ai_prompt")}>
          Send ai_prompt
        </button>
        <button className="btn btn-sm" onClick={() => sendNyanoWarudo("state_json")}>
          Send state_json
        </button>
      </div>

<div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
  <div className="text-[11px] font-semibold text-slate-700">Samples (share to nyano-warudo)</div>
  <div className="mt-1 text-[11px] text-slate-500">
    “実戦の1ゲーム分サンプル” を渡す用途。payload は右の欄にも残ります。
  </div>
  <div className="mt-2 flex flex-wrap items-center gap-2">
    <button className="btn btn-sm" onClick={downloadStateJson}>
      Download state_json
    </button>
    <button className="btn btn-sm" onClick={downloadTranscript}>
      Download transcript
    </button>
    <button className="btn btn-sm" onClick={downloadAiPrompt}>
      Download ai_prompt
    </button>
  </div>
</div>

      <div className="mt-2 text-[11px] text-slate-500">
        viewer cmd format: <span className="font-mono">#triad A2-&gt;B2 wm=C1</span>
      </div>
    </div>
  </div>

  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
    <div className="text-[11px] font-semibold text-slate-700">Last payload / result</div>
    <div className="mt-2 space-y-2">
      <CopyField label="payload (content)" value={lastBridgePayload || "—"} />
      <CopyField label="result" value={lastBridgeResult || "—"} />
    </div>
  </div>
</div>

            <div className="mt-3 text-[11px] text-slate-500">
              ここで確立した「command bus」は、次の段階で Twitch Bridge（EventSub/IRC）に置き換え可能です。
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <div>
            <div className="text-base font-semibold">Links</div>
            <div className="text-xs text-slate-600">便利リンク</div>
          </div>
        </div>
        <div className="card-bd flex flex-wrap items-center gap-2">
          <Link className="btn no-underline" to="/events">
            Events
          </Link>
          <Link className="btn no-underline" to="/match">
            Match
          </Link>
          <Link className="btn no-underline" to="/replay">
            Replay
          </Link>
          <a className="btn no-underline" href={overlayUrl} target="_blank" rel="noreferrer noopener">
            Overlay
          </a>
        </div>
      </div>
    </div>
  );
}
