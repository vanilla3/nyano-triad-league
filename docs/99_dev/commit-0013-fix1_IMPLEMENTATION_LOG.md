# commit-0013-fix1 — Implementation Log（差分）

## Why
- `pnpm -C packages/triad-engine test` が `combo_bonus_momentum.test.js` で失敗。
- 失敗原因は `makeCardDataFromNyano` に渡している trait が `{ classId: 0, ... }` となっており、Nyano on-chain の想定レンジ（classId:1..5, seasonId:1..4, rarity:1..5）外だったため。
- Core+tactics subset では trait は使わないが、CardData生成で入力検証が走るため、テスト側で正しいレンジを与える必要がある。

## What
- `combo_bonus_momentum.test.js` の trait を妥当値（`{classId:1, seasonId:1, rarity:1}`）に修正。
- 併せてコメントで「core+tactics では trait 不使用だが入力レンジは必要」を明記。

## Verify
- `pnpm -C packages/triad-engine test`
