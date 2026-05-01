import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintPageGuide } from "@/components/mint/MintPageGuide";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintTitleText, MintLabel } from "@/components/mint/MintTypography";
import { MintIcon } from "@/components/mint/icons/MintIcon";
import { MINT_PAGE_GUIDES } from "@/lib/mint_page_guides";
import { appendThemeToPath, resolveAppTheme } from "@/lib/theme";
import { NYANO_MINI_IMAGE_URL } from "@/lib/nyano_assets";

const DIFFICULTIES = [
  { key: "easy", label: "はじめて", sub: "ゆるめ", hint: "まずは一手ずつ" },
  { key: "normal", label: "ふつう", sub: "おすすめ", hint: "読み合い入門" },
  { key: "hard", label: "つよい", sub: "勝負", hint: "取り返しに注意" },
  { key: "expert", label: "めっちゃつよい", sub: "真剣", hint: "最後まで油断なし" },
] as const;

type DifficultyKey = (typeof DIFFICULTIES)[number]["key"];

const ARENA_CELLS = ["A", "7", "2", "5", "N", "9", "3", "K", "8"] as const;

export function ArenaPage() {
  const [searchParams] = useSearchParams();
  const theme = resolveAppTheme(searchParams);
  const themed = React.useCallback((to: string) => appendThemeToPath(to, theme), [theme]);
  const [difficulty, setDifficulty] = React.useState<DifficultyKey>("normal");
  const quickPlayUrl = themed(`/match?mode=guest&opp=vs_nyano_ai&ai=${difficulty}&rk=v2&ui=mint`);
  const quickStageUrl = themed(`/battle-stage?mode=guest&opp=vs_nyano_ai&ai=${difficulty}&rk=v2`);
  const activeDifficulty = DIFFICULTIES.find((item) => item.key === difficulty) ?? DIFFICULTIES[1];

  return (
    <div className="mint-arena-screen mint-game-page">
      <section className="mint-game-page-hero mint-game-page-hero--arena">
        <div className="mint-game-page-hero__copy">
          <div className="mint-game-page-kicker">
            <MintIcon name="arena" size={16} />
            <span>Nyano Arena</span>
          </div>
          <MintTitleText as="h2" className="mint-game-page-hero__title">
            アリーナへようこそ
          </MintTitleText>
          <p className="mint-game-page-hero__lead">
            Nyano AIが盤面で待機中。強さを選んで、3×3の一戦をすぐ始めよう。
          </p>
          <div className="mint-game-page-hero__actions">
            <MintPressable to={quickPlayUrl} tone="primary">
              <MintIcon name="match" size={18} />
              <span>すぐ遊ぶ</span>
            </MintPressable>
            <MintPressable to={themed("/decks")} tone="soft">
              <MintIcon name="decks" size={18} />
              <span>カードを組む</span>
            </MintPressable>
          </div>
        </div>
        <div className="mint-game-page-mascot mint-game-page-mascot--arena" aria-hidden="true">
          <img src={NYANO_MINI_IMAGE_URL} alt="" loading="lazy" />
        </div>
      </section>

      <section className="mint-arena-layout">
        <div className="mint-arena-sidenav">
          <MintPressable to={quickPlayUrl} tone="primary" className="mint-arena-sidenav__item">
            <MintIcon name="match" size={18} />
            <span>対戦する</span>
          </MintPressable>
          <MintPressable to={themed("/events")} tone="soft" className="mint-arena-sidenav__item">
            <MintIcon name="events" size={18} />
            <span>イベントへ</span>
          </MintPressable>
          <MintPressable to={themed("/replay")} tone="soft" className="mint-arena-sidenav__item">
            <MintIcon name="replay" size={18} />
            <span>リプレイを見る</span>
          </MintPressable>
        </div>

        <GlassPanel variant="panel" className="mint-arena-runway">
          <div className="mint-arena-runway__head">
            <div>
              <MintLabel>対戦相手</MintLabel>
              <MintTitleText as="h3" className="mint-arena-runway__title">
                Nyano AI
              </MintTitleText>
            </div>
            <span className="mint-arena-runway__badge">{activeDifficulty.label}</span>
          </div>
          <div className="mint-arena-board-mini" aria-hidden="true">
            {ARENA_CELLS.map((cell, index) => (
              <span key={`${cell}-${index}`} className={index === 4 ? "mint-arena-board-mini__cell mint-arena-board-mini__cell--nyano" : "mint-arena-board-mini__cell"}>
                {cell}
              </span>
            ))}
          </div>
          <p className="mint-arena-difficulty__assist">
            今の相手は「{activeDifficulty.label}」。{activeDifficulty.hint}でいこう。
          </p>
        </GlassPanel>

        <GlassPanel variant="panel" className="mint-arena-quickplay">
          <div className="mint-arena-quickplay__header">今日の一戦</div>
          <p className="mint-arena-quickplay__rules-summary">
            ゲスト対戦でそのまま開始。勝っても負けてもリプレイで振り返れます。
          </p>
          <div className="mint-arena-quickplay__actions">
            <MintPressable to={quickPlayUrl} tone="primary" fullWidth>
              <MintIcon name="match" size={18} />
              <span>バトル開始</span>
            </MintPressable>
            <MintPressable to={quickStageUrl} tone="soft" fullWidth>
              <MintIcon name="sparkle" size={18} />
              <span>ステージで見る</span>
            </MintPressable>
            <Link className="mint-arena-quickplay__link" to={themed("/rulesets")}>
              ルールを確認
            </Link>
          </div>
        </GlassPanel>
      </section>

      <section className="mint-arena-difficulty" aria-label="Difficulty">
        {DIFFICULTIES.map((item) => (
          <button
            key={item.key}
            className={[
              "mint-pressable mint-ui-pressable mint-arena-difficulty__card",
              difficulty === item.key ? "mint-arena-difficulty__card--active" : "",
            ].join(" ")}
            onClick={() => setDifficulty(item.key)}
            aria-pressed={difficulty === item.key}
          >
            <span className="mint-arena-difficulty__top">
              <MintIcon name="sparkle" size={14} />
              {item.sub}
            </span>
            <span className="mint-arena-difficulty__ja">{item.label}</span>
            <span className="mint-arena-difficulty__en">{item.hint}</span>
          </button>
        ))}
      </section>

      <MintPageGuide spec={MINT_PAGE_GUIDES.arena} />
    </div>
  );
}
