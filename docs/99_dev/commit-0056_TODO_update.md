# commit-0056 TODO update

## Done
- [x] state_json: strictAllowed allowlist + hash を追加
- [x] viewer cmd parser: unicode矢印/順序入替 を許容
- [x] transcript export: result(status) を含める

## Next
### nyano-warudo 側との連携確定
- [ ] nyano-warudo 側の strictAllowed に allowlist/hash の取り込みを反映（dedupe/差分検知）
- [ ] 投票開始時 state_json の内容を nyano-warudo 側UIに表示（allowlist件数 / hash）

### 視聴者コマンドの安全性
- [ ] `wm=` の入力ゆらぎ（`wm:C1`, `wm C1`, 全角記号）を追加で吸収
- [ ] 不正入力のフィードバック（Stream側: “なぜ無効か” を短く出す）

### AI Nyano 対戦（将来）
- [ ] state_json から “AIが選ぶべき最善手” の評価出力（簡易ヒューリスティック）
