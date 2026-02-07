# commit-0073 IMPLEMENTATION LOG

## 2026-02-07
### Summary
- /replay に NyanoReaction を追加し、step に応じた「そのターンの反応」を再現できるようにした。
- spectator 体験としての偏りを避けるため、NyanoReaction の neutral perspective を正しく扱うように改善。

### Done
- /replay: ScoreBar 直下に NyanoReaction を表示（step=0 は非表示）。
- /replay: winner 表示で draw を正しく扱う（デバッグ表示の整合）。
- NyanoReaction: perspective=null（neutral）のとき、advantage/disadvantage の判定が偏らないよう補正。

### Verification
- `pnpm -C apps/web dev`（または既存の起動手順）で起動し、`/replay` を開く。
- step を進めると、flip/chain/fever/優勢などに応じて Nyano の反応が切り替わる。
- step=9（終了）で draw の場合も破綻しない。

### Notes / Follow-ups
- 反応の「誰視点か」は、必要なら /replay にトグル（A/B/neutral）を追加して調整可能。
