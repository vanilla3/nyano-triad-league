import type { AiDifficulty } from "@/lib/ai/nyano_ai";
import { encodeClassicRulesMask, normalizeClassicRulesConfig } from "@/lib/classic_rules_param";
import type { RulesetKey } from "@/lib/ruleset_registry";

type ClassicRulesetKey = Extract<RulesetKey, `classic_${string}`>;

export type ClassicQuickPresetId =
  | "classic_light"
  | "classic_plus_same"
  | "classic_chaos_party"
  | "classic_type_battle";
export type QuickRulesPresetSelection = "standard" | ClassicQuickPresetId;

export type ClassicQuickPreset = {
  id: ClassicQuickPresetId;
  label: string;
  labelEn: string;
  summary: string;
  rulesetKey: ClassicRulesetKey;
  classicMask?: string;
};

const CLASSIC_LIGHT_MASK = encodeClassicRulesMask(
  normalizeClassicRulesConfig({
    order: true,
    threeOpen: true,
  }),
);

const CLASSIC_CHAOS_PARTY_MASK = encodeClassicRulesMask(
  normalizeClassicRulesConfig({
    chaos: true,
    reverse: true,
    swap: true,
  }),
);

export const CLASSIC_QUICK_PRESETS: readonly ClassicQuickPreset[] = [
  {
    id: "classic_light",
    label: "クラシック入門",
    labelEn: "Classic Light",
    summary: "3枚公開 + 順番固定で読みやすい入門向け。",
    rulesetKey: "classic_custom",
    classicMask: CLASSIC_LIGHT_MASK,
  },
  {
    id: "classic_plus_same",
    label: "Plus/Same",
    labelEn: "Classic Plus/Same",
    summary: "連鎖が気持ちいい定番クラシック。",
    rulesetKey: "classic_plus_same",
  },
  {
    id: "classic_chaos_party",
    label: "カオスパーティ",
    labelEn: "Chaos Party",
    summary: "Chaos + Reverse + Swap のお祭り構成。",
    rulesetKey: "classic_custom",
    classicMask: CLASSIC_CHAOS_PARTY_MASK,
  },
  {
    id: "classic_type_battle",
    label: "タイプバトル",
    labelEn: "Type Battle",
    summary: "Type Ascend で属性相性の駆け引きを強調。",
    rulesetKey: "classic_type_ascend",
  },
];

const PRESET_BY_ID = new Map(
  CLASSIC_QUICK_PRESETS.map((preset) => [preset.id, preset] as const),
);

export function getClassicQuickPreset(id: ClassicQuickPresetId): ClassicQuickPreset {
  const preset = PRESET_BY_ID.get(id);
  if (!preset) {
    throw new Error(`Unknown classic quick preset: ${id}`);
  }
  return preset;
}

export function normalizeClassicQuickPresetId(
  value: string | null | undefined,
): ClassicQuickPresetId | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return PRESET_BY_ID.has(normalized as ClassicQuickPresetId)
    ? (normalized as ClassicQuickPresetId)
    : null;
}

type BuildClassicQuickMatchPathOptions = {
  presetId: ClassicQuickPresetId;
  ai: AiDifficulty;
};

export function buildClassicQuickMatchPath(opts: BuildClassicQuickMatchPathOptions): string {
  const preset = getClassicQuickPreset(opts.presetId);
  const params = new URLSearchParams();
  params.set("mode", "guest");
  params.set("opp", "vs_nyano_ai");
  params.set("ai", opts.ai);
  params.set("ui", "mint");
  params.set("rk", preset.rulesetKey);
  if (preset.classicMask) {
    params.set("cr", preset.classicMask);
  }
  return `/match?${params.toString()}`;
}

type BuildQuickGuestMatchPathOptions = {
  preset: QuickRulesPresetSelection;
  ai: AiDifficulty;
  ui?: "mint" | "engine" | "rpg";
};

export function buildQuickGuestMatchPath(opts: BuildQuickGuestMatchPathOptions): string {
  if (opts.preset !== "standard") {
    return buildClassicQuickMatchPath({ presetId: opts.preset, ai: opts.ai });
  }

  const params = new URLSearchParams();
  params.set("mode", "guest");
  params.set("opp", "vs_nyano_ai");
  params.set("ai", opts.ai);
  params.set("rk", "v2");
  params.set("ui", opts.ui ?? "mint");
  return `/match?${params.toString()}`;
}

type BuildQuickGuestStagePathOptions = {
  preset: QuickRulesPresetSelection;
  ai: AiDifficulty;
};

export function buildQuickGuestStagePath(opts: BuildQuickGuestStagePathOptions): string {
  const params = new URLSearchParams();
  params.set("mode", "guest");
  params.set("opp", "vs_nyano_ai");
  params.set("ai", opts.ai);

  if (opts.preset === "standard") {
    params.set("rk", "v2");
  } else {
    const preset = getClassicQuickPreset(opts.preset);
    params.set("rk", preset.rulesetKey);
    if (preset.classicMask) params.set("cr", preset.classicMask);
  }

  return `/battle-stage?${params.toString()}`;
}
