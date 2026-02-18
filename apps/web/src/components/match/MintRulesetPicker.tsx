import React from "react";
import type { ClassicRulesConfigV1 } from "@nyano/triad-engine";

import type { RulesetKey } from "@/lib/ruleset_registry";
import {
  encodeClassicRulesMask,
  normalizeClassicRulesConfig,
} from "@/lib/classic_rules_param";
import { describeRulesetKey } from "./MatchSetupPanelMint.helpers";

type MintRulesetPickerProps = {
  rulesetKey: RulesetKey;
  classicConfig: ClassicRulesConfigV1;
  classicRuleTags: readonly string[];
  disabled?: boolean;
  onSelectRulesetKey: (nextKey: RulesetKey) => void;
  onSetClassicMask: (nextMask: string) => void;
};

const CLASSIC_PRESETS: Array<{ key: Exclude<RulesetKey, "v1" | "v2" | "full">; label: string }> = [
  { key: "classic_plus_same", label: "Plus+Same" },
  { key: "classic_plus", label: "Plus" },
  { key: "classic_same", label: "Same" },
  { key: "classic_reverse", label: "反転" },
  { key: "classic_ace_killer", label: "エースキラー" },
  { key: "classic_order", label: "順番固定" },
  { key: "classic_chaos", label: "ランダム" },
  { key: "classic_swap", label: "入替" },
  { key: "classic_all_open", label: "全公開" },
  { key: "classic_three_open", label: "3枚公開" },
  { key: "classic_type_ascend", label: "タイプ強化" },
  { key: "classic_type_descend", label: "タイプ弱化" },
  { key: "classic_custom", label: "カスタム" },
];

type RulesetFamily = "v1" | "v2" | "full" | "classic";

function resolveRulesetFamily(rulesetKey: RulesetKey): RulesetFamily {
  if (rulesetKey === "v1") return "v1";
  if (rulesetKey === "full") return "full";
  if (rulesetKey.startsWith("classic_")) return "classic";
  return "v2";
}

function segmentButtonClass(active: boolean): string {
  return [
    "mint-ruleset-picker__segment",
    "mint-pressable",
    "mint-pressable--pill",
    active ? "mint-ruleset-picker__segment--active" : "",
  ].join(" ");
}

function smallChipClass(active: boolean): string {
  return [
    "mint-ruleset-picker__chip",
    "mint-pressable",
    "mint-pressable--pill",
    active ? "mint-ruleset-picker__chip--active" : "",
  ].join(" ");
}

