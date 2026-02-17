import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ONBOARDING_STEPS,
  completedOnboardingStepCount,
  isOnboardingCompleted,
  markOnboardingStepDone,
  readOnboardingProgress,
} from "@/lib/onboarding";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintTitleText } from "@/components/mint/MintTypography";
import { MintIcon } from "@/components/mint/icons/MintIcon";
import { appendThemeToPath, resolveAppTheme } from "@/lib/theme";

type StartStep = {
  id: (typeof ONBOARDING_STEPS)[number];
  title: string;
  icon: "rules" | "arena" | "match";
  to: string;
  action: string;
};

export function StartPage() {
  const [searchParams] = useSearchParams();
  const theme = resolveAppTheme(searchParams);
  const themed = React.useCallback((path: string) => appendThemeToPath(path, theme), [theme]);
  const [progress, setProgress] = React.useState(() => readOnboardingProgress());
  const doneCount = completedOnboardingStepCount(progress);
  const isDone = isOnboardingCompleted(progress);

  const steps: StartStep[] = [
    {
      id: "read_quick_guide",
      title: "1) ルールを知る",
      icon: "rules",
      to: themed("/rulesets"),
      action: "ルールを開く",
    },
    {
      id: "start_first_match",
      title: "2) ゲストで対戦を開始する",
      icon: "arena",
      to: themed("/match?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint"),
      action: "今すぐ対戦",
    },
    {
      id: "commit_first_move",
      title: "3) Match で最初の手を確定する",
      icon: "match",
      to: themed("/match?mode=guest&opp=vs_nyano_ai&ai=normal&rk=v2&ui=mint"),
      action: "Matchへ",
    },
  ];

  return (
    <div className="mint-start-screen">
      <section className="mint-start-header">
        <MintTitleText as="h2" className="mint-start-header__title">
          はじめての1分スタート
        </MintTitleText>
        <GlassPanel variant="pill" className="mint-start-header__progress">
          {doneCount}/{ONBOARDING_STEPS.length} steps
        </GlassPanel>
      </section>

      <section className="mint-start-grid">
        {steps.map((step) => {
          const done = progress.steps[step.id];
          return (
            <GlassPanel key={step.id} variant="card" className="mint-start-card">
              <div className="mint-start-card__icon">
                <MintIcon name={step.icon} size={44} />
              </div>
              <MintTitleText as="h3" className="mint-start-card__title">
                {step.title}
              </MintTitleText>
              <div className="mint-start-card__status">{done ? "完了" : "未完了"}</div>
              <MintPressable
                to={step.to}
                tone={done ? "soft" : "primary"}
                onClick={() => {
                  if (step.id === "read_quick_guide" || step.id === "start_first_match") {
                    markOnboardingStepDone(step.id);
                    setProgress(readOnboardingProgress());
                  }
                }}
              >
                {step.action}
              </MintPressable>
            </GlassPanel>
          );
        })}
      </section>

      <section className="mint-start-footer">
        <GlassPanel variant="panel" className="mint-start-footer__panel">
          <div className="mint-start-footer__links">
            <MintPressable to={themed("/decks")} tone="soft">
              <MintIcon name="decks" size={18} />
              <span>Decks</span>
            </MintPressable>
            <MintPressable to={themed("/arena")} tone="soft">
              <MintIcon name="arena" size={18} />
              <span>Arena</span>
            </MintPressable>
          </div>
          <div className="mint-start-footer__state">
            {isDone ? "準備完了。Decks / Arena で遊べます。" : "3ステップを完了すると準備完了です。"}
          </div>
          <Link to={themed("/")} className="mint-start-footer__back">
            Homeへ戻る
          </Link>
        </GlassPanel>
      </section>
    </div>
  );
}
