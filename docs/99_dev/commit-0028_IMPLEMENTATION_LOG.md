# commit-0028 — Implementation Log（差分）

## Why
- Replay の share link が `?t=...`（base64url(JSON)）だと長くなり、SNS/Discord で貼りづらい。
- 共有が“面倒”になると、コミュニティの自走（議論・検証・大会運営）が止まりやすい。
- そこで、ブラウザ標準の gzip 圧縮を使った短い share param を導入し、既存リンク互換も維持する。

## What
### Replay share link compression
- `?z=...` を追加：`gzip(UTF-8 JSON)` を base64url 化して格納
- 既存 `?t=...`（raw base64url JSON）も引き続きサポート（後方互換）
- `Copy share link` は `z` を優先し、非対応環境では `t` にフォールバック

### Playground → Replay bridge（議論の導線）
- Playground の「結果カード」に `Copy replay link (on-chain)` を追加
  - transcript JSON を share param にして `/replay` を生成
  - 注意書き：Replay は Nyano のオンチェーン属性で再現するため、ベクタ(CardData)と結果が異なる可能性

### Base64 utilities
- `apps/web/src/lib/base64url.ts` を拡張
  - bytes encode/decode
  - gzip compress/decompress helpers

## Verify
- `pnpm -C apps/web dev`
- `/replay` で `Copy share link` → `?z=...` になり、別タブで同じ状態を復元できる
- 旧リンク `?t=...` も復元できる
