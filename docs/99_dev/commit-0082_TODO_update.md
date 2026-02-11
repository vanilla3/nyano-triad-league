# commit-0082 TODO update

## Done
- [x] strictAllowed の allowlist/hash を HUD/overlay/stream で整合
- [x] viewer command formatter を単一ソース化（triad_viewer_command）
- [x] /stream の parse/normalize を triad_viewer_command に統合（入力揺れ吸収を単一ソースに）
  - Stream.tsx / VoteControlPanel.tsx は `parseChatMoveLoose` を triad_viewer_command.ts から import 済み
  - Sprint 30 で統合テストマトリクス追加（24テスト: フォーマット変種→正規化一致検証）
- [x] CI に web build/lint を追加（将来の事故防止）
  - `.github/workflows/ci.yml` web ジョブに typecheck → lint → test → build → e2e 全段階実装済み

## Next
- [ ] overlay HUD の視認性改善（縮尺・余白・コントラスト・情報優先順位）
