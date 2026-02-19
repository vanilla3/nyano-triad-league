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
  const [helpOpen, setHelpOpen] = React.useState(false);
  const uniqueTags = React.useMemo(() => getUniqueClassicRuleTags(ruleTags), [ruleTags]);
  const ruleItems = React.useMemo(
    () =>
      uniqueTags.map((tag) => {
        const meta = getClassicRuleChipMeta(tag, { openLabel, swapLabel });
        return { tag, meta };
      }),
    [uniqueTags, openLabel, swapLabel],
  );

  if (uniqueTags.length === 0 && forcedCardIndex === null) return null;

  return (
    <section
      className={["mint-rules-ribbon-row", className].filter(Boolean).join(" ")}
      aria-label="Classic rules ribbon"
    >
      <div className="mint-rules-ribbon-row__main">
        <ul className="mint-rules-ribbon" role="list">
          {ruleItems.map((item) => (
            <li key={item.tag}>
              <span className="mint-rule-chip" title={item.meta.title} aria-label={item.meta.title}>
                <span className="mint-rule-chip__icon" aria-hidden="true">
                  {item.meta.icon}
                </span>
                <span className="mint-rule-chip__label">{item.meta.short}</span>
              </span>
            </li>
          ))}

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
        <button
          type="button"
          className="mint-rules-ribbon__help-btn"
          aria-expanded={helpOpen}
          aria-label={helpOpen ? "ルール説明を閉じる" : "ルール説明を開く"}
          onClick={() => setHelpOpen((prev) => !prev)}
        >
          ?
        </button>
      </div>

      {helpOpen ? (
        <div className="mint-rules-ribbon-help" role="dialog" aria-label="Classic rules help">
          <div className="mint-rules-ribbon-help__title">クラシックルール説明</div>
          <ul className="mint-rules-ribbon-help__list" role="list">
            {ruleItems.map((item) => (
              <li key={`help-${item.tag}`} className="mint-rules-ribbon-help__item">
                <span className="mint-rules-ribbon-help__item-head">
                  <span className="mint-rules-ribbon-help__icon" aria-hidden="true">
                    {item.meta.icon}
                  </span>
                  <span className="mint-rules-ribbon-help__name">{item.meta.short}</span>
                </span>
                <span className="mint-rules-ribbon-help__desc">{item.meta.title}</span>
              </li>
            ))}
            {forcedCardIndex !== null ? (
              <li className="mint-rules-ribbon-help__item">
                <span className="mint-rules-ribbon-help__item-head">
                  <span className="mint-rules-ribbon-help__icon" aria-hidden="true">#</span>
                  <span className="mint-rules-ribbon-help__name">FIX</span>
                </span>
                <span className="mint-rules-ribbon-help__desc">
                  {forcedRuleLabel ? `${forcedRuleLabel} ${forcedCardIndex + 1}` : `このターンはスロット ${forcedCardIndex + 1} が固定`}
                </span>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
