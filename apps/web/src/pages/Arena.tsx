import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintTitleText } from "@/components/mint/MintTypography";
import { MintIcon } from "@/components/mint/icons/MintIcon";
import { appendThemeToPath, resolveAppTheme } from "@/lib/theme";

const DIFFICULTIES = [
  { key: "easy", ja: "はじめて", en: "Easy" },
  { key: "normal", ja: "ふつう", en: "Normal" },
  { key: "hard", ja: "つよい", en: "Hard" },
  { key: "expert", ja: "めっちゃつよい", en: "Expert" },
] as const;

type DifficultyKey = (typeof DIFFICULTIES)[number]["key"];

function parseDifficulty(value: string | null): DifficultyKey {
  if (value === "easy" || value === "hard" || value === "expert") return value;
  return "normal";
}

export function ArenaPage() {
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
  };

  const sideItems = [
    { to: themed("/decks"), label: "Decks", icon: "decks" as const },
    { to: themed("/match?ui=mint"), label: "Match", icon: "match" as const },
    { to: themed("/replay"), label: "Replay", icon: "replay" as const },
    { to: themed("/playground"), label: "Playground", icon: "playground" as const },
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
              Nyano Triad League Arena
            </MintTitleText>
            <p className="mint-arena-banner__subtitle">
              対戦難易度を選んで Play Now へ。Pixi Stage もここから開始できます。
            </p>
          </div>
        </GlassPanel>

        <GlassPanel as="section" variant="panel" className="mint-arena-quickplay">
          <div className="mint-arena-quickplay__header">Quick Play</div>
          <MintPressable to={quickPlayUrl} tone="primary" size="lg" fullWidth>
            Play Now
          </MintPressable>
          <MintPressable to={quickStageUrl} tone="soft" fullWidth>
            Pixi Stage
          </MintPressable>
          <Link to={themed("/events")} className="mint-arena-quickplay__link">
            Events へ
          </Link>
        </GlassPanel>
      </section>

      <section className="mint-arena-difficulty" aria-label="Difficulty selection">
        {DIFFICULTIES.map((item) => (
          <button
            key={item.key}
            className={[
              "mint-pressable mint-arena-difficulty__card",
              difficulty === item.key ? "mint-arena-difficulty__card--active" : "",
            ].join(" ")}
            onClick={() => handleDifficultySelect(item.key)}
          >
            <span className="mint-arena-difficulty__ja">{item.ja}</span>
            <span className="mint-arena-difficulty__en">{item.en}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
