# Nyano Triad League — Battle UI “スマホゲー級” 改修 仕様書＋TODO（Cute Mint / v2 完全版）

対象リポジトリ: `vanilla3/nyano-triad-league`  
対象: `apps/web` の `/match`（対戦UI）＋サイト全体の“mint.nyano.ai 風かわいい統一”  
前提: 既存の `ui=rpg` 切替に加えて **`ui=mint`** を導入し、段階的に移行する。

作成日: 2026-02-09

---

## 0. このドキュメントの使い方

- **仕様書**: 「どんな見た目／どんな操作／どんな情報設計」にするか  
- **TODO**: “完全版（スマホゲー級）” までの道筋を **作業単位に分解**（Where/AC/依存関係つき）
- **Claude Code に投げる前提**で、ファイルパスや実装順が分かる粒度にしてあります。

---

## 1. 現在実装の確認サマリ（添付zip: nyano-triad-league-main (5) 時点）

### 1.1 /match の現状（重要ポイント）
- `apps/web/src/pages/Match.tsx` が **状態管理＋UIが巨大に同居**（今後のUI多面展開で肥大化しやすい）
- UI切替は `?ui=rpg` が存在（`isRpg = ui === "rpg"`）。ここへ `ui=mint` を追加するのが自然。
- 盤面は `BoardView`（Nyano-ish）または `BoardViewRPG`（RPG theme）で表示  
  - `BoardView` は `selectedCell / focusCell / placedCell / flippedCells / warningMarks` を受ける（Mint UIでも同じAPIに寄せると移植が楽）
- カード表示は `CardNyano` / `CardNyanoCompact` で統一されつつある  
  - `animate-card-place / animate-card-flip` は Tailwind に定義済みで、演出の基盤がある
- 観戦/説明系の部品が揃っている  
  - `AdvantageBadge`, `MoveQualityTip`, `FlipTraceBadges`, `AiReasonDisplay`, `NyanoAvatar`, `GameResultOverlay`
- E2E が既に存在（`apps/web/e2e/*`）。UI追加時に回帰を抑えやすい。

### 1.2 いまのUIを“スマホゲー級”へ上げる際のボトルネック
- **UIの“奥行き”と“HUDレイヤー”が薄い**  
  → 盤面が「カードUIの1セクション」になっていて、没入感が足りない
- **入力がフォーム的**（select/ボタン中心）  
  → スマホゲーらしい “直接操作感（タップ・ドラッグ・スワイプ）” が弱い
- **情報の見せ方が分散**  
  → 重要情報（ターン、優勢、合法手、警戒、AI理由）が「視線誘導の設計」になっていない
- **CSS資産の整理余地**  
  - `src/index.css` に UI/アニメ系定義がある一方、ビルドの主導は `src/styles.css`。  
    今後 Mint UI を追加するなら、**“どれが正” を決めて統合**した方が破綻しにくい。

---

## 2. ゴール定義（スマホゲー級の意味を“実装できる要件”に落とす）

### 2.1 UXゴール
1) **1秒で状況が分かる**  
   - “今だれの手番？” “どこに置ける？” “何が起きた？” が即読める
2) **直接操作感**（モバイル前提）  
   - 手札はスワイプ、タップで拡大、盤面タップで配置、長押しで詳細
3) **気持ちよい演出**  
   - 置く/フリップ/連鎖/勝敗が「短く」「気持ちいい」
4) **プログレッシブ開示**  
   - 初心者は要点だけ、上級者・配信者は詳細まで（ドロワー/展開で深掘り）
5) **Nyano Mint 風 “かわいい統一”**  
   - かわいいが、対戦中は読みやすい（可愛さは“読みやすさの上”）

### 2.2 非機能要件
- 60fps を目標（操作時）
- 低スペでも破綻しない（高負荷演出は設定で抑制）
- `prefers-reduced-motion` 対応
- タップ領域 44px 以上、フォーカスリング可視（アクセシビリティ）

---

## 3. アートディレクション（Cute Mint）

