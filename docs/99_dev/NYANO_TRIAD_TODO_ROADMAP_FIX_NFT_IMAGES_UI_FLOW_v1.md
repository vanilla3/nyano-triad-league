# Nyano Triad League — NFT画像表示の不具合修正 & 導線改善ロードマップ / TODO（完全作業版）

- 対象リポジトリ: https://github.com/vanilla3/nyano-triad-league
- この仕様書は「添付された最新実装（zip 10）」を読み取り、**原因仮説 → 検証手順 → 修正方針 → 実装TODO**まで落とし込んだものです。
- 目的:
  1) **NFTカード画像が確実に表示される**（既存ユーザーのキャッシュ問題も含めて潰す）
  2) **UI/UXの導線を改善し、基本は「運営が用意したゲームをユーザーが遊べる」体験に寄せる**
  3) 配信/ルールセット等の高度機能は「必要な人だけ」触れるように **段階的開示**にする

---

## 0. 現状確認（コード上の重要ポイント）

### 0.1 NFT画像表示の仕組み（現実装）
- 画像表示コンポーネント: `apps/web/src/components/NyanoCardArt.tsx`
  - `useNyanoTokenMetadata(tokenId)` を使って `meta.imageUrl` が取れれば `<TokenImage src=...>` で表示
  - `meta.imageUrl` が無い場合は **デフォルトの `NyanoImage` を表示**（＝現在の症状）
- 画像URLの解決:
  - `apps/web/src/lib/nyano/metadata.ts`
    - `getMetadataConfig(gameIndex.metadata)` が `imageBaseUrl` を見つけるとそれを使い、`{id}` を置換して画像URLを構築
    - 環境変数 `VITE_NYANO_METADATA_BASE` があれば **そちらが優先**（indexより強い）
- `gameIndex` の取得・キャッシュ:
  - `apps/web/src/lib/nyano/gameIndex.ts`
    - `/game/index.v1.json` を fetch
    - さらに `localStorage` に `nyano.gameIndex.v1` として保存し、次回以降はそれを返す

### 0.2 最新の index.v1.json の状態（zip 10）
- `apps/web/public/game/index.v1.json` の `metadata` に **`imageBaseUrl` が存在**
  - 例: `https://...arweave.net/ZsWmiEdK.../{id}.png`
- よって、**本来は NFT画像が表示できる状態**になっている

---

## 1. 問題①：NFT画像が出ずデフォ画像になる（原因仮説と最短修正）

### 1.1 症状の意味（重要）
`NyanoCardArt` がデフォ画像を出す条件は、ほぼ以下のどちらかです。

- (A) `meta.imageUrl` が生成できていない（＝ `getMetadataConfig(...)` が `null`）
- (B) `useNyanoTokenMetadata` のクエリが無効化されている（tokenId/configがnull）

現実装では、**config が null** になりやすい設計点があるため、ここが第一容疑です。

### 1.2 最有力原因（H1）：localStorage の gameIndex キャッシュが古いまま固定されている
`fetchGameIndex()` は次の条件を満たすと、ネットワークを見に行かず **localStorageのキャッシュを無期限採用**します。

- `cached.v === 1`
- `cached.tokens` がある
- `cached.metadata` がある（※ `metadata.imageBaseUrl` の有無は見ていない）

過去版の index（例：zip 8）では `metadata.imageBaseUrl` が **無い**状態でした。  
その状態の index が localStorage に入っているユーザーは、最新版に更新しても **ずっと古い index を使い続け**、結果として `getMetadataConfig()` が `null` → デフォ画像になります。

> つまり「コードは直っているのに、ユーザー側に古い index が残っていて壊れて見える」典型パターンです。

### 1.3 追加の有力原因（H2）：fetch が `/game/index.v1.json` 固定で、デプロイ環境の base path に弱い
`fetch("/game/index.v1.json")` は、GitHub Pages やサブパス配信（例: `https://example.com/nyano-triad-league/`）で 404 になりやすいです。  
この場合 `gameIndex === null` になり、やはり `imageBaseUrl` が取れずデフォ画像になります。

