# Work Order: 009 — Rulesets UI: Surface Classic Rules

## Goal
既に実装されている Classic Rules（エンジン側）を UI から使えるようにする。

## Context
- エンジン: `packages/triad-engine/src/classic_rules.ts` に Order/Chaos/Swap/Reverse/AceKiller/Plus/Same/TypeAscend/TypeDescend/AllOpen/ThreeOpen が存在
- ただし UI で設定できない／分かりにくい可能性がある

## Tasks
1) 現状確認
- `apps/web/src/pages/Rulesets.tsx` と関連コンポーネントを読み、Classic configの編集導線があるか確認

2) “おすすめ” を用意
- 迷ったらこれ（例：All Open + Same）など、2〜3個のプリセットをUIに出す

3) 詳細設定
- 各ルールをトグルで編集できる
- ルールの説明（1行）を付与
- 相反する設定（TypeAscend/TypeDescendなど）を排他的にする

4) Match への反映
- RulesetId 生成とURL互換（Invariant）を壊さない

## Acceptance Criteria
- Classic Rules を UI からオン/オフでき、Matchに反映される
- 初見でも迷わない（おすすめプリセットが最上段）

## Verification
- `pnpm -C apps/web typecheck`
- 手動: プリセット→Match開始→ルールが適用されている（例：AllOpenで手札が見える）