### 3.1 世界観キーワード
- **Kawaii / Clean / Glossy / Holo**
- **Pastel gradients**（ラベンダー、ミント、ベビーブルー、コーラル）
- **Rounded / Puffy / Sticker**
- **Sparkle & Soft noise**（わずかなノイズで高級感）

### 3.2 タイポ（提案）
- 見出し: `Nunito`（既存）＋ 日本語は丸ゴ（例: `M PLUS Rounded 1c`）
- 本文: `Noto Sans JP`（既存）
- 数値/ID: `JetBrains Mono`（既存）

### 3.3 “UI素材”の考え方
スマホゲーの品質差は、ほぼ「素材のレイヤリング」から生まれます。  
Mint UIでは以下を前提にします。

- **Panel**: ガラス + 縁のホロ + 角丸  
- **Board**: 盤面土台（奥行き） + セル（ぷっくり）  
- **FX**: スパークル/ライン/ふわっと光  
- **Icon**: SVG（警戒/連鎖/勝利/設定）

---

## 4. UIアーキテクチャ（実装が破綻しない設計）

### 4.1 方針：MatchPage は “状態”、UIは “View”
現状 `pages/Match.tsx` が肥大しやすいので、Mint UI導入のタイミングで分割します。

#### 提案構成
- `apps/web/src/pages/Match.tsx`
  - **URL/モード判定**（ui / mode / opp / ai / dm など）
  - `useMatchController()` を呼び、**UIに必要なデータと操作を返す**
  - `ui` に応じて View を切替
- `apps/web/src/pages/match/MatchViewClassic.tsx`
- `apps/web/src/pages/match/MatchViewRPG.tsx`
- `apps/web/src/pages/match/MatchViewMint.tsx`（新規）

> こうしておくと、UI追加が「Viewの差し替え」になり、ページの可読性と保守性が上がります。

### 4.2 UI切替（Feature Flag）
- `?ui=mint` で Mint UI を有効化（まずは“隠し”）
- `localStorage` に “最後に選んだUI” を保存（任意）
- 将来的に、安定後に `ui` のデフォルトを mint に寄せる

---

## 5. Mint Battle UI の画面仕様（/match?ui=mint）

### 5.1 レイヤー設計（Zの序列）
1) **BG**: パステルグラ + 微ノイズ + 星/肉球パターン（ゆっくり）
2) **Stage**: 盤面の土台（影とハイライトで奥行き）
3) **Board**: 3×3セル（触れる感）
4) **Cards**: 盤面カード＋手札（ティルト・影・キラ）
5) **HUD**: ガラスパネル（スコア/ターン/警戒/AI/ログ）
6) **FX**: 重要イベントだけ強め（フリップ/連鎖/勝敗）
7) **Modal/Drawer**: カード詳細/設定/ログ

### 5.2 レイアウト（Desktop / Tablet / Mobile）

#### Desktop（横長）
- 中央: Board（主役）
- 下: Hand（横一列、ホバー拡大、ドラッグ配置）
- 左上: 自分パネル（Avatar/スコア/残りカード/警戒）
- 右上: 相手パネル（NyanoAvatar/難易度/反応）
- 右側: Analysis Drawer（折りたたみ）
- 左側: Log Drawer（折りたたみ）

#### Mobile（縦持ち）
- 上: HUD（ターン/スコア/相手）
- 中: Board（最大面積）
- 下: Hand（横スクロール、タップで拡大 → 盤面タップで配置）
- 右下: “分析”ボタン（Drawer）
- 左下: “ログ”ボタン（Drawer）

### 5.3 入力仕様（“直接操作感”）
- Desktop:
  - カードをドラッグ → セルへドロップ（置けるセルはハイライト）
  - 置いたら **自動コミット（オプション）** or “確定ボタン”
- Mobile:
  - (1) 手札タップ → “選択中”状態（カードが少し浮く）
  - (2) 盤面セルタップ → 配置プレビュー
  - (3) もう一度タップで確定（または “確定ボタン”）
  - 長押し: カード詳細

### 5.4 警戒マーク（Warning Mark）UI
現在は select でセルを選ぶ形。Mint UIでは “ゲームらしく” します。

