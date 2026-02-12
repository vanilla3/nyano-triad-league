# 2026-02-12 — commit-0105 IMPLEMENTATION LOG

## Why
- ラダー（ランキング）を permissionless に第三者運用できる最小フォーマットが未定義だった。
- transcript / settled event / 署名検証を揃え、同一データから同一順位を再計算できる基盤が必要だった。

## What
- `packages/triad-engine/src/ladder.ts` を追加。
  - EIP-712 `LadderMatchAttestationV1` の typed-data / digest / recover / verify を実装。
  - `verifyLadderMatchRecordV1` で transcript hash / header整合 / 両署名を検証。
  - `buildLadderStandingsV1` で重複排除・集計・固定tie-breakを実装。
- `packages/triad-engine/src/index.ts` に `ladder` export を追加。
- `packages/triad-engine/test/ladder.test.js` を追加。
- `docs/02_protocol/Nyano_Triad_League_LADDER_FORMAT_SPEC_v1_ja.md` を追加。
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` の ladder 項目を完了化。

## Verify
- `pnpm -C packages/triad-engine lint`
- `pnpm -C packages/triad-engine build`
- `pnpm -C packages/triad-engine test` は環境制約（`node:test` の `spawn EPERM`）で完走不可
- `node -e` スモークで ladder の署名検証・standings 集計が成功
