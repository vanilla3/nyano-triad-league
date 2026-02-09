import React from "react";

const STORAGE_KEY = "nytl.tutorial.seen";

function isTutorialSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function markTutorialSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // ignore
  }
}

// eslint-disable-next-line react-refresh/only-export-components -- utility fn export alongside component is intentional
export function resetTutorialSeen(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

type Props = {
  onDismiss?: () => void;
};

/**
 * A mini 3-step tutorial shown on first guest match.
 * Stored in localStorage so it only appears once.
 */
export function MiniTutorial({ onDismiss }: Props) {
  const [visible, setVisible] = React.useState(() => !isTutorialSeen());

  if (!visible) return null;

  const dismiss = () => {
    markTutorialSeen();
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-lg">
        <div className="text-lg font-bold text-surface-900">3 Steps to Play Triad</div>

        <div className="mt-4 grid gap-3">
          <Step n={1} title="Choose a cell" desc="Tap an empty cell on the 3x3 board to place your card." />
          <Step n={2} title="Pick a card" desc="Select a card from your hand (5 cards total)." />
          <Step n={3} title="Commit" desc="Press the Commit button to lock in your move. Higher edges flip adjacent opponent cards!" />
        </div>

        <div className="mt-2 text-xs text-surface-500">
          Tip: When edge values tie, janken (Rock/Paper/Scissors) breaks it.
        </div>

        <button
          className="btn btn-primary mt-4 w-full"
          onClick={dismiss}
        >
          Got it!
        </button>
        <button
          className="mt-2 w-full text-center text-xs text-surface-400 hover:text-surface-600 underline"
          onClick={dismiss}
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-nyano-100 text-sm font-bold text-nyano-700">
        {n}
      </div>
      <div>
        <div className="font-medium text-surface-800">{title}</div>
        <div className="text-xs text-surface-600">{desc}</div>
      </div>
    </div>
  );
}