- “警戒モード”ボタン（🪤/⚠️）を押すと、置けるセルが点滅
- セルをタップして警戒を置く（残数表示）
- 置いた警戒は “ぷにアイコン＋薄い発光” で表示（所有者色）

---

## 6. コンポーネント仕様（Mint UI 実装部品）

> 既存の `components/*` を活かしつつ、Mint UI は“Battle専用”部品を分離します。

### 6.1 新設ディレクトリ案
- `apps/web/src/components/mint-ui/*`  
  汎用UI（ガラスパネル/ボタン/バッジ/ドロワー）
- `apps/web/src/components/mint-battle/*`  
  対戦専用（Stage/Board/Hand/HUD/FX）

### 6.2 UIキット（mint-ui）
- `HoloPanel`
  - 透明ガラス + うっすらホロ縁
  - 9-slice画像 or CSSで実現
- `MintButton`
  - ぷっくり + 押し込み + ふわ光
- `StickerBadge`
  - Advantage/AI理由/MoveTip を“ステッカー風”に統一
- `MintDrawer`
  - モバイルで必須（analysis/log）
- `KawaiiToggle` / `KawaiiSlider`
  - 設定（音/演出/自動コミット/誤操作防止）

### 6.3 Battle専用（mint-battle）
- `BattleStageMint`
  - 背景と盤面土台（パララックス/ゆっくりアニメ）
- `BoardViewMint`
  - 3×3セル、合法手ハイライト、警戒表示、フリップ演出
  - API は `BoardView` と同等にして置換可能にする
- `HandDisplayMint`
  - スワイプ、拡大、ドラッグ/タップ配置
- `BattleHUDMint`
  - スコア、ターン、優勢、残りカード、警戒残数
  - NyanoAvatar の反応（吹き出し）
- `BattleFXMint`
  - 置く/フリップ/連鎖/勝利の最小演出（Canvas or CSS）
- `CardInspectModal`
  - カード画像、edges、trait、hand、説明

---

## 7. 演出仕様（“短く、気持ちいい”）

### 7.1 盤面演出（最優先）
- セルハイライト: ふわ発光（合法手だけ）
- 配置: shadow → card 着地 → 小さな sparkles
- フリップ: 回転 + foil走査 + owner色が入れ替わる瞬間に“ポン”音
- 連鎖: セル間に薄いラインが走る（派手にしすぎない）

### 7.2 HUD演出（情報が主役）
- “あなたの番”は `pulse-soft` で呼吸
- Advantage は “±” とステッカーで明確に
- AI理由は Nyano の表情とバッジで短く（詳細はDrawer）

### 7.3 設定で抑制
- `Reduce motion` ON のときは:
  - flip演出を短縮
  - パーティクル停止
  - カメラ揺れ禁止

---

## 8. アセット制作パイプライン（AI生成 + Adobe仕上げ）

### 8.1 置き場所（提案）
- `apps/web/public/ui/mint/`
  - `bg/`（背景）
  - `board/`（盤面/セル）
  - `panel/`（枠/9-slice）
  - `fx/`（sparkle sprite）
  - `icons/`（svg）
  - `sfx/`（ogg/wav）

### 8.2 生成プロンプト（例）
- 背景（16:9 / 4:3 / mobile縦）
  - `pastel kawaii holographic background, soft lavender to mint gradient, subtle star sparkles, gentle noise texture, cute futuristic, clean, no text, high quality`
- 盤面土台
  - `cute game board base, rounded, glossy plastic, pastel, subtle paw print pattern, soft shadow, no text`
- ガラスパネル枠（透過）
  - `rounded glass panel frame, pastel holographic rim, soft inner glow, subtle sparkle, UI asset, transparent center, no text`

### 8.3 Adobeでの仕上げ（推奨）
- Photoshop:
  - ノイズ量と色相統一
  - 角の透明処理、縁のシャープ化
  - 9-slice化（角を崩さない）
- Illustrator:
  - SVGアイコン（線幅統一、角丸）
