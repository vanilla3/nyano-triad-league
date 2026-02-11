import { createPublicClient, http, parseAbi } from "viem";
import { mainnet } from "viem/chains";

import type { CardData } from "@nyano/triad-engine";
import { makeCardDataFromNyano } from "@nyano/triad-engine";
import { errorMessage } from "@/lib/errorMessage";

/**
 * Public RPC endpoints (browser-friendly defaults).
 *
 * Notes:
 * - Public RPCs can be rate-limited or block browsers (CORS).
 * - We keep multiple candidates and fallback automatically when possible.
 */
export const DEFAULT_RPC_URLS = [
  "https://ethereum-rpc.publicnode.com",
  "https://rpc.ankr.com/eth",
  "https://eth.llamarpc.com",
  // Keep Cloudflare as the last resort because some environments fail with CORS / fetch issues.
  "https://cloudflare-eth.com",
] as const;

export const DEFAULT_RPC_URL = DEFAULT_RPC_URLS[0];
export const DEFAULT_NYANO_ADDRESS = "0xd5839db20b47a06Ed09D7c0f44d9c2A4f0A6fEC3" as const;

export type NyanoOnchainTrait = { classId: number; seasonId: number; rarity: number };
export type NyanoCombatStats = { hp: number; atk: number; matk: number; def: number; mdef: number; agi: number };
export type NyanoTriad = { up: number; right: number; left: number; down: number };

export type NyanoCardBundle = {
  tokenId: bigint;
  owner: `0x${string}`;
  hand: 0 | 1 | 2;
  trait: NyanoOnchainTrait;
  combatStats: NyanoCombatStats;
  triad: NyanoTriad;
  card: CardData;
};

function env<T extends string>(key: string): T | undefined {
  // Vite injects import.meta.env at build time
  return (import.meta.env as Record<string, unknown>)?.[key] as T | undefined;
}

const LS_RPC_USER = "nytl.rpc.user";
const LS_RPC_LAST_OK = "nytl.rpc.lastOk";

function safeGetLocalStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

