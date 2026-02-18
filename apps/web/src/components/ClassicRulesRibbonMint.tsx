import React from "react";
import { getClassicRuleChipMeta, getUniqueClassicRuleTags } from "@/components/match/classicRulesUi";

export interface ClassicRulesRibbonMintProps {
  ruleTags: readonly string[];
  openLabel?: string | null;
  swapLabel?: string | null;
  forcedCardIndex?: number | null;
  forcedRuleLabel?: string | null;
  className?: string;
}

export function ClassicRulesRibbonMint({
  ruleTags,
  openLabel,
  swapLabel,
  forcedCardIndex = null,
  forcedRuleLabel = null,
  className = "",
}: ClassicRulesRibbonMintProps) {
  const uniqueTags = React.useMemo(() => getUniqueClassicRuleTags(ruleTags), [ruleTags]);

  if (uniqueTags.length === 0 && forcedCardIndex === null) return null;

  return (
    <section
      className={["mint-rules-ribbon-row", className].filter(Boolean).join(" ")}
      aria-label="Classic rules ribbon"
    >
      <ul className="mint-rules-ribbon" role="list">
        {uniqueTags.map((tag) => {
          const meta = getClassicRuleChipMeta(tag, { openLabel, swapLabel });
          const chipLabel = meta.short;
          const title = meta.title;
          return (
            <li key={tag}>
              <span className="mint-rule-chip" title={title} aria-label={title}>
                <span className="mint-rule-chip__icon" aria-hidden="true">
                  {meta.icon}
                </span>
                <span className="mint-rule-chip__label">{chipLabel}</span>
              </span>
            </li>
          );
        })}

        {forcedCardIndex !== null && (
          <li>
            <span
              className="mint-rule-chip mint-rule-chip--forced"
              title={`このターンはスロット ${forcedCardIndex + 1} が固定`}
              aria-label={`このターンはスロット ${forcedCardIndex + 1} が固定`}
            >
              <span className="mint-rule-chip__icon" aria-hidden="true">
                #
              </span>
              <span className="mint-rule-chip__label">
                {forcedRuleLabel ? `${forcedRuleLabel} ${forcedCardIndex + 1}` : `FIX ${forcedCardIndex + 1}`}
              </span>
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}
