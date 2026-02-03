import React from "react";
import type { CardData, TraitType } from "@nyano/triad-engine";

const traitBadge = (trait: TraitType | undefined) => {
  const t = trait ?? "none";
  const label =
    t === "none"
      ? "—"
      : t
          .replace(/^[a-z]/, (c) => c.toUpperCase())
          .replaceAll("_", " ");

  return (
    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
      {label}
    </span>
  );
};

export function CardMini(props: {
  card: CardData;
  owner: 0 | 1;
  subtle?: boolean;
}) {
  const { card, owner } = props;
  const ownerClass = owner === 0 ? "border-sky-300" : "border-rose-300";

  return (
    <div className={["h-full w-full rounded-lg border bg-white p-1", ownerClass].join(" ")}>
      <div className="flex items-center justify-between gap-1">
        <div className="text-[10px] text-slate-500">#{card.tokenId.toString()}</div>
        {traitBadge(card.trait)}
      </div>

      <div className="mt-1 grid grid-cols-3 grid-rows-3 gap-0.5 text-[10px]">
        <div />
        <div className="flex items-center justify-center rounded bg-slate-50">{card.edges.up}</div>
        <div />
        <div className="flex items-center justify-center rounded bg-slate-50">{card.edges.left}</div>
        <div className="flex items-center justify-center rounded bg-slate-100 font-semibold">{card.jankenHand}</div>
        <div className="flex items-center justify-center rounded bg-slate-50">{card.edges.right}</div>
        <div />
        <div className="flex items-center justify-center rounded bg-slate-50">{card.edges.down}</div>
        <div />
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
        <span>Σ {card.combatStatSum}</span>
        <span>{props.subtle ? "" : owner === 0 ? "A" : "B"}</span>
      </div>
    </div>
  );
}
