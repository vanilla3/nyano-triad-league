# Nyano Triad League — 遊戯王“級”ハイクオリティカードゲーム化（Cute Mint）ロードマップ＆TODO 仕様書 v1

作成日: 2026-02-10  
対象: `vanilla3/nyano-triad-league`（添付zip: nyano-triad-league-main (8) 相当）  
目的: **デフォルト画面からハイクオリティ**（スマホゲー級）で、**NFT画像が常に表示**される“カードゲームらしいプレゼン”へ引き上げる。  
テイスト: 遊戯王の「演出・情報提示のリッチさ」を参考にしつつ、**世界観は Nyano のミントサイト寄りの“かわいい”**に統一する（コピーではなく、手触りの抽出）。

---

## 1. ゴール定義（“遊戯王級”を要件に翻訳）

「遊戯王っぽい」＝雰囲気コピーではなく、**プレゼン品質**の目標とする。

### 1.1 画面品質（Look）
- 盤面が「ただの3x3グリッド」ではなく、**“ステージ”として成立**している（レイヤー・奥行き・光）。
- カードが「数値の箱」ではなく、**アートが主役**で、ステータスは読みやすく添え物。
- 余白・影・グロー・フォントが揃い、**一貫したUIシステム**になっている。

### 1.2 触り心地（Feel）
- 選択 → 配置 → 反転（フリップ）までが、**短いフィードバックの連続**で気持ちよい。
- 何が起きたかが **0.5秒以内に理解できる**（矢印/ライン/軽いテキスト）。
- モバイルでも **誤タップしにくく、戻せる**（Undo/Confirm/プレビュー）。

### 1.3 “デフォで高品質”の意味
- `/match` に直接入っても **mint UI が標準**（`?ui=` を付けなくても良い）。
- 主要画面（Home / Decks / Match / Replay）で **NFT画像が自然に表示**される。
- 画像/効果音/アニメが **“軽いのにリッチ”**（重さで勝たない）。

---

## 2. 現状実装（zip(8)）で既にできていること

### 2.1 Mint UI 基盤
- `mint-theme`（Tailwind拡張 + CSSユーティリティ）導入済み
- `DuelStageMint`（3D傾き + holo grid 背景）あり
- `BoardViewMint`（行動プロンプト/セル状態/インラインエラー/矢印オーバーレイ）あり
- `BattleHudMint`（フロストガラスHUD）あり
- `MatchDrawerMint`（右ドロワー/モバイルボトムシート）あり
- SFX（WebAudio）導入済み

### 2.2 NFT画像のための“仕込み”はある
- `NyanoCardArt` + `useNyanoTokenMetadata` + `metadata.ts` が存在
- **ただし** 現状 `GameIndex.metadata` に `imageBaseUrl` が入っていないため、設定が無いと画像URLが解決されず、フォールバック（汎用Nyano画像）になりやすい。

---

## 3. “遊戯王級”に足りない主要ギャップ（優先順）

### Gap A: NFT画像がデフォルトで出ない（設定が不足）
- `metadata.ts` は `VITE_NYANO_METADATA_BASE` または `GameIndex.metadata.imageBaseUrl` を期待
- `public/game/index.v1.json` の `metadata` に現状 `imageBaseUrl` が無い
- 結果: **NFTの絵が主役にならない**（カードが弱い）

### Gap B: カードの見せ方が “情報箱” 寄り（アートが目立たない）
- `CardNyanoCompact` が **水印（薄いサムネ）**中心で、絵が主役になっていない
- `HandDisplayMint` も `CardMini` → `CardNyanoCompact` のため、手札でもアートが弱い

### Gap C: Mint対戦UIが“完全置換”になっていない
- mint時でも Warning Mark が `<select>` UI
- Commit/Undo も mint専用の押し心地・導線になっていない
- “スマホゲー級”にするなら **盤面直操作に寄せて**統一する必要がある

### Gap D: デフォルトUIが mint になりきっていない（入口で損）
- Homeからは `ui=mint` で入れるが、直URL `/match` だと mint にならないケースが残る
- 「デフォで高品質」を狙うなら **URLパラメータを卒業**して標準化したい

### Gap E: ローディング/スケルトンの整合が甘い
- `Skeleton` が参照する `skeleton-base` は `index.css` にあるが、実際には `styles.css` を import しているため、環境によって見た目が崩れる可能性がある

### Gap F: “遊戯王級”の常套句（大きなカードプレビュー）が無い
- 遊戯王系UIでは、選択中/フォーカス中のカードを **大きく見せる**のが定石
- Nyanoでも、手札/盤面に触れた瞬間に **右上（or ドロワー）へ大プレビュー**を出すと一気に“カードゲーム感”が上がる

