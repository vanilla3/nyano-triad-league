import React from "react";
import OFFICIAL from "@root/rulesets/official_onchain_rulesets.json";

type OfficialRuleset = {
  name: string;
  engineId: number;
  rulesetId: `0x${string}`;
  configHash: `0x${string}`;
  uri: string;
};

export function RulesetsPage() {
  const rulesets = (OFFICIAL as any).rulesets as OfficialRuleset[];
  const notes = (OFFICIAL as any).notes as string[];

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">公式ルールセット</div>
        </div>
        <div className="card-bd grid gap-3 text-sm text-slate-700">
          <p>
            ルールセットは <span className="font-semibold">rulesetId</span>（= canonicalized config の keccak256）で固定されます。
            UI/クライアント実装は、まずこの“合意の核”に追従します。
          </p>

          <ul className="list-disc pl-6 text-slate-600">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card">
        <div className="card-hd flex items-center justify-between">
          <div className="text-base font-semibold">一覧</div>
          <div className="text-xs text-slate-500">{rulesets.length} items</div>
        </div>

        <div className="card-bd overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-2 pr-3">name</th>
                <th className="py-2 pr-3">engineId</th>
                <th className="py-2 pr-3">rulesetId</th>
                <th className="py-2 pr-3">configHash</th>
                <th className="py-2 pr-3">uri</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {rulesets.map((r) => (
                <tr key={r.rulesetId} className="border-t border-slate-100">
                  <td className="py-3 pr-3 font-medium">{r.name}</td>
                  <td className="py-3 pr-3">{r.engineId}</td>
                  <td className="py-3 pr-3">
                    <code className="text-xs">{r.rulesetId}</code>
                  </td>
                  <td className="py-3 pr-3">
                    <code className="text-xs">{r.configHash}</code>
                  </td>
                  <td className="py-3 pr-3">
                    <code className="text-xs">{r.uri}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">次に足すもの</div>
        </div>
        <div className="card-bd grid gap-2 text-sm text-slate-700">
          <ul className="list-disc pl-6">
            <li>rulesetId と UI の表示内容をリンクさせ、差分（v1→v2）を見える化</li>
            <li>rulesetId の生成・検証（ローカル計算）をUIから実行できるように</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
