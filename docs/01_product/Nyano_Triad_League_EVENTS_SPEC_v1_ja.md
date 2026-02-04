# Nyano Triad League — Events Spec v1（Draft, ja）

このドキュメントは「イベントとして運用できる」ための最小仕様をまとめます。  
目標は **“運営がいなくなっても勝手に盛り上がる”**ことです。

---

## 1. 目的
- 参加導線を簡単にする（1クリックで同条件に挑戦）
- 比較できる replay を増やす（議論が発生しやすい）
- 運営依存を下げる（サーバや裁定がなくても成立）

---

## 2. Event の定義（v1）
v1 はクライアント内の静的定義です。

- id（slug、固定）
- title / description
- rulesetKey（v1/v2）
- seasonId
- firstPlayer
- Nyano deck tokenIds（5枚）
- aiDifficulty（easy/normal）
- startAt / endAt（任意、ISO8601）

定義は `apps/web/src/lib/events.ts` に置きます。

---

## 3. URL と互換性
- Event は `/match?event=<id>` で起動できること。
- Event ID はできるだけ変更しない（過去共有リンクの互換性のため）。
- 結果の共有は transcript（Replay）で行い、議論の土台にする。

---

## 4. フェアネス（運用指針）
Event では条件を固定して“比較可能”にします。

- ruleset / season / firstPlayer / Nyano deck / difficulty を固定
- UI 側で変更を disabled にし、誤解を減らす

---

## 5. 将来の拡張
- オンチェーン提出（submit）で結果を確定できるようにする
- ランキング（オフチェーン集計→オンチェーン確定）の導線
- Nyanoデッキの所有・署名の問題（ERC-6551 / ERC-1271 等）の解決


---

## 6. Local Attempts（v1: 最小ランキングの土台）

当面はサーバレスで回すため、イベントの挑戦結果は **ローカル保存（localStorage）** でも十分に機能します。

- Replay 画面で `Save` を押すと「My Attempts」に保存
- `/events` でイベントごとの My Attempts を表示
- これは「将来のランキング（オンチェーン提出/集計）」の前段です

**注意**
- これは端末ローカルの記録です（別端末/別ブラウザには同期しません）
- 将来はオンチェーン提出と組み合わせて “誰でも検証可能なランキング” に拡張します
