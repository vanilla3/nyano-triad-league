import { createPublicClient, http, parseAbi } from "viem";
import { mainnet } from "viem/chains";

import type { CardData } from "@nyano/triad-engine";
import { makeCardDataFromNyano } from "@nyano/triad-engine";

export const DEFAULT_RPC_URL = "https://cloudflare-eth.com";
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
  return (import.meta as any).env?.[key] as T | undefined;
}

export function getRpcUrl(): string {
  return env<string>("VITE_RPC_URL") ?? DEFAULT_RPC_URL;
}

export function getNyanoAddress(): `0x${string}` {
  return (env<string>("VITE_NYANO_ADDRESS") ?? DEFAULT_NYANO_ADDRESS) as `0x${string}`;
}

const ABI = parseAbi([
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getJankenHand(uint256 tokenId) view returns (uint8)",
  "function getTrait(uint256 tokenId) view returns (uint8 classId, uint8 seasonId, uint8 rarity)",
  "function getCombatStats(uint256 tokenId) view returns (uint16 hp, uint16 atk, uint16 matk, uint16 def, uint16 mdef, uint16 agi)",
  "function getTriad(uint256 tokenId) view returns (uint8 up, uint8 right, uint8 left, uint8 down)",
]);

let _client: ReturnType<typeof createPublicClient> | null = null;
function getClient() {
  if (_client) return _client;
  _client = createPublicClient({ chain: mainnet, transport: http(getRpcUrl()) });
  return _client;
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

export async function fetchNyanoCard(tokenId: bigint): Promise<NyanoCardBundle> {
  const key = tokenId.toString();
  const hit = cache.get(key);
  if (hit) return hit;

  const p = (async () => {
    const client = getClient();
    const addr = getNyanoAddress();

    const [owner, handRaw, traitRaw, statsRaw, triadRaw] = await Promise.all([
      client.readContract({ address: addr, abi: ABI, functionName: "ownerOf", args: [tokenId] }) as Promise<`0x${string}`>,
      client.readContract({ address: addr, abi: ABI, functionName: "getJankenHand", args: [tokenId] }) as Promise<bigint>,
      client.readContract({ address: addr, abi: ABI, functionName: "getTrait", args: [tokenId] }) as Promise<[bigint, bigint, bigint]>,
      client.readContract({ address: addr, abi: ABI, functionName: "getCombatStats", args: [tokenId] }) as Promise<[bigint, bigint, bigint, bigint, bigint, bigint]>,
      client.readContract({ address: addr, abi: ABI, functionName: "getTriad", args: [tokenId] }) as Promise<[bigint, bigint, bigint, bigint]>,
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

    return { tokenId, owner, hand, trait, combatStats, triad, card };
  })();

  cache.set(key, p);
  return p;
}

export async function fetchNyanoCards(tokenIds: bigint[]): Promise<Map<bigint, NyanoCardBundle>> {
  const uniq = Array.from(new Set(tokenIds.map((t) => t.toString()))).map((s) => BigInt(s));
  const entries = await Promise.all(uniq.map(async (tid) => [tid, await fetchNyanoCard(tid)] as const));
  return new Map(entries);
}
