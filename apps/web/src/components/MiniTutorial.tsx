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
 * First-battle tutorial shown once per browser.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="mint-tutorial-modal w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-lg">
        <div className="text-lg font-bold text-surface-900">はじめての3ステップ</div>

        <div className="mt-4 grid gap-3">
          <Step n={1} title="マスを選ぶ" desc="3x3盤面の空いているマスをタップします。" />
          <Step n={2} title="カードを選ぶ" desc="手札5枚から、そのマスに置くカードを選びます。" />
          <Step n={3} title="この手を確定" desc="確定すると手番が進み、強い辺で隣の相手カードをひっくり返します。" />
        </div>

        <div className="mt-2 text-xs text-surface-500">
          同じ数字でぶつかった時は、ジャンケン相性で勝負が決まります。
        </div>

        <button
          className="btn btn-primary mt-4 w-full"
          onClick={dismiss}
        >
          バトルへ進む
        </button>
        <button
          className="mt-2 w-full text-center text-xs text-surface-400 underline hover:text-surface-600"
          onClick={dismiss}
        >
          今はスキップ
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