- 出力:
  - 写真/背景: WebP/AVIF
  - UI枠: PNG/WebP（透過）
  - アイコン: SVG

---

## 9. 完全版へ向けた実装ロードマップ（Mint Battle UI）

> 下は “ブレずに最後まで行く” ための順序です。  
> **先に壊れにくいアーキテクチャ（P0）** → **核（P1〜P3）** → **演出（P4）** → **全体統一（P5）** → **QA/最適化（P6）**。

### P0: 分割・足場（UI導入準備）
- `MatchPage` を “controller + view” に分割
- `ui=mint` を追加（空の Mint view でもよい）
- Mint UI用の tokens / 基本CSS を導入

### P1: BattleStageMint（背景 + 土台）
- 背景（静止でもOK）と盤面土台を整える
- Board は既存 `BoardView` をそのまま載せてOK（先に“雰囲気”を出す）

### P2: BoardViewMint（盤面完成）
- セル/カードの 3D風スタイル
- 合法手ハイライト、警戒表示、placed/flipped 演出
- Mobile向けタップUX

### P3: HandDisplayMint（手札UX完成）
- スワイプ、拡大、ドラッグ/タップ配置
- 誤操作防止オプション
- カード詳細モーダル

### P4: HUD/Drawer（情報設計の完成）
- 1秒で状況把握できる HUD
- analysis/log の progressive disclosure（Drawer）
- NyanoAvatar の“反応”連動

### P5: FX + Sound + Haptics（最後の一段）
- sparkles / foil / chain line
- SFX/BGM（設定あり）
- 振動（任意、ON/OFF）

### P6: サイト全体統一 + QA/最適化
- /home /arena /decks /replay /stream まで同一トーン
- E2E, パフォーマンス計測, a11y 改善
- Mint UI をデフォルト化（任意）

---

# 10. TODO（完全版まで） — “作業単位” チェックリスト

> 記法:
> - **Where**: 触る場所（ファイル/ディレクトリ）
> - **AC**: 受け入れ条件（出来た判定）
> - **Deps**: 依存（先に必要）

---

## 10.A 基盤（アーキテクチャ / 切替 / 設定）

- [ ] **MINT-BASE-001**: `ui=mint` ルーティング追加  
  - Where: `apps/web/src/pages/Match.tsx`  
  - AC: `?ui=mint` で Mint view が表示され、既存 UI が壊れない

- [ ] **MINT-BASE-002**: MatchPage を controller/view 分割（最小）  
  - Where: `apps/web/src/pages/Match.tsx` → `apps/web/src/pages/match/*`  
  - AC: 既存E2Eが通る、差分が読みやすい

- [ ] **MINT-BASE-003**: `useMatchController()` を抽出  
  - Where: `apps/web/src/pages/match/useMatchController.ts`（新規）  
  - AC: state+actions が 1つのhookから提供される（UIは薄くなる）

- [ ] **MINT-BASE-004**: Mint UI設定（localStorage）  
  - Where: `apps/web/src/lib/local_settings.ts` / `apps/web/src/pages/match/*`  
  - 内容: `mintui.reduceMotion`, `mintui.sound`, `mintui.autoCommit`, `mintui.haptics`, `mintui.hudDensity`  
  - AC: 設定が保持される

- [ ] **MINT-BASE-005**: CSS資産の統合方針決定  
  - Where: `apps/web/src/styles.css` と `apps/web/src/index.css`  
  - 方針案:
    - A) `index.css` を廃止し、必要分を `styles.css` へ移植
    - B) `styles.css` を `index.css` に統合して1本化  
  - AC: “どれが正” が1つになり、不要CSSが減る

---

## 10.B デザインシステム（tokens / UI kit）

- [ ] **MINT-DS-001**: Mint battle 用トークン追加（Tailwind）  
  - Where: `apps/web/tailwind.config.ts`  
  - 内容: `mintui.*`（bg/panel/accent/playerA/playerB）  
  - AC: Mint 用の色/影がクラスで使える

