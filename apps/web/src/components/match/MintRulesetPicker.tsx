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
  { key: "classic_reverse", label: "Reverse" },
  { key: "classic_ace_killer", label: "Ace Killer" },
  { key: "classic_order", label: "Order" },
  { key: "classic_chaos", label: "Chaos" },
  { key: "classic_swap", label: "Swap" },
  { key: "classic_all_open", label: "All Open" },
  { key: "classic_three_open", label: "Three Open" },
  { key: "classic_type_ascend", label: "Type Ascend" },
  { key: "classic_type_descend", label: "Type Descend" },
  { key: "classic_custom", label: "Custom" },
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
    "rounded-md px-3 py-2 text-xs font-semibold transition",
    active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
  ].join(" ");
}

function smallChipClass(active: boolean): string {
  return [
    "rounded-md border px-2 py-1 text-xs transition",
    active
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ].join(" ");
}

export function MintRulesetPicker(props: MintRulesetPickerProps) {
  const { rulesetKey, classicConfig, classicRuleTags, disabled = false, onSelectRulesetKey, onSetClassicMask } = props;

  const family = resolveRulesetFamily(rulesetKey);
  const isClassicCustom = rulesetKey === "classic_custom";

  const summaryText = React.useMemo(() => {
    if (rulesetKey !== "classic_custom") return describeRulesetKey(rulesetKey);
    if (classicRuleTags.length === 0) return "classic custom (no rules selected)";
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
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3" data-testid="mint-ruleset-picker">
      <div className="text-xs font-medium text-slate-700">Rules setup</div>

      <div className="inline-flex w-full flex-wrap rounded-lg border border-slate-200 bg-white p-1">
        <button type="button" className={segmentButtonClass(family === "v1")} disabled={disabled} onClick={() => onSelectRulesetKey("v1")}>
          v1
        </button>
        <button type="button" className={segmentButtonClass(family === "v2")} disabled={disabled} onClick={() => onSelectRulesetKey("v2")}>
          v2
        </button>
        <button type="button" className={segmentButtonClass(family === "full")} disabled={disabled} onClick={() => onSelectRulesetKey("full")}>
          full
        </button>
        <button
          type="button"
          className={segmentButtonClass(family === "classic")}
          disabled={disabled}
          onClick={() => onSelectRulesetKey("classic_plus_same")}
        >
          classic
        </button>
      </div>

      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        <span className="font-semibold text-slate-900">Current:</span> {summaryText}
      </div>

      {family === "classic" ? (
        <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={smallChipClass(!isClassicCustom)}
              disabled={disabled}
              onClick={() => onSelectRulesetKey("classic_plus_same")}
            >
              Preset
            </button>
            <button
              type="button"
              className={smallChipClass(isClassicCustom)}
              disabled={disabled}
              onClick={() => onSelectRulesetKey("classic_custom")}
            >
              Custom
            </button>
          </div>

          {!isClassicCustom ? (
            <div className="flex flex-wrap gap-2">
              {CLASSIC_PRESETS.filter((item) => item.key !== "classic_custom").map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={smallChipClass(rulesetKey === item.key)}
                  disabled={disabled}
                  onClick={() => onSelectRulesetKey(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Toggles</div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                    <input type="checkbox" checked={classicConfig.swap} disabled={disabled} onChange={(e) => updateClassicConfig({ swap: e.target.checked })} />
                    Swap
                  </label>
                  <label className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                    <input type="checkbox" checked={classicConfig.reverse} disabled={disabled} onChange={(e) => updateClassicConfig({ reverse: e.target.checked })} />
                    Reverse
                  </label>
                  <label className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                    <input type="checkbox" checked={classicConfig.aceKiller} disabled={disabled} onChange={(e) => updateClassicConfig({ aceKiller: e.target.checked })} />
                    Ace Killer
                  </label>
                  <label className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                    <input type="checkbox" checked={classicConfig.plus} disabled={disabled} onChange={(e) => updateClassicConfig({ plus: e.target.checked })} />
                    Plus
                  </label>
                  <label className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                    <input type="checkbox" checked={classicConfig.same} disabled={disabled} onChange={(e) => updateClassicConfig({ same: e.target.checked })} />
                    Same
                  </label>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Card selection</div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={smallChipClass(!classicConfig.order && !classicConfig.chaos)} disabled={disabled} onClick={() => setCardSelection("none")}>None</button>
                  <button type="button" className={smallChipClass(classicConfig.order)} disabled={disabled} onClick={() => setCardSelection("order")}>Order</button>
                  <button type="button" className={smallChipClass(classicConfig.chaos)} disabled={disabled} onClick={() => setCardSelection("chaos")}>Chaos</button>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Open rule</div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={smallChipClass(!classicConfig.allOpen && !classicConfig.threeOpen)} disabled={disabled} onClick={() => setOpenRule("none")}>None</button>
                  <button type="button" className={smallChipClass(classicConfig.allOpen)} disabled={disabled} onClick={() => setOpenRule("allOpen")}>All Open</button>
                  <button type="button" className={smallChipClass(classicConfig.threeOpen)} disabled={disabled} onClick={() => setOpenRule("threeOpen")}>Three Open</button>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type rule</div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={smallChipClass(!classicConfig.typeAscend && !classicConfig.typeDescend)} disabled={disabled} onClick={() => setTypeRule("none")}>None</button>
                  <button type="button" className={smallChipClass(classicConfig.typeAscend)} disabled={disabled} onClick={() => setTypeRule("typeAscend")}>Type Ascend</button>
                  <button type="button" className={smallChipClass(classicConfig.typeDescend)} disabled={disabled} onClick={() => setTypeRule("typeDescend")}>Type Descend</button>
                </div>
              </div>
            </div>
          )}

          <details className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <summary className="cursor-pointer font-medium text-slate-700">Rule help</summary>
            <div className="mt-1">Order/Chaos, Open, Type は排他です。トグル系は同時に有効化できます。</div>
          </details>
        </div>
      ) : null}
    </section>
  );
}
