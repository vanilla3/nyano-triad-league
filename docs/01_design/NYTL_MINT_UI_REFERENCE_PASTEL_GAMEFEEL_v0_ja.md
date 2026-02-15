# Nyano Triad League — Mint Battle UI 参考デザイン（Pastel Gamefeel）v0

更新: 2026-02-15

このドキュメントは、添付のイメージ画像（スマホゲー風 UI）を **「デザイン要素の分解」→「実装可能な要件」**に落とすための **参照仕様**です。

> 注意: 画像内の数値・カードの表示内容・UIテキストの一部は、実ゲームの仕様と無関係な“雰囲気用”です。
> **ここでは見た目（世界観・レイヤー・質感・余白・誘導）のみ**を参照し、ゲームロジック/数値/ルールは変更しません。

---

## 1. 参照画像

- 画像ファイル: `docs/01_design/assets/ui_reference_pastel_gamefeel.png`

この画像が示している「スマホゲー感」の本質は、単に可愛い色ではなく、
**(a) 背景レイヤー、(b) HUD/パネルの厚み、(c) 盤面セルの“触れる感”、(d) 情報の定位置化** の 4 点にあります。

---

## 2. 画面構成（要素分解）

### 2.1 背景（BG）
- ミント〜ラベンダー系の **柔らかなグラデーション**
- 薄い **肉球パターン**（大きめ、低コントラスト）
- **ボケ粒子 / スパークル**（ゆっくり漂う）
- 全体に **ソフトな光のにじみ**（ビネットというより “ふわっと光る空気感”）

**狙い**: 盤面や HUD の“ガラス/ホログラム”質感が映える土台。

### 2.2 トップHUD
- 左上: タイトルロゴ（縁取り + 影 + 小さなアイコン）
- 中央: スコア（A/B）を 1枚のガラスパネルにまとめる
  - プレイヤーを示すアイコン（猫）
  - “A: x / B: y” のように **左右対称で即読**
- 右上: `TURN 2/9` のようなターン表示（単独のピル）

**狙い**: 視線は上→中央（盤面）→下（手札）に流れる。トップで状況を固定する。

### 2.3 サイドパネル（Player A/B）
- 左右にプレイヤーパネル
  - 丸型アバター（グラデ縁 / 内側グロー）
  - `Player A` / `Player B` のラベル
  - `Remaining cards`（残り枚数やカード裏アイコン）
- 盤面横に小さな UI（矢印/選択状態の示唆）

**狙い**: 対戦相手を「人」として感じる。スコア以外の人格情報を固定。

### 2.4 盤面（Board）
- 3×3 のセルが **“カード置き場のトレイ”**として表現されている
- 各セルは
  - 角丸 + 内側ハイライト + 外側シャドウ（ぷっくり）
  - 斜めの **ガラス反射（シーン）**
  - ごく軽い **傾き/遠近**（完全なフラットではない）
- 置かれたカードは
  - セルの上に自然に“浮く”
  - 影がセルと連動（浮遊感を担保）

**狙い**: 「ここに置ける」「ここを触る」ことが直感で分かる。

### 2.5 手札トレイ（Bottom/Hand）
- 左下にガラスのトレイ
- カードが **少し重なって**見える（スペース効率 + 触りたくなる）
- 手札エリアの縁取り/影が強く、UIの“土台感”が出ている

**狙い**: 手札が UI の “操作の起点” として明確。

### 2.6 アクションプロンプト（Prompt）
- 画面下中央に **大きいピル**
- 日本語 + 英語の 2行/2段の情報（ただし“視認性が主”）

**狙い**: 初心者でも迷わない。次にやる行為が固定位置で出る。

---

## 3. デザイン・トークン（近似値）

画像から抽出した近似パレット（目安）:

- BG Mint: `#C1E4E6`
- BG Lavender: `#D0C3EF`
- BG Fresh Mint: `#B7F5DD`
- Neutral Lavender Gray: `#ACA3BB`

質感の基本:

- Glass fill: `rgba(255,255,255,0.65)`
- Glass border: `rgba(255,255,255,0.72)`
- Accent stroke (cyan): `rgba(125,211,252,0.55)`
- Accent stroke (pink): `rgba(251,113,133,0.35)`

影（“スマホゲー感”の肝）:

- Soft float: `0 18px 36px -28px rgba(2,6,23,0.55)`
- Panel rim: `0 0 0 1px rgba(125,211,252,0.22) inset`
- Glow: `0 0 18px rgba(125,211,252,0.18)`

角丸（統一推奨）:

- XL panel: 22〜26px
- Cell: 18〜22px
- Pill: 24〜28px

---

## 4. 既存実装へのマッピング（Where to implement）

> 現在の Mint UI は、すでに “ガラス + 角丸 + puffy” の方向性があり、
> **差分は「レイヤーの厚み」と「定位置 UI」**です。

### 4.1 背景/ステージ土台
- 対象:
  - `apps/web/src/components/DuelStageMint.tsx`
  - `apps/web/src/mint-theme/mint-theme.css`
- 追加/変更案:
  - ステージ外側に `mint-gamefeel-bg` レイヤー（肉球 + 粒子 + グラデ）を統合
  - `prefers-reduced-motion` / `data-vfx` で粒子アニメの強度を制御

### 4.2 トップHUD
- 対象:
  - `apps/web/src/components/BattleHudMint.tsx`
  - `apps/web/src/pages/Match.tsx`（Mint UIの HUD 部分）
- 追加/変更案:
  - 参照画像の “A/B スコアパネル” と “TURN ピル” を **別コンポーネント**として切り出し
  - 既存 HUD は情報量が多いので、
    `density=minimal` では参照画像寄り、`standard/full` は従来情報を Drawer へ寄せる

### 4.3 サイドのプレイヤーパネル
- 対象:
  - `apps/web/src/pages/Match.tsx`（Mint UIのレイアウト）
  - 新規: `apps/web/src/components/PlayerSidePanelMint.tsx`（提案）
- 追加/変更案:
  - Desktop 幅でのみ常設（Mobile は折りたたみ/縮小）
  - “Remaining cards” は **実数を出す/出さないをルールで切替**できるように（Openルールと整合）

### 4.4 手札トレイ/プロンプト
- 対象:
  - `apps/web/src/components/HandDisplayMint.tsx`
  - `apps/web/src/components/BoardViewMint.tsx`（ActionPrompt）
  - `apps/web/src/mint-theme/mint-theme.css`
- 追加/変更案:
  - 手札を“トレイ”として囲い、カードの重なり/影を調整
  - Prompt を参照画像のように “大きいピル + 二段表記” に寄せる

### 4.5 Nyano コメント表示のレイアウト崩れ対策
- 対象:
  - `apps/web/src/components/NyanoReactionSlot.tsx`
  - `apps/web/src/components/NyanoReaction.tsx`
  - `apps/web/src/mint-theme/mint-theme.css`
- 追加/変更案:
  - Slot の高さを **固定（min-height ではなく height）**し、内容は absolute で重ねる
  - テキストを `line-clamp` で 2行までに制限し、折返しによる縦伸びを防ぐ
  - CLS（Cumulative Layout Shift）を実測する回帰テストを追加

---

## 5. 実装方針（スマホゲー品質に寄せる“コツ”）

1. **レイヤーの序列を固定する**
   - BG → Stage → Board → Cards → HUD → FX → Modal

2. **「影」と「縁」をケチらない**
   - パネルが“浮いている”ことが、最速でゲーム感を作ります。

3. **情報は“移動させない”**
   - スコア/ターン/次アクションは、ゲーム中に位置が変わらない。

4. **派手さは “重要イベントだけ”**
   - 常時キラキラは疲れる。強い演出は flip/chain/win のみに限定し、
     `data-vfx` と `prefers-reduced-motion` で抑制できるようにする。

---

## 6. 完了条件（見た目の Done を客観化）

- 参照画像の以下が再現されている（完全一致ではなく“印象”）
  - BG: グラデ + パターン + 粒子
  - Board: セルトレイ感、空セルのガラス反射、奥行き
  - HUD: スコア/ターンが上部で固定
  - Hand: トレイ + 重なり + 選択時の浮き
  - Prompt: 大きいピル + 2言語

- Nyano コメント表示時にレイアウトが崩れない
  - **CLS が目視で分かるレベルで発生しない**

- 低スペ/Reduced motion でも破綻しない
  - `prefers-reduced-motion: reduce` で粒子・強いアニメが抑制される