- [ ] **MINT-DS-002**: `HoloPanel` 実装  
  - Where: `apps/web/src/components/mint-ui/HoloPanel.tsx`  
  - AC: ガラス感 + 角丸 + 影が安定して再利用できる

- [ ] **MINT-DS-003**: `MintButton` 実装（primary/ghost/soft）  
  - Where: `apps/web/src/components/mint-ui/MintButton.tsx`  
  - AC: 押し込み/hover が一貫、サイズが揃う

- [ ] **MINT-DS-004**: `StickerBadge`（Advantage/Reason/MoveTip 統一）  
  - Where: `apps/web/src/components/mint-ui/StickerBadge.tsx`  
  - AC: バッジの見た目が Mint UI で統一される

- [ ] **MINT-DS-005**: `MintDrawer` 実装（右/下から）  
  - Where: `apps/web/src/components/mint-ui/MintDrawer.tsx`  
  - AC: モバイルで使いやすい（スワイプで閉じるなど）

- [ ] **MINT-DS-006**: Fonts の統一（必要なら追加）  
  - Where: `apps/web/src/styles.css`（@import or self-host）  
  - AC: タイトルと本文のトーンが mint.nyano.ai と同系統に

---

## 10.C Battle Stage（背景・土台・没入感）

- [ ] **MINT-STAGE-001**: `BattleStageMint` 追加  
  - Where: `apps/web/src/components/mint-battle/BattleStageMint.tsx`  
  - AC: 背景・土台・パララックスが機能

- [ ] **MINT-STAGE-002**: 背景アセット（仮）導入  
  - Where: `apps/web/public/ui/mint/bg/*`  
  - AC: 画面全体の空気が “mintかわいい” になる

- [ ] **MINT-STAGE-003**: 盤面土台アセット（仮）導入  
  - Where: `apps/web/public/ui/mint/board/*`  
  - AC: Boardが“浮いて見える”

---

## 10.D Board（盤面UIの完成）

- [ ] **MINT-BOARD-001**: `BoardViewMint` の骨格  
  - Where: `apps/web/src/components/mint-battle/BoardViewMint.tsx`  
  - AC: `BoardView` と同等APIで置換できる

- [ ] **MINT-BOARD-002**: 合法手ハイライト（視線誘導）  
  - Where: `BoardViewMint`  
  - AC: 置ける場所が一目で分かる（強すぎない）

- [ ] **MINT-BOARD-003**: placed/flipped 演出（カード＋セル）  
  - Where: `BoardFlipAnimator` + `BoardViewMint` + `CardNyanoCompact`  
  - AC: 置く/フリップが “短く気持ちいい”

- [ ] **MINT-BOARD-004**: 警戒マーク表示（所有者色＋ぷにアイコン）  
  - Where: `BoardViewMint`  
  - AC: 警戒の位置と所有者が即読める

- [ ] **MINT-BOARD-005**: “警戒モード”入力の導入（select廃止）  
  - Where: `MatchViewMint`（操作UI）  
  - AC: 警戒はボタン→セルタップで置ける

- [ ] **MINT-BOARD-006**: MobileタップUX（選択→配置→確定）  
  - Where: `MatchViewMint` + `BoardViewMint` + `HandDisplayMint`  
  - AC: 誤操作が減る、操作が直感的

---

## 10.E Hand（手札UIの完成）

- [ ] **MINT-HAND-001**: `HandDisplayMint` 実装（スワイプ）  
  - Where: `apps/web/src/components/mint-battle/HandDisplayMint.tsx`  
  - AC: 5枚を横スクロールできる（モバイル）

- [ ] **MINT-HAND-002**: タップ拡大（プレビュー）  
  - AC: 選択カードが大きく見える（邪魔なら閉じられる）

- [ ] **MINT-HAND-003**: Desktopドラッグ＆ドロップ配置  
  - 技術案: `@dnd-kit/core`（軽量）  
  - AC: ドロップ先セルが分かる、操作が滑らか

- [ ] **MINT-HAND-004**: “使用済みカード”の視覚表現  
  - AC: 使ったカードが一目で分かる（グレーアウト/スタンプ）

