# commit-0018 — Implementation Log（差分）

## Why
- v1 core+tactics（オンチェーン互換サブセット）では `earthBoostEdges` は未対応であり、全 turn で NONE(255) である必要がある。
- ここが緩むと、TS と Solidity で「同じ transcript を受け入れる/拒否する」がズレて parity が崩れる。
- よって、正常系ベクタではなく **不変条件（throw/revert 期待）** として固定する。

## What
- TS: `earth_boost_edges_invalid.test.js` を追加
  - earthBoostEdge に 0..3 が混ざると `simulateMatchV1` が throw することを保証
- Solidity: `EarthBoostEdgesInvalidTest.sol` を追加
  - `TriadEngineV1.resolve` が revert することを保証（v1は `earthBoostEdges==0xff` 必須）
- docs: `Nyano_Triad_League_TEST_VECTORS_v1_ja.md` の不変条件セクションに追記

## Verify
- `pnpm -C packages/triad-engine test`
- `cd contracts && forge test`
