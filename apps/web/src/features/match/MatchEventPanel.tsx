import React from "react";
import { Link } from "react-router-dom";

export function MatchEventPanel(input: {
  isVisible: boolean;
  title: string;
  description: string;
  status: string;
  rulesetKey: string;
  aiDifficulty: string;
  nyanoDeckTokenIds: string[];
  onClearEvent: () => void;
}): React.ReactElement | null {
  const {
    isVisible,
    title,
    description,
    status,
    rulesetKey,
    aiDifficulty,
    nyanoDeckTokenIds,
    onClearEvent,
  } = input;
  if (!isVisible) return null;

  return (
    <section className="card">
      <div className="card-hd flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-semibold">Event: {title}</div>
          <div className="text-xs text-slate-500">
            迥ｶ諷・ <span className="font-medium">{status}</span> ﾂｷ 繝ｫ繝ｼ繝ｫ={rulesetKey} ﾂｷ AI={aiDifficulty}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn no-underline" to="/events">繧､繝吶Φ繝井ｸ隕ｧ</Link>
          <button className="btn" onClick={onClearEvent}>繧､繝吶Φ繝医ｒ髮｢閼ｱ</button>
        </div>
      </div>
      <div className="card-bd grid gap-2 text-sm text-slate-700">
        <p>{description}</p>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          Nyano繝・ャ繧ｭ縺ｮtokenIds: <span className="font-mono">{nyanoDeckTokenIds.join(", ")}</span>
        </div>
      </div>
    </section>
  );
}