- [ ] **MINT-HAND-005**: `CardInspectModal`（長押し/右クリック）  
  - Where: `apps/web/src/components/mint-battle/CardInspectModal.tsx`  
  - AC: edges/trait/hand が読める

---

## 10.F HUD（情報レイヤーの完成）

- [ ] **MINT-HUD-001**: `BattleHUDMint`（上部）  
  - 内容: Turn/MoveCount, Score, CurrentPlayer, Warning残数  
  - AC: “今の状況”が1秒で分かる

- [ ] **MINT-HUD-002**: プレイヤーパネル（自分/相手）  
  - 内容: Avatar/名前/難易度/状態  
  - AC: スマホでも視認できる

- [ ] **MINT-HUD-003**: Advantage 表示をステッカー化  
  - Where: `AdvantageBadge` を Mint 風に or Wrapper  
  - AC: かわいいが読みやすい

- [ ] **MINT-HUD-004**: AI理由（短い）＋詳細はDrawer  
  - Where: `AiReasonDisplay` / `AiNotesList`  
  - AC: 画面を散らかさず、深掘り可能

- [ ] **MINT-HUD-005**: TurnLog を Drawer 化（右 or 下）  
  - Where: `TurnLog`  
  - AC: 通常は隠れていて、必要時だけ見られる

- [ ] **MINT-HUD-006**: “直近の手”を常時表示（Last move chip）  
  - Where: `LastMoveFeedback`（既存）と統合  
  - AC: 何が起きたかが追える

---

## 10.G 演出・音・触覚（最終仕上げ）

- [ ] **MINT-FX-001**: Sparkle FX（軽量）  
  - Where: `apps/web/src/components/mint-battle/BattleFXMint.tsx`  
  - AC: 置いた瞬間が気持ちよい（うるさくない）

- [ ] **MINT-FX-002**: Foil走査（フリップ時）  
  - 技術案: CSS `mask-image` / gradient animation  
  - AC: 高級感が上がる

- [ ] **MINT-FX-003**: Chain line（連鎖）  
  - AC: 連鎖が分かるが邪魔しない

- [ ] **MINT-SOUND-001**: SFX導入（置く/フリップ/勝利）  
  - Where: `apps/web/src/lib/sound/*`（新規）  
  - AC: 音量/ミュート設定がある

- [ ] **MINT-SOUND-002**: BGM（任意）  
  - AC: ループが自然、ミュート可

- [ ] **MINT-HAPTIC-001**: `navigator.vibrate`（任意）  
  - AC: ON/OFFできる、やりすぎない

---

## 10.H アセット制作（AI生成 + 仕上げ + 最適化）

- [ ] **MINT-ASSET-001**: 画像生成（背景/盤面/パネル/FX）  
  - 手段: nanobanana API（または同等）  
  - Output: `public/ui/mint/*` に仮素材が入る

- [ ] **MINT-ASSET-002**: Photoshopで色相統一と透過品質  
  - AC: “安っぽさ”が消える（縁が綺麗）

- [ ] **MINT-ASSET-003**: 9-slice化（パネル枠）  
  - AC: サイズ可変でも角が崩れない

- [ ] **MINT-ASSET-004**: 最適化（WebP/AVIF, サイズ）  
  - AC: LCPが悪化しない（画像が重すぎない）

---

## 10.I サイト全体統一（mint.nyano.ai との整合）

- [ ] **MINT-SITE-001**: AppLayout を “mint” 寄せ（必要最小）  
  - Where: `apps/web/src/App.tsx`, `styles.css`  
  - AC: /home→/match の統一感

- [ ] **MINT-SITE-002**: “ゲーム画面は没入モード” を追加（任意）  
  - 例: `?immersive=1` でヘッダー/フッターを簡略化  
  - AC: スマホでゲームが“全画面”っぽくなる

- [ ] **MINT-SITE-003**: 主要ページのUI密度調整  
  - /arena /decks /replay /stream  
  - AC: どのページも同じブランドに見える

---

## 10.J テスト・品質保証（完全版の仕上げ）

