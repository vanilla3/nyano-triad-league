import React from "react";
import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">いまの段階と、次に目指す段階</div>
        </div>
        <div className="card-bd grid gap-3 text-sm text-slate-700">
          <p>
            現在の UI は、まず <span className="font-semibold">検証・共有（参照の仕組み）</span> を最短で成立させるための機能群です。
            ここが弱いと、コミュニティの議論が分裂しやすく、運営が消えた瞬間に熱が冷めます。
          </p>

          <p className="text-slate-600">
            次の段階は「運営として遊べる、ハイクオリティなゲーム体験」です。つまり、
            <span className="font-semibold">デッキを作り、対戦し、結果を共有し、リーグが自走する</span> ところまで UI を整えます。
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/arena" className="btn btn-primary no-underline">
              Arena（ゲーム導線）
            </Link>
            <Link to="/decks" className="btn no-underline">
              Decks（デッキ管理）
            </Link>
            <Link to="/replay" className="btn no-underline">
              Replay（参照）
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="card-hd">
            <div className="text-base font-semibold">Arena（ゲームの入口）</div>
          </div>
          <div className="card-bd grid gap-2 text-sm text-slate-700">
            <p>プレイ体験を “運営品質” まで引き上げるための導線を集約していきます。</p>
            <ul className="list-disc pl-6 text-slate-600">
              <li>デッキ→対戦→結果→共有の一気通貫</li>
              <li>v1/v2 などルール差分の可視化（議論を減らす）</li>
              <li>将来：署名・オンチェーン提出・ランキング</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <div className="text-base font-semibold">Tools（参照の装置）</div>
          </div>
          <div className="card-bd grid gap-2 text-sm text-slate-700">
            <p>運営が薄くても盛り上がるには、検証の入口が軽いことが必須です。</p>
            <ul className="list-disc pl-6 text-slate-600">
              <li>Playground：テストベクタから再現</li>
              <li>Replay：transcript から再現（共有リンク）</li>
              <li>Nyano：実物を同じ物差しで観察</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
