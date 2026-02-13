# Nyano Triad League — UI/UXアップデート + バグ修正ロードマップ & TODO（最新版 / 2026-02-11）

このドキュメントは **「現状の実装（添付zip: nyano-triad-league-main (11)）」を前提**に、以下を “そのまま実装に着手できる” 粒度まで分解した仕様書です。

- **NFT画像が表示されない問題**（以前は表示されていたが、今はデフォ画像になる）
- **読み込み速度（初期表示/カード画像/演出）** を多方面から改善
- **リプレイ / シェアが機能していない問題** の復旧と、堅牢化（環境差・サブパス配信・RPC依存の排除）
- **盤面のビジュアルを「ハイクオリティカードゲーム級」**に引き上げ（ただし世界観は *mint.nyano.ai* と同系統の “かわいい” 方向）
- **環境に応じてエフェクト負荷を自動調整**（モバイル/低電力/低GPUでは軽量化）

---

## 0. 現状の実装スナップショット（重要ポイント）

### フロント構成
- `apps/web`：React + Vite + react-router + TanStack Query
- テーマ：`ui=mint` がデフォルト（`Match.tsx` で `ui` が無ければ `"mint"`）
- バトル盤面：`DuelStageMint` + `BoardViewMint`
- カード表示：`CardNyanoDuel` → `NyanoCardArt`（NFTアートを `<img>` で表示）

### NFT画像の仕組み（いまのコード）
- `NyanoCardArt.tsx` → `useNyanoTokenMetadata(tokenId)`
- `useNyanoTokenMetadata.ts` は **`useNyanoGameIndex()` を呼び、GameIndexの `metadata.imageBaseUrl` を参照**
- GameIndex：`apps/web/public/game/index.v1.json`
  - `metadata.imageBaseUrl` は既に `{id}` プレースホルダ付きで入っている（現zipでは入っている）

### リプレイ/シェアの仕組み（いまのコード）
- `Match.tsx`：`/replay?z=...`（gzip + base64url） or `/replay?t=...`（raw base64url）
- `Replay.tsx`：`?z=` / `?t=` を読み取って復元し、**オンチェーンRPCから deck tokenId の CardData を取得**して再現する
- gzipは `CompressionStream`/`DecompressionStream` を優先し、無い環境では `t=`（非圧縮）へフォールバック

---

## 1. 問題点の整理（症状 → 原因仮説 → 修正方針）

### 1-A) NFT画像が表示されずデフォ画像になる

#### 症状
- `NyanoCardArt` が placeholder（`NyanoTokenPlaceholder`）を出し続ける/画像が差し替わらない

#### 原因仮説（優先度順）
**A1. GameIndexのローカルキャッシュが古く、`metadata.imageBaseUrl` が無い版を掴み続ける**
- `fetchGameIndex()` は localStorage を優先し、`cached.metadata` が存在すれば採用します。
- しかし **`metadata.imageBaseUrl` の有無を検証していない**ため、古いキャッシュが残っていると `getMetadataConfig()` が `null` を返し、画像解決が止まります。

**A2. `VITE_NYANO_METADATA_BASE` が “画像ではなくJSONメタデータ” を指していて、画像URLが壊れている**
- 変数名が “metadata” なので、運用側が `.json` ベースを入れがちです。
- `getMetadataConfig()` は env を最優先で採用するので、間違った値が入ると index側の正しい `imageBaseUrl` が無視されます。

**A3. そもそも画像URLは常に既知なのに、カード画像表示のためだけに GameIndex 依存になっている**
- `useNyanoTokenMetadata()` が **カード1枚表示するたびに `useNyanoGameIndex()` を経由**する設計は、表示が不安定になる要因です（失敗時に placeholder へ落ちやすい）。

#### 修正方針（結論）
- 「NFT画像は **デフォで必ず表示**」を最優先にする
- そのために：
  1) **画像URLパターンの“安全なデフォルト”**をコードに持つ（Arweave固定なら尚更）
  2) GameIndex / env を使うのは “上書きオプション” に格下げ
  3) localStorage キャッシュは **検証して壊れていたら破棄**（自動復旧）

---

### 1-B) 読み込みが遅い（初期表示 / 盤面 / 画像 / 演出）

