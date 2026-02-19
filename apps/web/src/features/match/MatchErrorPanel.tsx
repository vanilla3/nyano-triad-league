import React from "react";

export function MatchErrorPanel(input: {
  children: React.ReactNode;
}): React.ReactElement {
  const { children } = input;
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
      {children}
    </div>
  );
}