---

## 4. NFT画像表示仕様（確定事項）

ユーザー指定の画像ベース（ID: 1〜10000）を **最優先で実装**する。  
URLはここでは“パターン”として扱い、コード内では `<built-in function id>` 置換で生成する。

```txt
# 推奨パターン（例）
https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/{id}.png
```

> 備考: `arweave.net` 版でもアクセス可能な可能性がありますが、まずは上記の“提示されたパターン”を一次ソースとして採用し、失敗時のフォールバック（別ゲートウェイ）を Phase 0 で決めます。

### 4.1 期待する挙動（Acceptance）
- tokenId=1, 9999, 10000 の画像が表示できる
- 画像取得に失敗した場合でも UI が破綻しない（枠/プレースホルダ/再試行）
- CardBrowser 等で大量に並べても破綻しない（遅延読込＋段階表示）

---

## 5. UI仕様（遊戯王級の“見せ方”を Nyano に翻訳）

### 5.1 カード（最重要）— “絵が主役、数字は添え物”
**新: `CardNyanoDuel`（置換コンポーネント）**を追加し、`CardNyanoCompact` / `CardMini` の位置づけを見直す。

- **構造（レイヤー）**
  1) Card Frame（かわいい金縁/エメラルド）  
  2) NFT Art（主役、できれば全面 or 上面に大きく）  
  3) Glass Overlay（数字の可読性確保のための薄いグラデ）  
  4) Edge Numbers（上右下左）  
  5) Trait / Janken / TokenId（必要最小限）  
  6) Shine / Foil（常時は弱く、選択時にだけ強く）

- **サイズ定義（最低3段階）**
  - `board`（盤面用）: 視認性最優先、数字を大きめ
  - `hand`（手札用）: 触れる大きさ＋選択でリフト
  - `preview`（大プレビュー用）: アートが完全に見える、テキストも入る

- **デザイン方向性（遊戯王から借りる“機能”）**
  - “カードの状態（使用済み/選択/反転/警戒）”を **枠＋光＋揺れ**で示す
  - “強さの印象”を **輝度/粒子**で示す（数値だけにしない）

### 5.2 盤面（ステージ）— “置く場所に意味がある”見せ方
- `DuelStageMint` を拡張し、盤面を「テーブル/ステージ」化
- セルは現状 square だが、以下の2案を Phase 1 で決める  
  - **案A（安全）**: 盤面は square のまま、カードを“立体的に浮かせる”  
  - **案B（遊戯王寄り）**: セルを縦長（ゾーン）化し、カードを縦長枠にする

### 5.3 大カードプレビュー（“カードゲーム感”のスイッチ）
- 手札選択中は必ず `preview` を HUD 側に表示
- 盤面のカードに触れたら、そのカードも preview（観戦者理解が上がる）
- モバイルでは preview を **ボトムシート**で出す（ドロワー再利用）

### 5.4 デフォルト画面は “mint + 高品質”
- `/match` の標準UIを mint（`ui=mint` を暗黙デフォルト）
- ただし開発・検証用に `?ui=classic|rpg` は残す

---

## 6. ロードマップ（長期 / “完全版”まで）

> Phase 0〜2 で “見た目の中核（カード画像＋標準mint化＋大プレビュー）” を固める。  
> それ以降は演出・UX・最適化で“遊戯王級”の密度に寄せる。

### Phase 0: NFT画像を必ず出す（最優先・最短）
- 画像ベースの実装を確定（index or env or code fallback）
- 3トークンで表示確認（1/9999/10000）
- 失敗時フォールバック（別ゲートウェイ or placeholder）

### Phase 1: カードを作り直す（“絵が主役”）
- `CardNyanoDuel` 実装
- 盤面/手札/カード一覧で統一利用
- 大プレビュー追加

### Phase 2: 盤面をステージ化（遊戯王“級”の奥行き）
- ゾーンフレーム/3D/パララックス
- 反転の因果（矢印/ライン）をより“気持ち良い”見せ方へ

### Phase 3: Mint対戦UIの完全統一（select廃止）
- Warning mark を盤面直操作＋モード化
- Commit/Undo を mintボタン＆導線に統合
- 触感（haptic）・SE・アニメの一貫性

### Phase 4: 演出の密度を上げる（軽量にリッチ）
- Foil/shine 強化（選択時のみ）
- Victory/Defeat シーン（Nyano表情＋短い演出）
- AIの意図表示（短いバッジ＋必要なら詳細はドロワー）

