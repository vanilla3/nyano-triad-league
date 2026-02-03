# commit-0017-fix1 — Implementation Log（差分）

## Why
- `combo_bonus_fever_ignore_warning_mark.test.js` が `r.tilesA` / `r.tilesB` を参照していたが、engine の戻り値は `r.tiles.A` / `r.tiles.B` 形式。
- そのため tiles のアサーションが `undefined !== 8` で失敗していた（ロジック自体は正常）。

## What
- fever ignore test の tiles アサーションを `r.tiles.A` / `r.tiles.B` に修正。

## Verify
- `pnpm -C packages/triad-engine test`
