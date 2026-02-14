import type { FlipTraceV1, Direction } from "@nyano/triad-engine";

/* ═══════════════════════════════════════════════════════════════════════════
   flipTraceDescribe.ts
   
   flipTrace を人間に読みやすい短い日本語テキストに変換するユーティリティ。
   配信での読み上げ・TurnLog表示・overlay用。
   
   commit-0068: P1-1 対応
   ═══════════════════════════════════════════════════════════════════════════ */

const CELL_COORDS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

const DIR_JA: Record<Direction, string> = {
  up: "上",
  right: "右",
  down: "下",
  left: "左",
};

const DIR_ARROW: Record<Direction, string> = {
  up: "↑",
  right: "→",
  down: "↓",
  left: "←",
};

function diagArrow(vert?: Direction, horiz?: Direction): string {
  if (vert === "up" && horiz === "right") return "↗";
  if (vert === "up" && horiz === "left") return "↖";
  if (vert === "down" && horiz === "right") return "↘";
  if (vert === "down" && horiz === "left") return "↙";
  return "◇";
}

function diagDirJa(vert?: Direction, horiz?: Direction): string {
  const v = vert ? DIR_JA[vert] : "";
  const h = horiz ? DIR_JA[horiz] : "";
  return `${v}${h}`;
}

function coord(cellIdx: number): string {
  return CELL_COORDS[cellIdx] ?? String(cellIdx);
}

/* ───────────────────────────────────────────────
   Short Description (badges / overlay)
   e.g. "↑ 7>6 で奪取" or "↗ 5=5 じゃんけん勝ち"
   ─────────────────────────────────────────────── */

export function flipTraceShort(trace: FlipTraceV1): string {
  const arrow = trace.kind === "diag"
    ? diagArrow(trace.vert, trace.horiz)
    : DIR_ARROW[trace.dir ?? "up"];

  const cmp = trace.winBy === "lt"
    ? "<"
    : trace.aVal > trace.dVal
      ? ">"
      : trace.aVal < trace.dVal
        ? "<"
        : "=";
  const base = `${arrow} ${trace.aVal}${cmp}${trace.dVal}`;

  const tags: string[] = [];
  if (trace.tieBreak || trace.winBy === "tieBreak") tags.push("じゃんけん勝ち");
  if (trace.winBy === "same") tags.push("Same");
  if (trace.winBy === "plus") tags.push("Plus");
  if (trace.winBy === "aceKiller") tags.push("Ace Killer");
  if (trace.isChain) tags.push("連鎖");
  if (trace.kind === "diag") tags.push("斜め");

  if (tags.length > 0) return `${base} ${tags.join("・")}`;
  return base;
}

/* ───────────────────────────────────────────────
   Full Description (TurnLog detail / readout)
   e.g. "B2→A2: 上方向 7>6 で奪取"
   ─────────────────────────────────────────────── */

export function flipTraceFull(trace: FlipTraceV1): string {
  const from = coord(trace.from);
  const to = coord(trace.to);

  let dirDesc: string;
  if (trace.kind === "diag") {
    dirDesc = `${diagDirJa(trace.vert, trace.horiz)}斜め`;
  } else {
    dirDesc = `${DIR_JA[trace.dir ?? "up"]}方向`;
  }

  let resultDesc: string;
  if (trace.winBy === "same") {
    resultDesc = `${trace.aVal}=${trace.dVal} Sameで奪取`;
  } else if (trace.winBy === "plus") {
    resultDesc = `${trace.aVal}+${trace.dVal} Plusで奪取`;
  } else if (trace.winBy === "aceKiller") {
    resultDesc = `${trace.aVal}×${trace.dVal} Ace Killerで奪取`;
  } else if (trace.winBy === "lt") {
    resultDesc = `${trace.aVal}<${trace.dVal} で奪取`;
  } else if (trace.aVal > trace.dVal) {
    resultDesc = `${trace.aVal}>${trace.dVal} で奪取`;
  } else if (trace.tieBreak || trace.winBy === "tieBreak") {
    resultDesc = `${trace.aVal}=${trace.dVal} じゃんけんで勝ち`;
  } else {
    resultDesc = `${trace.aVal}=${trace.dVal}`;
  }

  const chain = trace.isChain ? "【連鎖】" : "";

  return `${chain}${from}→${to}: ${dirDesc} ${resultDesc}`;
}

/* ───────────────────────────────────────────────
   Turn Summary Description
   Summarize all flips in a turn as one sentence.
   e.g. "2枚奪取（連鎖あり）"
   ─────────────────────────────────────────────── */

export function flipTracesSummary(traces: readonly FlipTraceV1[]): string {
  if (traces.length === 0) return "奪取なし";

  const chainCount = traces.filter((t) => t.isChain).length;
  const jankenCount = traces.filter((t) => t.tieBreak || t.winBy === "tieBreak").length;
  const diagCount = traces.filter((t) => t.kind === "diag").length;
  const specialCount = traces.filter((t) => t.winBy === "same" || t.winBy === "plus").length;

  const parts: string[] = [`${traces.length}枚奪取`];

  if (chainCount > 0) parts.push(`連鎖${chainCount}`);
  if (jankenCount > 0) parts.push(`じゃんけん${jankenCount}`);
  if (diagCount > 0) parts.push(`斜め${diagCount}`);
  if (specialCount > 0) parts.push(`特別${specialCount}`);

  if (parts.length === 1) return parts[0];
  return `${parts[0]}（${parts.slice(1).join("・")}）`;
}

/* ───────────────────────────────────────────────
   Stream readout (for TTS / chat display)
   ─────────────────────────────────────────────── */

export function flipTracesReadout(
  traces: readonly FlipTraceV1[],
  playerLabel: string,
  cellIdx: number,
): string {
  if (traces.length === 0) return `${playerLabel}が${coord(cellIdx)}に配置`;

  const flipped = traces.map((t) => coord(t.to)).join("・");
  const chainNote = traces.some((t) => t.isChain) ? "（連鎖あり！）" : "";

  return `${playerLabel}が${coord(cellIdx)}に配置 → ${flipped}を奪取${chainNote}`;
}

/* ───────────────────────────────────────────────
   Badge Color Variant (Sprint 35)
   Determines CSS class for flip reason badge coloring.
   ─────────────────────────────────────────────── */

/** Determine badge color variant based on flip trace properties. */
export function flipBadgeVariant(trace: FlipTraceV1): string {
  if (trace.isChain) return "badge-violet";
  if (trace.tieBreak) return "badge-sky";
  if (trace.kind === "diag") return "badge-emerald";
  return "badge-amber";
}
