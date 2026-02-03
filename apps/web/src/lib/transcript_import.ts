import type { TranscriptV1, Turn } from "@nyano/triad-engine";

type AnyObj = Record<string, any>;
type BigIntish = string | number | bigint;

function must<T>(v: T | undefined | null, msg: string): T {
  if (v === undefined || v === null) throw new Error(msg);
  return v;
}

function toBigInt(x: BigIntish, name: string): bigint {
  if (typeof x === "bigint") return x;
  if (typeof x === "number") {
    if (!Number.isFinite(x)) throw new Error(`${name}: not finite`);
    return BigInt(x);
  }
  if (typeof x === "string") {
    if (!x.trim()) throw new Error(`${name}: empty string`);
    // allow decimal only
    return BigInt(x);
  }
  throw new Error(`${name}: unsupported type`);
}

function toNum(x: any, name: string): number {
  if (typeof x === "number") return x;
  if (typeof x === "string") return Number(x);
  if (typeof x === "bigint") return Number(x);
  throw new Error(`${name}: expected number`);
}

function toHexString(x: any, name: string): `0x${string}` {
  if (typeof x !== "string") throw new Error(`${name}: expected hex string`);
  if (!x.startsWith("0x")) throw new Error(`${name}: must start with 0x`);
  return x as `0x${string}`;
}

function normalizeTurn(t: AnyObj, i: number): Turn {
  return {
    cell: toNum(must(t.cell, `turn[${i}].cell missing`), `turn[${i}].cell`),
    cardIndex: toNum(must(t.cardIndex, `turn[${i}].cardIndex missing`), `turn[${i}].cardIndex`),
    warningMarkCell: t.warningMarkCell === undefined ? undefined : toNum(t.warningMarkCell, `turn[${i}].warningMarkCell`),
    earthBoostEdge: t.earthBoostEdge === undefined ? undefined : toNum(t.earthBoostEdge, `turn[${i}].earthBoostEdge`),
    reserved: t.reserved === undefined ? undefined : toNum(t.reserved, `turn[${i}].reserved`),
  };
}

export function parseTranscriptV1Json(text: string): TranscriptV1 {
  const obj = JSON.parse(text) as AnyObj;
  const header = must(obj.header, "header missing");

  const deckA = must(header.deckA, "header.deckA missing") as BigIntish[];
  const deckB = must(header.deckB, "header.deckB missing") as BigIntish[];

  const turnsRaw = must(obj.turns, "turns missing") as AnyObj[];
  const turns = turnsRaw.map(normalizeTurn);

  return {
    header: {
      version: toNum(must(header.version, "header.version missing"), "header.version"),
      rulesetId: toHexString(must(header.rulesetId, "header.rulesetId missing"), "header.rulesetId"),
      seasonId: toNum(must(header.seasonId, "header.seasonId missing"), "header.seasonId"),
      playerA: toHexString(must(header.playerA, "header.playerA missing"), "header.playerA"),
      playerB: toHexString(must(header.playerB, "header.playerB missing"), "header.playerB"),
      deckA: deckA.map((x, i) => toBigInt(x, `header.deckA[${i}]`)),
      deckB: deckB.map((x, i) => toBigInt(x, `header.deckB[${i}]`)),
      firstPlayer: toNum(must(header.firstPlayer, "header.firstPlayer missing"), "header.firstPlayer") as 0 | 1,
      deadline: toNum(must(header.deadline, "header.deadline missing"), "header.deadline"),
      salt: toHexString(must(header.salt, "header.salt missing"), "header.salt"),
    },
    turns,
  };
}
