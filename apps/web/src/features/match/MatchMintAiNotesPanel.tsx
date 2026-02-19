import React from "react";

export function MatchMintAiNotesPanel(input: {
  isVisible: boolean;
  noteCount: number;
  children: React.ReactNode;
}): React.ReactElement | null {
  const { isVisible, noteCount, children } = input;
  if (!isVisible) return null;

  return (
    <details
      className="rounded-xl border p-3 text-xs"
      style={{
        background: "var(--mint-surface)",
        borderColor: "var(--mint-accent-muted)",
        color: "var(--mint-text-primary)",
      }}
    >
      <summary className="cursor-pointer font-medium">Nyano AI ({noteCount})</summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}
