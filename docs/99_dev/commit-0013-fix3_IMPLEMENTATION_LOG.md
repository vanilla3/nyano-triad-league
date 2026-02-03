# commit-0013-fix3 — Implementation Log（差分）

## Why
- `combo_bonus_momentum.test.js` が `validateTranscriptBasic` で `undefined.version` になって落ちた。
- 原因は、`simulateMatchV1` が期待する `TranscriptV1` 形式が **`{ header, turns }`** なのに、テストが flat な transcript を渡していたため（`header` が無い）。

## What
- `combo_bonus_momentum.test.js` を修正：
  - shared vectors テスト（`core_tactics_vectors.test.js`）と同じ方式で transcript を構築
  - `header` を含め、`firstPlayer/deadline/salt` を vectors からそのまま反映
  - hex decode も同一ロジックに統一（0x prefix にも耐性）

## Verify
- `pnpm -C packages/triad-engine test`