### 1.4 まずやる「原因の切り分け」チェック（ブラウザで30秒）
AIに依頼する前に、人間が一度だけ確認しておくと確度が上がります（ただし確認できなくても修正は可能）。

1) DevTools Console で確認
```js
JSON.parse(localStorage.getItem("nyano.gameIndex.v1") ?? "null")?.metadata
```
- `imageBaseUrl` が **無い** → H1が濃厚
- `null` or `localStorage` に無い → H2 or 初回アクセス

2) Network で `index.v1.json` が取れているか確認
- `GET /game/index.v1.json` が 404/失敗 → H2濃厚

---

## 2. 修正方針（NFT画像表示）— “確実に直る” 優先順

### 方針A（最優先・即効）：localStorage のキャッシュキーをバンプして強制更新
- `apps/web/src/lib/nyano/gameIndex.ts`
  - `const STORAGE_KEY = "nyano.gameIndex.v1";` を **別キーに変更**
  - 例: `"nyano.gameIndex.v1.schema2"`
- 効果:
  - 既存ユーザーの古いキャッシュを確実に無視できる
- デメリット:
  - 初回ロードが少し重くなる（ただし一回だけ）

### 方針B（同時推奨）：base path 対応（Viteの BASE_URL を使う）
- `fetch("/game/index.v1.json")` を **BASE_URL基準**に変更
- 例:
  - `const base = (import.meta as any).env?.BASE_URL ?? "/";`
  - `fetch(`${base}game/index.v1.json`)`

### 方針C（再発防止）：キャッシュの互換性チェックを追加
- 旧キャッシュに `metadata.imageBaseUrl` が無い場合は **キャッシュ採用しない**
- 将来別フィールドを追加した時にも同じ事故を避けられる

### 方針D（ユーザー救済UI）：アプリ内に「キャッシュ削除」ボタンを置く
- Home の Settings にボタン追加（すでに Reset Tutorial がある）
- ボタン: `Reset Game Cache (Fix images)` など
- 押したら:
  - `localStorage.removeItem(STORAGE_KEY)`
  - 旧キーも掃除（`nyano.gameIndex.v1` など）
  - `window.location.reload()`

---

## 3. TODO（NFT画像表示 修正）— AIがそのまま着手できる粒度

### FIX-NFTIMG-001: localStorage キャッシュキーを更新して旧キャッシュを無効化（最優先）
- 優先度: P0
- 変更ファイル:
  - `apps/web/src/lib/nyano/gameIndex.ts`
- 作業:
  1. `STORAGE_KEY` を `"nyano.gameIndex.v1.schema2"` のように変更
  2. 旧キー `"nyano.gameIndex.v1"` も **読み取り対象から外す**（=完全に無視）
  3. （任意）初回起動で旧キーを削除して容量回収
- 受け入れ条件:
  - 旧版を触ったブラウザでも、更新後に **NFT画像が表示される**
  - 1回目ロード後、以降はキャッシュが効く

### FIX-NFTIMG-002: BASE_URL 対応で index fetch を壊れにくくする
- 優先度: P0
- 変更ファイル:
  - `apps/web/src/lib/nyano/gameIndex.ts`
- 作業:
  1. fetch を次へ置換
     - 旧: `fetch("/game/index.v1.json")`
     - 新: `fetch(resolveGameIndexUrl())`
  2. `resolveGameIndexUrl()` を追加し、Viteの `BASE_URL` を優先
- 受け入れ条件:
  - サブパス配信でも index を取得できる（404にならない）

### FIX-NFTIMG-003: キャッシュ互換性チェック（imageBaseUrl が無ければキャッシュ採用しない）
- 優先度: P0
- 変更ファイル:
  - `apps/web/src/lib/nyano/gameIndex.ts`
