# 2026-02-13 — commit-0110 IMPLEMENTATION LOG

## Why
- Phase 4 の未完了項目「シーズン制（ランキング/報酬/アーカイブ）」に対して、archive は実装済みだが ranking/reward の導線が不足していた。
- 現時点ではオンチェーン `pointsDelta` を使った公式集計をまだ接続していないため、まず local replay 履歴から決定的に再計算できる最小進行指標が必要だった。
- UI直書きで算出ロジックを持つと将来の pointsDelta 連携時に差分事故が出るため、pure function として切り出したかった。

## What
- `apps/web/src/lib/season_progress.ts` を新規追加。
  - local season points 算出を実装（Win +3 / Loss +1 / Event clear +2）。
  - reward tier 判定（Rookie/Bronze/Silver/Gold/Legend）を実装。
  - event別 points board（deterministic tie-break）を実装。
  - markdown 出力（progress section）を実装。
- `apps/web/src/pages/Events.tsx`
  - Season Archive に `Local season points (provisional)` パネルを追加。
    - 現在Tier / 次Tierまで / 進捗バー / reward hint
  - `Season points board (local provisional)` を追加。
  - `Copy summary` を `season archive + progress` の結合出力に拡張。
- Tests
  - `apps/web/src/lib/__tests__/season_progress.test.ts` を追加。
    - points算出、tier遷移、tie-break、markdown 生成を検証。
- Docs
  - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` に Commit0110 を追記。

## Verify
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
