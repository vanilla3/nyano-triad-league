import React from "react";

export function MatchAiNotesPanel(input: {
  isVisible: boolean;
  isRpg: boolean;
  isStageFocusRoute: boolean;
  noteCount: number;
  children: React.ReactNode;
}): React.ReactElement | null {
  const { isVisible, isRpg, isStageFocusRoute, noteCount, children } = input;
  if (!isVisible) return null;

  return (
    <details className={
      isRpg
        ? "rounded-lg p-2 text-xs"
        : ["rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700", isStageFocusRoute ? "stage-focus-side-panel" : ""].filter(Boolean).join(" ")
    }
    style={isRpg ? { background: "rgba(0,0,0,0.3)", color: "var(--rpg-text-dim, #8A7E6B)" } : undefined}
    >
      <summary className="cursor-pointer font-medium">Nyano AI ({noteCount})</summary>
      <div className="mt-2">
        {children}
      </div>
    </details>
  );
}
