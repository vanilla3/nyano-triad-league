import React from "react";
import { Link } from "react-router-dom";

import type { ClassicRulesConfigV1 } from "@nyano/triad-engine";
import type { AiDifficulty } from "@/lib/ai/nyano_ai";
import type { RulesetKey } from "@/lib/ruleset_registry";
import type { MatchBoardUi, OpponentMode } from "@/features/match/urlParams";
import { appendThemeToPath, type AppTheme } from "@/lib/theme";

import { NyanoAvatar } from "@/components/NyanoAvatar";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintTitleText } from "@/components/mint/MintTypography";
import { MintIcon } from "@/components/mint/icons/MintIcon";
import { MintRulesetPicker } from "@/components/match/MintRulesetPicker";
import { describeRulesetKeyDisplay } from "@/components/match/MatchSetupPanelMint.helpers";

const AI_DIFFICULTY_ITEMS: Array<{ key: AiDifficulty; label: string; hint: string }> = [
  { key: "easy", label: "はじめて", hint: "基本" },
  { key: "normal", label: "ふつう", hint: "標準" },
  { key: "hard", label: "つよい", hint: "先読み" },
  { key: "expert", label: "めっちゃつよい", hint: "最難" },
];

function resolveAiDifficultyDisplay(key: AiDifficulty): string {
  const found = AI_DIFFICULTY_ITEMS.find((it) => it.key === key);
  return found ? `${found.label} (${found.hint})` : key;
}

function resolveBoardUiDisplay(ui: MatchBoardUi): string {
  if (ui === "engine") return "✨ Pixi";
  if (ui === "rpg") return "🗺️ RPG";
  return "🌿 Mint";
}

export type MatchGuestSetupPanelMintProps = {
  isVisible: boolean;
  defaultOpen?: boolean;
  theme: AppTheme;
  tutorial?: React.ReactNode;

  opponentMode: OpponentMode;
  aiDifficulty: AiDifficulty;
  aiAutoPlay: boolean;
  rulesetKey: RulesetKey;
  classicConfig: ClassicRulesConfigV1;
  classicRuleTags: readonly string[];
  ui: MatchBoardUi;

  disabled?: boolean;
  onSetParam: (key: string, value: string) => void;
  onSelectRulesetKey: (nextKey: RulesetKey) => void;
  onSetClassicMask: (nextMask: string) => void;
  onBoardUiChange?: (nextUi: MatchBoardUi) => void;
};

