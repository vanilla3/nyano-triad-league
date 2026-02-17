import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintPageGuide } from "@/components/mint/MintPageGuide";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintTitleText } from "@/components/mint/MintTypography";
import { MintIcon } from "@/components/mint/icons/MintIcon";
import { MINT_PAGE_GUIDES } from "@/lib/mint_page_guides";
import { appendThemeToPath, resolveAppTheme } from "@/lib/theme";

const DIFFICULTIES = [
  { key: "easy", ja: "はじめて", en: "Easy", hint: "基本を学ぶ", icon: "rules" as const },
  { key: "normal", ja: "ふつう", en: "Normal", hint: "バランス型", icon: "arena" as const },
  { key: "hard", ja: "つよい", en: "Hard", hint: "先読み重視", icon: "match" as const },
  { key: "expert", ja: "めっちゃつよい", en: "Expert", hint: "最高難度", icon: "sparkle" as const },
] as const;

type DifficultyKey = (typeof DIFFICULTIES)[number]["key"];

function parseDifficulty(value: string | null): DifficultyKey {
  if (value === "easy" || value === "hard" || value === "expert") return value;
  return "normal";
}

export function ArenaPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = resolveAppTheme(searchParams);
  const difficulty = parseDifficulty(searchParams.get("difficulty"));

  const themed = React.useCallback((path: string) => appendThemeToPath(path, theme), [theme]);
  const quickPlayUrl = themed(`/match?mode=guest&opp=vs_nyano_ai&ai=${difficulty}&rk=v2&ui=mint`);
  const quickStageUrl = themed(`/battle-stage?mode=guest&opp=vs_nyano_ai&ai=${difficulty}&rk=v2`);

  const handleDifficultySelect = (next: DifficultyKey) => {
    const params = new URLSearchParams(searchParams);
    params.set("difficulty", next);
    setSearchParams(params, { replace: true });
    navigate(themed(`/match?mode=guest&opp=vs_nyano_ai&ai=${next}&rk=v2&ui=mint`));
  };

  const sideItems = [
    { to: themed("/decks"), label: "デッキ", icon: "decks" as const },
    { to: themed("/match?ui=mint"), label: "対戦設定", icon: "match" as const },
    { to: themed("/replay"), label: "リプレイ", icon: "replay" as const },
    { to: themed("/playground"), label: "練習場", icon: "playground" as const },
  ];

  return (
    <div className="mint-arena-screen">
      <section className="mint-arena-layout">
        <aside className="mint-arena-sidenav" aria-label="Arena navigation">
          {sideItems.map((item) => (
            <MintPressable key={item.label} to={item.to} className="mint-arena-sidenav__item" fullWidth>
              <MintIcon name={item.icon} size={18} />
              <span>{item.label}</span>
            </MintPressable>
          ))}
        </aside>

        <GlassPanel as="section" variant="panel" className="mint-arena-banner">
          <div className="mint-arena-banner__mascot" aria-hidden="true">
            <img src="/favicon-32.png" alt="" width={44} height={44} />
          </div>
          <div className="mint-arena-banner__copy">
            <MintTitleText as="h2" className="mint-arena-banner__title">
              Nyano Triad League アリーナ
            </MintTitleText>
            <p className="mint-arena-banner__subtitle">難易度を選んで、すぐに対戦を始めよう。</p>
          </div>
        </GlassPanel>

        <GlassPanel as="section" variant="panel" className="mint-arena-quickplay">
          <div className="mint-arena-quickplay__header">クイック対戦</div>
          <MintPressable to={quickPlayUrl} tone="primary" size="lg" fullWidth>
            今すぐ遊ぶ
          </MintPressable>
          <MintPressable to={quickStageUrl} tone="soft" fullWidth>
            Pixi Stage
          </MintPressable>
          <Link to={themed("/events")} className="mint-arena-quickplay__link">
            イベント一覧を開く
          </Link>
        </GlassPanel>
      </section>

      <MintPageGuide spec={MINT_PAGE_GUIDES.arena} className="mint-arena-guide" />

      <section className="mint-arena-difficulty" aria-label="Difficulty selection">
        {DIFFICULTIES.map((item) => (
          <button
            key={item.key}
            type="button"
            className={[
              "mint-pressable mint-ui-pressable mint-ui-pressable--soft mint-ui-pressable--lg mint-arena-difficulty__card",
              difficulty === item.key ? "mint-arena-difficulty__card--active" : "",
            ].join(" ")}
            onClick={() => handleDifficultySelect(item.key)}
            aria-pressed={difficulty === item.key}
          >
            <span className="mint-arena-difficulty__top">
              <MintIcon name={item.icon} size={18} />
              <span className="mint-arena-difficulty__hint">{item.hint}</span>
            </span>
            <span className="mint-arena-difficulty__ja">{item.ja}</span>
            <span className="mint-arena-difficulty__en">{item.en}</span>
          </button>
        ))}
      </section>
      <p className="mint-arena-difficulty__assist">難易度カードを押すと、そのまま対戦開始します。</p>
    </div>
  );
}