function lsGet(key: string): string | null {
  const ls = safeGetLocalStorage();
  if (!ls) return null;
  try {
    return ls.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  const ls = safeGetLocalStorage();
  if (!ls) return;
  try {
    ls.setItem(key, value);
  } catch {
    // ignore
  }
}

function lsRemove(key: string): void {
  const ls = safeGetLocalStorage();
  if (!ls) return;
  try {
    ls.removeItem(key);
  } catch {
    // ignore
  }
}

function normalizeUrl(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  if (!t) return null;
  return t;
}

export function getUserRpcOverride(): string | null {
  return normalizeUrl(lsGet(LS_RPC_USER));
}

export function setUserRpcOverride(rpcUrl: string): void {
  const u = normalizeUrl(rpcUrl);
  if (!u) throw new Error("RPC URL is empty");
  lsSet(LS_RPC_USER, u);
}

export function clearUserRpcOverride(): void {
  lsRemove(LS_RPC_USER);
}

export function getLastOkRpcUrl(): string | null {
  return normalizeUrl(lsGet(LS_RPC_LAST_OK));
}

function setLastOkRpcUrl(rpcUrl: string): void {
  const u = normalizeUrl(rpcUrl);
  if (!u) return;
  lsSet(LS_RPC_LAST_OK, u);
}

export function getRpcUrl(): string {
  // Priority:
  // 1) user override (localStorage)
  // 2) env (VITE_RPC_URL)
  // 3) last ok (auto-detected)
  // 4) defaults
  return getUserRpcOverride() ?? normalizeUrl(env<string>("VITE_RPC_URL")) ?? getLastOkRpcUrl() ?? DEFAULT_RPC_URL;
}

/**
 * RPC candidates in the order we will try.
 */
export function getRpcCandidates(): string[] {
  const cands: string[] = [];

  const push = (u: string | null) => {
    const x = normalizeUrl(u);
    if (!x) return;
    if (!cands.includes(x)) cands.push(x);
  };

  push(getUserRpcOverride());
  push(normalizeUrl(env<string>("VITE_RPC_URL")));
  push(getLastOkRpcUrl());

  for (const u of DEFAULT_RPC_URLS) push(u);

  return cands;
}

export function getNyanoAddress(): `0x${string}` {
  return (normalizeUrl(env<string>("VITE_NYANO_ADDRESS")) ?? DEFAULT_NYANO_ADDRESS) as `0x${string}`;
}

const ABI = parseAbi([
  // ERC721
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",

  // ERC721Enumerable
  "function totalSupply() view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",

  // BlueAtelierNFT helpers
  "function exists(uint256 tokenId) view returns (bool)",

  // Nyano Peace attributes for Triad League
  "function getJankenHand(uint256 tokenId) view returns (uint8)",
  "function getTrait(uint256 tokenId) view returns (uint8 classId, uint8 seasonId, uint8 rarity)",
  "function getCombatStats(uint256 tokenId) view returns (uint16 hp, uint16 atk, uint16 matk, uint16 def, uint16 mdef, uint16 agi)",
  "function getTriad(uint256 tokenId) view returns (uint8 up, uint8 right, uint8 left, uint8 down)",
]);

const clientsByRpc = new Map<string, ReturnType<typeof createPublicClient>>();

function getClientForRpc(rpcUrl: string) {
  const key = rpcUrl.trim();
  const hit = clientsByRpc.get(key);
  if (hit) return hit;
  const c = createPublicClient({ chain: mainnet, transport: http(key) });
  clientsByRpc.set(key, c);
  return c;
}

const cache = new Map<string, Promise<NyanoCardBundle>>();

function toNum(x: bigint, name: string): number {
  const n = Number(x);
  if (!Number.isFinite(n)) throw new Error(`${name} is not finite`);
  return n;
}

function toHand(x: bigint): 0 | 1 | 2 {
  const n = toNum(x, "jankenHand");
  if (n !== 0 && n !== 1 && n !== 2) throw new Error(`jankenHand out of range: ${n} (expected 0..2)`);
  return n as 0 | 1 | 2;
}

function getErrMessage(e: any): string {
  return String(e?.shortMessage ?? e?.message ?? e);
}

function isRpcConnectivityError(e: any): boolean {
  const name = String(e?.name ?? "");
  const msg = getErrMessage(e).toLowerCase();

  if (name.includes("HttpRequestError")) return true;

  // viem/browser fetch failure patterns
  if (msg.includes("failed to fetch")) return true;
  if (msg.includes("http request failed")) return true;
  if (msg.includes("network error")) return true;
  if (msg.includes("timeout")) return true;

  // typical public RPC rate limiting
  if (msg.includes("429")) return true;
  if (msg.includes("rate limit")) return true;
  if (msg.includes("too many requests")) return true;

  return false;
}

/**
 * Lightweight browser-side RPC probe (useful for UI).
 * It does not guarantee the endpoint is "good", but it catches:
 * - CORS blocks
 * - network blocks
 * - obvious downtime
 */
export async function pingRpcUrl(rpcUrl: string): Promise<{ ok: boolean; chainId?: string; error?: string }> {
  const url = normalizeUrl(rpcUrl);
  if (!url) return { ok: false, error: "RPC URL is empty" };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
      signal: controller.signal,
    });

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const json = (await res.json().catch(() => null)) as any;
    const chainId = String(json?.result ?? "");
    if (!chainId) return { ok: false, error: "bad response" };

    return { ok: true, chainId };
  } catch (e: unknown) {
    return { ok: false, error: errorMessage(e) };
  } finally {
    clearTimeout(t);
  }
}

function makeRpcFailureError(candidates: string[], lastErr: any): Error {
  const lines = [
    "RPC接続に失敗しました（ブラウザから Ethereum RPC に到達できません）。",
    "",
    "原因として多いもの：",
    "- 公開RPCの混雑/レート制限（429）",
    "- ブラウザCORSブロック（'Failed to fetch'）",
    "- ネットワーク側のブロック",
    "",
    "試行したRPC:",
    ...candidates.map((u) => `- ${u}`),
    "",
    "対処:",
    "- /nyano の「RPC Settings」から別のRPCに切り替える（local override）",
    "- あるいは apps/web/.env で VITE_RPC_URL を自分のRPCに設定する",
    "",
    `last error: ${getErrMessage(lastErr)}`,
  ];

  return new Error(lines.join("\n"));
}

