import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MintPressable } from "@/components/mint/MintPressable";
import { DuelStageMint } from "@/components/DuelStageMint";
import { MintIcon } from "@/components/mint/icons/MintIcon";
import { BoardViewMint } from "@/components/BoardViewMint";
import { HandDisplayMint } from "@/components/HandDisplayMint";
import type { CardData } from "@nyano/triad-engine";
import type { FlipTraceArrow } from "@/components/FlipArrowOverlay";

type VfxTier = "off" | "low" | "medium" | "high";

const VFX_KEY = "nytl.vfx.quality";

function setVfxTier(tier: VfxTier) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.vfx = tier;
  try {
    localStorage.setItem(VFX_KEY, tier);
  } catch {
    // ignore
  }
}

function getVfxTier(): VfxTier {
  if (typeof document !== "undefined") {
    const raw = document.documentElement.dataset.vfx;
    if (raw === "off" || raw === "low" || raw === "medium" || raw === "high") return raw;
  }
  try {
    const pref = (typeof localStorage !== "undefined" ? localStorage.getItem(VFX_KEY) : null) ?? "";
    const v = pref.trim().toLowerCase();
    if (v === "off" || v === "low" || v === "medium" || v === "high") return v as VfxTier;
  } catch {
    // ignore
  }
  return "high";
}

const DEMO_GHOST_CARD: CardData = {
  tokenId: 123n,
  edges: { up: 5, right: 7, down: 3, left: 6 },
  jankenHand: 0,
  combatStatSum: 21,
  trait: "forest",
};

const DEMO_HAND_CARDS: CardData[] = [
  { tokenId: 11n, edges: { up: 5, right: 4, down: 6, left: 2 }, jankenHand: 0, combatStatSum: 17, trait: "forest" },
  { tokenId: 12n, edges: { up: 2, right: 7, down: 3, left: 5 }, jankenHand: 1, combatStatSum: 17, trait: "aqua" },
  { tokenId: 13n, edges: { up: 6, right: 3, down: 4, left: 6 }, jankenHand: 2, combatStatSum: 19, trait: "wind" },
  { tokenId: 14n, edges: { up: 4, right: 6, down: 2, left: 7 }, jankenHand: 0, combatStatSum: 19, trait: "flame" },
  { tokenId: 15n, edges: { up: 1, right: 5, down: 7, left: 3 }, jankenHand: 1, combatStatSum: 16, trait: "none" },
];
const DEMO_HAND_USED = new Set<number>([4]);

const DEMO_FLIP_TRACES: readonly FlipTraceArrow[] = [
  { from: 4, to: 2, isChain: false, kind: "ortho", aVal: 7, dVal: 6, tieBreak: false },
  { from: 2, to: 6, isChain: true, kind: "diag", aVal: 5, dVal: 4, tieBreak: false },
];


