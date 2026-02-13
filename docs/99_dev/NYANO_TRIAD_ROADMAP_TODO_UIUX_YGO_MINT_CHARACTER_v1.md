# Nyano Triad League — UI/UX 仕様書＋ロードマップ＋TODO（v1）
（Nyano Character v3 / 遊戯王“級”の対戦表示 / Mintサイト統一）

作成日: 2026-02-10  
対象: `vanilla3/nyano-triad-league`（添付zip: main (6) を確認）  
追加参照（添付）: `personality_updated.ts`, `llmReply_updated.ts`（Nyano人格の“正”として参照）

---

## 1. ねらい（今回の3点を“同時に”成立させる）

### A. Nyano の character 性を強化（しゃべり・ふるまい）
- **添付の `personality_updated.ts` / `llmReply_updated.ts` の内容を“キャラ聖典”として採用**し、ゲーム内の発話・リアクション・説明文を統一する。
- 目標は「可愛い」「ポンコツだけど憎めない」「優しい」「嘘をつかない」「攻撃的にならない」。
- **対戦UIの“説明”を Nyano の発話として溶かし込む**（Nintendo UX の“UI＝理解”と相性が良い）。

### B. 遊戯王風（=ハイエンド対戦ゲー級）に、カード／盤面表示を引き上げる
- ここでの「遊戯王風」は **“雰囲気の模倣”ではなく “プレゼンテーション品質の到達目標”**。
- 具体的には：
  - 盤面が“ステージ”として成立（奥行き・光・立体感・演出）
  - カードが“物体”として見える（高解像度・適切なトリミング・フレーム・影）
  - 重要情報が“ゲームらしいHUD”に整理される（状況把握が速い）

### C. デフォルトデザインを mint.nyano.ai 風に統一（サイト全体）
- 現状: サイト全体は rose/fuchsia 系の既定デザイン、Mintテーマは主に Match の `ui=mint` で局所適用。
- 目標: **「デフォルト=Mintサイト風」**に寄せ、全ページで統一された UI コンポーネント・配色・角丸・影・余白体系を使う。

---

## 2. 現状実装の確認（添付zip (6) ベース）

### 2.1 Match のUI切替は既に存在
- `apps/web/src/pages/Match.tsx`
  - `?ui=rpg` / `?ui=mint` を判定して表示を切替
  - Telemetry（NIN-UX-003）相当の `createTelemetryTracker()` が導入済み
- Mint UI の主要コンポーネントは実装済み
  - `BoardViewMint.tsx`（盤面、selectableセル、inline error、FlipArrowOverlay）
  - `HandDisplayMint.tsx`（タップ選択、持ち札UI）
  - `GameResultOverlayMint.tsx`
  - `NyanoReaction.tsx` + `nyano_dialogue.ts`（短い台詞システム）

### 2.2 しかし「カード画像」が未完成
- `CardNyano.tsx` / `CardNyanoCompact` の“中心”は **NyanoImage や数値UI**で、NFTのカードアート（token image）が表示されない。
- 要件「カード画像も適切に表示」を満たすには：
  - tokenId → metadata → image URL の解決
  - 画像の読み込み・キャッシュ・失敗時フォールバック
  - UI上の **アスペクト比／トリミング／枠／影** の統一
  が必要。

### 2.3 Mintサイト風の“全体統一”は未着手
- `apps/web/src/styles.css` の body 背景やボタン等は rose 系（Mintとは別系統）
- `App.tsx` のヘッダ/ナビが Mintサイト風ではない
- MintテーマCSS（`src/mint-theme/mint-theme.css`）は主に盤面で import されるのみ

### 2.4 Nyano人格は“入口”のみ
- `apps/web/src/lib/nyano_dialogue.ts` は短文辞書として機能しているが、
  - 親密度 tier
  - 時間帯/曜日
  - “ポンコツエピソード”
  - 禁止事項（嘘・攻撃・マウント）
  - 安全ガード（URL/アドレス出力禁止 等）
  が **ゲーム内の体系**としては未統合。

---

## 3. ゴール定義（Definition of Done）

### 3.1 見た目（スマホゲー級 / 遊戯王級）
- 盤面が“ステージ”として成立し、**静止画でも強い**（スクショ映え）
- カードは「枠」「アート」「数値」「バッジ」が破綻なく表示される
- 重要演出（置く/反転/連鎖/警戒）は短く気持ち良い
- モバイルで **60fps 体感**（重い端末は 30fps でも破綻しない）

