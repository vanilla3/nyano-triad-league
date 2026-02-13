# Nyano Triad League — UI/UXアップデート現状整理 ＋ ロードマップ ＋ 詳細TODO（外部アップデート反映 / v1）

作成日: 2026-02-10  
確認対象: 添付 `nyano-triad-league-main (8).zip`（ローカル解析）  
対象範囲: **ユーザーが触れる部分（UI/UX）** 全般  
主眼:  
- 「遊戯王“級”のプレゼン品質」＝カード/盤面/演出/HUDの完成度を一段上げる  
- 「デフォでハイクオリティ」＝どの入口から入っても mint風・高品質・迷わない  
- 「NFT画像をデフォで表示」＝環境変数なしでもカードに画像が出る状態を作る  

---

## 0. まず結論（不足点のトップ3）

### 0.1 NFT画像が“デフォで”出る保証がまだ弱い
- `NyanoCardArt` は実装済み（`apps/web/src/components/NyanoCardArt.tsx`）  
- しかし、画像URLの解決は **`VITE_NYANO_METADATA_BASE` または `GameIndex.metadata.imageBaseUrl` に依存**（`apps/web/src/lib/nyano/metadata.ts` / `useNyanoTokenMetadata.ts`）  
- 現在の `apps/web/public/game/index.v1.json` の `metadata` には **`imageBaseUrl` がない**（`mode: local` 等）  
→ **環境によっては“絵が出ない”が起き得る**（＝デフォ高品質の阻害要因）

### 0.2 /match のMint UIが“完全にデフォルト”ではない
- Home の Quick Play は `ui=mint` を付けている（`apps/web/src/pages/Home.tsx`）  
- 一方、Arena/Decks の `/match` リンクは `ui=mint` が付いていない箇所がある（`apps/web/src/pages/Arena.tsx`, `Decks.tsx`）  
→ 入口によって体験品質が揺れる（“デフォでハイクオリティ”に反する）

### 0.3 盤面上のカードが “NFTアート主役” になっていない
- 盤面（Mint）では `CardNyanoCompact` が主で、アートは **透かし**（`CardNyanoCompact` の `opacity 0.12`）  
→ “カードゲーム感” が伸びしろ  
→ **Yu-Gi-Oh級**にするなら「盤面でも絵が主役」「数字は読みやすく添える」が必須

---

## 1. 現在の実装状況（UIに関わるところだけ）

### 1.1 グローバル
- `AppLayout` で `data-theme` をセットし、デフォルト `mint`（`apps/web/src/App.tsx`）
- Tailwind 拡張は mint/rpg 両方あり（`apps/web/tailwind.config.ts`）
- `styles.css` を main で読み込み（`apps/web/src/main.tsx`）
  - `index.css` が存在するが現状 import されていない（＝未使用の可能性が高い）
  - `Skeleton` が参照する `.skeleton-base` は `index.css` にあるため、**見た目が欠ける恐れ**（要修正）

### 1.2 Home
- Quick Play のURLに `ui=mint` が付いている  
- tutorial reset 等もある（良い）

### 1.3 Arena / Decks
- Quick Play やデッキ対戦リンクに `ui=mint` が付いていない箇所がある  
→ “入口差” が起きる

### 1.4 Match（Mint UI）
- Mint UI部品は既に揃っている：  
  - `DuelStageMint`, `BoardViewMint`, `HandDisplayMint`, `BattleHudMint`, `MatchDrawerMint`, `GameResultOverlayMint`, `FlipArrowOverlay` 等  
- Nintendo UX要素（行動プロンプト/インラインエラー/因果可視化/密度切替/Telemetry/SFX）が入っている  
→ 「UIの骨格」は強い。次は **“見た目の格” と “アートの主役化”**。

### 1.5 NFT画像表示
- `NyanoCardArt` は `useNyanoTokenMetadata` を通して画像URLを解決  
- 画像の“ベースURL/パターン”が未設定だと、フォールバック（NyanoImage）になる  
→ 「デフォでNFT画像表示」を仕様として固定する必要がある

---

## 2. ゴール定義（“遊戯王級”を実装可能な要件に落とす）

### 2.1 “Yu-Gi-Oh級プレゼン” の要件（Nyano Mint味）
- **盤面が“舞台”**：奥行き、光、影、素材感（ガラス/ホロ/ぷっくり）
- **カードが“主役”**：NFTアートが視認できる（盤面・手札・一覧）
- **情報はHUDで制御**：スコア/手番/優勢/警戒/直近の手が一目
- **演出が因果を伝える**：フリップ理由・連鎖が瞬間理解できる
- **スマホ前提の触り心地**：タップ/スワイプ中心で誤操作しない

### 2.2 “デフォでハイクオリティ” の要件
- `ui` の指定なしでも、基本はMint UIが出る（または内部リンクが必ず `ui=mint`）
- NFT画像の解決が **env無しでも成立**（indexに埋め込む等）
- ローディング/エラーも“綺麗”（Skeleton/EmptyState が整っている）

---

# 3. ロードマップ（UIアップデート専用）

