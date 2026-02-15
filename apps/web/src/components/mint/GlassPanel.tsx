import React from "react";

type GlassVariant = "panel" | "card" | "pill";

type GlassPanelProps = {
  as?: "div" | "section" | "article";
  variant?: GlassVariant;
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
};

function classForVariant(variant: GlassVariant): string {
  if (variant === "card") return "mint-glass mint-glass--card";
  if (variant === "pill") return "mint-glass mint-glass--pill";
  return "mint-glass mint-glass--panel";
}

export function GlassPanel({
  as = "div",
  variant = "panel",
  interactive = false,
  className,
  children,
}: GlassPanelProps) {
  const Tag = as;
  const classes = [
    classForVariant(variant),
    interactive ? "mint-glass--interactive" : "",
    className ?? "",
  ].join(" ").trim();

  return <Tag className={classes}>{children}</Tag>;
}
