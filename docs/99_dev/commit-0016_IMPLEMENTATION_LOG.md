# commit-0016 — Implementation Log（差分）

## Why
- 警戒マーク（-1 デバフ）は “踏まれたターンだけ有効” で、**踏まれなかった場合でも 1ターンで失効**する必要がある。
- ここがズレると、後続ターンの flip 判定が変わり、TS参照実装とオンチェーン settlement の分裂や、読み合いの崩壊につながる。
- したがって「失効タイミング」を **shared vectors（JSON）で勝敗反転として固定**するのが最も強い退行検出になる。

## What
- `test-vectors/core_tactics_v1.json` に新ケースを追加：
  - `warning_mark_expires_if_not_stepped_allows_flip`
  - Aが turn0 でマークを置く → Bは turn1 で踏まない → turn3 で同セルに置いて flip できる（=マークが残っていないことが前提）
  - もしマークが残り続ける実装だと flip が起きず勝敗が逆転する（退行検出）
- `contracts/test/generated/CoreTacticsVectorsV1Test.sol` を再生成して更新
- ドキュメント `Nyano_Triad_League_TEST_VECTORS_v1_ja.md` にケースを追記

## Verify
- `node scripts/generate_core_tactics_vectors_v1.mjs && git diff --exit-code`
- `pnpm -C packages/triad-engine test`
- `cd contracts && forge test`
