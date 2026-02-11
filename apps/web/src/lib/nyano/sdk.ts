// Nyano community SDK (internal, viem-based)
//
// Provides a stable API for reading Nyano's on-chain game parameters.
// Uses viem directly (no wagmi) to keep the dependency tree minimal.

import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet } from "viem/chains";

import type { JankenHand, CombatStats, TriadStats } from "./gameIndex";

export type { JankenHand, CombatStats, TriadStats };

export type TokenGameData = {
  tokenId: bigint;
  exists: boolean;
  hand?: JankenHand;
  combat?: CombatStats;
  triad?: TriadStats;
  owner?: `0x${string}`;
  issues?: string[];
};

const NYANO_ABI = [
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "exists", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "ownerOf", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "getJankenHand", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "getCombatStats", outputs: [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "getTriad", outputs: [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }], name: "tokenOfOwnerByIndex", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

const DEFAULT_RPC_URLS = [
  "https://ethereum-rpc.publicnode.com",
  "https://rpc.ankr.com/eth",
  "https://eth.llamarpc.com",
  "https://cloudflare-eth.com",
];

const DEFAULT_CONTRACT: `0x${string}` = "0xd5839db20b47a06Ed09D7c0f44d9c2A4f0A6fEC3";

function getRpcUrl(): string {
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("nyano_triad_rpc_override");
    if (override) return override;
  }
  return import.meta.env?.VITE_RPC_URL ?? DEFAULT_RPC_URLS[0];
}

function getContractAddress(): `0x${string}` {
  const env = import.meta.env?.VITE_NYANO_ADDRESS;
  return env ? (env as `0x${string}`) : DEFAULT_CONTRACT;
}

function getClient(): PublicClient {
  return createPublicClient({
    chain: mainnet,
    transport: http(getRpcUrl()),
  }) as PublicClient;
}

function toNum(v: unknown): number {
  const n = typeof v === "bigint" ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function readTokenGameDataBatch(tokenIds: bigint[]): Promise<TokenGameData[]> {
  if (tokenIds.length === 0) return [];

  const client = getClient();
  const address = getContractAddress();

  type NyanoCall = {
    address: `0x${string}`;
    abi: typeof NYANO_ABI;
    functionName: string;
    args: readonly [bigint];
  };
  const calls: NyanoCall[] = [];
  for (const tokenId of tokenIds) {
    calls.push({ address, abi: NYANO_ABI, functionName: "exists", args: [tokenId] });
    calls.push({ address, abi: NYANO_ABI, functionName: "ownerOf", args: [tokenId] });
    calls.push({ address, abi: NYANO_ABI, functionName: "getJankenHand", args: [tokenId] });
    calls.push({ address, abi: NYANO_ABI, functionName: "getCombatStats", args: [tokenId] });
    calls.push({ address, abi: NYANO_ABI, functionName: "getTriad", args: [tokenId] });
  }

  const results = await client.multicall({ contracts: calls, allowFailure: true });

  const out: TokenGameData[] = [];
  let i = 0;

  for (const tokenId of tokenIds) {
    const issues: string[] = [];

    const existsR = results[i++];
    const ownerR = results[i++];
    const handR = results[i++];
    const combatR = results[i++];
    const triadR = results[i++];

    const exists = existsR.status === "success" ? Boolean(existsR.result) : false;
    if (!exists) {
      out.push({ tokenId, exists: false });
      continue;
    }

    const owner = ownerR.status === "success" ? (ownerR.result as unknown as `0x${string}`) : undefined;

    let hand: JankenHand | undefined;
    if (handR.status === "success") {
      const n = toNum(handR.result);
      if (n === 0 || n === 1 || n === 2) hand = n as JankenHand;
      else issues.push("hand");
    } else {
      issues.push("hand");
    }

    let combat: CombatStats | undefined;
    if (combatR.status === "success") {
      const r: unknown = combatR.result;
      if (Array.isArray(r)) {
        combat = { hp: toNum(r[0]), atk: toNum(r[1]), matk: toNum(r[2]), def: toNum(r[3]), mdef: toNum(r[4]), agi: toNum(r[5]) };
      } else if (typeof r === "object" && r !== null) {
        const obj = r as Record<string, unknown>;
        combat = { hp: toNum(obj.hp), atk: toNum(obj.atk), matk: toNum(obj.matk), def: toNum(obj.def), mdef: toNum(obj.mdef), agi: toNum(obj.agi) };
      }
    } else {
      issues.push("combat");
    }

    let triad: TriadStats | undefined;
    if (triadR.status === "success") {
      const r: unknown = triadR.result;
      if (Array.isArray(r)) {
        triad = { up: toNum(r[0]), right: toNum(r[1]), left: toNum(r[2]), down: toNum(r[3]) };
      } else if (typeof r === "object" && r !== null) {
        const obj = r as Record<string, unknown>;
        triad = { up: toNum(obj.up), right: toNum(obj.right), left: toNum(obj.left), down: toNum(obj.down) };
      }
    } else {
      issues.push("triad");
    }

    out.push({
      tokenId,
      exists,
      owner,
      hand,
      combat,
      triad,
      issues: issues.length ? issues : undefined,
    });
  }

  return out;
}

export async function readOwnedTokenIds(owner: `0x${string}`, limit = 30): Promise<bigint[]> {
  if (!owner) return [];

  const client = getClient();
  const address = getContractAddress();

  const balance = await client.readContract({
    address,
    abi: NYANO_ABI,
    functionName: "balanceOf",
    args: [owner],
  });

  const count = Math.min(Number(balance), Math.max(0, limit));
  if (count <= 0) return [];

  const calls = Array.from({ length: count }, (_, idx) => ({
    address,
    abi: NYANO_ABI,
    functionName: "tokenOfOwnerByIndex" as const,
    args: [owner, BigInt(idx)] as const,
  }));

  const results = await client.multicall({ contracts: calls, allowFailure: true });

  const out: bigint[] = [];
  for (const r of results) {
    if (r.status === "success" && typeof r.result === "bigint") out.push(r.result);
  }
  return out;
}

export async function fetchTotalSupply(): Promise<bigint> {
  const client = getClient();
  const address = getContractAddress();

  return await client.readContract({
    address,
    abi: NYANO_ABI,
    functionName: "totalSupply",
  });
}