export function MotionsPage() {
  const [searchParams] = useSearchParams();

  const devOk = (() => {
    if (!import.meta.env.PROD) return true;
    if (searchParams.get("dev") === "1") return true;
    try {
      return localStorage.getItem("nytl.dev") === "1";
    } catch {
      return false;
    }
  })();

  const [seed, setSeed] = React.useState(0);
  const [vfx, setVfx] = React.useState<VfxTier>(() => getVfxTier());
  const [mintTab, setMintTab] = React.useState<"home" | "arena" | "decks">("home");
  const [handSelected, setHandSelected] = React.useState<number | null>(2);

  React.useEffect(() => {
    if (devOk) setVfxTier(vfx);
  }, [devOk, vfx]);

  if (!devOk) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur px-6 py-6 shadow-sm">
          <h1 className="text-lg font-extrabold tracking-tight">Motions</h1>
          <p className="mt-2 text-sm text-slate-600">
            このページは開発用です。公開環境では <code className="font-mono">?dev=1</code> を付けた場合のみ表示します。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="btn btn-primary" to="/">
              Home へ戻る
            </Link>
            <a className="btn bg-white/70 border border-slate-200 text-slate-700 hover:bg-white" href="/motions?dev=1">
              dev=1 で開く
            </a>
          </div>
        </div>
      </div>
    );
  }

  const remountKey = `motion-${seed}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
      <header className="rounded-3xl border border-sky-100/70 bg-white/70 backdrop-blur px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Motions</h1>
            <p className="text-sm text-slate-600">
              かわいいモーションの実装確認ページ（<code className="font-mono">/motions</code>）。
              本番UIには影響しないように、原則リンクは貼りません。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">VFX</span>
            {(["off", "low", "medium", "high"] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                className={
                  "btn text-xs px-3 py-1.5 " +
                  (vfx === tier
                    ? "btn-primary"
                    : "bg-white/70 border border-slate-200 text-slate-700 hover:bg-white")
                }
                onClick={() => setVfx(tier)}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setSeed((s) => s + 1)}
            aria-label="Replay animations"
          >
            アニメを再生
          </button>
          <Link
            className="btn bg-white/70 border border-slate-200 text-slate-700 hover:bg-white"
            to="/playground"
          >
            Playground へ
          </Link>
          <span className="text-xs text-slate-500">
            ※ Reduced motion は OS/ブラウザ設定（prefers-reduced-motion）で確認
          </span>
        </div>
      </header>

      <section className="rounded-3xl border border-sky-100/70 bg-white/70 backdrop-blur px-5 py-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700">Legacy utility motions（src/motions.css）</h2>
        <p className="mt-1 text-xs text-slate-500">
          旧 <code className="font-mono">index.css</code> に存在していたが、まだ参照されるため移設したもの。
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" key={remountKey}>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">cell place</div>
            <div className="mt-3 h-20 rounded-2xl border border-amber-200/60 bg-amber-50/70 animate-cell-place" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">cell flip</div>
            <div className="mt-3 h-20 rounded-2xl border border-indigo-200/60 bg-indigo-50/70 animate-cell-flip" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">flip glow</div>
            <div className="mt-3 h-20 rounded-2xl border border-violet-200/60 bg-violet-50/70 animate-flip-glow" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">banner enter</div>
            <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-200/60 bg-emerald-50/70">
              <div className="px-3 py-3 animate-banner-enter">
                <div className="text-sm font-bold text-emerald-800">WINNER!</div>
                <div className="text-xs text-emerald-700">banner-slide-in</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">result shimmer</div>
            <div className="mt-3 h-20 rounded-2xl bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-200 opacity-80 result-banner-shimmer" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">victory pulse</div>
            <div className="mt-3 h-20 rounded-2xl border border-sky-200/60 bg-sky-50/70 animate-victory" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">idle float</div>
            <div className="mt-3 flex h-20 items-center justify-center">
              <div className="h-14 w-14 rounded-2xl border border-pink-200/60 bg-pink-50/70 animate-float" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">live dot</div>
            <div className="mt-3 flex h-20 items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-red-500 animate-live-dot" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">counter tick</div>
            <div className="mt-3 flex h-20 items-center justify-center text-2xl font-extrabold animate-counter-tick">
              8
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-sky-100/70 bg-white/70 backdrop-blur px-5 py-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700">Tailwind motions（tailwind.config.ts）</h2>
        <p className="mt-1 text-xs text-slate-500">
          今後の追加は基本こちらへ（keyframes/animation）寄せる。
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" key={`tw-${seed}`}>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">fade in up</div>
            <div className="mt-3 h-20 rounded-2xl border border-slate-200 bg-white/70 animate-fade-in-up" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">shake</div>
            <div className="mt-3 h-20 rounded-2xl border border-rose-200/60 bg-rose-50/70 animate-shake" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-600">confetti</div>
            <div className="mt-3 h-20 rounded-2xl border border-emerald-200/60 bg-emerald-50/70 animate-confetti" />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-sky-100/70 bg-white/70 backdrop-blur px-5 py-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700">Mint micro-interactions（mint-theme.css）</h2>
        <p className="mt-1 text-xs text-slate-500">
          Tabのアクティブ切り替え / BigButtonのアイコン挙動など。
          見た目の確認は <code className="font-mono">?theme=mint</code> を付けると分かりやすいです。
        </p>

        <div className="mt-4 grid gap-5" key={`mint-${seed}`}>
          <div>
            <div className="text-xs font-semibold text-slate-600">tab activate</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                { key: "home" as const, label: "Home" },
                { key: "arena" as const, label: "Arena" },
                { key: "decks" as const, label: "Decks" },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={[
                    "mint-pressable mint-hit mint-tab-nav__item",
                    mintTab === t.key ? "mint-tab-nav__item--active" : "",
                  ].join(" ")}
                  onClick={() => setMintTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">big button icon hover</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <MintPressable tone="soft" size="lg" fullWidth className="mint-big-button" onClick={() => setSeed((s) => s + 1)}>
                <span className="mint-big-button__icon-wrap" aria-hidden="true">
                  <MintIcon name="arena" size={28} />
                </span>
                <span className="mint-big-button__copy">
                  <span className="mint-big-button__title">BigButton</span>
                  <span className="mint-big-button__subtitle">hoverでアイコンが少し動きます</span>
                </span>
              </MintPressable>
              <MintPressable tone="primary" size="lg" fullWidth className="mint-big-button" onClick={() => setSeed((s) => s + 1)}>
                <span className="mint-big-button__icon-wrap" aria-hidden="true">
                  <MintIcon name="match" size={28} />
                </span>
                <span className="mint-big-button__copy">
                  <span className="mint-big-button__title">Primary</span>
                  <span className="mint-big-button__subtitle">press-ackも確認できます</span>
                </span>
              </MintPressable>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">hand: selection spotlight</div>
            <div className="mt-2 rounded-3xl border border-slate-200 bg-white/60 px-3 py-3 shadow-sm">
              <HandDisplayMint
                cards={DEMO_HAND_CARDS}
                owner={0}
                usedIndices={DEMO_HAND_USED}
                selectedIndex={handSelected}
                onSelect={(idx) => setHandSelected(idx)}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              選択中は他のカードを少しだけ沈めて、主役（選択カード）を立てます。やりすぎない“かわいさ”を狙う。
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">stage burst + particles</div>
            <div className="mt-2">
              <DuelStageMint impact="high" impactBurst impactBurstLevel="hard">
                <div className="mint-board-frame" style={{ width: 260, height: 260, marginInline: "auto" }}>
                  <div
                    className="mint-board-inner"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <div className="text-xs text-slate-600">Dummy Board</div>
                  </div>
                </div>
              </DuelStageMint>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              VFX tier / Reduced motion によっては演出が抑制されます。
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">board: idle guide</div>
            <div className="mt-2">
              <DuelStageMint impact="low">
                <div style={{ width: 320, marginInline: "auto" }}>
                  <BoardViewMint
                    board={Array.from({ length: 9 }, () => null) as any}
                    currentPlayer={0}
                    gamePhase="idle"
                    showCoordinates
                    selectableCells={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
                    idleGuideSelectables={[1, 3, 5, 7]}
                  />
                </div>
              </DuelStageMint>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              放置時の「ここ触ってね」誘導。Spotlight（置く操作中）は邪魔にならないよう自動で抑制。
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600">board: spotlight + ghost + trace</div>
            <div className="mt-2">
              <DuelStageMint impact="low">
                <div style={{ width: 320, marginInline: "auto" }}>
                  <BoardViewMint
                    board={Array.from({ length: 9 }, () => null) as any}
                    currentPlayer={0}
                    gamePhase="select_cell"
                    showCoordinates
                    selectableCells={[1, 2, 4, 5, 7]}
                    selectedCell={4}
                    selectedCardPreview={DEMO_GHOST_CARD}
                    placedCell={0}
                    flippedCells={[2, 6]}
                    flipTraces={DEMO_FLIP_TRACES}
                    isFlipAnimating
                  />
                </div>
              </DuelStageMint>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              置けるマスを Spotlight で“目で分かる”ように／選択マスにカードのゴースト／反転の因果を Trace Pulse で補強。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
