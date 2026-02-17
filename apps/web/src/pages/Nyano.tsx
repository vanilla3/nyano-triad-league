import React from "react";

import { CardMini } from "@/components/CardMini";
import { CopyField } from "@/components/CopyField";
import { useToast } from "@/components/Toast";
import { errorMessage } from "@/lib/errorMessage";
import { writeClipboardText } from "@/lib/clipboard";
import { stringifyWithBigInt } from "@/lib/json";
import {
  clearUserRpcOverride,
  fetchMintedTokenIds,
  fetchNyanoCard,
  getNyanoAddress,
  getRpcCandidates,
  getRpcUrl,
  getUserRpcOverride,
  pingRpcUrl,
  setUserRpcOverride,
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

function rpcLabel(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("publicnode")) return "PublicNode";
  if (u.includes("ankr")) return "Ankr";
  if (u.includes("llamarpc")) return "Llama";
  if (u.includes("cloudflare-eth")) return "Cloudflare";
  return "Custom";
}

const EXAMPLES: Array<{ label: string; value: string }> = [
  { label: "（例）1 2 3 ※存在しない可能性あり", value: "1 2 3" },
  { label: "（例）201 202 242 ※存在しない可能性あり", value: "201 202 242" },
  { label: "（例）491 2300 2828 ※存在しない可能性あり", value: "491 2300 2828" },
];