> いま強い骨格があるので、**“入口の揺れ” と “NFTアート”** を最優先で固めると、一気に見栄えが上がります。

## Phase 0: デフォ品質の固定（入口統一 + NFT画像表示の保証）
目的: どこから入っても mint高品質、カードに画像が出る

## Phase 1: カードを“主役”にする（Duel Card Skin v2）
目的: 盤面/手札/一覧で NFTアートが見える、Yu-Gi-Oh級フレーム

## Phase 2: 盤面を“舞台”にする（Stage/Boardの質感、VFX）
目的: 奥行き・光・素材・演出でゲームらしさを最大化

## Phase 3: UXの磨き込み（直感性、誤操作耐性、説明不要）
目的: “触れば分かる”、迷わない、納得できる

## Phase 4: サイト全体の統一（Home/Arena/Decks/Replay/Stream）
目的: mintサイト風の一貫したブランド体験

## Phase 5: QA・高速化（スマホ実戦品質）
目的: 重くない、壊れない、回帰が検知できる

---

# 4. 詳細TODO（完全版までの道筋）

記法:
- **ID**: 追跡用
- **Priority**: P0（最優先）/P1/P2
- **Where**: 触る場所
- **AC**: 受け入れ条件（できた判定）
- **Deps**: 依存

---

## Phase 0 — デフォ品質の固定（入口統一 + NFT画像表示）

### 0-001: `/match` のデフォルトUIを mint に寄せる
- Priority: P0
- Where: `apps/web/src/pages/Match.tsx`
- 実装案:
  - `ui` が空なら `mint` 扱い（互換維持のため、classicは `ui=classic` などに退避）
  - もしくは全リンクに `ui=mint` を付ける（Phase0-002 とセット）
- AC:
  - `/match?mode=guest...` でも mint UI が表示される
  - `ui=rpg` は現状維持で表示可能

### 0-002: 入口リンクの統一（Arena/Decks/他）
- Priority: P0
- Where:
  - `apps/web/src/pages/Arena.tsx`（quickPlayUrl）
  - `apps/web/src/pages/Decks.tsx`（`/match?a=...` / `/match?b=...`）
  - その他 `/match` を生成する箇所
- AC:
  - “どの入口からでも mint UI” が担保される

### 0-010: NFT画像ベースURLの“仕様化”（env無しで成立）
- Priority: P0
- Where:
  - `apps/web/public/game/index.v1.json`（`metadata.imageBaseUrl` を追加）
  - 可能なら `scripts/build_game_index_v1.mjs` にも出力を追加（Phase0-011）
- 仕様:
  - `metadata.imageBaseUrl = "https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/{id}.png"`
  - ※上記はユーザー提示URL。`{id}` は実装の `<built-in function id>` に合わせてください。
- AC:
  - env未設定でも `NyanoCardArt` が tokenId の画像を表示できる

### 0-011: index生成スクリプトのメタデータ出力を整合
- Priority: P1
- Where: `scripts/build_game_index_v1.mjs`
- 実装案:
  - `--imageBaseUrl` 引数 or env を追加し、`metadata.imageBaseUrl` を出力
  - 既存 `metadata.mode` 等は保持
- AC:
  - `node scripts/build_game_index_v1.mjs` で、画像ベースも含めて index を生成できる

### 0-020: Skeleton/EmptyState の見た目欠けを解消（CSS一本化）
- Priority: P0
- Where:
  - `apps/web/src/styles.css`（`.skeleton-base` 等を移植）
  - `apps/web/src/index.css`（未使用なら整理）
- AC:
  - Skeleton が想定どおり表示される
  - CSSの“正”が一つになっている（将来の崩れ防止）

### 0-030: 画像ロード失敗時のフォールバックを上品に
- Priority: P1
- Where:
  - `apps/web/src/components/NyanoCardArt.tsx`
  - `apps/web/src/components/NyanoImage.tsx`
- 実装案:
  - 画像onErrorで、NyanoImageへフォールバック
  - ロード中は skeleton を表示
- AC:
  - 画像が遅い/失敗でも UIが崩れず、可愛いまま

---

## Phase 1 — Duel Card Skin v2（カードを主役に）

### 1-001: 盤面用カードを “アート主役” に（Compact v2）
- Priority: P0
- Where:
  - `apps/web/src/components/CardNyano.tsx`（新コンポーネント追加推奨）
  - `apps/web/src/components/BoardViewMint.tsx`（盤面カード差し替え）
- 実装案:
  - `CardNyanoDuelCompact` を新設
  - 背景に `NyanoCardArt`（opacity 1.0）を置き、数字は半透明パネルに載せる
  - 角にtrait/jankenアイコン、中央にうっすらfoil
- AC:
  - 盤面上でもNFTアートが視認できる（“透かし”ではない）
  - 数字は読みやすい（コントラスト確保）

### 1-002: 手札カードの視認性（大きさ/比率/タップ領域）
- Priority: P0
- Where:
  - `apps/web/src/components/HandDisplayMint.tsx`
  - `apps/web/src/components/CardMini.tsx`（または置換）
