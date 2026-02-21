# ExecPlan 007: Motion Language v0.1 導入

## 目的
Nyano Triad League のUIを「かわいいのに上質」「迷わない」「触って気持ちいい」触感へ統一する。

- 押下の返事（Response）
- 状態変化の明確さ（Transition）
- 成功のご褒美（Reward）
- Idleでも死んでない（Ambient）

## 非ゴール
- 全画面のレイアウト/色の全面刷新
- Pixiレンダラの大改修（別ExecPlanで扱う）
- 資産生成（画像/音）をこのExecPlanでは前提にしない

## 参照
- 仕様表（Motion辞書・トークン）: `docs/01_design/NYTL_MOTION_LANGUAGE_SPEC_TABLE_v0_1_ja.md`

## 重要原則
- **動きは意味のために使う**（かわいい≠動かしまくる）
- **レイアウトを揺らさない**（transform/opacity優先）
- `prefers-reduced-motion` と `data-vfx=off|low|medium|high` を尊重

## マイルストーン
1. **WO006**: Motion tokens & primitives を実装（使い回しの核）
2. **WO007**: Core UI へ適用（Buttons/Toast/Panel/Route transition）
3. **WO008**: Match 盤面へ適用（Select→Place→Flip→Chain）
4. **WO009**: Classic rules をUIから使えるように（体験の深み）

## 検証（毎WO）
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- 手動: モバイル幅 + `prefers-reduced-motion` + `data-vfx` を切り替えて破綻しない

## Done の定義
- 主要導線（Home→Arena→Match→Result）で動きが統一されている
- 盤面の「置ける」「置いた」「奪った」「連鎖した」が視覚で即理解できる
- 低VFX/Reduceでも成立（意味が伝わる）