- 作業:
  - `if (cached && cached.v===1 && cached.tokens && cached.metadata)` の条件を強化
  - `cached.metadata.imageBaseUrl` が無い場合 → ネットワーク fetch にフォールバック
- 受け入れ条件:
  - 旧キャッシュが残っていても、自動的に新indexへ更新される

### FIX-NFTIMG-004: getMetadataConfig のバリデーション（誤った env が index を潰すのを防ぐ）
- 優先度: P1
- 変更ファイル:
  - `apps/web/src/lib/nyano/metadata.ts`
- 作業:
  - `VITE_NYANO_METADATA_BASE` がある場合でも、`"{id}"` を含まない文字列は **無効扱い**にする
  - 無効な場合は console.warn で理由を出し、index の `imageBaseUrl` を使う
- 受け入れ条件:
  - env 設定ミスで突然デフォ画像になる事故を避けられる

### FIX-NFTIMG-005: UI側の緊急救済（キャッシュ削除ボタン）
- 優先度: P1
- 変更ファイル候補:
  - `apps/web/src/pages/Home.tsx`（Settingsに追加が簡単）
  - または `apps/web/src/App.tsx` に「…」メニューを作る
- 作業:
  - ボタン追加: `Reset Game Cache`
  - 実行内容:
    - `localStorage.removeItem("nyano.gameIndex.v1")`
    - `localStorage.removeItem("nyano.gameIndex.v1.schema2")`（現キー）
    - `window.location.reload()`
- 受け入れ条件:
  - ユーザーが自己解決できる

### FIX-NFTIMG-006: 自動診断ログ（開発者向け）
- 優先度: P2（あとで良い）
- 変更ファイル:
  - `apps/web/src/components/NyanoCardArt.tsx`
- 作業:
  - `meta.imageUrl` が無いとき、`tokenId` と `getMetadataConfig` の結果（null）を `console.debug` で出す
  - ただし production では noisy になり得るので `import.meta.env.DEV` の時だけに限定
- 受け入れ条件:
  - 次回以降の類似不具合の調査が速い

### FIX-NFTIMG-007: 単体テスト追加（壊れ戻り防止）
- 優先度: P2
- 追加ファイル:
  - `apps/web/src/lib/nyano/__tests__/metadata.test.ts`
  - `apps/web/src/lib/nyano/__tests__/gameIndexCache.test.ts`（可能なら）
- テスト観点:
  - `getMetadataConfig()` が `imageBaseUrl` を正しく採用する
  - envBase が不正なとき無視される
  - `resolveTokenImageUrl()` が `{id}` 置換できる
  - 旧キャッシュ（imageBaseUrl無し）を採用しない

---

## 4. 問題②：UIがわかりにくい（導線が悪い）— ゴール定義

### 4.1 目指す体験（運営提供ゲーム中心）
- 初見ユーザーが **考えずに遊べる**：
  - 「ホームに来る → 大きいボタンを押す → すぐ対戦開始」
- “運営が用意したゲーム” を主軸にする：
  - **Events（固定ルール × 固定相手）** を中心に据える
  - Quick Play は入口として残す（ゲストで即プレイ）
- 高度機能は後ろへ：
  - Decks / Rulesets / Playground / Stream 等は「必要な人だけ」開ける
  - ただし機能自体は消さず、**段階的開示（progressive disclosure）**にする

### 4.2 現状の「迷子ポイント」（コード上）
- グローバルナビが多い:
  - `apps/web/src/App.tsx` のヘッダーが **Play/Watch/Tools/Home** のフル構成
  - 一般ユーザー視点では「どれを押せば遊べるのか」が曖昧になりやすい
- Match 画面が万能すぎる:
  - Match は検証・配信・イベント・ゲスト等を全部内包していて、説明なしだと情報量が多い

---

## 5. UI/UX 改修方針（任天堂的＝直感優先の設計原則で）