### 3.2 体験（任天堂レベルUX）
- 初見が説明を読まずに **30秒以内に1手目**
- 置けない時に **理由が短く分かる**（ユーザーがUIを責めない）
- 観戦者が **「今どっちが勝ちそう？」**に答えられるHUD

### 3.3 キャラクター（Nyano v3）
- Nyanoは一貫して：
  - 優しい・ポンコツ・感情表現が大きい
  - 嘘をつかない（知ったかぶり禁止）
  - 攻撃的にならない（煽り禁止、負けても相手を傷つけない）
  - 「ぴかっ✨」など定番の癖が入る（ただし過剰連打しない）
- UI説明がNyanoの口調に変換されている（冷たいシステム文が消える）

---

## 4. 仕様（上位設計）

# 4.1 テーマ統一（Mintサイト風）

### 4.1.1 デフォルトテーマを Mint にする方針
- デフォルト（クエリなし）で Mintテーマに。
- 互換のために、旧テーマを `?theme=classic` で残す（最低限）。
- Match の `ui` は「レイアウト/演出密度」、theme は「配色・部品体系」に分離するのが安全。

#### 推奨
- `?ui=`: `mint | rpg | classic`（見せ方）
- `?theme=`: `mint | classic`（色・部品）
- 初期値: `ui=mint` かつ `theme=mint`

### 4.1.2 グローバルスタイルの変更点
- `apps/web/src/styles.css`
  - body背景を Mint寄り（#F0FAF5）＋やわらかいグラデに変更
  - `.btn-primary` 等を mint accent（#10B981）基調へ
  - ナビの active 表現も Mintに寄せる（fuchsia→mint）

- `apps/web/src/App.tsx`
  - ヘッダを frosted glass + mint border + かわいい余白へ
  - ロゴ（Nyano）を左上に配置（小さめの NyanoAvatar/アイコン）
  - ナビアイコン/ラベルに余白とヒエラルキー（“遊び”が先に来る）

---

# 4.2 カード画像（NFTアート）を正しく表示する

## 4.2.1 必要機能
1) tokenId → metadata URL を解決  
2) metadata JSON から `image` を抽出（フォーマット差異を吸収）  
3) `ipfs://` / `ar://` / `https://` を正規化し、ブラウザで表示できるURLに変換  
4) キャッシュ（react-query + localStorage か IndexedDB）  
5) 失敗時のフォールバック（NyanoImage / プレースホルダ）  
6) 画像は **object-fit / safe-crop** を統一（縦横比で崩れない）

## 4.2.2 UIとしての“適切な表示”ルール
- **アート枠**（Art Window）を作る
  - 比率: 4:3 または 1:1（Nyano画像の実態に合わせて決定）
  - 角丸: 10〜14px（小サイズは小さく）
- `object-fit: cover` を基本にしつつ、**重要部位が切れやすいなら `object-position` を調整**（例：上寄せ）
- 読み込み中は “スケルトン” + “薄いキラ” で待ち時間を可愛くする
- 盤面の極小カードは **アートを“薄く”**、数値を優先（視認性の担保）

---

# 4.3 遊戯王“級”の盤面表示（ただし Nyano かわいい）

