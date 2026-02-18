import type { JankenHand } from "./nyano/gameIndex";

export type DeckFilterPreset = {
  id: string;
  label: string;
  hint: string;
  hand: JankenHand | -1;
  minEdgeSum: number;
};

export const DECK_FILTER_PRESETS = [
  { id: "all", label: "すべて", hint: "条件なし", hand: -1, minEdgeSum: 0 },
  { id: "rock", label: "グー重視", hint: "序盤の取り合い向け", hand: 0, minEdgeSum: 0 },
  { id: "scissors", label: "チョキ重視", hint: "反転狙いを増やす", hand: 1, minEdgeSum: 0 },
  { id: "paper", label: "パー重視", hint: "守りと受け返し向け", hand: 2, minEdgeSum: 0 },
  { id: "power", label: "高エッジ", hint: "辺の合計値で押し切る", hand: -1, minEdgeSum: 27 },
] as const satisfies readonly DeckFilterPreset[];

export type DeckFilterPresetId = (typeof DECK_FILTER_PRESETS)[number]["id"];

const DECK_FILTER_PRESET_MAP = new Map<DeckFilterPresetId, (typeof DECK_FILTER_PRESETS)[number]>(
  DECK_FILTER_PRESETS.map((preset) => [preset.id, preset]),
);

const LEGACY_DECK_FILTER_ID_MAP: Record<string, DeckFilterPresetId> = {
  attacker: "rock",
  defender: "paper",
  other: "scissors",
};

export function normalizeDeckFilterPresetId(value: string | null | undefined): DeckFilterPresetId | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (!key) return null;
  if (DECK_FILTER_PRESET_MAP.has(key as DeckFilterPresetId)) {
    return key as DeckFilterPresetId;
  }
  return LEGACY_DECK_FILTER_ID_MAP[key] ?? null;
}

export function isDeckFilterPresetId(value: string | null | undefined): value is DeckFilterPresetId {
  return normalizeDeckFilterPresetId(value) !== null;
}

export function resolveDeckFilterPreset(value: string | null | undefined): (typeof DECK_FILTER_PRESETS)[number] {
  const normalized = normalizeDeckFilterPresetId(value);
  if (!normalized) return DECK_FILTER_PRESETS[0];
  return DECK_FILTER_PRESET_MAP.get(normalized) ?? DECK_FILTER_PRESETS[0];
}
