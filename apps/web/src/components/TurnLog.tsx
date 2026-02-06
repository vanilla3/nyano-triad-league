import React from "react";
import type { BoardState, TurnSummary } from "@nyano/triad-engine";
import { FlipTraceBadges, FlipTraceDetailList } from "@/components/FlipTraceBadges";

const cellRC = (cell: number): string => {
  const r = Math.floor(cell / 3);
  const c = cell % 3;
  return `${r},${c}`;
};

type Owner = 0 | 1;

type EdgeDir = "up" | "right" | "down" | "left";

type FlipDetail = {
  cell: number;
  tokenId: bigint;
  from: Owner;
  to: Owner;
  dirFromPlaced: EdgeDir | null;
  explain: string;
};

type TurnDelta = {
  placedCell: number | null;
  placedTokenId: bigint | null;
  placedOwner: Owner | null;
  flippedCells: number[];
  flipped: FlipDetail[];
};

const ownerLabel = (o: Owner): string => (o === 0 ? "A" : "B");

const oppositeDir = (d: EdgeDir): EdgeDir => {
  switch (d) {
    case "up":
      return "down";
    case "down":
      return "up";
    case "left":
      return "right";
    case "right":
      return "left";
  }
};

const handName = (h: number): string => {
  // 0..2 in Nyano: assumed Rock/Paper/Scissors (standard order)
  if (h === 0) return "Rock";
  if (h === 1) return "Paper";
  if (h === 2) return "Scissors";
  return `Hand(${h})`;
};

const jankenWins = (me: number, them: number): boolean => {
  // Rock(0) > Scissors(2), Paper(1) > Rock(0), Scissors(2) > Paper(1)
  if (me === them) return false;
  if (me === 0 && them === 2) return true;
  if (me === 1 && them === 0) return true;
  if (me === 2 && them === 1) return true;
  return false;
};

function dirFromPlaced(placedCell: number, neighborCell: number): EdgeDir | null {
  if (neighborCell === placedCell - 3) return "up";
  if (neighborCell === placedCell + 3) return "down";

  if (neighborCell === placedCell - 1 && placedCell % 3 !== 0) return "left";
  if (neighborCell === placedCell + 1 && placedCell % 3 !== 2) return "right";

  return null;
}

function formatCells(cells: number[]): string {
  if (cells.length === 0) return "—";
  if (cells.length <= 4) return cells.join(",");
  return `${cells.slice(0, 4).join(",")}…(+${cells.length - 4})`;
}

function edgeExpr(base: number, triadPlus: number, warningDebuff: number): { text: string; effective: number } {
  const effective = base + triadPlus - warningDebuff;
  const parts: string[] = [String(base)];
  if (triadPlus) parts.push(`+${triadPlus}`);
  if (warningDebuff) parts.push(`-${warningDebuff}`);

  if (parts.length === 1) return { text: String(effective), effective };
  return { text: `${parts.join(" ")} = ${effective}`, effective };
}

function explainFlip(args: {
  placedCell: number;
  flipCell: number;
  placedCard: any;
  otherCard: any;
  triadPlus: number;
  warningDebuff: number;
  warningTriggered: boolean;
  ignoreWarningMark: boolean;
}): { dir: EdgeDir | null; explain: string } {
  const dir = dirFromPlaced(args.placedCell, args.flipCell);
  if (!dir) {
    return { dir: null, explain: "non-adjacent flip (chain/extra rule); explanation TBD" };
  }

  const opp = oppositeDir(dir);

  const placedEdgeBase = Number((args.placedCard.edges as any)[dir]);
  const otherEdgeBase = Number((args.otherCard.edges as any)[opp]);

  const ex = edgeExpr(placedEdgeBase, args.triadPlus, args.warningDebuff);

  const warnTag =
    args.warningTriggered && args.ignoreWarningMark
      ? " (warning ignored)"
      : args.warningTriggered && args.warningDebuff
        ? " (warning -1)"
        : "";

  if (ex.effective > otherEdgeBase) {
    return {
      dir,
      explain: `edge ${dir}: ${ex.text} > ${otherEdgeBase}${warnTag}`,
    };
  }

  if (ex.effective < otherEdgeBase) {
    // Not explained by direct edge-compare; may happen due to chain/extra rule.
    return {
      dir,
      explain: `edge ${dir}: ${ex.text} < ${otherEdgeBase} → flip via chain/extra rule (not explained by edge-compare)${warnTag}`,
    };
  }

  // tie -> janken tiebreak (if any)
  const meHand = Number(args.placedCard.jankenHand);
  const themHand = Number(args.otherCard.jankenHand);

  if (jankenWins(meHand, themHand)) {
    return {
      dir,
      explain: `edge tie (${ex.text} == ${otherEdgeBase}) → janken ${handName(meHand)} beats ${handName(themHand)}${warnTag}`,
    };
  }

  return {
    dir,
    explain: `edge tie (${ex.text} == ${otherEdgeBase}) and janken not won → flip via chain/extra rule (not explained by edge-compare)${warnTag}`,
  };
}

