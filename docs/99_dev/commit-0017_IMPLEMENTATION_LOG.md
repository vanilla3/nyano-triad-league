# commit-0017 — Implementation Log（差分）

## Why
- Fever（comboCount>=5）の “次手効果（警戒マーク無視）” は実装差が入りやすいが、v1（3x3/9手）でも再現可能。
- shared vectors に追加して TS ↔ Solidity の parity で固定し、将来のリファクタでも壊れないようにする。

## What
- shared vector を追加：`fever_ignores_warning_mark_on_next_card_allows_flip`
  - turn6 で Fever を発火（flipCount=4）
  - turn7 で相手が警戒マークを設置（cell=8）
  - turn8 で Fever により警戒を無視して flip が成立（無視できないと tile 数がズレる）
- generated solidity test を更新（JSONに追従）
- TS unit test を追加し、`appliedBonus.ignoreWarningMark === true` と `flipCount === 1` を直接検証

## Verify
- `pnpm -C packages/triad-engine test`
- `cd contracts && forge test`
- `node scripts/generate_core_tactics_vectors_v1.mjs && git diff --exit-code`