#### 症状（想定含む）
- 初回ロードが重い、盤面が出るまで時間がかかる
- 背景PNGが大きい（`board-bg.png`, `hero-bg.png` などが MB級）
- NFT画像はArweaveで遅延することがある

#### 主な原因ポイント
- `public/board-bg.png` が **1.5MB**、`hero-bg.png` が **1MB**（現zip）
- `NyanoCardArt` が index 依存 → index取得失敗/遅延で画像も巻き込まれる
- 画像ドメインへの接続確立（DNS/TLS）が遅い（`preconnect` 未実施）

#### 修正方針（結論）
- **“重いものを軽く”** と **“必要になるまで読まない”** を両立する  
  - ローカル画像：WebP/AVIF化 + `image-set()` + サイズ最適化
  - NFT画像：プリロード戦略 + フォールバックゲートウェイ + キャッシュ
  - 演出：デバイス判定で自動スケール（後述の VisualQuality System）

---

### 1-C) リプレイ / シェアが機能しない

#### 症状（よくあるパターン）
- シェアURLを別端末で開くと 404 / 真っ白 / 失敗
- `?z=` を開いたとき、復元に失敗（環境差）
- Guest/Fastモードの試合がリプレイできない（RPCで tokenId が存在しない等）
- RPCが落ちるとリプレイが丸ごと死ぬ

#### 原因仮説（優先度順）
**C1. share URL の生成が `window.location.origin` 固定で、サブパス配信に弱い**
- `Match.tsx` の `buildReplayUrl(true)` が `origin + "/replay"` を作る  
  → GitHub Pages 等の `/repo-name/` 配信で壊れます。

**C2. Router が basename 未設定（createBrowserRouter）**
- サブパス環境で deep link が死ぬ（`/replay` 直叩きが 404 になりやすい）

**C3. Replay が “オンチェーンRPC取得必須”**
- RPCが不安定な環境（CORS/RateLimit）で失敗
- Guestモードの “デモカード” はチェーンに存在しない → 原理的に再生不能

**C4. gzip復元はブラウザ実装差がある（特にモバイル/古いSafari）**
- `DecompressionStream` が無い端末で `z=` を開くと失敗  
  ※生成側が `z=` を作れても、閲覧側が復元できないと詰む

#### 修正方針（結論）
- **Replay/Share v2**：共有データに “カードスナップショット” を同梱し、RPC依存を外す  
- URL生成は **BASE_URL/basename を考慮**（必要なら `#/replay` 形式も選べるように）
- gzipは **fflate/pako等のJS実装**で必ず動くようにする（stream APIは最適化として残す）

---

### 1-D) 盤面のビジュアルを最新技術でアップグレードしたい（環境で負荷調整）

#### 現状（良い点）
- `DuelStageMint` で舞台（背景・グロー・パース）を作っている
- `CardNyanoDuel` の “フルブリードアート + ガラスUI” は方向性が良い

#### 現状（改善余地）
- **盤面/カードの演出が常時動いて**いて、情報がうるさく感じる瞬間がある  
  （foil/shimmer・sparkle背景・cellの常時アニメ）
- ボード背景の画質・圧縮が未最適化（PNGが大きい）
- “スマホゲー級” のコアである：
  - レイヤリング（奥行き）
  - ライト/影（接地感）
  - 反応（触った時の気持ち良さ）
  - テンポ（0.2〜0.4秒で気持ちよく返す）
  がまだ伸ばせる

#### 修正方針（結論）
- **VisualQuality System（自動 + 手動）**を導入して、演出を階層化する  
- “可愛い” を崩さずに **高級感（質感）** を足す  
  - 例：パステルの中に「微細な粒状ノイズ」「ソフトな環境光」「控えめなイリデセンス」

---

## 2. 仕様（決定事項）— まずここを実装の「骨格」にする

### 2-A) NFT画像表示：デフォで必ず表示される設計

#### 仕様
1. 画像URLパターンの優先順位を以下にする（強い順）
   1) `VITE_NYANO_IMAGE_BASE`（新設・画像専用、必ず `{id}` を含むこと）
   2) `GameIndex.metadata.imageBaseUrl`（`{id}` 必須）
   3) **コード内デフォルト**（今回のArweave固定パターン）