function computeDelta(boardPrev: BoardState, boardNow: BoardState, turn: TurnSummary): TurnDelta {
  let placedCell: number | null = null;
  let placedTokenId: bigint | null = null;
  let placedOwner: Owner | null = null;

  const flippedCells: number[] = [];
  const flipped: FlipDetail[] = [];

  for (let i = 0; i < boardNow.length; i++) {
    const a = boardPrev[i];
    const b = boardNow[i];

    if (a === null && b !== null) {
      placedCell = i;
      placedTokenId = b.card.tokenId;
      placedOwner = b.owner as Owner;
      continue;
    }

    if (a !== null && b !== null && a.owner !== b.owner) {
      flippedCells.push(i);
    }
  }

  if (placedCell === null) {
    return { placedCell, placedTokenId, placedOwner, flippedCells, flipped };
  }

  const placedCellObj = boardNow[placedCell];
  const placedCard = placedCellObj?.card;

  const triadPlus = Number(turn.appliedBonus?.triadPlus ?? 0);
  const ignoreWarningMark = Boolean(turn.appliedBonus?.ignoreWarningMark);
  const warningTriggered = Boolean(turn.warningTriggered);
  const warningDebuff = warningTriggered && !ignoreWarningMark ? 1 : 0;

  for (const c of flippedCells) {
    const before = boardPrev[c];
    const after = boardNow[c];

    if (!before || !after || !placedCard) continue;

    const { dir, explain } = explainFlip({
      placedCell,
      flipCell: c,
      placedCard,
      otherCard: before.card,
      triadPlus,
      warningDebuff,
      warningTriggered,
      ignoreWarningMark,
    });

    flipped.push({
      cell: c,
      tokenId: after.card.tokenId,
      from: before.owner as Owner,
      to: after.owner as Owner,
      dirFromPlaced: dir,
      explain,
    });
  }

  return { placedCell, placedTokenId, placedOwner, flippedCells, flipped };
}

function formatFlipLine(f: FlipDetail): string {
  const dir = f.dirFromPlaced ? ` ${f.dirFromPlaced}` : "";
  return `cell ${f.cell}${dir} (#${f.tokenId.toString()}) ${ownerLabel(f.from)}→${ownerLabel(f.to)}`;
}

export function TurnLog(props: {
  turns: TurnSummary[];
  /** Optional: boardHistory[0]..[9] to derive "placed" and exact flipped cell indices per turn */
  boardHistory?: BoardState[];
  selectedTurnIndex: number;
  onSelect: (turnIndex: number) => void;
}) {
  const deltas = React.useMemo(() => {
    if (!props.boardHistory) return null;
    if (props.boardHistory.length < props.turns.length + 1) return null;

    const out: TurnDelta[] = [];
    for (let i = 0; i < props.turns.length; i++) {
      out.push(computeDelta(props.boardHistory[i], props.boardHistory[i + 1], props.turns[i]));
    }
    return out;
  }, [props.boardHistory, props.turns]);

  return (
    <div className="grid gap-2">
      {props.turns.map((t) => {
        const selected = props.selectedTurnIndex === t.turnIndex;
        const d = deltas ? deltas[t.turnIndex] : null;

        return (
          <button
            key={t.turnIndex}
            className={[
              "w-full rounded-lg border px-3 py-2 text-left text-sm",
              selected ? "border-surface-900 bg-surface-50" : "border-surface-200 bg-white hover:bg-surface-50",
            ].join(" ")}
            onClick={() => props.onSelect(t.turnIndex)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">
                Turn {t.turnIndex + 1} · {t.player === 0 ? "A" : "B"} · cell {t.cell} ({cellRC(t.cell)}) · cardIndex{" "}
                {t.cardIndex}
              </div>
              <div className="text-xs text-surface-500">token #{t.tokenId.toString()}</div>
            </div>

            <div className="mt-1 flex flex-wrap gap-2 text-xs text-surface-600">
              <span className="badge">flips: {t.flipCount}</span>
              <FlipTraceBadges flipTraces={t.flipTraces} />

              {d ? (
                <>
                  <span className="badge">placed: {d.placedCell ?? "—"}</span>
                  <span className="badge badge-amber">flipped cells: {formatCells(d.flippedCells)}</span>
                </>
              ) : null}

              <span className="badge">comboCount: {t.comboCount}</span>
              <span className="badge">combo: {t.comboEffect}</span>
              <span className="badge">+triad: {t.appliedBonus.triadPlus}</span>
              <span className="badge">ignoreWarning: {t.appliedBonus.ignoreWarningMark ? "yes" : "no"}</span>

              {t.warningPlaced !== null ? (
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5">placed mark: {t.warningPlaced}</span>
              ) : null}

              {t.warningTriggered ? (
                <span className="badge badge-amber">stepped on warning</span>
              ) : null}
            </div>

            {selected ? (
  <div className="mt-2 grid gap-2">
    {t.flipTraces && t.flipTraces.length ? (
      <div className="rounded-lg border border-surface-200 bg-white p-2 text-xs text-surface-700">
        <div className="font-medium">Flip traces (after modifiers)</div>
        <FlipTraceDetailList flipTraces={t.flipTraces} />
      </div>
    ) : null}

    {d ? (
      <div className="rounded-lg border border-surface-200 bg-white p-2 text-xs text-surface-700">
        <div className="font-medium">Δ (board diff)</div>
        <div className="mt-1 grid gap-1 font-mono">
          <div>
            placed: cell {d.placedCell ?? "—"}{" "}
            {d.placedTokenId !== null ? `(#${d.placedTokenId.toString()})` : ""}{" "}
            {d.placedOwner !== null ? `by ${ownerLabel(d.placedOwner)}` : ""}
          </div>
          <div>flipped: {d.flipped.length}</div>

          {d.flipped.length ? (
            <div className="mt-1 grid gap-1">
              {d.flipped.map((f) => (
                <div
                  key={`${t.turnIndex}-${f.cell}`}
                  className="rounded-md border border-surface-200 bg-surface-50 px-2 py-1"
                >
                  <div className="font-mono">{formatFlipLine(f)}</div>
                  <div className="mt-0.5 text-surface-600">{f.explain}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    ) : null}
  </div>
) : null}

                </div>
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
