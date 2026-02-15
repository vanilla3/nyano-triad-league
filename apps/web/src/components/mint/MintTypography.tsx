import React from "react";

type MintTitleTextProps = {
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  children: React.ReactNode;
};

type MintLabelProps = {
  className?: string;
  children: React.ReactNode;
};

export function MintTitleText({ as = "h2", className, children }: MintTitleTextProps) {
  const Tag = as;
  return <Tag className={["mint-title-text", className ?? ""].join(" ").trim()}>{children}</Tag>;
}

export function MintLabel({ className, children }: MintLabelProps) {
  return <span className={["mint-label-text", className ?? ""].join(" ").trim()}>{children}</span>;
}
