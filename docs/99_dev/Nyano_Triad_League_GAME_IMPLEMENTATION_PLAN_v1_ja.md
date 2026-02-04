# Nyano Triad League — Game UI Implementation Plan v1（ja）

この計画は「機能UI」から「運営品質のゲームUI」へ移行するための段階計画です。  
**壊さない順序**：参照（Watch/Tools）→ デッキ（Play準備）→ 対戦（Play本体）→ 署名/提出 → リーグ運用。

---

## Phase 0（完了）: 参照レイヤ（Watch/Tools）
- Playground（テストベクタ再現）
- Replay（transcript import + 共有リンク）
- Nyano Inspector（tokenId read-only）
- Rulesets（公式スナップショット固定）

成果：議論が回る最低装置。

---

## Phase 1（進行）: Playの土台（Decks + Arena）
### 1.1 Decks（localStorage）
- デッキ作成（tokenId 5枚）
- 保存/編集/削除/インポート/エクスポート
- カードプレビュー（オンチェーンread）

### 1.2 Arena（導線）
- 「デッキ→対戦→結果→共有」のUI導線を集約
- 今後の機能が増えても迷子にならない情報設計

**受け入れ条件**
- 迷わずデッキを作って保存できる
- 共有用にデッキJSONをコピーできる

---

## Phase 2: Local Match（サンドボックス対戦）
- PvP（手動）に加えて **Vs Nyano（AI）** を段階的に導入（イベント運用の土台）

## Phase 2a: Vs Nyano（AI）
- まずはクライアント内の簡易AI（壊れない・決定論）
- difficulty（Easy/Normal）
- transcript を生成し Replay で共有


- デッキ選択（Decksから）
- 対戦UI（ターンごとに cell + cardIndex を選ぶ）
- 盤面/ログ/理由の表示
- transcript を生成して Replay に飛ばす（共有）

**受け入れ条件**
- 2人（または1人で両側）で9手まで遊べる
- transcript を生成でき、Replay で再現できる

---

## Phase 3: 署名（EIP-712）と提出準備
- transcript への EIP-712 署名（A/B）
- submit tx の準備（UI上でガイド + 失敗理由の提示）
- ownerOf mismatch などの注意を UI に組み込む

**受け入れ条件**
- “署名して提出する”一連の手順が UI で迷わず実行できる（最初はテストネットでも可）

---

## Phase 4: リーグ運用（運営品質）
- Season（期間/ルール/報酬）
- ランキング（サブグラフ/外部indexer or まずは簡易）
- 大会（第三者が主催できる導線、ルールパッケージ共有）

---

## 横断要件（常に守る）
- share link を壊さない（互換維持）
- 公式ルールはスナップショット + テストで固定
- エラーは原因が分かる（tokenId/RPC/関数名）


---

## Phase 2b: Events（Nyano Challenge）
- `/events` で “公式イベント” を一覧表示
- イベントIDで条件を固定して `/match?event=...` に誘導
- オフチェーンで回ることを最優先（Replay共有）
- 将来：オンチェーン提出/ランキングへ拡張