function shortenOneLine(s: string, max = 180): string {
  const one = String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (one.length <= max) return one;
  return one.slice(0, Math.max(0, max - 1)) + "…";
}

export class NyanoTokenNotMintedError extends Error {
  readonly tokenId: bigint;
  constructor(tokenId: bigint) {
    const lines = [
      `Token #${tokenId.toString()} は on-chain に存在しません（exists(tokenId)=false）。`,
      "getTriad/getTrait/getCombatStats は「存在しない tokenId」を指定すると revert します。",
      "",
      "対処:",
      "- 自分が保有する tokenId を使ってください（/nyano で検証できます）",
      "- このコレクションはVRFにより tokenId がランダム配布されるため、1,2,3...が存在するとは限りません",
    ];
    super(lines.join("\n"));
    this.name = "NyanoTokenNotMintedError";
    this.tokenId = tokenId;
  }
}

export async function fetchNyanoCard(tokenId: bigint): Promise<NyanoCardBundle> {
  const key = tokenId.toString();
  const hit = cache.get(key);
  if (hit) return hit;

  const p = (async () => {
    const addr = getNyanoAddress();
    const candidates = getRpcCandidates();

    let lastErr: any = null;

    for (const rpcUrl of candidates) {
      try {
        const client = getClientForRpc(rpcUrl);

        // Preflight: token must exist, otherwise getTriad/getTrait will revert.
        const exists = (await client.readContract({
          address: addr,
          abi: ABI,
          functionName: "exists",
          args: [tokenId],
        })) as boolean;

        if (!exists) {
          throw new NyanoTokenNotMintedError(tokenId);
        }

        const [owner, handRaw, traitRaw, statsRaw, triadRaw] = await Promise.all([
          client.readContract({ address: addr, abi: ABI, functionName: "ownerOf", args: [tokenId] }) as unknown as Promise<`0x${string}`>,
          client.readContract({ address: addr, abi: ABI, functionName: "getJankenHand", args: [tokenId] }) as unknown as Promise<bigint>,
          client.readContract({ address: addr, abi: ABI, functionName: "getTrait", args: [tokenId] }) as unknown as Promise<[bigint, bigint, bigint]>,
          client.readContract({ address: addr, abi: ABI, functionName: "getCombatStats", args: [tokenId] }) as unknown as Promise<[bigint, bigint, bigint, bigint, bigint, bigint]>,
          client.readContract({ address: addr, abi: ABI, functionName: "getTriad", args: [tokenId] }) as unknown as Promise<[bigint, bigint, bigint, bigint]>,
        ]);

        const hand = toHand(handRaw);

        const trait: NyanoOnchainTrait = {
          classId: toNum(traitRaw[0], "classId"),
          seasonId: toNum(traitRaw[1], "seasonId"),
          rarity: toNum(traitRaw[2], "rarity"),
        };

        const combatStats: NyanoCombatStats = {
          hp: toNum(statsRaw[0], "hp"),
          atk: toNum(statsRaw[1], "atk"),
          matk: toNum(statsRaw[2], "matk"),
          def: toNum(statsRaw[3], "def"),
          mdef: toNum(statsRaw[4], "mdef"),
          agi: toNum(statsRaw[5], "agi"),
        };

        const triad: NyanoTriad = {
          up: toNum(triadRaw[0], "up"),
          right: toNum(triadRaw[1], "right"),
          left: toNum(triadRaw[2], "left"),
          down: toNum(triadRaw[3], "down"),
        };

        const card = makeCardDataFromNyano({
          tokenId,
          triad,
          jankenHand: hand,
          combatStats,
          trait,
        });

        // Persist as the last known working RPC for this browser.
        setLastOkRpcUrl(rpcUrl);

        return { tokenId, owner, hand, trait, combatStats, triad, card };
      } catch (e: unknown) {
        lastErr = e;
        if (isRpcConnectivityError(e)) {
          // try next RPC candidate
          continue;
        }
        throw e;
      }
    }

    throw makeRpcFailureError(candidates, lastErr);
  })();

  cache.set(key, p);

  // If the promise rejects, don't keep the rejection cached forever.
  p.catch(() => {
    cache.delete(key);
  });

  return p;
}