export function MatchGuestSetupPanelMint(props: MatchGuestSetupPanelMintProps): React.ReactElement | null {
  const {
    isVisible,
    defaultOpen = false,
    theme,
    tutorial,
    opponentMode,
    aiDifficulty,
    aiAutoPlay,
    rulesetKey,
    classicConfig,
    classicRuleTags,
    ui,
    disabled = false,
    onSetParam,
    onSelectRulesetKey,
    onSetClassicMask,
    onBoardUiChange,
  } = props;

  const [open, setOpen] = React.useState(defaultOpen);

  if (!isVisible) return null;

  const themed = (path: string) => appendThemeToPath(path, theme);
  const rulesSummary = describeRulesetKeyDisplay(rulesetKey);

  return (
    <>
      <GlassPanel as="section" variant="panel" className="mint-guest-setup mint-motion-enter">
        <div className="mint-guest-setup__header">
          <NyanoAvatar size={44} expression="playful" />
          <div className="mint-guest-setup__header-copy">
            <MintTitleText as="h3" className="mint-guest-setup__title">
              ゲスト クイック対戦
            </MintTitleText>
            <div className="mint-guest-setup__subtitle">ルールや難易度はあとからでも変更できます。</div>
          </div>

          <div className="mint-guest-setup__header-actions">
            <MintPressable
              tone="soft"
              size="sm"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              <MintIcon name="rules" size={16} />
              <span>{open ? "閉じる" : "設定"}</span>
            </MintPressable>
          </div>
        </div>

        <div className="mint-guest-setup__summary-row">
          <div className="mint-guest-setup__pill">
            <span className="mint-guest-setup__pill-label">ルール</span>
            <span className="mint-guest-setup__pill-value" title={rulesSummary}>
              {rulesSummary}
            </span>
          </div>
          <div className="mint-guest-setup__pill">
            <span className="mint-guest-setup__pill-label">盤面</span>
            <span className="mint-guest-setup__pill-value" title={ui}>{resolveBoardUiDisplay(ui)}</span>
          </div>
          {opponentMode === "vs_nyano_ai" ? (
            <div className="mint-guest-setup__pill">
              <span className="mint-guest-setup__pill-label">AI</span>
              <span className="mint-guest-setup__pill-value" title={aiDifficulty}>{resolveAiDifficultyDisplay(aiDifficulty)}</span>
            </div>
          ) : (
            <div className="mint-guest-setup__pill">
              <span className="mint-guest-setup__pill-label">対戦</span>
              <span className="mint-guest-setup__pill-value">対人</span>
            </div>
          )}
        </div>

        {open ? (
          <div className="mint-guest-setup__drawer mint-motion-enter">
            {opponentMode === "vs_nyano_ai" ? (
              <div className="mint-guest-setup__section">
                <div className="mint-guest-setup__section-title">難易度</div>
                <div className="mint-guest-setup__chips" role="list" aria-label="AI difficulty">
                  {AI_DIFFICULTY_ITEMS.map((item) => {
                    const active = aiDifficulty === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`mint-guest-setup__chip mint-pressable mint-hit${active ? " is-active" : ""}`}
                        disabled={disabled}
                        onClick={() => onSetParam("ai", item.key)}
                        aria-pressed={active}
                        title={item.hint}
                      >
                        <span className="mint-guest-setup__chip-label">{item.label}</span>
                        <small className="mint-guest-setup__chip-hint">{item.hint}</small>
                      </button>
                    );
                  })}
                </div>
                <label className="mint-guest-setup__toggle">
                  <input
                    type="checkbox"
                    checked={aiAutoPlay}
                    onChange={(e) => onSetParam("auto", e.target.checked ? "1" : "0")}
                    disabled={disabled}
                  />
                  Nyanoの手番を自動進行
                </label>
              </div>
            ) : null}

            {onBoardUiChange ? (
              <div className="mint-guest-setup__section">
                <div className="mint-guest-setup__section-title">盤面スタイル</div>
                <div className="mint-guest-setup__chips" role="list" aria-label="Board UI">
                  {(["mint", "rpg", "engine"] as const).map((item) => {
                    const active = ui === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`mint-guest-setup__chip mint-pressable mint-hit${active ? " is-active" : ""}`}
                        disabled={disabled}
                        onClick={() => onBoardUiChange(item)}
                        aria-pressed={active}
                      >
                        <span className="mint-guest-setup__chip-label">{resolveBoardUiDisplay(item)}</span>
                        <small className="mint-guest-setup__chip-hint">
                          {item === "mint" ? "標準" : item === "rpg" ? "演出" : "Pixi"}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mint-guest-setup__section">
              <div className="mint-guest-setup__section-title">ルール</div>
              <MintRulesetPicker
                rulesetKey={rulesetKey}
                classicConfig={classicConfig}
                classicRuleTags={classicRuleTags}
                disabled={disabled}
                onSelectRulesetKey={onSelectRulesetKey}
                onSetClassicMask={onSetClassicMask}
              />
              <div className="mint-guest-setup__helper">
                <span>デッキを作って遊ぶ → </span>
                <Link to={themed("/decks")} className="mint-guest-setup__link">
                  デッキ
                </Link>
                <span> / </span>
                <Link to={themed("/arena")} className="mint-guest-setup__link">
                  アリーナ
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </GlassPanel>

      {tutorial ? <div className="mint-guest-setup__tutorial">{tutorial}</div> : null}
    </>
  );
}
