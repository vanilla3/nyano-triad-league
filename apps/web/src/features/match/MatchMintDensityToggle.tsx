import React from "react";
import type { UiDensity } from "@/lib/local_settings";

const DENSITY_OPTIONS = ["minimal", "standard", "full"] as const satisfies ReadonlyArray<UiDensity>;

function densityLabel(value: UiDensity): string {
  if (value === "minimal") return "Minimal";
  if (value === "standard") return "Standard";
  return "Full";
}

export function MatchMintDensityToggle(input: {
  value: UiDensity;
  onChange: (value: UiDensity) => void;
}): React.ReactElement {
  const { value, onChange } = input;
  return (
    <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--mint-surface-dim)" }}>
      {DENSITY_OPTIONS.map((density) => (
        <button
          key={density}
          className="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{
            background: value === density ? "var(--mint-accent)" : "transparent",
            color: value === density ? "white" : "var(--mint-text-secondary)",
          }}
          onClick={() => onChange(density)}
        >
          {densityLabel(density)}
        </button>
      ))}
    </div>
  );
}
