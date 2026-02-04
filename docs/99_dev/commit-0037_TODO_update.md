# commit-0037 TODO update

## Done
- [x] Copy/Save 等の成功フィードバックを toast に統一
- [x] JSON/長い値の表示を折りたたみ（Disclosure）で整理
- [x] Events の attempt 操作（copy/remove/clear）を分かりやすく（confirm/toast）

## Next
### UI/UX（ゲーム体験寄り）
- [ ] Arena/Match を「ゲームっぽく」する演出（勝敗演出、ターンの強調、SEは後）
- [ ] Replay の “共有しやすさ” を強化（ワンクリック共有、OGP用メタの検討）
- [ ] Nyanoらしいマスコット（SVG）を UI に薄く入れる（ヘッダ/空状態）

### 機能
- [ ] Event: “ベスト記録” の可視化（tile差/タイブレーク、保存時に自動ハイライト）
- [ ] AI: 難易度 normal の強化（探索深度/評価関数の調整、学習は後）
- [ ] On-chain 提出の設計（段階導入）
  - まずは transcriptHash を提出 → 後から full transcript / proof

### テスト
- [ ] UI regression の軽い自動化（Playwright で smoke: /match→/replay）