2. `VITE_NYANO_METADATA_BASE` は “画像用” としては使わない  
   - 将来、JSONメタデータを取りに行く用途に限定する（誤設定事故を防ぐ）

3. `useNyanoTokenMetadata()` は **カード画像のために GameIndex を強制ロードしない**
   - 画像表示だけなら (1) の優先順位で即解決できる
   - GameIndex は “カード一覧/デッキ生成” 等のページで必要な時だけ読む

4. 画像ロード失敗時のフォールバック
   - primary: `https://arweave.net/ZsW.../{id}.png`（標準ゲートウェイ）
   - secondary: `https://<sub>.arweave.net/ZsW.../{id}.png`（現状のもの）
   - tertiary: `https://ar-io.net/ZsW.../{id}.png`（候補、必要なら）
   - ※NyanoCardArt側で `onError` を段階的に切り替える

5. デバッグ導線
   - `?debug=1` のとき、カードの右下に
     - tokenId
     - 解決された画像URL
     - 失敗回数
     を表示する（“見れば原因がわかる”）

---

### 2-B) Replay/Share v2：RPC依存を外して確実に動く

#### ReplayBundle v2（共有する最小データ構造）
`/replay?z=` や `/replay?t=` に埋め込む JSON を、Transcript単体から **Bundle** に変更。

```ts
type ReplayBundleV2 = {
  v: 2;
  createdAt: string;            // ISO
  app: { name: "nyano-triad-league"; build?: string };
  transcript: TranscriptV1;     // 今の互換を維持
  cards?: Record<string, CardData>; // tokenId(string) => CardData（deckA+deckB分）
  // 任意：見栄え/検証用
  imageBaseUrl?: string;        // 画像URLパターン（{id}）
  rulesetLabel?: string;
  eventId?: string;
};
```

#### 仕様ポイント
- `cards` が入っていれば **ReplayはRPCを使わず再生**する
- `cards` が無い旧リンクは、従来通りRPCから取得（後方互換）
- `cards` は deckA+deckB の10枚分でよい（boardの全てが再現できる）
- これにより：
  - Guestデモ試合も共有できる
  - RPCダウンでもリプレイが死なない
  - “再現性” が上がる（プレイ時点のカード性能を固定できる）

---

### 2-C) VisualQuality System：自動で重さを調整、ユーザーも切替可能

#### Qualityレベル
- `OFF`：演出なし（低電力/検証用）
- `LOW`：最低限（影/ハイライトのみ、アニメ少）
- `MEDIUM`：標準（いまのmint程度）
- `HIGH`：豪華（パーティクル/微細ノイズ/反射）
- `ULTRA`：最上（WebGL/WebGPU背景など。対応端末のみ）

#### 初期値の自動決定（例）
- `prefers-reduced-motion: reduce` → `OFF` or `LOW`
- `navigator.deviceMemory <= 4` or `hardwareConcurrency <= 4` → `LOW`
- `saveData`（省データ） → `LOW`
- それ以外は `MEDIUM`、FPSが安定していれば `HIGH`

#### 動的劣化（FPS監視）
- 直近 3秒の平均FPSが 45 を下回ったら 1段階落とす
- 60前後で安定していれば戻してよい（ただし頻繁に揺れないようヒステリシス）

#### 実装要件
- `VisualSettingsContext` を作り、
  - `quality`
  - `reducedMotion`
  - `capabilities`（deviceMemory等）
  を配布する
- CSSは `data-vfx="low|medium|high|ultra"` を root に付けて切替する

---

## 3. ロードマップ（マイルストーン）

> 日付ではなく “完成順” で並べています。AI実装は **M0 → M1 → M2...** の順に進めるのが安全です。

### M0：表示崩壊/機能停止を止血（最優先）
- NFT画像が **デフォで表示される**（キャッシュや環境差で死なない）
- Share URL が **どの環境でも正しいURL**になる（サブパス/ルータ）
- Replay が **Guestでも動く**（RPC依存を外す）
- gzip復元が **Safari/モバイルでも確実に動く**

### M1：速度改善（体感の底上げ）
- ローカルの大型PNGをWebP/AVIF化
- 画像プリロードと `preconnect` 導入
- GameIndexのキャッシュ破損を自動回復
- 主要ページのコード分割（初回JSを軽量化）

