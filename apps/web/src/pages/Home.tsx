import React from "react";
import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">このUIが目指すもの</div>
        </div>
        <div className="card-bd grid gap-3 text-sm text-slate-700">
          <p>
            Nyano Triad League は、Nyano Peace NFTのオンチェーン属性を“カード性能”として扱う 3×3 盤面ゲームです。
            重要なのは <span className="font-semibold">運営が消えても検証と共有が止まらない</span> こと。
          </p>
          <ul className="list-disc pl-6">
            <li>対戦結果は transcript から決定論で再現できる（オフチェーンでも検証可能）</li>
            <li>ルールセットがバージョン化され、第三者がリーグ運営/分析/リプレイUIを作れる</li>
            <li>オンチェーン決済は“最終確定”の役割に限定（1 tx）</li>
          </ul>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/playground" className="btn btn-primary no-underline">
              Playground を開く
            </Link>
            <Link to="/replay" className="btn no-underline">
              Transcript からリプレイ
            </Link>
            <Link to="/nyano" className="btn no-underline">
              Nyano を調べる
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="card-hd">
            <div className="text-base font-semibold">Playground（検証の起点）</div>
          </div>
          <div className="card-bd grid gap-2 text-sm text-slate-700">
            <p>公式テストベクタ（スナップショット）からケースを選び、盤面をリプレイできます。</p>
            <p className="text-slate-500">
              コミュニティで議論が起きやすいのは「この試合、本当にその結果？」という検証局面です。まずはそこを最短で支えます。
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <div className="text-base font-semibold">Replay（共有の中心）</div>
          </div>
          <div className="card-bd grid gap-2 text-sm text-slate-700">
            <p>transcript JSON を貼り付けるだけで、オンチェーン属性を読み取り、誰でも同じ試合を再現できます。</p>
            <p className="text-slate-500">
              「運営がいないのに盛り上がる」には、検証の入口が“軽い”ことが重要です。まずは read-only で実現します。
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <div className="text-base font-semibold">Nyano（実物を観察）</div>
          </div>
          <div className="card-bd grid gap-2 text-sm text-slate-700">
            <p>Nyano tokenId を入力すると、Triad/Janken/Stats/Trait を読み出し、カード性能に変換して表示します。</p>
            <p className="text-slate-500">“このNFTは強いのか？”を、同じ物差しで語れる土台を作ります。</p>
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <div className="text-base font-semibold">Rulesets（合意の核）</div>
          </div>
          <div className="card-bd grid gap-2 text-sm text-slate-700">
            <p>ルールは“変更可能なゲームデザイン”でありつつ、IDで固定される“プロトコル”でもあります。</p>
            <p className="text-slate-500">UI上で rulesetId の安定性・差分を観察できるようにしていきます。</p>
          </div>
        </div>
      </section>
    </div>
  );
}
