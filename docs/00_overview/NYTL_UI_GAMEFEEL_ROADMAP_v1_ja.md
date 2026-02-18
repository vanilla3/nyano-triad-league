# NYTL UI Gamefeel Roadmap v1

このロードマップは「見た目を良くする」だけでなく、
**触った時の理解・反応・迷いの無さ**まで含めた改善計画です。

---

## North Star

ユーザーが説明を読まなくても、
**触るだけで遊べる**。

---

## Phase A: ルール導線の整備（迷わせない）

目的: 新ルール（Classic 追加ルール）を “存在する” から “使える” へ。

Deliverables:

- 対戦前 UI で Classic ルールを選べる
- おすすめプリセット（Standard / Classic）
- 選択内容の要約（短文）

Quality Gates:

- 2クリック以内で対戦開始できる
- 初見でも “何が変わるか” が分かる

---

## Phase B: Mint Material v4（触れる質感の統一）

目的: ボタン/チップ/パネルに “厚み” と “押せる感” を作る。

Deliverables:

- `MintPressable` v4
- `MintBigButton` / `MintTabNav` が v4 に追従
- hover/active/selected/disabled の状態が統一

Quality Gates:

- 390px で押しやすい（44px hit area）
- 押下で沈む（影が変化する）

---

## Phase C: 盤面の「トレイ + スロット」化

目的: バトル画面を “ゲーム画面” にする。

Deliverables:

- 空マスが凹みに見える
- 置ける場所が直感的
- `vfx=off/low` で軽量化

---

## Phase D: 図鑑/デッキビルダーの再設計

目的: 図鑑が “眺めて楽しい” 体験になる。

Deliverables:

- `CardBrowser` の Mint 化
- フィルタ/検索/現在条件の分かりやすさ
- 3カラム（Stats / Grid / Summary）を材質で分離

---

## Phase E: 背景/装飾アセットの薄レイヤー導入（加点）

目的: 雲・足跡・キラ・ノイズで “空気感” を出す。

Deliverables:

- アセット生成フロー（Gemini）
- `mint-app-shell__bg` の多層背景
- ノイズを薄く導入

---

## Phase F: 仕上げ（任天堂品質の最後の 10%）

目的: バグではなく “違和感” を潰す。

Deliverables:

- 画面遷移の気持ちよさ（micro motion）
- ボタン/カードのサウンド（任意）
- スクリーンショットテスト（必要なら）

Quality Gates:

- 目が疲れない（彩度/コントラスト/密度のバランス）
- レイアウトが揺れない（コメント欄/通知）
