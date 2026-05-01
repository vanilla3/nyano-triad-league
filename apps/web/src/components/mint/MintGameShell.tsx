import React from "react";

type MintGameShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function MintGameShell({ children, className }: MintGameShellProps) {
  return (
    <div className={["mint-app-shell", className ?? ""].join(" ").trim()}>
      <div className="mint-app-shell__bg" aria-hidden="true" />
      <div className="mint-app-shell__grid" aria-hidden="true" />
      <div className="mint-app-shell__noise" aria-hidden="true" />
      <div className="mint-app-shell__sparkles" aria-hidden="true" />
      <div className="mint-app-shell__safe">{children}</div>
    </div>
  );
}
