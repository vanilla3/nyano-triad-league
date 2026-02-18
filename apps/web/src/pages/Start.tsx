import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ONBOARDING_STEPS,
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
  ];

  return (
    <div className="mint-start-screen">
      <section className="mint-start-header">
        <MintTitleText as="h2" className="mint-start-header__title">
          はじめての1分スタート
        </MintTitleText>
        <GlassPanel variant="pill" className="mint-start-header__progress">
          最短 2 ステップで開始
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
              <span>デッキ</span>
            </MintPressable>
            <MintPressable to={themed("/arena")} tone="soft">
              <MintIcon name="arena" size={18} />
              <span>アリーナ</span>
            </MintPressable>
          </div>
          <div className="mint-start-footer__state">
            まずは 1→2 の順で進めると、すぐに対戦を始められます。
          </div>
          <Link to={themed("/")} className="mint-start-footer__back">
            ホームへ戻る
          </Link>
        </GlassPanel>
      </section>
    </div>
  );
}