### Phase 5: サイト全体を “デフォで高品質” に統一
- Decks / Replay / Stream のカード表示を統一
- CardBrowser を仮想化（大量表示でも軽い）
- “NFT未所持でも遊べる”導線の洗練（最短タップ数）

### Phase 6: QA・計測・改善ループ
- Playwright E2E（画像表示/基本操作）
- 低速回線/低メモリ端末での劣化確認
- 失敗納得テスト（置けない理由の提示など）

---

## 7. TODO（完全版まで：作業単位 / Where / AC / Deps）

### 7.0 Data / NFT画像（必須）

- [ ] **IMG-0001: 画像ベースURLパターンの採用方針を確定**
  - Where: `docs/`（この仕様書の横に `docs/assets/NFT_IMAGE_BASE.md` 新規）
  - AC: “一次URL” と “フォールバックURL” が決まる（両方 `{id}.png` 形式）
  - Deps: なし

- [ ] **IMG-0002: GameIndex に `metadata.imageBaseUrl` を追加**
  - Where: `apps/web/public/game/index.v1.json`
  - 例: `"imageBaseUrl": "…/{id}.png"`
  - AC: ローカル起動で `NyanoCardArt` が tokenId→画像URLを解決できる
  - Deps: IMG-0001

- [ ] **IMG-0003: index生成スクリプトが `imageBaseUrl` を保持する**
  - Where: `scripts/build_game_index_v1.mjs`
  - 方針:
    - `const IMAGE_BASE = process.env.NYANO_IMAGE_BASE_URL_PATTERN ?? "<default>";`
    - 出力jsonに `metadata.imageBaseUrl = IMAGE_BASE`
  - AC: script再実行後も index に `imageBaseUrl` が残る
  - Deps: IMG-0002

- [ ] **IMG-0004: 失敗時フォールバック（別ゲートウェイ）**
  - Where: `apps/web/src/components/NyanoCardArt.tsx`（TokenImage）
  - 仕様:
    - onError時、同じ tokenId から fallback URL を組み立てて一度だけ再試行
    - それもダメなら `NyanoImage` に落とす
  - AC: 一部のゲートウェイが不調でも画像が出る確率が上がる
  - Deps: IMG-0001

- [ ] **IMG-0005: 大量表示ページの画像負荷対策（最低限）**
  - Where: `apps/web/src/components/CardBrowser.tsx`
  - 仕様:
    - `loading="lazy"` を徹底
    - 50件表示でも破綻しない（スクロールで順次ロード）
  - AC: スクロールがカクつかない
  - Deps: IMG-0002

---

### 7.1 カードUI（“絵が主役”へ）

- [ ] **CARD-0101: `CardNyanoDuel` 新規実装（board/hand/previewサイズ対応）**
  - Where: `apps/web/src/components/CardNyanoDuel.tsx`（新規）
  - AC:
    - NFT画像が“主役”で見える
    - Edge数字が読みやすい（背景ガラス/縁取り）
    - owner/状態（used/selected/flipped/placed）が一目で分かる
  - Deps: IMG-0002

- [ ] **CARD-0102: 盤面のカードを `CardNyanoDuel` に置換**
  - Where: `BoardViewMint.tsx`（カード描画部）
  - AC: 盤面上でNFT画像が常に見える
  - Deps: CARD-0101

- [ ] **CARD-0103: 手札のカードを `CardNyanoDuel` に置換**
  - Where: `HandDisplayMint.tsx` + `CardMini.tsx`
  - AC: 手札でNFT画像がはっきり見える
  - Deps: CARD-0101

- [ ] **CARD-0104: “大カードプレビュー”追加（右上 / ドロワー）**
  - Where: `Match.tsx` + `components/CardPreviewMint.tsx`（新規）
  - 仕様:
    - 手札選択中は必ず表示
    - 盤面ホバー/タップでも表示（観戦者理解UP）
  - AC: 選択中のカードが常に大きく見える
  - Deps: CARD-0101, MatchDrawerMint

- [ ] **CARD-0105: カード枠素材（オリジナル）を作る**
  - Where: `apps/web/public/ui/card-frame/*.png`（追加）
  - 生成案:
    - nanobanana APIでベース生成 → Adobeで整形（角丸/透過/影）
  - AC: かわいいmint調のフレームが揃う（通常/レア/選択）
  - Deps: CARD-0101（コンポーネント側の枠差し込み口）

---

### 7.2 盤面ステージ（遊戯王“級”の奥行き）