### 5.1 設計原則（実装判断の基準）
- **1画面1目的**：その画面で「何ができるか」を1つに絞る
- **Primary CTA を1つにする**：最も押してほしいボタンは常に1つ
- **段階的開示**：上級者向けの設定は折りたたむ/別画面へ
- **失敗が起きても戻れる**：誤操作してもやり直しが簡単
- **言葉より視覚**：アイコン・カードプレビュー・矢印で理解できる

> 任天堂のUIに共通するのは「説明文より先に手が動く」状態を作ることです。  
> 本プロジェクトでは、**“Play（公式）” と “Create（配信/検証）” を分離**するのが最短距離です。

---

## 6. TODO（UI/UX 導線改善）— AIがそのまま実装できる構造

### UX-NAV-001: ナビを「プレイヤー用」と「運営/配信者用」に分離（最優先）
- 優先度: P0
- 変更ファイル:
  - `apps/web/src/App.tsx`
- 仕様:
  - デフォルト（Player View）ではナビを **最小構成**にする
    - Home / Play / Events / Replay の4つ程度
  - Tools（Playground, Rulesets, Stream, Nyano）は **More(…)** 内に隠す
  - PCはヘッダー、スマホは下部タブ（将来）も検討
- 実装案（簡易）:
  - `details` / `summary` を使った「More」ドロップダウンを追加
  - もしくは `localStorage` に `nytl.navMode = "player" | "creator"` を持ち、切替UIをヘッダーに追加
- 受け入れ条件:
  - 初見ユーザーが「どこを押せば遊べるか」迷わない（Play が一番目立つ）

### UX-PLAY-001: Arena を “Play Hub” として再定義（運営提供ゲームの入口にする）
- 優先度: P0
- 変更ファイル:
  - `apps/web/src/pages/Arena.tsx`
- 仕様（見せ方）:
  1. 最上段に「公式イベント」枠（Today’s Event / Recommended）
  2. 次に「Quick Play（ゲスト）」枠
  3. その下に “My Deck / Advanced” を折りたたみ（or 末尾）
- 実装TODO:
  - Eventsページへ遷移せずとも、Arenaに **イベントの上位1〜3件だけプレビュー表示**
  - `Start` ボタンは常に `ui=mint` 付で統一
- 受け入れ条件:
  - Arena に来た時点で「何を遊べば良いか」が1スクロール以内に収まる

### UX-HOME-001: Home の主CTAを「公式で遊ぶ」に寄せる（ゲスト/イベントの二択）
- 優先度: P1（ただし効果大）
- 変更ファイル:
  - `apps/web/src/pages/Home.tsx`
- 仕様:
  - 「すぐ遊ぶ（ゲスト）」は維持
  - 追加で「イベントに挑戦」CTAを同格に置く（運営提供ゲームを主語にする）
  - Decks/Arena の導線は二次へ（今は Secondary actions にあり、少し混線）
- 受け入れ条件:
  - Home の時点で “運営が用意したゲーム” が目に入る

### UX-MATCH-001: Match を “プレイ画面” と “設定画面” に分離（情報量を制御）
- 優先度: P1
- 変更ファイル:
  - `apps/web/src/pages/Match.tsx`
  - 新規: `apps/web/src/pages/Play.tsx`（または `MatchSetup.tsx`）
- 仕様（おすすめ）:
  - `/play` で「モード選択（ゲスト/イベント/自分のデッキ）」を行い、/match は “対戦に集中” させる
  - /match に入ったら「余計な説明セクション」は折りたたみ（heroは縮小）
- 受け入れ条件:
  - /match が “試合に集中できる画面” になる
  - 設定をいじりたい人は /play または “詳細設定” から入れる

### UX-STREAM-001: 配信連携は “Creator Tools” 側へ移動（通常導線から分離）
- 優先度: P1
- 変更ファイル:
  - `apps/web/src/App.tsx` ナビ
  - `apps/web/src/pages/Stream.tsx`（説明文/入口）