- 実装案:
  - 手札は “絵が見えるサイズ” を最低保証（スマホで小さすぎない）
  - タップ時に軽く拡大し、盤面に置く流れを明確化
- AC:
  - スマホで「絵を見て選んでる感」が出る

### 1-010: カード詳細（Inspect）を追加（長押し/右クリック）
- Priority: P1
- Where:
  - `apps/web/src/components/CardInspectModal.tsx`（新規）
  - `HandDisplayMint` / `BoardViewMint` から呼ぶ
- AC:
  - 盤面/手札からカードを大きく見られる
  - tokenId・trait・hand・edges が読みやすい

### 1-020: フレーム素材（9-slice）導入（Adobe/生成OK）
- Priority: P2（ただし見た目が欲しければ前倒し）
- Where: `apps/web/public/ui/mint/card/*`
- AC:
  - フレームの縁が高級感（ガラス/ホロ）で統一

---

## Phase 2 — Stage/Board（盤面を舞台に）

### 2-001: DuelStageMint の質感を上げる（背景/ライト/影）
- Priority: P1
- Where:
  - `apps/web/src/components/DuelStageMint.tsx`
  - `apps/web/src/mint-theme/mint-theme.css`
- 実装案:
  - 背景の微アニメ（星/肉球ノイズ）
  - 盤面土台の影（inner shadow + drop shadow）
  - “中心に視線が集まる” vignette
- AC:
  - 何も操作しなくても「舞台感」がある

### 2-010: カード配置/フリップ演出の強化（短く気持ちいい）
- Priority: P1
- Where:
  - `apps/web/src/mint-theme/mint-theme.css`（keyframes）
  - `apps/web/src/components/BoardViewMint.tsx`（演出フック）
- AC:
  - 置く/フリップが気持ちいいが、邪魔しない（0.3〜0.6秒目安）

### 2-020: VFX（sparkle/foil/chain line）を追加（軽量）
- Priority: P2
- Where:
  - `apps/web/src/components/BattleFxMint.tsx`（新規）
  - `Match.tsx`（イベントでトリガー）
- AC:
  - 連鎖/勝利/重要局面で“祝福”される

---

## Phase 3 — UX磨き込み（任天堂的：触れば分かる）

### 3-001: 盤面のモード（配置/警戒）をUIとして明確に
- Priority: P1
- Where: `apps/web/src/pages/Match.tsx`, `BoardViewMint.tsx`
- AC:
  - “いま何をしているか” が迷わない

### 3-010: 行動プロンプト文言の見直し（短く・優しく・誘導）
- Priority: P2
- Where: `apps/web/src/components/BoardViewMint.tsx`（ActionPrompt）
- AC:
  - 初見が読みやすい、責めない言い回し

### 3-020: 誤操作の救済（confirm/undoの設計）
- Priority: P2
- Where: `Match.tsx`, `HandDisplayMint.tsx`
- AC:
  - スマホでミスが減る（Telemetryで invalid_action_count が減る）

---

## Phase 4 — サイト全体統一（mintサイト風）

### 4-001: CardBrowser/Decks の見た目を “カードゲーム” に寄せる
- Priority: P1
- Where:
  - `apps/web/src/components/CardBrowser.tsx`
  - `apps/web/src/pages/Decks.tsx`
- 実装案:
  - 検索結果は“カード一覧”としてアート表示
  - フィルタUIをステッカー/チップ化
- AC:
  - Decks画面が“管理画面”ではなく“カードゲーム画面”に見える

### 4-010: Replay のUI密度とテーマ統一
- Priority: P2
- Where: `apps/web/src/pages/Replay.tsx` 等
- AC:
  - Match→Replayで違和感がない

---

## Phase 5 — QA・高速化

### 5-001: E2Eに “mintがデフォ” を追加で担保
- Priority: P1
- Where: `apps/web/e2e/*`
- AC:
  - Home/Arena/Decks から Match（mint）へ行く導線が落ちない

### 5-010: 画像のプリロード（手札5枚＋盤面）
- Priority: P2
- Where:
  - `useNyanoTokenMetadata` / `NyanoCardArt`
  - `Match.tsx`（hand生成時にprefetch）
- AC:
  - 体感で“絵の出遅れ”が減る

---

# 5. すぐ着手すると効果が大きい「最短3手」

1) **Phase0-001/002**：入口統一（ui=mint をデフォ化）  
2) **Phase0-010**：indexに `metadata.imageBaseUrl` を入れて NFT絵を確実に出す  
3) **Phase1-001**：盤面カードを “アート主役（Compact v2）” に差し替える  

この3つで「デフォでハイクオリティ」「NFT画像が出る」「カードゲームっぽい」が一気に揃います。

---

## 6. 補足（ファイル期限）
過去に添付いただいた一部ファイルは、こちら側で参照期限が切れている可能性があります。  
ただし今回の整理は **(8).zip** だけで完結しています。追加の参照が必要になった場合のみ、該当ファイルを再添付ください。

以上。
