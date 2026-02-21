import React from "react";
import { Link } from "react-router-dom";
import { useIdle } from "@/hooks/useIdle";

const DIFFICULTIES = ["easy", "normal", "hard", "expert"] as const;

export function ArenaPage() {
  const [difficulty, setDifficulty] = React.useState<string>("normal");
  const quickPlayIdle = useIdle({ timeoutMs: 4200 });
  const quickPlayUrl = `/match?mode=guest&opp=vs_nyano_ai&ai=${difficulty}&rk=v2&ui=mint`;
  const quickStageUrl = `/battle-stage?mode=guest&opp=vs_nyano_ai&ai=${difficulty}&rk=v2`;

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">Arena</div>
          <div className="text-xs text-slate-500">運営として“遊べるゲーム”へ育てるためのハブ</div>
        </div>

        <div className="card-bd grid gap-4 text-sm text-slate-700">
          <p>
            ここから「デッキ → 対戦 → 結果 → 共有」を一気通貫にします。まずはデッキ管理を固め、次に対戦UIを作ります。
          </p>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border-2 border-nyano-300 bg-nyano-50 p-4">
              <div className="font-semibold text-nyano-800">Quick Play</div>
              <div className="mt-1 text-xs text-nyano-600">デッキ不要でいますぐ対戦。ランダムデッキ vs Nyano AI</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={[
                      "px-2 py-0.5 rounded-full text-xs font-medium transition-all",
                      difficulty === d
                        ? "bg-nyano-500 text-white"
                        : "bg-white text-nyano-700 border border-nyano-200 hover:bg-nyano-100",
                    ].join(" ")}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link className={["btn btn-primary no-underline", quickPlayIdle ? "mint-idle-attention" : ""].join(" ").trim()} to={quickPlayUrl}>
                    Play Now
                  </Link>
                  <Link className="btn no-underline" to={quickStageUrl}>
                    Pixi Stage
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-medium">1) Decks</div>
              <div className="mt-1 text-xs text-slate-600">Nyano tokenId 5枚でデッキを保存</div>
              <div className="mt-3">
                <Link className="btn no-underline" to="/decks">
                  Decks を開く
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-medium">2) Match</div>
              <div className="mt-1 text-xs text-slate-600">ローカル対戦（ドラフト）→ transcript → Replay（Vs Nyano AIも可）</div>
              <div className="mt-3">
                <Link className="btn btn-primary no-underline" to="/match?ui=mint">
                  Match を開始
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-medium">3) Replay</div>
              <div className="mt-1 text-xs text-slate-600">共有リンクから誰でも検証</div>
              <div className="mt-3">
                <Link className="btn no-underline" to="/replay">
                  Replay を開く
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-medium">4) Playground</div>
              <div className="mt-1 text-xs text-slate-600">公式ベクタで議論の起点を固定</div>
              <div className="mt-3">
                <Link className="btn no-underline" to="/playground">
                  Playground を開く
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span className="font-medium">次の実装（予定）</span>：Match（ローカル対戦）を磨く → 署名 → オンチェーン提出、の順で段階導入します。
          </div>
        </div>
      </section>


      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">Events</div>
          <div className="text-xs text-slate-500">運営が薄くても回る“挑戦の場”を用意します</div>
        </div>

        <div className="card-bd grid gap-3 text-sm text-slate-700">
          <p>
            PvP は盛り上がりますが、イベント運用では「いつでも挑める固定の熱源」があると強いです。
            そこで、<span className="font-semibold">AIキャラ Nyano と戦えるイベント</span> を用意し、リプレイ共有で議論が回る形にします。
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Link className="btn btn-primary no-underline" to="/events">
              Events を開く
            </Link>
            <Link className="btn no-underline" to="/match?event=nyano-open-challenge&ui=mint">
              Nyano Open Challenge を開始
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            ※ Event はまず off-chain（transcript共有）で成立させ、後から on-chain 提出やランキングに拡張します。
          </div>
        </div>
      </section>


      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">運営品質へ寄せるためのUI要件（概要）</div>
        </div>
        <div className="card-bd grid gap-2 text-sm text-slate-700">
          <ul className="list-disc pl-6 text-slate-600">
            <li>“何をすれば遊べるか”が迷子にならない導線（CTAの明確化）</li>
            <li>対戦ログが読める（実況・差分・理由の説明）</li>
            <li>共有が軽い（短いURL / コピー導線 / 失敗時の原因提示）</li>
            <li>将来：大会/リーグ運用を想定した情報設計（ルール/期間/報酬）</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
