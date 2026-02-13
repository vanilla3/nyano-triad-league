# Work Order: 005 Major-Studio UI/UX Foundation (Stage-first)

## 1) 背景 / 目的

現状の UI は「参照ツール」としては強い一方、
**遊び続けたくなる“触り心地”と“没入感”**（タイポ/動き/音/情報階層/密度制御）がまだ伸びしろです。

本 Work Order では、いきなり全面改修を狙わず、
**Pixi Stage（/battle-stage, /replay-stage）を核に“ゲーム会社レベル”の品質基盤**を整えます。

- 盤面・手札・HUD が 1つの「舞台」として統一された印象になる
- 動作/読みやすさ/テンポが改善し、ミス操作が減る
- 低性能端末や reduced-motion でも破綻しない

## 2) このPRの範囲

### MUST
- UI トークン（色/影/角丸/タイポ/アニメ時間）を **CSS variables** で整理し、Mint/Pixi 両方から参照できるようにする
- Stage 系 UI の “情報階層” を明確化
  - ①盤面、②手札、③次アクション、④ログ/詳細 の順で視線誘導
- 操作感の底上げ
  - 押した/置けた/確定した のフィードバックを一貫化（視覚 + 可能なら軽い SFX）
  - 重要操作（Commit/Undo/End）を迷わず押せる
- パフォーマンスと安全性
  - `prefers-reduced-motion` と `data-vfx` を尊重
  - Pixi 初期化失敗でもフォールバックでプレイ可能

### SHOULD
- Stage の HUD を “ゲームっぽい” トーンへ寄せる
  - 文字のコントラスト/アウトライン/背景ブラー/ガラス調（過度にならない範囲で）
- モバイル縦持ちでの手札 UI 改善（選択→配置→確定が 1画面で完結）

### NOT DO（非ゴール）
- ルール/エンジン仕様の変更
- share link / schema / viewer command の破壊的変更
- デザインを一気に別物へ置き換える（段階導入）

## 3) 実装ガイド（触る場所）

- グローバル CSS:
  - `apps/web/src/styles.css`（現状のスタイル入口）
  - `apps/web/src/index.css`（Tailwind layer）
  - `apps/web/src/mint-theme/mint-theme.css`
- Stage / Pixi:
  - `apps/web/src/pages/BattleStage.tsx`
  - `apps/web/src/pages/ReplayStage.tsx`
  - `apps/web/src/engine/components/BattleStageEngine.tsx`
  - `apps/web/src/engine/renderers/pixi/*`
- HUD:
  - `apps/web/src/components/BattleHudMint.tsx`
  - `apps/web/src/components/DuelStageMint.tsx`
  - `apps/web/src/components/NyanoReaction.tsx`

## 4) 受け入れ基準

- 390px 幅端末で `/battle-stage` が横スクロールなしで成立
- 手札→盤面→確定の導線が 1 画面で完結し、ページスクロールに依存しない
- reduced-motion のとき、主要アニメが短縮/抑制される
- `pnpm -C apps/web test` / `typecheck` / `build` が通る

## 5) 検証

```bash
pnpm -C apps/web test
pnpm -C apps/web typecheck
pnpm -C apps/web build
```

手動:
- `/battle-stage` と `/replay-stage` を desktop + mobile 幅で確認
- Pixi を無効化した場合（WebGL失敗想定）のフォールバック確認

## 6) 次フェーズ案（このPRではやらない）

- 005-B: SFX の拡張（勝利/フリップ/コンボ） + ミュート UI
- 005-C: 盤面 VFX の tier 拡張（low/medium/high）
- 005-D: Arena / Events の “ゲーム入口” 演出（ヒーロー/導線/進行）
