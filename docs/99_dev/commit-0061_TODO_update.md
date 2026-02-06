# commit-0061 TODO update

## 今回の追加で “できるようになったこと”
- Nyano画像をローカル同梱（webp+png）で確実に表示できる
- Tailwindトークンと UI primitives の導入で、全画面の見た目を底上げできる
- 盤面/カード UI の新実装（Nyanoトーン）をコードとして取り込めた

---

## 次コミット候補（優先順）

### P0: 動作確認
- [ ] `pnpm -C apps/web dev` が正常起動すること
- [ ] Match / Replay / Overlay が表示できること（最低限のレイアウト崩れが無い）
- [ ] 画像（`/nyano.webp`）が表示されること

### P1: “ゲーム感” を出す統合
- [ ] Match 終了時に `GameResultOverlay` を表示（勝敗/枚数/共有導線）
- [ ] Deck/Hand 表示で `HandDisplay` の導入検討（CardNyano.tsx 内）

### P2: 配信・視聴者参加の体験改善
- [ ] OBS Overlay を Premium デザインへ段階的移行
- [ ] state_json を投票開始時にも送る運用に合わせ、UI側で allowlist / strictAllowed を可視化

### P3: 採用判断
- [ ] `_design/Home.tsx` をトップページとして採用するか決める（既存 Home がある場合は統合）

---

## 注意
- Tailwind の config ファイル形式（ts/js）で挙動差がある場合は、現在のプロジェクト設定に合わせて `tailwind.config.*` を揃える必要があります。