- [ ] **MINT-QA-001**: E2Eに `ui=mint` パス追加  
  - Where: `apps/web/e2e/*`  
  - AC: Mint UIでも基本導線が通る

- [ ] **MINT-QA-002**: Visual regression（最低限）  
  - 手段: Playwright screenshot 比較（差分許容を調整）  
  - AC: UI崩れが検知できる

- [ ] **MINT-QA-003**: パフォーマンス計測（簡易）  
  - 指標: FPS（体感）/ LCP / 画像重量  
  - AC: “重いから戻す” が起きない

- [ ] **MINT-QA-004**: a11y チェック  
  - 項目: フォーカス、タップ領域、コントラスト、reduced motion  
  - AC: 主要操作がキーボードでも可能（最低限）

---

## 10.K リリース・移行（段階的に安全に）

- [ ] **MINT-ROLLOUT-001**: Mint UIを “隠し” で公開（ui=mint）  
  - AC: 既存ユーザー影響なし

- [ ] **MINT-ROLLOUT-002**: Mint UIを “推奨” に（UI切替UI追加）  
  - AC: 切替導線が分かりやすい

- [ ] **MINT-ROLLOUT-003**: Mint UIをデフォルト化（任意）  
  - AC: 重大バグが無い、E2Eが安定

---

# 11. Claude Code に渡す “分割プロンプト”（作業パッケージ別）

> 大きい変更を一気に投げると破綻するので、P0→P6で分割します。  
> 以下は「そのまま貼る」用途です。

## Prompt P0（分割＋ui=mint 足場）
```
リポジトリ vanilla3/nyano-triad-league の apps/web を改修してください。
/match に ui=mint を追加し、MatchPage を controller/view に分割します。

要件:
- pages/Match.tsx の状態管理を useMatchController() に抽出
- view は MatchViewClassic / MatchViewRPG / MatchViewMint に分離
- ui=rpg は現状維持、ui=mint はまず骨格だけ表示でOK
- E2E が通ること（既存導線破壊禁止）
```

## Prompt P1（BattleStageMint）
```
ui=mint の MatchViewMint を実装し、BattleStageMint（背景＋土台）を追加してください。
Board は既存 BoardView をそのまま載せてOKです。
assets は public/ui/mint/bg と public/ui/mint/board を参照する設計にしてください（仮画像でも動く）。
```

## Prompt P2（BoardViewMint）
```
BoardViewMint を作成し、合法手ハイライト、警戒表示、placed/flipped 演出を実装してください。
BoardView と同等の props で置換可能にしてください。
```

## Prompt P3（HandDisplayMint）
```
HandDisplayMint を作り、モバイルはスワイプ＋タップ拡大→盤面タップで配置。
デスクトップはドラッグ＆ドロップ配置（@dnd-kit等OK）。
誤操作防止オプションも用意してください。
```

## Prompt P4（HUD/Drawer）
```
BattleHUDMint と Drawer を実装し、Score/Turn/Advantage/AI理由/TurnLog を統合してください。
情報はプログレッシブ開示（通常は要点、詳細はDrawer）にしてください。
```

## Prompt P5（FX/Sound）
```
BattleFXMint（sparkle/foil/chain line）と、SFX/BGMの仕込みを追加してください。
reduced motion / mute を設定で制御できるようにしてください。
```

## Prompt P6（QA/最適化）
```
ui=mint のE2Eと簡易ビジュアルリグレッションを追加し、画像アセットを最適化してください。
パフォーマンスが悪化しないように、重い演出は抑制設定を入れてください。
```

---

## 12. Done 定義（“スマホゲー級” 完了条件）
- Mint UIで、スマホ操作が気持ちよく成立する（誤操作が少ない）
- 置く/フリップ/勝敗が “短く気持ちいい”
- HUDにより、状況理解が1秒で可能
- 配信者・上級者向け情報は Drawer で深掘りできる
- E2E/回帰が安定し、既存モード（classic/rpg）が壊れていない
- アセットが軽く、表示が速い（体感）

---

以上。