### M2：盤面ビジュアル vNext（“スマホゲー級” の核）
- VisualQuality System 実装
- 盤面の質感（影・光・テクスチャ）を階層化
- エフェクトを「控えめだが上質」に再設計（常時キラキラを減らす）
- 演出（置く/めくる/連鎖）を “気持ちいいテンポ” に

### M3：仕上げ（運用に耐える）
- E2E（Playwright）で Replay/Share を自動テスト
- 低速回線/低スペ端末での劣化挙動チェック
- アクセシビリティ（タップ領域、色、フォーカス、字幕）

---

## 4. TODO（AIに渡す完全版タスクリスト）

### 凡例
- **P0**: すぐ直す（バグ/破綻）
- **P1**: 速度/信頼性の底上げ
- **P2**: 見た目/UXの大幅強化
- **P3**: 仕上げ/検証/運用

---

## 4-1. P0：NFT画像が出ない問題を確実に直す

### P0-IMG-001：GameIndexキャッシュが古いと画像が死ぬ問題を修正
**目的**：古いlocalStorageの index が残っていても NFT画像が出る

- 変更ファイル
  - `apps/web/src/lib/nyano/gameIndex.ts`
- 実装
  1. `const isValid = cached.metadata?.imageBaseUrl?.includes("{id}")` を追加
  2. valid でない場合は localStorage を破棄して network fetch を優先
  3. `localStorage` のキーに `indexVersion` を含め、仕様変更時に強制更新できるようにする
- 受け入れ条件
  - 旧indexキャッシュを入れても、次回起動で自動復旧し、NFT画像が表示される

---

### P0-IMG-002：画像URLのデフォルト（フォールバック）をコードに持たせる
**目的**：どんな環境でも最低限表示される

- 変更ファイル
  - `apps/web/src/lib/nyano/metadata.ts`
  - （必要なら）`apps/web/src/lib/nyano/useNyanoTokenMetadata.ts`
- 実装（推奨）
  1. `DEFAULT_NYANO_IMAGE_BASE = "https://arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/{id}.png"`
     - ※ subdomain 版を primary にしたいならそれでも可。ただし標準ゲートウェイを推奨。
  2. `getMetadataConfig()` が `null` を返さないようにする（defaultを返す）
  3. env変数を分離
     - 新：`VITE_NYANO_IMAGE_BASE`（画像）
     - 旧：`VITE_NYANO_METADATA_BASE`（JSONメタデータ用に温存するが画像解決に使わない）
- 受け入れ条件
  - GameIndex取得に失敗しても、NFT画像URLが生成され表示される

---

### P0-IMG-003：NyanoCardArt のフォールバックゲートウェイを段階化
**目的**：Arweaveゲートウェイ障害でも復旧しやすくする

- 変更ファイル
  - `apps/web/src/components/NyanoCardArt.tsx`
- 実装案
  - stateに `attempt` を持つ（0,1,2）
  - `attempt=0`: primary（standard arweave.net）
  - `attempt=1`: secondary（subdomain or alternate gateway）
  - `attempt=2`: placeholder
- 受け入れ条件
  - 1つのゲートウェイが落ちても、別ゲートウェイで表示される

---

### P0-IMG-004：デバッグ表示（?debug=1）
**目的**：次に壊れた時に “原因が見える” ようにする

- 変更ファイル
  - `apps/web/src/components/NyanoCardArt.tsx`
- 実装
  - `const debug = new URLSearchParams(window.location.search).get("debug")==="1"`
  - debug時、画像の右下に URL と attempt を小さく表示
- 受け入れ条件
  - 現象が再発してもURLが分かり、即座に原因切り分けできる

---

## 4-2. P0：Replay/Shareが機能していない問題を直す

### P0-RPL-001：Share URL生成を BASE_URL 対応にする
**目的**：サブパス配信でも壊れないURL生成（コピー/QR/共有）

- 変更ファイル
  - `apps/web/src/pages/Match.tsx`
  - `apps/web/src/pages/Replay.tsx`
  - （共通化）`apps/web/src/lib/appUrl.ts`（新規）