- 仕様:
  - Player View では Stream を隠す（More内）
  - Streamページの冒頭に「配信者向けです」バッジ + 最短導線（Overlayのリンク等）
- 受け入れ条件:
  - 一般ユーザーが Stream に迷い込まない

### UX-COPY-001: 文言の統一（“運営が用意したゲーム” を主語にする）
- 優先度: P2
- 対象:
  - Home/Arena/Events/Match の説明文
- 例:
  - “検証用” “ハブ” の言葉は Creator View に寄せ、Player View は「遊ぶ」「挑戦」「勝つ」「共有」に寄せる
- 受け入れ条件:
  - 日本語のトーンが一貫し、迷いが減る

### UX-ONBOARD-001: 初回オンボーディングを “3ステップ” に固定する
- 優先度: P2
- 変更ファイル候補:
  - `apps/web/src/components/MiniTutorial.tsx`
  - `apps/web/src/pages/Home.tsx` / `Arena.tsx`
- 仕様:
  1. 「ゲストで遊ぶ」→ まず触らせる
  2. 「イベントに挑戦」→ 運営提供のゲームへ
  3. 「NFT/デッキを使う」→ 深い遊びへ
- 受け入れ条件:
  - 説明を読まずとも次の行動が分かる

---

## 7. ロードマップ（長期・完全版）— 優先順位付き

### Phase 0（即日〜2日）: 緊急修正（NFT画像）
- [P0] FIX-NFTIMG-001 キャッシュキー更新
- [P0] FIX-NFTIMG-002 BASE_URL 対応
- [P0] FIX-NFTIMG-003 互換性チェック
- [P1] FIX-NFTIMG-005 キャッシュ削除ボタン

### Phase 1（〜1週間）: “遊べる”導線の再設計
- [P0] UX-NAV-001 ナビ分離（Player/Creator）
- [P0] UX-PLAY-001 Arena を Play Hub 化（イベント/Quick Play）
- [P1] UX-HOME-001 Home を公式主語へ
- [P1] UX-STREAM-001 配信を Creator 側へ

### Phase 2（2〜4週間）: 任天堂的UX（直感/気持ちよさ）
- [P1] UX-MATCH-001 Match の情報量制御（/play 分離）
- [P2] UX-ONBOARD-001 初回3ステップ
- [P2] UX-COPY-001 文言統一
- [P2] 設定の “安全な折りたたみ” 徹底（詳細は開けないと見えない）

### Phase 3（1〜2ヶ月）: 運営提供ゲームを「回る」仕組みにする
- Events の強化
  - デイリー/ウィークリーイベントのテンプレ化
  - リプレイ共有の一体感（SNSカード/短縮URLなど）
- ランキング/称号（オフチェーンでも良い）
- “運営が用意したデッキ” のバリエーション増

### Phase 4（2〜3ヶ月）: 配信者・コミュニティ拡張
- Stream の導線最適化（Overlay一発生成、視聴者投票UX）
- ルールセットの共有（creator only）
- “ユーザーが作ったルール” は「ギャラリー」形式で隔離し、メイン体験を汚さない

---

## 8. 実装メモ（AIへ渡すときの指示テンプレ）

### 8.1 作業開始コマンド
```bash
pnpm install
pnpm dev:web
# test
pnpm -C apps/web test
pnpm -C apps/web typecheck
```

### 8.2 受け入れテスト（最小）
- NFT画像:
  - 既存ブラウザで localStorage に旧 `nyano.gameIndex.v1` がある状態 → 画像が出る
  - サブパス配信（BASE_URL != "/"）でも index が読める
- UI:
  - Player View のナビが最小になる
  - 「Play（Arena）」に行けば1スクロール以内で対戦開始できる

---

## 9. 付録：画像ベースURL（現行）
- 画像ベース（置換パターン）:
```txt
https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/{id}.png
```
- フォールバック（推奨）:
```txt
https://arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/{id}.png
```

---

以上。
