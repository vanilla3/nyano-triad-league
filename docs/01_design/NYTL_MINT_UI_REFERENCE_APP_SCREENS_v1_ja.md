# NYTL Mint UI — 参照画像（アプリ全体画面）要素分解 v1

> 目的: /match だけでなく **アプリ全体を「スマホゲームの画面」に寄せる**ため、参照画像の要素を分解し、実装に落とせる形にする。
>
> 注意: 参照画像内の数値・表記はダミー。**見た目と情報設計のみ**を参照する。

---

## 1) 参照画像一覧（このリポジトリ内）

- メインメニュー（大ボタン + 3ステップ）
  - `docs/01_design/reference/ui_mockups_20260215/01_main_menu_reference.png`
- オンボーディング（3カード + DONE）
  - `docs/01_design/reference/ui_mockups_20260215/02_onboarding_reference.png`
- Arena（モード選択）
  - `docs/01_design/reference/ui_mockups_20260215/03_arena_mode_select_reference.png`
- Deck Builder（カード一覧 + 統計 + 右サマリ）
  - `docs/01_design/reference/ui_mockups_20260215/04_deck_builder_reference.png`
- Match（盤面 + HUD）
  - `docs/01_design/reference/ui_mockups_20260215/05_match_screen_reference.png`

---

## 2) 共通のビジュアル言語（Mint UI の核）

### 2.1 レイヤーの序列（“ゲーム画面らしさ” の正体）

1. 背景（空グラデ / 雲 / 肉球パターン / きらめき粒子）
2. ガラスパネル（半透明 + 内側ハイライト + 外側グロー）
3. 情報（アイコン + 大きいラベル + 小さい補助）
4. 選択状態（リング / グロー / うっすら拡大）
5. 演出（きらめき・ふわっと上下・押し込み）

**重要:**
- 画面は常に「上 = 状況」「中 = メイン」「下 = 次の操作」で視線を誘導する。
- 演出は `prefers-reduced-motion` と `data-vfx` で抑制できること。

### 2.2 形状・質感のルール

- 角丸は “大きめ” が基本（R=20〜36相当）。
- 枠線は 1px では弱い。**2〜3px + 内側ハイライト**で“厚み”を出す。
- 影は 1 種では足りない。
  - 低い位置の柔らかい影（ambient）
  - 近接した濃い影（contact）
  - 外側の淡いグロー（bloom）

### 2.3 タイポグラフィ（「子どもでも読める」）

- 見出し/ロゴは **白縁（stroke）+ 影**。
- ボタンやラベルは “太字” と “十分な文字サイズ”。
- 日本語+英語の併記は「日本語を主」「英語を副」でコントラストを付ける。

### 2.4 情報設計（Nintendo品質の近道）

- 1つの要素に 1つの意味。
  - 例: 「Decks」ボタンには “カード” アイコン。
- 迷わせるテキストを減らし、**形で理解できる**ようにする。
- “次に押す場所” を一番気持ち良くする（押しやすいサイズ、最も強いハイライト）。

---

## 3) 画面別：構造と必須要素

### 3.1 メインメニュー（Home）

参照: `01_main_menu_reference.png`

**MUST**
- 中央の大きいガラスボタン 4つ（Arena / Decks / Replay / Stream）
- 背景: 空グラデ + 雲 + 肉球 + 星
- “3ステップで始めよう” の横長カード 3つ
- 画面下の情報バー（現在フェーズ/次のマイルストーン等）

**SHOULD**
- ロゴ付近にマスコット（Nyano）が “覗き” で存在
- ボタンアイコンは **線画 + パステル**で統一

**NOT DO**
- 細かいテキストで説明しすぎない（メニューは「入口」）。

### 3.2 オンボーディング（3ステップカード）

参照: `02_onboarding_reference.png`

**MUST**
- 3枚カード + DONE バッジ + 大ボタン
- 右上の progress pill（例: 3/3 steps）

**SHOULD**
- Done の表現は “完了感” が出る（色/小さなアニメ）
- ステップは押すと該当ページへ遷移

### 3.3 Arena（モード選択）

参照: `03_arena_mode_select_reference.png`

**MUST**
- 左サイドに大きいナビ（Decks / Match / Replay / Playground）
- 中央: 大バナー（キャラ + タイトル）
- 右: Quick Play カード（Play Now など）
- 下: 難易度カード 4つ（Easy/Normal/Hard/Expert）

**SHOULD**
- Quick Play の中に “Pixi Stage” の入口
- 難易度カードは「押し心地」があり、選択状態が分かる

### 3.4 Deck Builder

参照: `04_deck_builder_reference.png`

**MUST**
- 上部: タブ式ナビ（Decks/Arena/Events/Replay/Stream/Settings）
- 左: Deck Stats（Total cards/Power/Type 等） + Filter ボタン群
- 中央: カード一覧グリッド（最適化済みのサムネ）
- 右: Deck Summary（選択カード一覧） + Save Deck

**SHOULD**
- 左のフィルタは “ラベルより形” （アイコン/色）で理解できる
- 選択カードは “枠 + 軽い浮き” で明確

### 3.5 Match

参照: `05_match_screen_reference.png`

**MUST**
- Top HUD: ロゴ / スコア / TURN
- 左右: プレイヤーパネル（Avatar/Name/Remaining）
- 中央: 盤面（トレイ感）
- 下: 手札トレイ + 次アクション提示

**SHOULD**
- 盤面セルは「置ける場所」が一目で分かる（光/影/段差）
- コメント（Nyano）表示で UI が揺れない

---

## 4) 実装に落とすための UI プリミティブ（部品表）

> 参照画像を “ページ単位” で再現しようとすると破綻しやすい。
> 先に部品（プリミティブ）を揃えて、各ページで組み立てる。

### A. レイアウト
- `MintGameShell`（背景 + safe-area + 中央カラム）
- `MintTopTabs`（上部タブナビ）
- `MintSideNav`（左サイドの大ボタン）

### B. パネル
- `GlassPanel`（基本）
- `GlassCard`（大ボタン/カード）
- `GlassPill`（HUD/Badge）

### C. ボタン
- `MintBigButton`（Home の 4 大ボタン）
- `MintPrimaryButton`（Play Now / Save Deck）
- `MintChipButton`（フィルタ等）

### D. 状態表現
- Hover/Press/Selected/Disabled
- `focus-visible` のリング（キーボード操作）

### E. アイコン
- `MintIcon`（SVG を統一の stroke/gradient/shadow で描画）

---

## 5) 実装上の注意

- **決定論/互換**に関わるロジック（triad-engine / transcript / URL schema）には触れない。
- `prefers-reduced-motion` と `data-vfx` で演出を抑制できるようにする。
- `backdrop-filter` は環境により負荷が大きいので、密度の高いリスト（Deck Builder の中央グリッド）では
  - 背景をガラスにしつつ、カードサムネ自体には blur をかけない
  - 影/枠線で厚みを出す

---

## 6) Codex 実装の進め方（推奨）

- まず `MintGameShell` と `GlassPanel` 系を作る（他画面の土台になる）
- Home → Arena → Deck Builder の順で移植
- 最後に e2e / layout shift / 390px をまとめて守る

（この段取りは ExecPlan 009 で具体化する）