- 実装
  1. `getAppBaseUrl()` を作る  
     - `const base = import.meta.env.BASE_URL || "/"`  
     - `return window.location.origin + base.replace(/\/$/, "")`
  2. `buildReplayUrl(true)` / `buildCanonicalReplayLink()` は `origin` 直結をやめ、上記を使う
- 受け入れ条件
  - GitHub Pages / サブパス環境でも share link が正しいURLになる

---

### P0-RPL-002：Routerのbasename or hash対応（共有リンクの安定化）
**目的**：外部から `/replay` に直接アクセスしても壊れない

- 対応オプション（どちらか採用）
  - A案：`createBrowserRouter(routes, { basename: import.meta.env.BASE_URL })`
  - B案：`createHashRouter` に切替（GitHub Pages向けに強い）
- 変更ファイル
  - `apps/web/src/main.tsx`
- 受け入れ条件
  - 共有リンクを “別ブラウザ/別端末” で開いても表示される

---

### P0-RPL-003：ReplayBundle v2 を導入（RPC依存排除）
**目的**：Guest/高速モードでも replay/share が確実に動く

- 変更ファイル
  - `apps/web/src/pages/Match.tsx`（share生成側）
  - `apps/web/src/pages/Replay.tsx`（読み込み側）
  - `apps/web/src/lib/transcript_import.ts`（または新規 parser）
- 実装ステップ
  1. shareのJSONを `sim.transcript` 単体から `ReplayBundleV2` に変更
     - `cards` には `cards: Map<bigint, CardData>` から deck分を抽出して入れる
  2. Replay側は受け取ったJSONが
     - `v===2 && cards` → そのCardDataを使う（RPC不要）
     - それ以外 → 従来通りRPC（互換）
- 受け入れ条件
  - Guest matchの共有リンクを開いても replay が再生できる
  - RPCをオフラインにしても replay が再生できる（v2リンク）

---

### P0-RPL-004：gzip 圧縮/復元を fflate/pako で必ず動くようにする
**目的**：生成側と閲覧側のブラウザ差で壊れない

- 変更ファイル
  - `apps/web/package.json`（依存追加）
  - `apps/web/src/lib/base64url.ts`
- 実装
  1. `fflate` か `pako` を導入（推奨：fflateは軽量）
  2. `tryGzipCompressUtf8ToBase64Url` / `safeGzipDecompressUtf8FromBase64Url` に
     - Stream API が無い/失敗したら JS gzip にフォールバック
- 受け入れ条件
  - iOS Safari 相当でも `?z=` が復元できる

---

## 4-3. P1：速度改善（多方面）

### P1-PERF-001：publicの重いPNGをWebP/AVIFに置換
**目的**：初期ロードを軽くして “安っぽさ” も減らす（画像の解像感UP）

- 対象
  - `apps/web/public/board-bg.png`（1.5MB）
  - `apps/web/public/hero-bg.png`（1MB）
  - `apps/web/public/og-image.png` 等
- 実装
  1. `board-bg.webp` / `board-bg.avif` を生成
  2. CSSは `image-set()` を使う（例）
     ```css
     background-image: image-set(
       url("/board-bg.avif") type("image/avif"),
       url("/board-bg.webp") type("image/webp"),
       url("/board-bg.png")  type("image/png")
     );
     ```
  3. 低スペ向けに `LOW` では背景画像を外してグラデだけにする分岐も用意
- 受け入れ条件
  - Lighthouse/体感で “最初の表示” が速くなる

---

### P1-PERF-002：Arweave画像向けに preconnect / dns-prefetch
**目的**：TLS/DNSの待ちを減らす

- 変更ファイル
  - `apps/web/index.html`（あれば） or `AppLayout` の `<head>`（Viteなら index.html）
- 実装
  - `<link rel="preconnect" href="https://arweave.net" crossorigin>`
  - `<link rel="preconnect" href="https://m3c2...arweave.net" crossorigin>`
- 受け入れ条件
  - 初回のNFT画像が出るまでの時間が短縮される

---

### P1-PERF-003：Match開始時にデッキ画像をプリロード
**目的**：盤面に出した瞬間に “画像が無い” を減らす

- 変更ファイル
  - `apps/web/src/pages/Match.tsx`
  - `apps/web/src/lib/nyano/resolveTokenImageUrl.ts`
