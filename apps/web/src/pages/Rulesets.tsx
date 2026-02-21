import React from "react";
import { useToast } from "@/components/Toast";
import OFFICIAL_RAW from "@root/rulesets/official_onchain_rulesets.json";
import { writeClipboardText } from "@/lib/clipboard";

type OfficialRuleset = {
  name: string;
  engineId: number;
  rulesetId: `0x${string}`;
  configHash: `0x${string}`;
  uri: string;
};

interface OfficialRulesetsJson {
  rulesets: OfficialRuleset[];
  notes: string[];
}

const OFFICIAL = OFFICIAL_RAW as OfficialRulesetsJson;

function safeLower(s: string): string {
  return (s ?? "").toLowerCase();
}

export function RulesetsPage() {
  const rulesets = OFFICIAL.rulesets;
  const notes = OFFICIAL.notes ?? [];

  const [q, setQ] = React.useState<string>("");
  const toast = useToast();

  const copyWithToast = async (label: string, text: string) => {
    await writeClipboardText(text);
    toast.success("Copied", label);
  };

  const ql = safeLower(q.trim());
  const filtered = ql
    ? rulesets.filter((r) => {
        const hay = [
          safeLower(r.name),
          safeLower(String(r.engineId)),
          safeLower(r.rulesetId),
          safeLower(r.configHash),
          safeLower(r.uri),
        ].join(" ");
        return hay.includes(ql);
      })
    : rulesets;

  const notesList: string[] = Array.isArray(notes)
    ? notes
    : typeof notes === "string"
      ? [notes]
      : [];

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="card-hd">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-base font-semibold">Ruleset Registry 📜</div>
              <div className="text-xs text-slate-500">
                公式ルールセットの一覧です。対戦ログ（transcript）がどのルールで解釈されるかを、<span className="font-medium">rulesetId</span>{" "}
                で固定します。
              </div>
            </div>

            <div className="flex items-center gap-2">
              
            </div>
          </div>
        </div>

        <div className="card-bd grid gap-4">
          <div className="callout callout-info">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-sky">WHY</span>
              <div className="font-medium">「合意の核」をズラさないための仕組み</div>
            </div>
            <div className="mt-2 text-sm">
              ルールセットは canonicalized config の <span className="font-medium">keccak256</span> で{" "}
              <span className="font-medium">rulesetId</span> を作り、クライアントはそれに追従します。
              運営がいなくても「この試合はこのルールで再生される」が崩れません。
            </div>

            {notesList.length ? (
              <ul className="mt-3 list-disc pl-6 text-sm text-slate-700">
                {notesList.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <div className="grid gap-2 md:col-span-2">
              <div className="text-xs font-medium text-slate-600">Filter</div>
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="name / rulesetId / uri など"
              />
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-medium text-slate-600">Count</div>
              <div className="callout callout-muted text-sm">
                <div className="flex items-center justify-between">
                  <span>shown</span>
                  <span className="font-medium">{filtered.length}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>total</span>
                  <span>{rulesets.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-hd flex items-center justify-between">
          <div className="text-base font-semibold">一覧</div>
          <div className="text-xs text-slate-500">{filtered.length} items</div>
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
                <th className="py-2 pr-3">actions</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {filtered.map((r) => (
                <tr key={r.rulesetId} className="border-t border-slate-100 hover:bg-white/60">
                  <td className="py-3 pr-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="mt-1 text-xs text-slate-500">engine #{r.engineId}</div>
                  </td>

                  <td className="py-3 pr-3">
                    <span className="badge badge-slate">{r.engineId}</span>
                  </td>

                  <td className="py-3 pr-3">
                    <code className="text-xs whitespace-nowrap">{r.rulesetId}</code>
                  </td>

                  <td className="py-3 pr-3">
                    <code className="text-xs whitespace-nowrap">{r.configHash}</code>
                  </td>

                  <td className="py-3 pr-3">
                    <a className="text-xs" href={r.uri} target="_blank" rel="noreferrer noopener">
                      <code className="text-xs block max-w-[320px] truncate">{r.uri}</code>
                    </a>
                  </td>

                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="btn btn-sm mint-pressable mint-hit" onClick={() => copyWithToast("rulesetId", r.rulesetId)}>
                        Copy rulesetId
                      </button>
                      <button className="btn btn-sm mint-pressable mint-hit" onClick={() => copyWithToast("configHash", r.configHash)}>
                        Copy configHash
                      </button>
                      <button className="btn btn-sm mint-pressable mint-hit" onClick={() => copyWithToast("uri", r.uri)}>
                        Copy uri
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 ? (
            <div className="mt-4 text-sm text-slate-600">一致する ruleset がありません。</div>
          ) : null}
        </div>
      </section>

      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">次に足すもの</div>
        </div>
        <div className="card-bd grid gap-2 text-sm text-slate-700">
          <ul className="list-disc pl-6">
            <li>rulesetId と UI の表示内容をリンクさせ、差分（v1→v2）を見える化</li>
            <li>rulesetId の生成・検証（ローカル計算）を UI から実行</li>
            <li>コミュニティが提案したルールを「候補」として並べ、合意形成フローへ繋ぐ</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
