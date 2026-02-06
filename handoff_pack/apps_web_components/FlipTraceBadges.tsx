import React from "react";
import type { FlipTraceV1, Direction } from "@nyano/triad-engine";

function arrowFromDir(dir?: Direction): string {
  switch (dir) {
    case "up":
      return "↑";
    case "right":
      return "→";
    case "down":
      return "↓";
    case "left":
      return "←";
    default:
      return "·";
  }
}

function arrowFromDiag(vert?: Direction, horiz?: Direction): string {
  // Expect vert in {up,down}, horiz in {left,right}
  if (vert === "up" && horiz === "right") return "↗";
  if (vert === "up" && horiz === "left") return "↖";
  if (vert === "down" && horiz === "right") return "↘";
  if (vert === "down" && horiz === "left") return "↙";
  return "◇";
}

function compareSymbol(aVal: number, dVal: number, tieBreak: boolean): string {
  if (aVal > dVal) return ">";
  if (aVal < dVal) return "<";
  if (tieBreak) return "="; // tie decided by janken
  return "=";
}

function one(trace: FlipTraceV1): { main: string; tags: string[] } {
  const arrow = trace.kind === "diag" ? arrowFromDiag(trace.vert, trace.horiz) : arrowFromDir(trace.dir);
  const cmp = compareSymbol(trace.aVal, trace.dVal, trace.tieBreak);
  const main = `${arrow} ${trace.aVal}${cmp}${trace.dVal}`;

  const tags: string[] = [];
  if (trace.isChain) tags.push("chain");
  if (trace.tieBreak) tags.push("janken");
  return { main, tags };
}

export function FlipTraceBadges(props: {
  flipTraces?: readonly FlipTraceV1[] | null;
  /** show only first N traces as badges */
  limit?: number;
  className?: string;
}) {
  const { flipTraces, limit = 3, className = "" } = props;
  if (!flipTraces || flipTraces.length === 0) return null;

  const shown = flipTraces.slice(0, Math.max(0, limit));
  const rest = Math.max(0, flipTraces.length - shown.length);

  return (
    <div className={["flex flex-wrap items-center gap-1", className].join(" ")}>
      {shown.map((t, i) => {
        const x = one(t);
        return (
          <span key={`${t.from}-${t.to}-${i}`} className="badge badge-amber">
            {x.main}
            {x.tags.length ? <span className="opacity-70">({x.tags.join(",")})</span> : null}
          </span>
        );
      })}
      {rest > 0 ? <span className="badge">+{rest}</span> : null}
    </div>
  );
}

export function FlipTraceDetailList(props: { flipTraces?: readonly FlipTraceV1[] | null }) {
  const { flipTraces } = props;
  if (!flipTraces || flipTraces.length === 0) return null;

  return (
    <div className="mt-1 grid gap-1 font-mono">
      {flipTraces.map((t, i) => {
        const arrow = t.kind === "diag" ? arrowFromDiag(t.vert, t.horiz) : arrowFromDir(t.dir);
        const cmp = compareSymbol(t.aVal, t.dVal, t.tieBreak);
        const tags = [t.isChain ? "chain" : null, t.tieBreak ? "janken" : null].filter(Boolean).join(",");
        return (
          <div key={`${t.from}-${t.to}-${i}`} className="rounded-md border border-surface-200 bg-surface-50 px-2 py-1 text-xs text-surface-700">
            <div>
              {arrow} {t.from}→{t.to} : {t.aVal}{cmp}{t.dVal}
              {tags ? <span className="ml-2 text-surface-500">[{tags}]</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