- 実装
  - `cards` と deck tokenIds が揃ったら、10枚分を `new Image().src = url` でプリロード
  - `requestIdleCallback` があれば空き時間でやる
- 受け入れ条件
  - 盤面に置いた瞬間の画像表示が改善

---

### P1-PERF-004：ページコード分割（初回JS軽量化）
**目的**：トップ/アリーナ表示が軽く、ゲーム開始が速い

- 変更ファイル
  - `apps/web/src/main.tsx`
- 実装案
  - `createBrowserRouter` の `lazy` か `React.lazy` を使って pages を動的import
- 受け入れ条件
  - 初回ロードのJSが減り、TTIが改善する

---

## 4-4. P2：盤面ビジュアルを最新技術でアップグレード（可愛い × 高級感）

### P2-VFX-001：VisualQuality System の導入
**目的**：環境差で自動的に演出を調整し、破綻しない

- 変更ファイル
  - `apps/web/src/lib/visual/visualSettings.ts`（新規）
  - `apps/web/src/App.tsx` または `main.tsx`（Provider追加）
  - `apps/web/src/mint-theme/mint-theme.css`（vfx分岐）
- 実装
  - rootに `data-vfx="low|medium|high|ultra"` を付与
  - `prefers-reduced-motion` と deviceMemory で初期値
  - FPS監視で動的劣化（任意）
- 受け入れ条件
  - モバイルでも落ちず、PCでは豪華になる

---

### P2-VFX-002：盤面 “質感” を上げる（テクスチャ + ライト + 影）
**目的**：安っぽさの除去（接地感/奥行き/空気感）

- 改修対象
  - `DuelStageMint.tsx`（背景レイヤ）
  - `mint-theme.css`（board/frame/cell）
- 具体仕様
  1. **環境光（Ambient）**：ソフトなグリーン系の環境光を1枚噛ませる
  2. **粒状ノイズ（Film grain）**：`HIGH` で薄く（不透明度 0.02〜0.04）
  3. **接地影（Contact shadow）**：カードの下に柔らかい影（blur 12〜18）
  4. **ビネット**：中心に視線を集める（既にあるが調整）
  5. **セルの素材感**：ガラス/樹脂っぽいハイライト（角だけ光る）
- 受け入れ条件
  - “背景が安い” ではなく “舞台っぽい” に見える

---

### P2-VFX-003：常時キラキラを抑え、意味のある時だけ光らせる
**目的**：うるささの除去（情報ノイズ削減）

- 対象
  - `.mint-compact-card::after`（常時 holo）
  - `.mint-duel-card__foil`（常時 shimmer）
  - `.mint-stage::after`（常時 sparkle drift）
- 仕様
  - `MEDIUM`：ホロは **停止**（hover/selectedのみ）
  - `HIGH`：ホロは **ゆっくり**（8s→16s）+ opacity半減
  - `LOW`：ホロ無効
- 受け入れ条件
  - 眩しさ/うるささが減り、カード情報が読みやすい

---

### P2-VFX-004：カードの「触り心地」を上げる（3D tilt / press / snap）
**目的**：スマホゲー級の “触った瞬間の納得感”

- 仕様（例）
  - hover（PC）で 3D tilt（最大 6deg）
  - tap（Mobile）で 0.12s の “沈み込み” → 0.18s で戻る
  - 選択中カードは “ふわっと浮く” が、影は強すぎない
- 実装
  - `HandDisplayMint` / `CardNyanoDuel` 周辺に pointer tracking（HIGHのみ）
- 受け入れ条件
  - 選択/配置の体験が気持ちよくなる

---

## 4-5. P2：必要な画像アセット一覧（全部書く）

> 生成AI（Nano Banana等）やAdobeで作る前提。**ファイル名・サイズ・用途**を固定しておくと実装が爆速になります。

### A) 盤面（Stage/Board）
1. `ui/mint/stage/stage-bg.avif`（推奨 1920x1080 / 2560x1440）  
   - 役割：DuelStageMint の最背面。mintカラーの抽象背景（パステル、かわいい、主張しすぎない）
