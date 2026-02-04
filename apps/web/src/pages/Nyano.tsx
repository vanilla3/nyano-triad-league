import React from "react";

import { CardMini } from "@/components/CardMini";
import { stringifyWithBigInt } from "@/lib/json";
import {
  DEFAULT_NYANO_ADDRESS,
  DEFAULT_RPC_URL,
  fetchNyanoCard,
  getNyanoAddress,
  getRpcUrl,
  type NyanoCardBundle,
} from "@/lib/nyano_rpc";

function parseTokenIds(input: string): bigint[] {
  const parts = input
    .split(/[\s,]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: bigint[] = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) throw new Error(`invalid tokenId: ${p}`);
    out.push(BigInt(p));
  }
  if (out.length === 0) throw new Error("tokenId を1つ以上入力してください（例: 1 2 3）");
  if (out.length > 20) throw new Error("一度に読み込めるのは最大20件です");
  return out;
}

function shortAddr(a: string): string {
  return a.slice(0, 6) + "…" + a.slice(-4);
}

const EXAMPLES: Array<{ label: string; value: string }> = [
  { label: "Starter (1 2 3)", value: "1 2 3" },
  { label: "Special (201 202 242)", value: "201 202 242" },
  { label: "Random-ish (491 2300 2828)", value: "491 2300 2828" },
];

export function NyanoPage() {
  const [input, setInput] = React.useState<string>("1 2 3");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<
    Array<
      | { tokenId: bigint; ok: true; data: NyanoCardBundle }
      | { tokenId: bigint; ok: false; error: string }
    >
    | null
  >(null);

  const [copied, setCopied] = React.useState<string | null>(null);

  const rpcUrl = getRpcUrl();
  const contract = getNyanoAddress();

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const copyWithToast = async (label: string, text: string) => {
    await copy(text);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1200);
  };

  const openEtherscan = (tokenId: bigint) => {
    const addr = getNyanoAddress();
    const url = `https://etherscan.io/token/${addr}?a=${tokenId.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openNyanoMint = () => {
    window.open("https://mint.nyano.ai/", "_blank", "noopener,noreferrer");
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    setItems(null);

    try {
      const tokenIds = parseTokenIds(input);

      const results = await Promise.all(
        tokenIds.map(async (tid) => {
          try {
            const data = await fetchNyanoCard(tid);
            return { tokenId: tid, ok: true as const, data };
          } catch (e: any) {
            return { tokenId: tid, ok: false as const, error: e?.message ?? String(e) };
          }
        })
      );

      setItems(results);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="card-hd">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-base font-semibold">Nyano Inspector 🐾</div>
              <div className="text-xs text-slate-500">
                Nyano Peace のオンチェーン属性（Triad/Janken/Stats/Trait）を読み出し、Triad のカード性能に変換して表示します（read-only）。
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn btn-soft" onClick={openNyanoMint} title="Nyano公式Mintサイトを開きます">
                Open mint.nyano.ai
              </button>
            </div>
          </div>
        </div>

        <div className="card-bd grid gap-4 md:grid-cols-3">
          <div className="grid gap-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-600">tokenIds</div>
              {copied ? <div className="text-xs text-slate-500">copied: {copied}</div> : null}
            </div>

            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例: 1 2 3 / 10,11,12"
            />

            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex.label} className="btn btn-sm" onClick={() => setInput(ex.value)}>
                  {ex.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500">空白/カンマ区切り。最大20件。</div>
          </div>

          <div className="grid gap-2">
            <div className="text-xs font-medium text-slate-600">Actions</div>
            <button className="btn btn-primary" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Load from chain"}
            </button>
            {error ? <div className="callout callout-warn">{error}</div> : null}

            <div className="callout callout-muted text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-slate">RPC</span>
                  <code>{rpcUrl}</code>
                  {rpcUrl === DEFAULT_RPC_URL ? <span className="text-slate-400">(default)</span> : null}
                </div>
                <button className="btn btn-sm" onClick={() => copyWithToast("rpc", rpcUrl)}>
                  Copy
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-slate">Contract</span>
                  <code>{contract}</code>
                  {contract === DEFAULT_NYANO_ADDRESS ? <span className="text-slate-400">(default)</span> : null}
                </div>
                <button className="btn btn-sm" onClick={() => copyWithToast("contract", contract)}>
                  Copy
                </button>
              </div>

              <div className="mt-2 text-slate-500">
                ※ RPC は .env（VITE_RPC_URL）で差し替え可能です。
              </div>
            </div>
          </div>
        </div>
      </section>

      {items ? (
        <section className="grid gap-4 md:grid-cols-2">
          {items.map((it) => (
            <div key={it.tokenId.toString()} className="card">
              <div className="card-hd flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-base font-semibold">token #{it.tokenId.toString()}</div>
                  <span className="badge badge-nyano">Nyano Peace</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn" onClick={() => openEtherscan(it.tokenId)}>
                    Etherscan
                  </button>
                </div>
              </div>

              <div className="card-bd grid gap-4">
                {it.ok ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="h-28">
                        <CardMini card={it.data.card} owner={0} subtle />
                      </div>

                      <div className="grid gap-2 text-sm text-slate-700">
                        <div className="text-xs text-slate-500">owner</div>
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2">
                          <code className="text-xs">{it.data.owner}</code>
                          <span className="text-xs text-slate-500">{shortAddr(it.data.owner)}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="rounded-lg border border-slate-200 bg-white/70 p-2">
                            <div className="text-slate-500">hand</div>
                            <div className="font-mono text-slate-700">{it.data.hand}</div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white/70 p-2">
                            <div className="text-slate-500">Σ stats</div>
                            <div className="font-mono text-slate-700">{it.data.card.combatStatSum}</div>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white/70 p-2">
                            <div className="text-slate-500">trait</div>
                            <div className="font-mono text-slate-700">{it.data.card.trait ?? "none"}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 text-xs text-slate-600">
                      <div className="rounded-lg border border-slate-200 bg-white/70 p-3 font-mono">
                        triad: up {it.data.triad.up}, right {it.data.triad.right}, down {it.data.triad.down}, left {it.data.triad.left}
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white/70 p-3 font-mono">
                        trait(onchain): class {it.data.trait.classId}, season {it.data.trait.seasonId}, rarity {it.data.trait.rarity}
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white/70 p-3 font-mono">
                        stats: hp {it.data.combatStats.hp}, atk {it.data.combatStats.atk}, matk {it.data.combatStats.matk}, def {it.data.combatStats.def}, mdef {it.data.combatStats.mdef}, agi {it.data.combatStats.agi}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button className="btn" onClick={() => copyWithToast("CardData", stringifyWithBigInt(it.data.card))}>
                        Copy CardData JSON
                      </button>
                      <button className="btn" onClick={() => copyWithToast("tokenId", it.tokenId.toString())}>
                        Copy tokenId
                      </button>
                      <button className="btn btn-sm" onClick={() => copyWithToast("owner", it.data.owner)}>
                        Copy owner
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="callout callout-warn">Error: {it.error}</div>
                )}
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