export function NyanoPage() {
  const [input, setInput] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [sampleLoading, setSampleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<
    Array<
      | { tokenId: bigint; ok: true; data: NyanoCardBundle }
      | { tokenId: bigint; ok: false; error: string }
    >
    | null
  >(null);

  const toast = useToast();

  const rpcUrl = getRpcUrl();
  const contract = getNyanoAddress();
  const userOverride = getUserRpcOverride();

  const [rpcDraft, setRpcDraft] = React.useState<string>(() => userOverride ?? rpcUrl);
  const [rpcProbing, setRpcProbing] = React.useState(false);
  const [rpcProbe, setRpcProbe] = React.useState<{ ok: boolean; chainId?: string; error?: string } | null>(null);

  const rpcCandidates = React.useMemo(() => getRpcCandidates(), []);

  const copyWithToast = async (label: string, text: string) => {
    await writeClipboardText(text);
    toast.success("コピーしました", label);
  };

  const openEtherscan = (tokenId: bigint) => {
    const addr = getNyanoAddress();
    const url = `https://etherscan.io/token/${addr}?a=${tokenId.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openNyanoMint = () => {
    window.open("https://mint.nyano.ai/", "_blank", "noopener,noreferrer");
  };



  const loadSampleMinted = async () => {
    setSampleLoading(true);
    try {
      const ids = await fetchMintedTokenIds(6, 0);
      if (ids.length === 0) {
        toast.warn("Mint済みトークンなし", "totalSupply=0 の可能性があります");
        return;
      }
      const text = ids.map((x) => x.toString()).join(" ");
      setInput(text);
      toast.success("サンプル tokenId を取得", text);
    } catch (e: unknown) {
      toast.error("サンプル取得失敗", errorMessage(e));
    } finally {
      setSampleLoading(false);
    }
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
          } catch (e: unknown) {
            return { tokenId: tid, ok: false as const, error: errorMessage(e) };
          }
        })
      );

      setItems(results);
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const testRpc = async () => {
    setRpcProbing(true);
    setRpcProbe(null);
    try {
      const r = await pingRpcUrl(rpcDraft);
      setRpcProbe(r);
      if (r.ok) toast.success("RPC疎通OK", `chainId=${r.chainId ?? "?"}`);
      else toast.warn("RPC疎通NG", r.error ?? "不明なエラー");
    } finally {
      setRpcProbing(false);
    }
  };

  const applyRpc = () => {
    try {
      setUserRpcOverride(rpcDraft);
      setRpcProbe(null);
      toast.success("RPCを切替", rpcLabel(rpcDraft));
    } catch (e: unknown) {
      toast.error("RPC切替失敗", errorMessage(e));
    }
  };

  const resetRpc = () => {
    clearUserRpcOverride();
    setRpcDraft(getRpcUrl());
    setRpcProbe(null);
    toast.success("RPCをリセット", "env/default に戻しました");
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
                mint.nyano.ai を開く
              </button>
            </div>
          </div>
        </div>

        <div className="card-bd grid gap-4 md:grid-cols-3">
          <div className="grid gap-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-600">tokenIds</div>
            </div>

            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例: 501 1001 2800 / 10,11,12"
            />

            <div className="flex flex-wrap gap-2">
              <button className="btn btn-sm" onClick={loadSampleMinted} disabled={sampleLoading}>
                {sampleLoading ? "読み込み中…" : "サンプル（存在するtokenId）を取得"}
              </button>
              {EXAMPLES.map((ex) => (
                <button key={ex.label} className="btn btn-sm" onClick={() => setInput(ex.value)}>
                  {ex.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500">空白/カンマ区切り。最大20件。存在しない tokenId は読み込み時に弾かれます。</div>
          </div>

          <div className="grid gap-2">
            <div className="text-xs font-medium text-slate-600">操作</div>
            <button className="btn btn-primary" onClick={load} disabled={loading}>
              {loading ? "読み込み中…" : "チェーンから取得"}
            </button>
            {error ? <div className="callout callout-warn">{error}</div> : null}

            <div className="grid gap-2">
              <CopyField label="RPC (active)" value={rpcUrl} copyValue={rpcUrl} />
              <CopyField
                label="Contract"
                value={contract}
                copyValue={contract}
                href={`https://etherscan.io/token/${contract}#code`}
              />

              {userOverride ? (
                <div className="callout callout-nyano text-xs">
                  RPC override: <span className="font-mono">{userOverride}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-500">※ RPC は env（VITE_RPC_URL）または /nyano から一時的に差し替え可能です。</div>
              )}
            </div>

            <div className="mt-2 grid gap-2">
              <div className="text-xs font-medium text-slate-600">RPC設定</div>
              <div className="callout callout-info text-xs">
                「Load Cards / Load from chain」が <span className="font-mono">Failed to fetch</span> で落ちる場合、公開RPCのCORS/混雑のことが多いです。
                ここでRPCを切り替えると改善することがあります。
              </div>

              <input
                className="input"
                value={rpcDraft}
                onChange={(e) => setRpcDraft(e.target.value)}
                placeholder="https://your-rpc.example"
              />

              <div className="flex flex-wrap gap-2">
                {rpcCandidates.slice(0, 6).map((u) => (
                  <button key={u} className="btn btn-sm" onClick={() => setRpcDraft(u)} title={u}>
                    {rpcLabel(u)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="btn btn-sm" onClick={testRpc} disabled={rpcProbing}>
                  {rpcProbing ? "検査中…" : "接続テスト"}
                </button>
                <button className="btn btn-primary btn-sm" onClick={applyRpc} disabled={!rpcDraft.trim()}>
                  このRPCを使う
                </button>
                <button className="btn btn-soft btn-sm" onClick={resetRpc} disabled={!userOverride}>
                  リセット
                </button>
              </div>

              {rpcProbe ? (
                rpcProbe.ok ? (
                  <div className="callout callout-muted text-xs">
                    ✅ OK: chainId=<span className="font-mono">{rpcProbe.chainId ?? "?"}</span>
                  </div>
                ) : (
                  <div className="callout callout-warn text-xs">
                    ❌ NG: <span className="font-mono">{rpcProbe.error ?? "不明なエラー"}</span>
                  </div>
                )
              ) : null}
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
                      <div className="w-28">
                        <CardMini card={it.data.card} owner={0} />
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
                        CardData JSONをコピー
                      </button>
                      <button className="btn" onClick={() => copyWithToast("tokenId", it.tokenId.toString())}>
                        tokenIdをコピー
                      </button>
                      <button className="btn btn-sm" onClick={() => copyWithToast("owner", it.data.owner)}>
                        ownerをコピー
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="callout callout-warn">エラー: {it.error}</div>
                )}
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
