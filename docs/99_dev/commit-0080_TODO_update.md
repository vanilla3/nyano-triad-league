# commit-0080 TODO update

## Done
- [x] `#triad` の formatter を単一ソース化（triad_vote_utils → triad_viewer_command）
- [x] StreamOperationsHUD の strictAllowed を toPlay 基準へ修正
- [x] /stream の allowlist hash 算出を共有関数へ寄せる
- [x] ロードマップに進捗と CI/pnpm の注意点を追記

## Next（価値が出やすい順）
- [ ] CI: pnpm の二重指定エラー修正（pnpm/action-setup の version と packageManager を single source に統一）
- [ ] P3: /stream の受理判定（parse/normalize）を triad_viewer_command に統一（票割れ根絶）
- [ ] overlay: 視認性最終調整（フォント/余白/視線誘導、OBSテンプレ）
