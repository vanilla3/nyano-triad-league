import { computeRulesetId } from "@nyano/triad-engine";

import { RULESET_KEYS, resolveRulesetOrThrow, type RulesetKey } from "@/lib/ruleset_registry";

export type RulesetDiscoveryMeta = {
  title: string;
  summary: string;
  tags: readonly string[];
  recommended: boolean;
};

const RULESET_META: Record<RulesetKey, RulesetDiscoveryMeta> = {
  v1: {
    title: "コア戦術 v1",
    summary: "オンチェーン互換を重視した基本ルールです。",
    tags: ["基本", "安定"],
    recommended: false,
  },
  v2: {
    title: "コア戦術 v2",
    summary: "現在の標準ルールです。初回対戦におすすめです。",
    tags: ["標準", "バランス"],
    recommended: true,
  },
  full: {
    title: "フルルール",
    summary: "特性とフォーメーションが有効な、読み合い重視の構成です。",
    tags: ["上級", "戦略"],
    recommended: true,
  },
  classic_plus_same: {
    title: "クラシック Plus+Same",
    summary: "クラシック系の定番。Plus と Same を同時に使います。",
    tags: ["クラシック", "コンボ"],
    recommended: true,
  },
  classic_custom: {
    title: "クラシック カスタム",
    summary: "クラシックの各ルールを自由に組み合わせてURL共有できます。",
    tags: ["クラシック", "カスタム"],
    recommended: false,
  },
  classic_plus: {
    title: "クラシック Plus",
    summary: "クラシックに Plus ルールを追加した構成です。",
    tags: ["クラシック", "Plus"],
    recommended: false,
  },
  classic_same: {
    title: "クラシック Same",
    summary: "クラシックに Same ルールを追加した構成です。",
    tags: ["クラシック", "Same"],
    recommended: false,
  },
  classic_reverse: {
    title: "クラシック Reverse",
    summary: "辺の比較が反転し、低い数値で高い数値を取れるようになります。",
    tags: ["クラシック", "Reverse"],
    recommended: false,
  },
  classic_ace_killer: {
    title: "クラシック Ace Killer",
    summary: "Ace Killer（1が10を取る）を有効化した構成です。",
    tags: ["クラシック", "AceKiller"],
    recommended: false,
  },
  classic_type_ascend: {
    title: "クラシック タイプ強化",
    summary: "同タイプを重ねるほど値が強化されます。",
    tags: ["クラシック", "タイプ", "強化"],
    recommended: false,
  },
  classic_type_descend: {
    title: "クラシック タイプ弱化",
    summary: "同タイプを重ねるほど値が弱化されます。",
    tags: ["クラシック", "タイプ", "弱化"],
    recommended: false,
  },
  classic_order: {
    title: "クラシック 順番固定",
    summary: "手札の並び順がそのままプレイ順に影響します。",
    tags: ["クラシック", "順番固定"],
    recommended: false,
  },
  classic_chaos: {
    title: "クラシック ランダム",
    summary: "毎ターンの選択制約がランダムに変化します。",
    tags: ["クラシック", "ランダム"],
    recommended: false,
  },
  classic_swap: {
    title: "クラシック 入れ替え",
    summary: "対戦開始時に所定スロットが入れ替わります。",
    tags: ["クラシック", "入れ替え"],
    recommended: false,
  },
  classic_all_open: {
    title: "クラシック 全公開",
    summary: "両プレイヤーの手札が最初からすべて公開されます。",
    tags: ["クラシック", "公開"],
    recommended: false,
  },
  classic_three_open: {
    title: "クラシック 3枚公開",
    summary: "手札のうち3枚のみ公開され、残りは非公開です。",
    tags: ["クラシック", "公開"],
    recommended: false,
  },
};

const RULESET_ID_TO_KEY = new Map<string, RulesetKey>(
  RULESET_KEYS.map((key) => [computeRulesetId(resolveRulesetOrThrow(key)).toLowerCase(), key]),
);

export function resolveRulesetKeyById(rulesetId: string | null | undefined): RulesetKey | null {
  if (typeof rulesetId !== "string" || rulesetId.length === 0) return null;
  return RULESET_ID_TO_KEY.get(rulesetId.toLowerCase()) ?? null;
}

export function getRulesetMeta(key: RulesetKey): RulesetDiscoveryMeta {
  return RULESET_META[key];
}

export function getRecommendedRulesetKeys(): RulesetKey[] {
  return RULESET_KEYS.filter((key) => RULESET_META[key].recommended);
}

export function buildMatchRulesetUrl(key: RulesetKey): string {
  return `/match?ui=mint&rk=${key}`;
}
