# NYTL Motion Language 仕様表 v0.1（かわいいモーション集の落とし込み）

> 目的：Nyano Triad League（NYTL）を「触っていて気持ちいい」「ゲームっぽい」「かわいい」体験に寄せるための **モーション語彙** を定義する。
>
> 注意：この仕様は“振る舞い”の指針であり、数値はチューニング前提。

## 共通原則（Sakurai lens）

- **状態変化が一瞬で分かる**：押せた／置けた／失敗した／勝った、が0.2秒以内に伝わる。
- **タメ（予備動作）→ツメ（着地）**：Linear禁止。必ず「加速」「減速」「少しのオーバーシュート」を使い分ける。
- **モーションはUIの“文法”**：同じ意味の動きは同じテンポ・同じ手触りで統一。
- **軽量が正義**：動画ベタ貼りではなくCSS/シェーダー風（UVスクロール + ノイズ）で表現。
- **アクセシビリティ**：`prefers-reduced-motion` と `[data-vfx]`（off/low/medium/high）を尊重。

## 実装レイヤ（このリポジトリの前提）

- **Tailwind アニメーション**：`apps/web/tailwind.config.ts` の `theme.extend.animation/keyframes`（推奨）。
- **テーマCSS**：`apps/web/src/mint-theme/mint-theme.css` / `apps/web/src/rpg-theme/rpg-theme.css`。
- **共通モーションユーティリティ**：`apps/web/src/motions.css`（legacyの補完。新規追加は最小限）。

## モーションID一覧（MOT）

> 参考：yui540さんのモーション集（https://yui540.com/motions）の“かわいさ”を、NYTLのUI文脈に合わせて再設計する。

| MOT | 名前（愛称） | 使いどころ | トリガ | 目安（ms / frames） | イージング | 変化量 | 実装（現状の当て先） | Reduced/VFX |
|---:|---|---|---|---|---|---|---|---|
| MOT-01 | ぷに押し（Press Pop） | ボタン/カード/タブ | `pointerdown/up` | 90〜140ms（6〜9f） | easeOutQuad→easeOutBack | scale 0.98→1.02 | `:active` + `transition`（btn系） | reduce: scaleのみ / vfx:常にOK |
| MOT-02 | ふわヒカ（Hover/Focus） | hover/keyboard focus | hover/focus-visible | 120〜180ms | easeOutCubic | 明度+輪郭 | Tailwind `transition` + `ring` | reduce:OK / vfx:OK |
| MOT-03 | ぽん登場（Panel Pop-In） | モーダル/ドロワ/カード詳細 | open | 180〜260ms（12〜16f） | easeOutBack | y:+8→0 / scale:0.98→1.0 | 既存の `animate-fade-in-up` を拡張 | reduce:fadeのみ / vfx:lowで短縮 |
| MOT-04 | すっ閉じ（Panel Pop-Out） | close | close | 120〜200ms（8〜12f） | easeInCubic | y:0→+6 / opacity 1→0 | 退出用 keyframes（追加候補） | reduce:短縮 / vfx:OK |
| MOT-05 | ぷる通知（Toast） | トースト/小さな通知 | appear | 180〜240ms | easeOutBack | y:+10→0 | `styles.css` の `toast-in` | reduce:fadeのみ / vfx:OK |
| MOT-06 | どすん配置（Place Impact） | 盤面にカードを置く | place | 280〜520ms（18〜32f） | easeOutBack | scale 0.85→1.08→1.0 | `motions.css` `.animate-cell-place`（classic） / Mintは `mint-cell-place` | reduce:短縮 / vfx:lowで0.3s |
| MOT-07 | くるん反転（Flip） | 盤面の取り合い | flip | 320〜620ms | easeInOutCubic | rotateY + ちょい発光 | `motions.css` `.animate-cell-flip` + `.animate-flip-glow` / Mintは `mint-cell-flip` | reduce:短縮 / vfx:offで発光無効 |
| MOT-08 | つらなり（Chain Stagger） | 連鎖/矢印演出 | chain | 150ms刻み（段階） | easeOutCubic | delay 0.15/0.3/0.45s | `.flip-delay-*` + `FlipArrowOverlay` | reduce:同時 / vfx:lowで短縮 |
| MOT-09 | どや勝利（Victory Pulse） | 勝利表示/リザルト | win | 600ms × 3 | easeInOut | scale 1→1.05 | `motions.css` `.animate-victory` | reduce:1回 / vfx:offで1ms |
| MOT-10 | しゅん敗北（Defeat Shake） | 敗北/エラー | lose/error | 280〜420ms | easeInOut | x揺れ | `motions.css` `.animate-defeat`（keyframeはTailwindの`shake`） | reduce:無効化 |
| MOT-11 | きらレア（Rare Burst） | レア獲得/ガチャ風 | rare | 420〜680ms | easeOutExpo | glow+粒 | Tailwind `animate-confetti`（既存）+ particles（将来） | reduce:光のみ / vfx:lowで粒なし |
| MOT-12 | ふわ待機（Idle Float） | ヒーロー/マスコット | idle | 2.6〜3.4s | easeInOutSine | y:-8 | `motions.css` `.animate-float` | reduce:無効化 / vfx:off無効 |
| MOT-13 | つやシマー（Shimmer） | スケルトン/ロード | loading | 1.4〜2.4s | linear | gradient move | `styles.css` の skeleton shimmer | reduce:無効化 |
| MOT-14 | いきてる背景（Alive BG） | 常時背景 | idle | 常時 | linear + 微ノイズ | UV scroll | `styles.css` 背景グリッド + noise overlay | vfx:offで静止 |

## 運用ルール

1. **新規UIでモーションを作る時はまず MOT を選ぶ**（勝手に独自モーションを増やさない）。
2. 実装が増えてきたら **MOTごとにコンポーネント化**（例：`Pressable`, `PopIn`, `Toast`）。
3. 速度の基準は「触った瞬間に返る（~120ms）」と「結果が気持ちいい（~420ms）」の2段。
4. `prefers-reduced-motion: reduce` は “見た目を壊さずに短縮/無効化” を優先。

