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
    summary: "決定論と互換性を重視したベースルール。",
    tags: ["core", "stable", "v1"],
    recommended: false,
  },
  v2: {
    title: "コア戦術 v2",
    summary: "標準ルール。迷ったらまずこれ。",
    tags: ["default", "balanced", "v2"],
    recommended: true,
  },
  full: {
    title: "フルルール",
    summary: "特性・編成を含む、最も戦術的な構成。",
    tags: ["advanced", "deep"],
    recommended: true,
  },
  classic_plus_same: {
    title: "クラシック Plus+Same",
    summary: "連鎖が起きやすい定番クラシック。",
    tags: ["classic", "combo"],
    recommended: true,
  },
  classic_custom: {
    title: "クラシック カスタム",
    summary: "ルールを自由に組み合わせてURL共有。",
    tags: ["classic", "custom"],
    recommended: false,
  },
  classic_plus: {
    title: "クラシック Plus",
    summary: "Plus による連鎖奪取を有効化。",
    tags: ["classic", "plus"],
    recommended: false,
  },
  classic_same: {
    title: "クラシック Same",
    summary: "Same による連鎖奪取を有効化。",
    tags: ["classic", "same"],
    recommended: false,
  },
  classic_reverse: {
    title: "クラシック Reverse",
    summary: "数値の強弱関係を反転。",
    tags: ["classic", "reverse"],
    recommended: false,
  },
  classic_ace_killer: {
    title: "クラシック Ace Killer",
    summary: "1 が 10 に勝つ特殊ルール。",
    tags: ["classic", "ace_killer"],
    recommended: false,
  },
  classic_type_ascend: {
    title: "クラシック Type Ascend",
    summary: "同タイプ継続配置で補正が上昇。",
    tags: ["classic", "type", "ascend"],
    recommended: false,
  },
  classic_type_descend: {
    title: "クラシック Type Descend",
    summary: "同タイプ継続配置で補正が減衰。",
    tags: ["classic", "type", "descend"],
    recommended: false,
  },
  classic_order: {
    title: "クラシック Order",
    summary: "カード使用順が固定される。",
    tags: ["classic", "order"],
    recommended: false,
  },
  classic_chaos: {
    title: "クラシック Chaos",
    summary: "毎ターンの使用カードがランダム。",
    tags: ["classic", "chaos"],
    recommended: false,
  },
  classic_swap: {
    title: "クラシック Swap",
    summary: "開始時に手札スロットが入れ替わる。",
    tags: ["classic", "swap"],
    recommended: false,
  },
  classic_all_open: {
    title: "クラシック All Open",
    summary: "双方の手札を常時公開。",
    tags: ["classic", "open"],
    recommended: false,
  },
  classic_three_open: {
    title: "クラシック Three Open",
    summary: "各手札3枚のみ公開。",
    tags: ["classic", "open"],
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

type BuildMatchRulesetUrlOptions = {
  classicMask?: string | null;
  theme?: string | null;
};

export function buildMatchRulesetUrl(key: RulesetKey, opts?: BuildMatchRulesetUrlOptions): string {
  const params = new URLSearchParams();
  params.set("ui", "mint");
  params.set("rk", key);
  if (key === "classic_custom" && opts?.classicMask) params.set("cr", opts.classicMask);
  if (opts?.theme) params.set("theme", opts.theme);
  return `/match?${params.toString()}`;
}