## 4.3.1 レイアウト（Mint Duel Layout）
```
┌─────────────────────────────── Top HUD（ターン/スコア/設定） ───────────────────────────────┐
│  Player A  score      turn      score  Nyano(AI)                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘

┌──────── Left（行動/ヒント） ────────┐   ┌────────────── Center（3D Board Stage） ───────────────┐   ┌──── Right（AI予測/ログ） ────┐
│ ・置く  ・警戒  ・確認              │   │  盤面：holo grid + 3D tilt + light FX                 │   │ ・候補手 Top3（％ or score）    │
│ ・カード拡大/ルール                │   │  セル：puffy/flat, selectable glow                    │   │ ・理由（短文）                   │
│ （通常は折りたたみ）               │   │  カード：art + frame + shadow + flip animation       │   │ （通常は折りたたみ）             │
└───────────────────────────────────┘   └───────────────────────────────────────────────────────┘   └──────────────────────────────┘

┌──────────────────────────── Bottom（Hand：ファン状/横並び + 直接操作） ───────────────────────────┐
│  手札5枚：タップでリフト→セルが光る→タップで置く（ドラッグもオプション）                          │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## 4.3.2 盤面を“ステージ”にする（技術選択）
- **第一段階（推奨）**: CSS 3D + Canvas/SVG 軽FX  
  - 速度が出る、実装が軽い、保守が楽
- **第二段階（拡張）**: WebGL（three.js / pixi）  
  - 最高品質が狙えるが、依存・負荷・調整工数が増える  
  - まずは CSS 3D で土台を作り、必要なら後から差し替える

## 4.3.3 必須演出（短く気持ちよい）
- カード配置: “トンッ” + 小さくバウンド + 影が落ちる
- 反転: 0.45〜0.6秒（減速カーブ）＋ FlipArrowOverlay に同期
- 連鎖: ライン/粒子が走る（派手すぎない）
- 警戒: セルに “ミント色の可愛い注意アイコン” がぷるぷる（reduce motionで停止）

---

# 4.4 Nyano Character v3（しゃべり統合）

## 4.4.1 personality_updated.ts から採る“絶対ルール”
- 嘘をつかない／知ったかしない
- 攻撃的にならない／マウントを取らない
- 失敗を笑い話に変える（“ポンコツ”を武器に）
- 夢：VTuberになりたい
- 好き：ステーキ（健康的大食い）、猫、仲間（Nyano軍団）

## 4.4.2 ゲーム内に落とす“発話の型”
- **UI誘導**（行動を1行で示す）  
  例: 「カード選んで、光ってるマスをタップしてにゃ。ぴかっ✨」
- **結果の納得**（なぜ失敗したか）  
  例: 「そこはもう置けないにゃ…！別の光ってるとこにしよ？ぴかっ✨」
- **AIの説明（短）**  
  例: 「ここは“角守り”にゃ。取られると痛いにゃ…！」
- **可愛い雑談（隙間）**  
  例: 「終わったらステーキ食べたいにゃ…（小声）」

## 4.4.3 親密度（tier）導入（ゲームに最適化）
- localStorage に `nyano.affinity.level`（1〜10）を持つ
- 増減条件（例）
  - 対戦完了 +1（上限10）
  - 連勝/連敗で感情が変わる（tier そのものは急に変えない）
- tier により台詞の距離感を変える（acquaintance→friend→partner→special）

## 4.4.4 LLMは“オプション”で（llmReply_updated.ts の思想を継承）
- クライアントにAPIキーは置かない
- `VITE_NYANO_LLM_ENDPOINT` がある時だけ、サーバ経由で生成
- ガード（URL/0xアドレス/過剰な@/ハッシュタグ等）は llmReply の方針を移植
- LLMが落ちてもテンプレ台詞にフォールバック（ゲームが止まらない）

---

## 5. 実装アーキテクチャ（追加/変更するモジュール）

### 5.1 Nyano人格（テンプレ＋選択ロジック）
- 追加案:
  - `apps/web/src/lib/nyano/persona/`
    - `core.ts`（コアアイデンティティ抜粋）
    - `tiers.ts`（親密度と口調の差）
    - `lines.ts`（シーン別台詞辞書：短文）
    - `select.ts`（seed/状況から台詞選択）
  - 既存 `nyano_dialogue.ts` は上記に吸収 or ラッパー化

### 5.2 NFTメタデータ/画像
- 追加案:
  - `apps/web/src/lib/nyano/metadata.ts`
    - tokenId→metadata url（GameIndex metadata.base を使う）
    - image URL 正規化（ipfs, arweave）
  - `apps/web/src/lib/nyano/hooks_metadata.ts`
    - `useNyanoTokenMetadata(tokenId)` / `useNyanoTokenImages(tokenIds[])`
  - `apps/web/src/components/NyanoCardArt.tsx`
    - ローディング/フォールバック含めた表示

### 5.3 Duel（遊戯王級プレゼン）UI
- 追加案:
  - `apps/web/src/components/DuelStageMint.tsx`（背景/パース/パネル配置）
  - `apps/web/src/components/BoardViewMintDuel.tsx`（BoardViewMint を内包し、3D/FX/HUDを足す）
  - `apps/web/src/components/CardNyanoDuelSkin.tsx`（カードフレーム刷新：アート＋数値）
- CSS/Assets:
  - `apps/web/src/mint-theme/mint-duel.css`（新規）
  - `apps/web/public/ui/duel/*`（背景テクスチャ、フレーム、アイコン）

### 5.4 テーマ統一（全ページ）
- `apps/web/src/styles.css` の既定をmint化
- `apps/web/src/components/*` のボタン等を mint tokens に寄せる
- 可能なら `ui` と `theme` を分離する `useTheme()` を導入

---

# 6. ロードマップ（段階的に“崩さず”上げる）

## Phase 0: 土台（Theme/Metadata/Component境界）
**目的**: 後戻りしないための基礎整備。  
- デフォルトテーマをmintへ寄せる（ただし classic を残す）
- tokenId→画像表示の“配管”を作る（まずは1枚でも表示できる状態）

## Phase 1: カードスキン刷新（Duel Card）
**目的**: 「カード画像も適切に表示」を満たす。  
- CardNyanoCompact の中心にアート表示
- 盤面/手札/一覧（Decks/Nyano）で崩れない

## Phase 2: 盤面をステージ化（Duel Board）
**目的**: 「遊戯王級」の“見た目の格”を盤面で出す。  
- CSS 3D の tilt + holo grid background
- 置く/反転/連鎖の演出を段階導入

## Phase 3: HUD & パネル（必要情報をゲームらしく整理）
**目的**: 観戦でも状況が分かる（Nintendo UX）  
- Top HUD（ターン/スコア/状態）
- Right panel（AI候補/理由）※折りたたみ
- Left panel（行動/ヒント）※折りたたみ

## Phase 4: Nyano Character v3 統合
**目的**: UI説明がNyanoの“しゃべり”になる。  
- 親密度tier + 時間帯
- “ポンコツ”雑談の挿入ポイント
- LLMオプション（サーバ経由）を後から追加可能に

## Phase 5: 仕上げ（性能・アクセシビリティ・リプレイ/配信）
- 画像最適化（webp, srcset, preload）
- reduced motion / mute / haptics
- Replay/Overlay にも Duel/Mint を反映（必要なら）

---

# 7. TODO（実装単位で分割 / 完全版まで）

表記:
- **P**: Priority（P0=最優先）
- **Where**: 触るファイル/場所
- **AC**: 受け入れ条件（完成判定）
- **Deps**: 依存

---

## 7.0 基盤（P0）

### [P0-001] Theme の既定を mint 寄りに変更（全ページ）
- Where: `apps/web/src/styles.css`, `apps/web/src/App.tsx`
- 内容:
  - body 背景/リンク/ボタン/ナビ active を mint 系に置換
  - “Nyano Triad League 🐾” 周りも mint accent に統一
- AC:
  - `/?theme=`無しで mint 系配色に見える
  - 主要ページ（Home/Arena/Decks/Match/Replay）が崩れない
- Deps: なし

### [P0-002] theme 切替（classic を残す）
- Where: `apps/web/src/lib/theme.ts`（新規）, `main.tsx` or `AppLayout`
- 内容:
  - `?theme=classic` のときだけ旧配色へ
  - それ以外は mint
- AC:
  - 既存のスクショ/共有URLが壊れない
- Deps: P0-001

### [P0-010] tokenId → metadata → image URL 解決の配管
- Where: `apps/web/src/lib/nyano/metadata.ts`（新規）
- 内容:
  - `fetchGameIndex()` の `metadata.base/ext` を利用して metadata URL を組み立て
  - metadata JSON を取得し `image` を抽出
  - `ipfs://` 等を `https://` に正規化
- AC:
  - 任意 tokenId の画像URLが得られる（consoleでOK）
  - 失敗しても例外で落ちない
- Deps: `useNyanoGameIndex`（既存）

### [P0-011] NyanoCardArt コンポーネント（ロード/失敗フォールバック込み）
- Where: `apps/web/src/components/NyanoCardArt.tsx`（新規）
- 内容:
  - `tokenId` を受け、`useNyanoTokenMetadata` で画像表示
  - skeleton/placeholder/エラー表示
- AC:
  - 画像が出る・出ないどちらでもUIが破綻しない
- Deps: P0-010

### [P0-012] CardNyano / CardNyanoCompact にアートを組み込み（最小）
- Where: `apps/web/src/components/CardNyano.tsx`
- 内容:
  - Full/Compact の中央に `NyanoCardArt`
  - 既存の edge 数値・janken 表示は維持
- AC:
  - Match（mint/rpg/classic）でカード画像が表示される
  - 画像未取得時も崩れない
- Deps: P0-011

---

## 7.1 Duel Card Skin（P1）

### [P1-100] “遊戯王級”カードフレームの設計（アート枠/バッジ/影）
- Where: `apps/web/src/components/CardNyano.tsx` または新規 `CardNyanoDuelSkin.tsx`
- 内容:
  - アート枠、情報枠、数値の配置を再設計
  - 小サイズ（盤面）と中サイズ（手札）で視認性を最適化
- AC:
  - スマホで数値が読める
  - アートが歪まない（aspect固定）
- Deps: P0-012

### [P1-110] Holo/Foil 演出（控えめ・かわいい）
- Where: `apps/web/src/mint-theme/mint-duel.css`（新規）
- 内容:
  - `mix-blend-mode` と gradient overlay で“きら”を表現
  - reduced-motion で停止
- AC:
  - 低スペ端末でも破綻しない（FPS低下が目立たない）
- Deps: P1-100

### [P1-120] Card Zoom（長押し/右クリックで拡大）
- Where: `apps/web/src/components/CardZoomModal.tsx`（新規） + `HandDisplayMint.tsx` 等
- 内容:
  - モバイルは長押し、PCは右クリック/ホバーで拡大
- AC:
  - 対戦中でも邪魔にならない
- Deps: P1-100

### [P1-130] Decks/Nyano/CardBrowser でも画像が出るように
- Where: `Decks.tsx`, `Nyano.tsx`, `CardBrowser.tsx`, `CardMini.tsx`
- 内容:
  - 一覧は遅延読み込み（IntersectionObserver）で負荷を抑える
- AC:
  - 一覧が重くならない
- Deps: P0-011

---

## 7.2 Duel Board（P2）

### [P2-200] DuelStageMint（3Dパース + 背景）
- Where: `apps/web/src/components/DuelStageMint.tsx`（新規）
- 内容:
  - 中央ボードを `perspective + rotateX` で軽く傾ける
  - 背景に pastel holo grid（CSS or Canvas）
- AC:
  - “盤面がステージ”に見える
  - reduced motion で tilt/アニメ停止
- Deps: Mint theme（既存）

### [P2-210] BoardViewMint を DuelStage に統合（壊さず差し替え）
- Where: `Match.tsx`（isMintブロック）  
- 内容:
  - 既存 `BoardViewMint` を内包して見た目だけ差し替え
- AC:
  - 入力ロジックは現状維持で、見た目だけ上がる
- Deps: P2-200

### [P2-220] 置く/反転/連鎖FXの同期（FlipArrowOverlay拡張）
- Where: `FlipArrowOverlay.tsx`, `BoardViewMint.tsx`
- 内容:
  - 線＋粒子（SVG）を追加
  - 反転アニメと同時に走る
- AC:
  - 何が原因で反転したか一目で分かる
- Deps: 既存 flipTraces

---

## 7.3 HUD・パネル（P3）

### [P3-300] Top HUD（ターン/スコア/状態）をDuel風に
- Where: `Match.tsx`（mint表示） or 新規 `BattleHudMint.tsx`
- 内容:
  - 勝敗/優勢/ターンが一瞬で分かる
  - “今やること” 1行を常時表示（Nyano口調でも可）
- AC:
  - 観戦者が状況を説明できる
- Deps: なし

### [P3-310] Right Panel（AI候補手/理由）※折りたたみ
- Where: 新規 `AiInsightPanel.tsx`
- 内容:
  - 既存AIを拡張して top候補（score）を返す（後述）
  - “カード予測”風に、候補のカードプレビューとセルを表示
- AC:
  - 情報過多にならず、必要時だけ見られる
- Deps: AI拡張（P3-311）

### [P3-311] AI を“候補リスト”出力できるよう拡張
- Where: `apps/web/src/lib/ai/nyano_ai.ts`
- 内容:
  - `computeCandidateMoves()` のような関数で候補を返す（上位3〜5）
  - 既存 `pickAiMove()` は最終選択に使う（互換維持）
- AC:
  - AI挙動は変わらない（難易度別）
- Deps: なし

### [P3-320] Left Panel（行動/ヒント）※折りたたみ
- Where: 新規 `ActionPanel.tsx`
- 内容:
  - “置く/警戒/確認” の手順が視覚的に分かる
  - 初心者だけ開く（progressive disclosure）
- AC:
  - 初見が迷わない
- Deps: なし

---

## 7.4 Nyano Character v3 統合（P4）

### [P4-400] personality_updated.ts を“ゲーム向けに移植”する（依存整理）
- Where（推奨）:
  - `packages/nyano-personality/`（新規パッケージ）  
    or  
  - `apps/web/src/lib/nyano/persona/`（直置き）
- 内容:
  - コア設定（CORE_IDENTITY / CORE_BELIEFS / neverDo）を抜粋してゲームに必要な形に整形
- AC:
  - ビルドが通る（json import構文などをVite対応にする）
- Deps: なし

### [P4-410] nyano_dialogue.ts を v3 の口調へ更新（短文の質を上げる）
- Where: `apps/web/src/lib/nyano_dialogue.ts`
- 内容:
  - 既存 ReactionKind / AiReasonCode の辞書を v3 口調へ
  - “煽り”に見える言い回しを排除
  - “ぴかっ✨”を適切に混ぜる
- AC:
  - プレイしていてNyanoが“同一人物”に見える
- Deps: P4-400

### [P4-420] 親密度 tier と時間帯を導入
- Where: `apps/web/src/lib/nyano/persona/select.ts`（新規）
- 内容:
  - `localStorage` に affinity/tier
  - `match complete` で自然に上がる
  - timeSlot（朝/昼/夜）で挨拶が変わる
- AC:
  - 連戦で台詞が単調にならない
- Deps: P4-410

### [P4-430] Nyano発話を “UIの誘導文” と統合
- Where: `Match.tsx`（action prompt / inline error）
- 内容:
  - 画面の冷たい文言を Nyano の台詞へ置換
  - ただし **情報は削らない**（Nyano口調で明確に）
- AC:
  - 初心者が理解しやすい
- Deps: P4-420

### [P4-440] LLMオプション（llmReply思想の移植）
- Where: `apps/web/src/lib/nyano/llm/`（新規）
- 内容:
  - `VITE_NYANO_LLM_ENDPOINT` がある時のみ使用
  - URL/0x/@過剰 等をガード
  - 失敗時はテンプレへフォールバック
- AC:
  - LLM無しで完全に動く（必須にしない）
- Deps: P4-400

---

## 7.5 仕上げ（P5）

### [P5-500] 画像最適化（webp, srcset, preload）
- Where: `NyanoCardArt.tsx`, `index.html`
- AC:
  - 初回対戦開始が重くならない
- Deps: P0-011

### [P5-510] モバイル触感（haptics / sound / mute）
- Where: `apps/web/src/lib/feedback/*`（新規）
- AC:
  - 設定で切れる
  - OS設定（reduced motion等）に従う
- Deps: なし

### [P5-520] Replay/Overlay に Duel 表示を広げる（必要なら）
- Where: `Replay.tsx`, `Overlay.tsx`
- AC:
  - “見せる用途”でも統一感が出る
- Deps: DuelStage / CardSkin 完成後

---

# 8. アセット制作パイプライン（画像生成/API/Adobe）

## 8.1 作るもの（最低限）
- 盤面背景（holo grid, pastel）
- カードフレーム（外枠・内枠・バッジ）
- UIパネル（frosted glass + border）
- アイコン（警戒/連鎖/勝敗/設定）

## 8.2 生成→仕上げ（例）
1) nanobanana API 等で「パステル・ミント・ホログラム風のボード背景」を複数案生成  
2) Adobe（Photoshop/Illustrator）で：
   - ノイズ/バンディング除去
   - 角丸/枠/影の統一
   - 透過png素材化
3) 書き出し:
   - UI: `webp`（透過が必要なら png）
   - 2x/3x を用意（retina）
4) 配置:
   - `apps/web/public/ui/duel/backgrounds/*`
   - `apps/web/public/ui/duel/frames/*`
   - `apps/web/public/ui/duel/icons/*`

## 8.3 命名規則（おすすめ）
- `bg_duel_grid_mint_v01.webp`
- `frame_card_common_v01.webp`
- `icon_warning_mint_v01.webp`

---

# 9. ファイル配置の提案（添付 ts をどこに置くか）

## 9.1 personality_updated.ts
- そのままは依存が多いので、**“ゲーム向けサブセット”を切り出す**のが安全。
- 推奨:
  - `packages/nyano-personality/src/persona.ts`（抜粋）
  - `packages/nyano-personality/src/replies.ts`（短文テンプレ）
  - `apps/web` から import

## 9.2 llmReply_updated.ts
- クライアント直呼びは避ける（キー漏洩・安全性）
- 推奨:
  - `apps/web/src/lib/nyano/llm/client.ts`（HTTPでサーバに投げるだけ）
  - サーバ側（別repoでも可）で openai-compatible endpoint を持つ

---

## 10. まず最初に着手する順（迷わないための“最短経路”）
1) **P0-010〜012**（カード画像が出る配管）  
2) **P2-200〜210**（盤面がステージ化）  
3) **P0-001〜002**（全体のmint統一）  
4) **P4-410〜430**（Nyano台詞をv3へ）  
5) 余裕が出たら **P3-310**（AI予測パネル）  

---

以上。
