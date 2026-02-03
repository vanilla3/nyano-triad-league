# commit-0022 — Implementation Log（差分）

## Why
- v2（Shadowのみ）を導入したことで、UI/ボット/第三者が「どの rulesetId がどの engineId か」を再現できないと分裂する。
- また League の提出入口が `submitMatchV1/V2` だけだと、外部ツールが “正しい入口” を選べず UX が悪い。
- 運営がいなくなっても回るには、
  1) 公式 ruleset package を機械的に生成できる
  2) League 提出が 1つの入口で自動解決できる
  が必要。

## What
- League:
  - `submitMatch(t,sigA,sigB)` を追加（RulesetRegistry の engineId を参照して自動ルーティング）
- Tests:
  - `submitMatch` が v1/v2 を正しく自動選択して決済できることを追加検証
- Tooling:
  - `scripts/print_official_onchain_rulesets.mjs` を追加
    - triad-engine の公式 config から rulesetId/configHash を出力し、コミュニティ共有できる
- Docs:
  - `Nyano_Triad_League_RULESET_PACKAGE_SPEC_v1_ja.md` を新設（生成手順と登録手順）

## Verify
- `pnpm -C packages/triad-engine test`
- `cd contracts && forge test`
