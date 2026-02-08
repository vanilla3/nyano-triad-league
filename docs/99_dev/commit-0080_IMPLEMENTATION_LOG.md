# commit-0080 IMPLEMENTATION LOG

更新: 2026-02-08

## Summary
- `#triad` の文字列生成を **単一ソース化**し、strictAllowed の allowlist/hash が /stream・/overlay・HUD で一致する確度を最大化した。
- StreamOperationsHUD の strictAllowed 計算が、常に controlledSide 基準になっていた点を修正し、**toPlay（実際の手番）基準**で表示するようにした。
- /stream 側の allowlist hash 算出で使う FNV-1a を `triad_vote_utils` へ寄せ、重複実装を減らした。

## Why
- `strictAllowed.hash` は nyano-warudo 側の「合法手 allowlist 固定」に直結するため、**わずかな表記差（スペース/表記ゆれ/実装分岐）でも事故になる**。
- HUD の strictAllowed が toPlay とズレていると、運営が「何が合法か」を誤認しやすく、配信品質を落とす。

## What changed
- `apps/web/src/lib/triad_vote_utils.ts`
  - `toViewerMoveText()` を `triad_viewer_command.formatViewerMoveText()` に委譲（#triad の format を単一化）
- `apps/web/src/components/StreamOperationsHUD.tsx`
  - allowlist の card slot 計算を `toPlay`（手番）基準に変更（fallback: controlledSide）
- `apps/web/src/pages/Stream.tsx`
  - allowlist hash 計算で使う `fnv1a32Hex` を `triad_vote_utils` から import（重複排除）
- `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md`
  - 進捗（コミットマップ）と CI/pnpm の注意点を追記

## Verify（最小動作確認）
- /stream を開き、手番が進む状況で HUD の `strictAllowed`（件数と hash）が変化すること
- /overlay の strictAllowed 表示と HUD 表示の hash が一致すること（同一 turn で比較）
- vote start で state_json を送る運用において、nyano-warudo 側で strictAllowed が “投票中にズレにくい” こと
