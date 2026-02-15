import React from "react";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintIcon, type MintIconName } from "@/components/mint/icons/MintIcon";

type MintBigButtonProps = {
  to: string;
  title: string;
  subtitle?: string;
  icon: MintIconName;
  className?: string;
  onClick?: () => void;
};

export function MintBigButton({ to, title, subtitle, icon, className, onClick }: MintBigButtonProps) {
  return (
    <MintPressable
      to={to}
      onClick={onClick}
      className={["mint-big-button", className ?? ""].join(" ").trim()}
      size="lg"
      tone="soft"
      fullWidth
    >
      <span className="mint-big-button__icon-wrap" aria-hidden="true">
        <MintIcon name={icon} size={28} />
      </span>
      <span className="mint-big-button__copy">
        <span className="mint-big-button__title">{title}</span>
        {subtitle ? <span className="mint-big-button__subtitle">{subtitle}</span> : null}
      </span>
    </MintPressable>
  );
}
