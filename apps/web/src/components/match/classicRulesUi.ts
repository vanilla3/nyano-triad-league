export interface ClassicRuleMeta {
  short: string;
  icon: string;
  title: string;
}

type ClassicOpenMode = "all_open" | "three_open";

const RULE_META: Record<string, ClassicRuleMeta> = {
  swap: { short: "SWAP", icon: "↔", title: "Swap: 開始時に一部カードを入れ替え" },
  reverse: { short: "REV", icon: "⇅", title: "Reverse: 強弱関係を反転" },
  aceKiller: { short: "ACE", icon: "A", title: "Ace Killer: 1 と 10 の関係を拡張" },
  plus: { short: "PLUS", icon: "+", title: "Plus: 隣接和が一致すると連鎖奪取" },
  same: { short: "SAME", icon: "=", title: "Same: 隣接値が一致すると連鎖奪取" },
  order: { short: "ORDER", icon: "1", title: "Order: 使用カードスロットが固定" },
  chaos: { short: "CHAOS", icon: "?", title: "Chaos: 毎ターンの使用スロットが乱択" },
  allOpen: { short: "OPEN", icon: "◎", title: "All Open: 全カード公開" },
  threeOpen: { short: "3OPEN", icon: "◔", title: "Three Open: 3枚公開" },
  typeAscend: { short: "ASC", icon: "↑", title: "Type Ascend: タイプ補正(昇順)" },
  typeDescend: { short: "DESC", icon: "↓", title: "Type Descend: タイプ補正(降順)" },
};

function toTitleCaseToken(value: string): string {
  if (!value) return "RULE";
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase();
}

export function getUniqueClassicRuleTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

export function getClassicRuleChipMeta(
  tag: string,
  options?: {
    openLabel?: string | null;
    swapLabel?: string | null;
  },
): ClassicRuleMeta {
  const base = RULE_META[tag];
  const short = base?.short ?? toTitleCaseToken(tag);
  const icon = base?.icon ?? "•";
  let title = base?.title ?? short;
  if ((tag === "allOpen" || tag === "threeOpen") && options?.openLabel) {
    title = options.openLabel;
  }
  if (tag === "swap" && options?.swapLabel) {
    title = options.swapLabel;
  }
  return { short, icon, title };
}

export function getPlayerDisplayLabel(playerIndex: 0 | 1): string {
  return playerIndex === 0 ? "プレイヤーA" : "プレイヤーB";
}

export function getPlayerEnglishLabel(playerIndex: 0 | 1): string {
  return playerIndex === 0 ? "Player A" : "Player B";
}

export function getClassicOpenModeLabel(mode: ClassicOpenMode): string {
  return mode === "all_open" ? "全公開 (ALL OPEN)" : "3枚公開 (THREE OPEN)";
}
