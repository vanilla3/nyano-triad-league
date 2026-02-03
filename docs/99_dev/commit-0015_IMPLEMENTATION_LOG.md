# commit-0015 — Implementation Log（差分）

## Why
- Core+tactics の parity（TS参照実装 ↔ オンチェーン settlement）を維持するうえで、警戒マークの **使用上限（各プレイヤー最大3回）** はバグが混入しやすい。
- これは正常系の勝敗ベクタではなく、**上限超過を “revert/throw” で検知する不変条件**なので、専用テストとして追加するのが適切。

## What
- TS: `warning_mark_limit.test.js` を追加し、Aが4回目の警戒マークを置こうとすると throw することを保証。
- Solidity: `WarningMarkLimitTest.sol` を追加し、Aが4回目の警戒マークを置こうとすると revert することを保証。
- ドキュメント: `Nyano_Triad_League_TEST_VECTORS_v1_ja.md` に「ベクタ外の不変条件テスト」セクションを追加。

## Verify
- `pnpm -C packages/triad-engine test`
- `cd contracts && forge test`