export async function fetchNyanoCards(tokenIds: bigint[]): Promise<Map<bigint, NyanoCardBundle>> {
  const uniq = Array.from(new Set(tokenIds.map((t) => t.toString()))).map((s) => BigInt(s));
  const settled = await Promise.allSettled(uniq.map(async (tid) => await fetchNyanoCard(tid)));

  const ok = new Map<bigint, NyanoCardBundle>();
  const errs: Array<{ tokenId: bigint; error: any }> = [];

  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    const tid = uniq[i]!;
    if (r.status === "fulfilled") ok.set(tid, r.value);
    else errs.push({ tokenId: tid, error: r.reason });
  }

  if (errs.length > 0) {
    const allRpc = errs.every(({ error }) => {
      const msg = getErrMessage(error).toLowerCase();
      return (
        isRpcConnectivityError(error) ||
        msg.includes("rpc接続に失敗") ||
        msg.includes("failed to fetch") ||
        msg.includes("http request failed")
      );
    });

    if (allRpc) {
      const e0 = errs[0]!.error;
      throw e0 instanceof Error ? e0 : new Error(getErrMessage(e0));
    }

    const missing = errs.filter((x) => String(x.error?.name ?? "") === "NyanoTokenNotMintedError");
    const other = errs.filter((x) => String(x.error?.name ?? "") !== "NyanoTokenNotMintedError");

    const lines: string[] = ["カード読み込みに失敗しました。"];

    if (missing.length > 0) {
      lines.push("", "存在しない tokenId（未Mint / burn 済み等）:");
      for (const m of missing) lines.push(`- ${m.tokenId.toString()}`);
    }

    if (other.length > 0) {
      lines.push("", "その他のエラー:");
      const limit = 6;
      for (let i = 0; i < Math.min(limit, other.length); i++) {
        const o = other[i]!;
        lines.push(`- tokenId ${o.tokenId.toString()}: ${shortenOneLine(getErrMessage(o.error))}`);
      }
      if (other.length > limit) lines.push(`- … and ${other.length - limit} more`);
    }

    lines.push("", "ヒント: /nyano で tokenId を個別に検証できます（Etherscanも開けます）。");

    throw new Error(lines.join("\n"));
  }

  return ok;
}

/**
 * Fetch some tokenIds that are guaranteed to exist by enumerating the collection.
 *
 * Useful for:
 * - Debugging /nyano page without guessing tokenIds.
 * - Building demo decks without hardcoding fragile tokenId lists.
 */
export async function fetchMintedTokenIds(count: number, startIndex = 0): Promise<bigint[]> {
  if (!Number.isFinite(count) || count <= 0) throw new Error("count must be positive");
  const start = Number.isFinite(startIndex) ? Math.max(0, Math.floor(startIndex)) : 0;

  const addr = getNyanoAddress();
  const candidates = getRpcCandidates();
  let lastErr: any = null;

  for (const rpcUrl of candidates) {
    try {
      const client = getClientForRpc(rpcUrl);

      const totalSupply = (await client.readContract({
        address: addr,
        abi: ABI,
        functionName: "totalSupply",
        args: [],
      })) as bigint;

      const total = Number(totalSupply);
      if (!Number.isFinite(total) || total < 0) throw new Error(`bad totalSupply: ${totalSupply.toString()}`);

      const n = Math.min(Math.floor(count), Math.max(0, total - start));
      if (n <= 0) return [];

      const tokenIds = await Promise.all(
        Array.from({ length: n }, (_, i) => i).map(async (i) => {
          const id = (await client.readContract({
            address: addr,
            abi: ABI,
            functionName: "tokenByIndex",
            args: [BigInt(start + i)],
          })) as bigint;
          return id;
        })
      );

      setLastOkRpcUrl(rpcUrl);
      return tokenIds;
    } catch (e: unknown) {
      lastErr = e;
      if (isRpcConnectivityError(e)) continue;
      throw e;
    }
  }

  throw makeRpcFailureError(candidates, lastErr);
}