- [ ] **STAGE-0201: `DuelStageMint` を“ステージレイヤー”化**
  - Where: `mint-theme.css` + `DuelStageMint.tsx`
  - 仕様:
    - 背景に柔らかいパターン（mintサイト寄り）
    - 盤面周囲に弱いグロー
    - `prefers-reduced-motion` で静止
  - AC: 盤面が「置き場」ではなく「舞台」になる
  - Deps: なし

- [ ] **STAGE-0202: ゾーンフレーム強化（セルの存在感）**
  - Where: `mint-theme.css`（`.mint-cell`周辺）
  - AC: 空セルでも“置ける場所”として気持ち良い
  - Deps: STAGE-0201

- [ ] **STAGE-0203: 反転演出のリッチ化（軽量）**
  - Where: `FlipArrowOverlay.tsx` / `mint-theme.css`
  - 仕様:
    - 矢印ラインの太さ・発光・残像
    - 連鎖時に色を変える
  - AC: 何が起きたかが見ただけで分かる
  - Deps: 現状のflipTraces出力

- [ ] **STAGE-0204: 案A/Bのレイアウト意思決定**
  - Where: `docs/ui/BOARD_LAYOUT_DECISION.md`（新規）
  - AC: “縦長ゾーン”に寄せるかの決定が完了
  - Deps: CARD-0101（カード比率が見えてから）

---

### 7.3 デフォルトを高品質に（URLパラメータ卒業）

- [ ] **DEF-0301: `/match` の標準UIを mint にする**
  - Where: `apps/web/src/pages/Match.tsx`
  - 仕様:
    - `ui` が未指定なら `mint` とみなす
    - `?ui=rpg|classic` は明示時のみ
  - AC: 直アクセスでも高品質UI
  - Deps: なし

- [ ] **DEF-0302: “ロード直後からNFT画像が出る”を優先**
  - Where: `metadata.ts` / `NyanoCardArt.tsx`
  - 仕様案:
    - `getMetadataConfig()` に **デフォルトbase** を用意（index読込前でもURL生成できる）
  - AC: 画像の“出遅れ”が減る
  - Deps: IMG-0001

- [ ] **DEF-0303: SkeletonのCSS整合を解消**
  - Where:
    - ① `styles.css` に `skeleton-base` を移植 もしくは
    - ② `main.tsx` で `index.css` も import
  - AC: ローディングが常に綺麗
  - Deps: なし

---

### 7.4 Mint対戦UIの完全統合（select廃止）

- [ ] **UX-0401: Warning Mark を “盤面モード” にする**
  - Where: `Match.tsx` + `BoardViewMint.tsx`
  - 仕様:
    - `warningMode` ボタンで切替
    - モード中は置けるセルが黄色く呼吸
    - タップで警戒セット、再タップで解除
  - AC: `<select>` が不要になる
  - Deps: BoardViewMint（warning mode classは既にある）

- [ ] **UX-0402: Commit/Undo を mintボタン化＋固定配置**
  - Where: `Match.tsx` + `mint-theme.css`
  - AC: 親指で押しやすい位置、誤操作しにくい
  - Deps: UX-0401

- [ ] **UX-0403: モバイル“確定フロー”の完成**
  - Where: `HandDisplayMint.tsx` / `Match.tsx`
  - 仕様:
    - タップ→プレビュー→置く（2ステップ）
    - 置いた後に1秒以内なら “やり直し” が分かる
  - AC: 誤タップが減る
  - Deps: CARD-0104（プレビュー）

---

### 7.5 仕上げ（演出・パフォーマンス・QA）

- [ ] **POL-0501: 画像読み込み最適化（prefetch戦略）**
  - Where: `Match.tsx`
  - 仕様:
    - 手札5枚の画像は優先度高
    - 盤面カードは通常
  - AC: 初動の“絵が出る”が速い
  - Deps: IMG-0002

- [ ] **POL-0502: CardBrowser を仮想化（react-window等）**
  - Where: `CardBrowser.tsx`
  - AC: 10000件スケールでも体感が落ちない
  - Deps: IMG-0005

- [ ] **QA-0601: Playwright で “画像が出る” E2E**
  - Where: `apps/web/e2e/*`
  - AC: tokenId=1 のカード画像が表示されることを自動テスト
  - Deps: IMG-0002

---

## 8. すぐ着手すべき “最短3手”（推奨）

1) **IMG-0002**（indexに imageBaseUrl）  
2) **CARD-0101/0102/0103**（カードを“絵が主役”に置換）  
3) **DEF-0301**（/match デフォ mint）

この3つだけで、体感は一気に「カードゲームっぽい」へ跳ねます。  
演出は Phase 2 以降で積めば十分に“遊戯王級の密度”まで持っていけます（重さで殴らない）。

---

以上。