2. `ui/mint/stage/stage-vignette.webp`（1920x1080, alpha）  
   - 役割：中心に視線を集めるビネット。CSSでも可だが画像の方が高級感を作りやすい
3. `ui/mint/stage/stage-noise.webp`（512x512, alpha, tile）  
   - 役割：フィルムグレイン。`mix-blend-mode: overlay` 等で薄く重ねる（HIGHのみ）
4. `ui/mint/board/board-surface.avif`（2048x2048, tile可能）  
   - 役割：盤面の素材（樹脂/ラバー/マット）。セルの下地
5. `ui/mint/board/cell-frame.webp`（256x256, alpha）  
   - 役割：セルの縁（角丸、少し立体）
6. `ui/mint/board/cell-highlight.webp`（256x256, alpha）  
   - 役割：セル選択時のハイライト用マスク

### B) カード（フレーム/質感）
7. `ui/mint/card/card-frame.webp`（1024x1365, alpha）  
   - 役割：NFTアートの上に載せる “カードらしさ” の縁（かわいいが高級）
8. `ui/mint/card/card-glass.avif`（512x512, alpha, tile可）  
   - 役割：下部ガラスパネルの質感（今はCSSで作っているが、画像を混ぜると一気に上がる）
9. `ui/mint/card/foil-mask.webp`（1024x1024, alpha, tile）  
   - 役割：ホロのマスク（HIGHのみ、動きは控えめ）
10. `ui/mint/card/card-shadow.webp`（512x512, alpha）  
   - 役割：接地影。CSSのdrop-shadowでも可

### C) エフェクト（軽量に見せる）
11. `ui/mint/fx/sparkle-1.webp`（128x128, alpha）
12. `ui/mint/fx/sparkle-2.webp`（128x128, alpha）
13. `ui/mint/fx/paw-particle.webp`（128x128, alpha）  
    - 役割：Nyanoらしさ。連鎖や勝利演出で数個だけ飛ばす
14. `ui/mint/fx/ripple-ring.webp`（256x256, alpha）  
    - 役割：配置時のリップル（いまCSSでもあるが、画像で上品に）

### D) UI（アイコン/装飾）
15. `ui/mint/ui/icon-warning.svg`
16. `ui/mint/ui/icon-share.svg`
17. `ui/mint/ui/icon-replay.svg`
18. `ui/mint/ui/icon-sound-on.svg` / `icon-sound-off.svg`  
    - 役割：絵文字を卒業し、統一感を出す

---

## 5. 生成（Nano Banana / Adobe）に依頼する時の指示テンプレ

### 盤面背景（stage-bg）
- プロンプト例：
  - 「パステルミント基調、かわいい、清潔感、抽象的な光のにじみ、柔らかいボケ、ゲームのバトル舞台用、中央は情報が読みやすいように少し暗め、周辺に淡い光、ノイズは最小、UIの邪魔をしない、4K、横長」
- 禁止：
  - 過度なキラキラ、文字、強いコントラスト、写真的なリアル金属

### カードフレーム（card-frame）
- プロンプト例：
  - 「Nyano mintサイトと同系統のかわいい雰囲気、角丸、上品な縁取り、白〜薄ミント、微細な影、PBRっぽい質感、アートを邪魔しない、透明背景、カードゲーム用フレーム」

---

## 6. テスト観点（最低限）

- NFT画像
  - 初回アクセス（キャッシュ無し）で表示される
  - 旧キャッシュ有りでも表示される（自動復旧）
  - ゲートウェイ1が死んでも fallback する
- Share/Replay
  - `/replay?z=` が Safari でも復元できる
  - Guest match の共有リンクが再生できる
  - サブパス配信でも share link が正しい
- VFX
  - `prefers-reduced-motion` で演出が減る
  - 低スペ端末で描画が破綻しない（FPS劣化時の自動ダウングレード）

---

## 7. すぐ動ける “実装順” のおすすめ（AI向け）

1. **P0-IMG-001〜004**（NFT画像の止血 & デバッグ）
2. **P0-RPL-001〜004**（Share/Replayの復旧と互換）
3. **P1-PERF-001〜003**（体感速度）
4. **P2-VFX-001〜004** + アセット生成（見た目をスマホゲー級へ）
5. 最後に E2E テスト & QA

---