export function MintRulesetPicker(props: MintRulesetPickerProps) {
  const { rulesetKey, classicConfig, classicRuleTags, disabled = false, onSelectRulesetKey, onSetClassicMask } = props;

  const family = resolveRulesetFamily(rulesetKey);
  const isClassicCustom = rulesetKey === "classic_custom";

  const summaryText = React.useMemo(() => {
    if (rulesetKey !== "classic_custom") return describeRulesetKey(rulesetKey);
    if (classicRuleTags.length === 0) return "classic（custom: 未選択）";
    return `classic custom (${classicRuleTags.join(" + ")})`;
  }, [rulesetKey, classicRuleTags]);

  const updateClassicConfig = React.useCallback((patch: Partial<ClassicRulesConfigV1>) => {
    const next = normalizeClassicRulesConfig({ ...classicConfig, ...patch });
    const mask = encodeClassicRulesMask(next);
    onSetClassicMask(mask);
    if (rulesetKey !== "classic_custom") onSelectRulesetKey("classic_custom");
  }, [classicConfig, onSetClassicMask, rulesetKey, onSelectRulesetKey]);

  const setCardSelection = (mode: "none" | "order" | "chaos") => {
    updateClassicConfig({
      order: mode === "order",
      chaos: mode === "chaos",
    });
  };

  const setOpenRule = (mode: "none" | "allOpen" | "threeOpen") => {
    updateClassicConfig({
      allOpen: mode === "allOpen",
      threeOpen: mode === "threeOpen",
    });
  };

  const setTypeRule = (mode: "none" | "typeAscend" | "typeDescend") => {
    updateClassicConfig({
      typeAscend: mode === "typeAscend",
      typeDescend: mode === "typeDescend",
    });
  };

  return (
    <section
      className="mint-ruleset-picker"
      data-testid="mint-ruleset-picker"
      aria-label="Rules setup panel"
    >
      <div className="mint-ruleset-picker__title">ルール設定</div>

      <div className="mint-ruleset-picker__family" role="radiogroup" aria-label="Ruleset family">
        <button
          type="button"
          className={segmentButtonClass(family === "v1")}
          disabled={disabled}
          onClick={() => onSelectRulesetKey("v1")}
          aria-pressed={family === "v1"}
          data-testid="mint-ruleset-family-v1"
        >
          v1
        </button>
        <button
          type="button"
          className={segmentButtonClass(family === "v2")}
          disabled={disabled}
          onClick={() => onSelectRulesetKey("v2")}
          aria-pressed={family === "v2"}
          data-testid="mint-ruleset-family-v2"
        >
          v2
        </button>
        <button
          type="button"
          className={segmentButtonClass(family === "full")}
          disabled={disabled}
          onClick={() => onSelectRulesetKey("full")}
          aria-pressed={family === "full"}
          data-testid="mint-ruleset-family-full"
        >
          full
        </button>
        <button
          type="button"
          className={segmentButtonClass(family === "classic")}
          disabled={disabled}
          onClick={() => onSelectRulesetKey("classic_plus_same")}
          aria-pressed={family === "classic"}
          data-testid="mint-ruleset-family-classic"
        >
          classic
        </button>
      </div>

      <div className="mint-ruleset-picker__summary" data-testid="mint-ruleset-current-summary">
        <span className="mint-ruleset-picker__summary-key">現在:</span> {summaryText}
      </div>

      {family === "classic" ? (
        <div className="mint-ruleset-picker__classic-panel">
          <div className="mint-ruleset-picker__chip-row" role="radiogroup" aria-label="Classic setup mode">
            <button
              type="button"
              className={smallChipClass(!isClassicCustom)}
              disabled={disabled}
              onClick={() => onSelectRulesetKey("classic_plus_same")}
              data-testid="mint-ruleset-classic-preset-mode"
            >
              プリセット
            </button>
            <button
              type="button"
              className={smallChipClass(isClassicCustom)}
              disabled={disabled}
              onClick={() => onSelectRulesetKey("classic_custom")}
              data-testid="mint-ruleset-classic-custom-mode"
            >
              カスタム
            </button>
          </div>

          {!isClassicCustom ? (
            <div className="mint-ruleset-picker__chip-row">
              {CLASSIC_PRESETS.filter((item) => item.key !== "classic_custom").map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={smallChipClass(rulesetKey === item.key)}
                  disabled={disabled}
                  onClick={() => onSelectRulesetKey(item.key)}
                  data-testid={`mint-ruleset-preset-${item.key}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mint-ruleset-picker__custom-grid">
              <div className="mint-ruleset-picker__group">
                <div className="mint-ruleset-picker__group-title">トグル</div>
                <div className="mint-ruleset-picker__chip-row">
                  <label className="mint-ruleset-picker__toggle">
                    <input type="checkbox" checked={classicConfig.swap} disabled={disabled} onChange={(e) => updateClassicConfig({ swap: e.target.checked })} data-testid="mint-ruleset-custom-toggle-swap" />
                    入替 (Swap)
                  </label>
                  <label className="mint-ruleset-picker__toggle">
                    <input type="checkbox" checked={classicConfig.reverse} disabled={disabled} onChange={(e) => updateClassicConfig({ reverse: e.target.checked })} data-testid="mint-ruleset-custom-toggle-reverse" />
                    反転 (Reverse)
                  </label>
                  <label className="mint-ruleset-picker__toggle">
                    <input type="checkbox" checked={classicConfig.aceKiller} disabled={disabled} onChange={(e) => updateClassicConfig({ aceKiller: e.target.checked })} data-testid="mint-ruleset-custom-toggle-ace-killer" />
                    1が10に勝つ (Ace Killer)
                  </label>
                  <label className="mint-ruleset-picker__toggle">
                    <input type="checkbox" checked={classicConfig.plus} disabled={disabled} onChange={(e) => updateClassicConfig({ plus: e.target.checked })} data-testid="mint-ruleset-custom-toggle-plus" />
                    Plus
                  </label>
                  <label className="mint-ruleset-picker__toggle">
                    <input type="checkbox" checked={classicConfig.same} disabled={disabled} onChange={(e) => updateClassicConfig({ same: e.target.checked })} data-testid="mint-ruleset-custom-toggle-same" />
                    Same
                  </label>
                </div>
              </div>

              <div className="mint-ruleset-picker__group">
                <div className="mint-ruleset-picker__group-title">手札選択</div>
                <div className="mint-ruleset-picker__chip-row">
                  <button type="button" className={smallChipClass(!classicConfig.order && !classicConfig.chaos)} disabled={disabled} onClick={() => setCardSelection("none")} data-testid="mint-ruleset-custom-card-none">なし</button>
                  <button type="button" className={smallChipClass(classicConfig.order)} disabled={disabled} onClick={() => setCardSelection("order")} data-testid="mint-ruleset-custom-card-order">順番固定</button>
                  <button type="button" className={smallChipClass(classicConfig.chaos)} disabled={disabled} onClick={() => setCardSelection("chaos")} data-testid="mint-ruleset-custom-card-chaos">ランダム</button>
                </div>
              </div>

              <div className="mint-ruleset-picker__group">
                <div className="mint-ruleset-picker__group-title">公開ルール</div>
                <div className="mint-ruleset-picker__chip-row">
                  <button type="button" className={smallChipClass(!classicConfig.allOpen && !classicConfig.threeOpen)} disabled={disabled} onClick={() => setOpenRule("none")} data-testid="mint-ruleset-custom-open-none">なし</button>
                  <button type="button" className={smallChipClass(classicConfig.allOpen)} disabled={disabled} onClick={() => setOpenRule("allOpen")} data-testid="mint-ruleset-custom-open-all">全公開</button>
                  <button type="button" className={smallChipClass(classicConfig.threeOpen)} disabled={disabled} onClick={() => setOpenRule("threeOpen")} data-testid="mint-ruleset-custom-open-three">3枚公開</button>
                </div>
              </div>

              <div className="mint-ruleset-picker__group">
                <div className="mint-ruleset-picker__group-title">タイプルール</div>
                <div className="mint-ruleset-picker__chip-row">
                  <button type="button" className={smallChipClass(!classicConfig.typeAscend && !classicConfig.typeDescend)} disabled={disabled} onClick={() => setTypeRule("none")} data-testid="mint-ruleset-custom-type-none">なし</button>
                  <button type="button" className={smallChipClass(classicConfig.typeAscend)} disabled={disabled} onClick={() => setTypeRule("typeAscend")} data-testid="mint-ruleset-custom-type-ascend">強化</button>
                  <button type="button" className={smallChipClass(classicConfig.typeDescend)} disabled={disabled} onClick={() => setTypeRule("typeDescend")} data-testid="mint-ruleset-custom-type-descend">弱化</button>
                </div>
              </div>
            </div>
          )}

          <details className="mint-ruleset-picker__help">
            <summary className="mint-ruleset-picker__help-summary">ルールヘルプ</summary>
            <div className="mint-ruleset-picker__help-body">順番固定/ランダム、公開ルール、タイプルールはそれぞれ排他です。トグル系は同時に有効化できます。</div>
          </details>
        </div>
      ) : null}
    </section>
  );
}
