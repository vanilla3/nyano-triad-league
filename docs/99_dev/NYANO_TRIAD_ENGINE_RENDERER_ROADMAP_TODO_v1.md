# Nyano Triad League — ゲームエンジン活用（PixiJS中心）で“スマホゲー級”に引き上げるロードマップ & TODO（v1）

対象：`nyano-triad-league-main (12).zip` の `apps/web`（Vite + React + TS）  
目的：**対戦体験（盤面・カード・演出）をゲームエンジン/描画エンジンでGPUレンダリング化**し、見た目・手触り・安定fpsを底上げする。

> 注記：以前の添付物の一部は期限切れになっている可能性があります。今回は **(12).zip のコードのみ**を前提に整理しています。

---

## 0. 結論（採用方針）

### 推奨：**PixiJS v8 を “対戦シーン専用レンダラ” として導入**
- 既存の **React/TS資産（ルーティング、UI、リプレイ/共有、AI対戦、デッキ/イベント）を維持**したまま、`/match`（必要なら `/replay` も）だけCanvas(WebGL/WebGPU)化できる。
- Pixi v8 は環境によって WebGL/WebGPU/Canvas を切り替えやすく、**端末性能差に合わせた品質調整**がしやすい。
- `data-vfx`（既存のVFX品質設定）と連動し、**FXを自動/手動で軽くする**設計に繋げやすい。

### 中期オプション：盤面の“舞台感”を上げたくなったら Babylon.js（3D土台のみ）
- ただし初手から3Dは作業面積が増えるので、まず Pixi で勝ち筋（動作/品質/ロード）を固める。

---

## 1. 現状確認（(12).zip を見て分かったこと）

### 1.1 対戦画面の構造（現状）
- `apps/web/src/pages/Match.tsx`
  - `ui` クエリでテーマ分岐（default `"mint"`）。
  - Mint UI：`DuelStageMint` + `BoardViewMint` + `BattleHudMint` + `HandDisplayMint` など。
- カード表現：
  - `CardNyanoDuel` が NFTアートを主役として表示（`NyanoCardArt`）。
  - `NyanoCardArt` は `useNyanoTokenMetadata` → Arweave URL → fallback gateway → 生成プレースホルダの順。

### 1.2 既にある“品質調整の土台”
- `lib/visual/visualSettings.ts`
  - `VfxQuality: off/low/medium/high` を `data-vfx` として `<html>` に付与。
  - `local_settings.ts` に `nytl.vfx.quality`（auto含む）保存済み。
- SFX：`lib/sfx` + `Match.tsx` にミュートトグルあり。

> つまり、「端末性能差でエフェクトの重さを変える」思想はすでに存在します。  
> ゲームエンジン導入も、この既存の品質制御に“合流”させるのが最短です。

---

## 2. エンジン導入の設計（Reactシェル + Pixiレンダラ）

### 2.1 ゴール像（最終形）
- **ReactはUI/HUD/導線/モーダル/設定/共有/リプレイ**を担当
- **Pixiは盤面・カード・演出・入力（必要なら）**を担当
- ただし最初は安全に：**盤面だけPixi → 手札もPixi → 演出統合**の順で移行

```
[React MatchPage]
  ├─ <BattleHudMint />  (DOM)
  ├─ <HandDisplayMint /> (DOM)    ← 初期は残す
  └─ <BattleStageEngine /> (Canvas)
        └─ PixiBattleRenderer
            ├─ BoardLayer
            ├─ CardLayer (placed cards)
            ├─ FxLayer
            └─ DebugLayer (optional)
```

### 2.2 “Renderer Abstraction” を入れて将来差し替え可能にする
- Pixi を固定実装すると後で3D化しづらいので、最初に小さなインターフェースを置く。
- 例：`apps/web/src/engine/renderers/IBattleRenderer.ts`

```ts
export type BattleRendererQuality = "off"|"low"|"medium"|"high";

export type BattleRendererInit = {
  container: HTMLElement;
  quality: BattleRendererQuality;
  assetsBase: string; // "/assets/engine" など
};

export type BattleRendererState = {
  board: BoardState;
  handA?: CardData[];
  handB?: CardData[];
  currentPlayer?: 0|1|null;
  selectableCells?: Set<number>;
  selectedCell?: number|null;
  placedCell?: number|null;
  flippedCells?: number[];
  // 将来: chainTraces, warnings, etc
};

export interface IBattleRenderer {
  init(init: BattleRendererInit): Promise<void>;
  resize(): void;
  setQuality(q: BattleRendererQuality): void;
  setState(s: BattleRendererState): void;
  playPlace(cell: number): void;
  playFlip(cells: number[]): void;
  destroy(): void;
}
```

---

## 3. ロードマップ（実装フェーズ）

### M0（1〜2日）: Pixi導入 + “盤面だけ”描画できる最小レンダラ
- 目的：**壊さずに差し込む**。既存Mint UIは維持し、`ui=engine` または `renderer=pixi` で有効化。
- 成果：
  - Pixi canvas が表示され、3x3盤面の枠と選択可能セルのハイライトが出る
  - クリック/タップが既存の `handleCellSelect` に繋がる

### M1（2〜4日）: 盤面カード（配置カード）をPixiで描画（NFTアート含む）
- 目的：**盤面上のカードが“ゲーム的に映える”**ようにする。
- 成果：
  - 配置カード（9枚まで）が Pixi 上で表示
  - `NyanoCardArt` 相当の画像URL解決を再利用し、**同じNFT画像**が見える
  - 置いた瞬間のアニメ（ドロップ + 影 + 小さな光）／フリップ演出が動く

### M2（3〜6日）: 手札もPixiへ（任天堂レベルの入力感を作る）
- 目的：**タップ→選択→配置**が直感的で気持ちいい（スマホで勝つ）。
- 成果：
  - 手札5枚を Pixi で表示（片側のみでもOK）
  - 選択カードの“浮き上がり”と、置けるマスの誘導（強すぎない）
  - ドラッグ（PC）とタップ（モバイル）の両立

### M3（継続）: “最新技術”を盛り込んだ上品な演出（品質段階あり）
- 目的：安っぽさを消し、**素材感・奥行き・光**で格を上げる。
- 成果：
  - Holo/foil（箔）表現：角度で色が変わる、ただし低品質では無効
  - ハイライトは「常時キラキラ」ではなく**イベントに同期して短く**出る
  - Quality: off/low/medium/high を `data-vfx` と同期

### M4（任意）: `/replay` も同じレンダラで再生（共有映え）
- 目的：リプレイを“観戦コンテンツ”にする。
- 成果：
  - `Replay.tsx` の盤面を同じレンダラで表示（再生ステップと同期）
  - “見せ場”の演出（ハイライト/スロー/字幕）は medium/high のみ

---

## 4. TODO（AIがそのまま着手できる実装タスクリスト）

> ルール：各タスクは **「目的」「変更ファイル」「実装手順」「受け入れ条件（AC）」「テストコマンド」**を必ず満たす。

---

### EPIC ENG-000: 導入準備（依存追加・フラグ導線・最小Canvas表示）

#### ENG-001: PixiJS導入（依存/ビルド設定）
- 目的：Pixiを安全に導入し、bundleを分離して初回ロード悪化を抑える。
- 変更：
  - `apps/web/package.json` に `pixi.js` を追加
  - `apps/web/vite.config.ts` の `manualChunks` に `vendor-pixi` を追加
- 実装手順：
  1) `pnpm -C apps/web add pixi.js`
  2) `vite.config.ts` に `vendor-pixi: ["pixi.js"]` を追加
- AC：
  - `pnpm -C apps/web build` が通る
  - ビルド成果物に pixi chunk が分離されている
- テスト：
  - `pnpm -C apps/web build`

#### ENG-002: `ui=engine`（または `renderer=pixi`）で切替できる導線を追加
- 目的：既存UIを壊さず段階導入できるようにする。
- 変更：
  - `apps/web/src/pages/Match.tsx`
  - `apps/web/src/pages/Home.tsx`（デモ導線）
- 実装手順：
  1) `const isEngine = ui === "engine"` を追加
  2) Mintの分岐に `isEngine` を挿入（最初はBoard部分のみ差し替え）
  3) Homeから `/match?ui=engine` へ遷移できるボタンを追加（DEVのみでも可）
- AC：
  - `?ui=mint` は従来どおり
  - `?ui=engine` で canvas が出る（次タスクで）
- テスト：
  - `pnpm -C apps/web dev` でURL確認

#### ENG-003: エンジン用ディレクトリとレンダラI/Fを作成
- 目的：将来 Babylon等へ差し替え可能にする土台。
- 追加：
  - `apps/web/src/engine/renderers/IBattleRenderer.ts`
  - `apps/web/src/engine/renderers/pixi/PixiBattleRenderer.ts`
  - `apps/web/src/engine/components/BattleStageEngine.tsx`
- 実装手順：
  1) `IBattleRenderer` を上記仕様で作成
  2) PixiBattleRenderer は「盤面背景 + 3x3セル枠 + 選択可能セルのハイライト」だけ実装
  3) `BattleStageEngine` で mount/unmount と resize を管理（ResizeObserver）
- AC：
  - `BattleStageEngine` をページに置くと canvas が表示される
  - 画面リサイズで追従する
- テスト：
  - `pnpm -C apps/web typecheck`
  - `pnpm -C apps/web test`（可能なら簡単なレンダラユニット）

---

### EPIC ENG-100: 盤面入力の接続（Reactロジックは維持）

#### ENG-101: selectableCells / selectedCell をレンダラへ伝播
- 目的：UI誘導をPixi側へ移す（DOMのmint-cell breathe等を置き換える下地）。
- 変更：
  - `BattleStageEngine.tsx`（props設計）
  - `Match.tsx`（BoardViewMintのprops相当を渡す）
- 実装手順：
  1) `BattleStageEngine` の props に `state: BattleRendererState` を追加
  2) `Match.tsx` で `boardNow / selectableCells / draftCell / currentPlayer` を state に詰めて渡す
- AC：
  - 選択可能セルが点灯
  - 選択セル（draftCell）が強調
- テスト：
  - `pnpm -C apps/web dev`（手番でセルが光る）

#### ENG-102: cell tap → `onCellSelect` に接続
- 目的：操作を壊さず移行する。
- 変更：
  - `PixiBattleRenderer.ts`
  - `BattleStageEngine.tsx`
- 実装手順：
  1) Pixi側で各セルに hit area を設定（Graphics または Sprite）
  2) `onCellTap(cellIndex)` を `BattleStageEngine` から受け取り、Matchの `handleCellSelect` を呼ぶ
  3) `selectableCells` 外のセルは入力無効
- AC：
  - `?ui=engine` でも置ける（従来と同じルール）
- テスト：
  - 対戦を最後まで進められる（少なくとも手動9手）

---

### EPIC ENG-200: NFT画像・カード描画（盤面カードの“主役化”）

#### ENG-201: 盤面カード（placed cards）の描画
- 目的：盤面に置かれたカードを Pixi で “カードらしく” 表示。
- 追加/変更：
  - `apps/web/src/engine/renderers/pixi/layers/CardLayer.ts`（新規）
  - `PixiBattleRenderer.ts`（レイヤー合成）
- 実装手順：
  1) BoardState を走査して `cell.card` を描画
  2) カード枠（frame）+ NFT art（sprite）+ 数字（Text/BitmapText）を重ねる
- AC：
  - 盤面にカードが置かれたら即表示される
  - owner（A/B）で薄い色調が変わる
- テスト：
  - `pnpm -C apps/web dev` で目視

#### ENG-202: 画像URL解決を “既存ロジック” と共有する
- 目的：DOM版（NyanoCardArt）と URL生成がズレないようにする。
- 追加：
  - `apps/web/src/engine/assets/nyanoImageUrl.ts`
- 実装手順：
  1) `lib/nyano/useNyanoTokenMetadata` が最終的に返す `imageUrl` 生成ロジックを参照し、**重複しない形**で抽出する  
     - 例：`resolveNyanoImageUrl(tokenId, gameIndexMetadata, env)` のような純関数に寄せる
  2) Pixi側はそのURLを受け取り `Assets.load`（または Texture.fromURL）する
- AC：
  - DOM表示と Pixi表示が同じNFT画像になる
- テスト：
  - 同じ tokenId で DOM/Pixi を見比べても一致

#### ENG-203: 画像プリロード（5枚手札 + 盤面最大9）で体感速度を上げる
- 目的：スマホで“読み込み待ち感”を消す。
- 変更：
  - `BattleStageEngine.tsx` or `PixiBattleRenderer.ts` に preload キュー
- 実装手順：
  1) `tokenId` 群が見えたタイミングでURLを列挙
  2) LRU（最大30〜60テクスチャ）で保持し、再戦で再利用
  3) 低品質（data-vfx=low/off）ではプリロード同時数を絞る（例：2本）
- AC：
  - 手札切り替えや盤面配置時に「急な白抜け」が減る
- テスト：
  - network throttling（DevTools）でも壊れない

---

### EPIC ENG-300: アニメーション & 演出（上品・短い・意味のあるエフェクト）

#### ENG-301: Place演出（カードドロップ + 影 + リップル）
- 目的：置く瞬間が気持ちいい（スマホゲー必須）。
- 入力：
  - 既存 `useBoardFlipAnimation` の `placedCell` を活用（またはレンダラ内部でdiff）
- 実装手順：
  1) `playPlace(cell)` を実装（scale/position/alpha）
  2) リップルは low では無し、medium/high で1発だけ出す
- AC：
  - 置いた瞬間が視覚で分かるが、うるさくない
- テスト：
  - 連続で置いてもフレーム落ちしにくい

#### ENG-302: Flip演出（回転 + owner色の変化 + 小さなフラッシュ）
- 目的：フリップの因果が明確になる。
- 入力：
  - `flippedCells` を使用
- 実装手順：
  1) `playFlip(cells)` を実装（y回転/色相変化）
  2) `data-vfx=off/low` では短縮（もしくは点滅のみ）
- AC：
  - 反転が分かる。眩しすぎない。
- テスト：
  - フリップが多い手でも破綻しない

#### ENG-303: “foil / holo” は高品質だけ（GPUに優しく）
- 目的：安っぽさを消すが、低端末を殺さない。
- 実装手順：
  1) high のみ：カード上に簡易シェーダ（ノイズ + 角度）  
  2) medium：2枚のグラデspriteを加算合成でスライド  
  3) low/off：無し
- AC：
  - lowでも読みやすさが落ちない
- テスト：
  - iPhone低電力モード想定でも描画崩れしない

---

### EPIC ENG-400: 品質段階（環境差の自動調整 + 手動設定）

#### ENG-401: `data-vfx` とレンダラ品質を同期
- 目的：設定が一貫し、運用が楽になる。
- 変更：
  - `BattleStageEngine.tsx`（quality決定）
- 実装手順：
  1) `document.documentElement.dataset.vfx` を読む
  2) `renderer.setQuality("off|low|medium|high")` にマップ
- AC：
  - vfxを変えると即反映
- テスト：
  - localStorage `nytl.vfx.quality` を変えて確認

#### ENG-402: FPS監視で自動ダウングレード（任意）
- 目的：端末差・温度差で突然重くなるのを防ぐ。
- 実装手順：
  1) 3秒平均FPSを計測
  2) 目標未達が継続したら quality を1段落とす（high→medium→low）
  3) “戻す” は慎重に（10秒以上安定したら戻す）
- AC：
  - フリーズしにくい
- テスト：
  - CPU throttling で品質が落ちる

---

### EPIC ENG-500: リプレイ/共有への適用（観戦品質）

#### ENG-501: `/replay` に `ui=engine` を追加（盤面だけでもOK）
- 目的：共有で開いた瞬間から“高品質”に見える。
- 変更：
  - `apps/web/src/pages/Replay.tsx`
- 実装手順：
  1) `ui` param を読み、`BoardView` の代わりに `BattleStageEngine` を使う分岐を追加
  2) 再生ステップに合わせて `setState(board)` を更新
- AC：
  - リプレイ再生が壊れない
- テスト：
  - `pnpm -C apps/web dev` で replay URL の動作確認

---

## 5. 必要な画像アセット（“全部”詳細）

> 既存の `public/board-bg.webp` 等は活用可能。  
> ただし “スマホゲー級” を狙うなら、**エンジン用に最適化された素材**を用意すると一気に化けます。

### 5.1 配置場所（提案）
- `apps/web/public/assets/engine/`
  - `board/`
  - `cards/`
  - `fx/`
  - `ui/`

### 5.2 盤面（board）
1) `board/stage_bg.avif`（またはwebp）
- 用途：盤面全体の下地（かわいい・ミントサイトの世界観）
- 推奨：2048x1024 〜 4096x2048（端末により縮小）
- 備考：`image-set()` で `@1x/@2x` を用意しても良い

2) `board/grid_overlay.png`
- 用途：薄い格子/模様（上品に）
- 推奨：1024x1024 透過PNG（タイル）

3) `board/cell_frame.png`
- 用途：セル枠（9-slice想定）
- 推奨：512x512 透過PNG

4) `board/cell_highlight.png`
- 用途：置けるマスのハイライト（控えめ）
- 推奨：256x256 透過PNG

5) `board/shadow_soft.png`
- 用途：カード下影（ぼけた楕円）
- 推奨：256x128 透過PNG

### 5.3 カード（cards）
1) `cards/card_frame.png`
- 用途：カード外枠（かわいいが安っぽくない）
- 推奨：1024x1536（縦長、枠は透過）

2) `cards/card_glass_overlay.png`
- 用途：ガラス面・光の当たり
- 推奨：1024x1536 透過PNG

3) `cards/foil_mask.png`
- 用途：foil/holoのマスク（highのみ）
- 推奨：1024x1536 グレースケールPNG

4) `cards/icons_janken.png`
- 用途：グー/チョキ/パー（Atlas）
- 推奨：512x512

### 5.4 FX（fx）
1) `fx/sparkle_01.png`（粒）
2) `fx/sparkle_02.png`（星）
3) `fx/ripple_ring.png`（リング）
4) `fx/line_soft.png`（ライン・矢印）
- 推奨：256〜512 透過PNG、できれば2種ずつ

---

## 6. “AIに素材生成”を依頼する場合の指示例（任意）

### 6.1 ボード背景生成（かわいい + ミントサイト）
- 依頼文例（生成AI/Adobeどちらでも可）：
  - 「mint.nyano.ai の配色に合わせた、カードゲーム盤面用の背景。  
     かわいく清潔感があり、子どもっぽすぎない。  
     モチーフ：肉球、ミント、ふわっとした光。  
     中央は情報が載るのでテクスチャは控えめ。  
     4096x2048、tile不要、周辺にディテール、中央は余白。」

### 6.2 カード枠生成（高級感のある“かわいさ”）
- 依頼文例：
  - 「Nyanoの世界観。角丸、ホワイト+ミントの上品な枠。  
     余計な装飾は減らし、素材感（エンボス、箔、ガラス）で高級感。  
     1024x1536、中央は透明、枠だけ描画。」

---

## 7. 実装上の落とし穴（AI実装で事故りやすいポイント）

1) **React再レンダーでPixiを作り直さない**
- Pixiの `Application` は mount時に1回だけ作成、state更新は `setState()` で差分適用。

2) **画像ロードは“詰まり”を作らない**
- 同時ロード数を制限（2〜4）し、見える順で優先。

3) **低品質で無理にフィルタを使わない**
- Bloom/Blur系は `medium/high` のみ。

4) **入力は“誤タップしない”**
- セルhit areaを実際の見た目より少し内側に。

---

## 8. 受け入れ条件（Definition of Done）

- `?ui=engine` で対戦が最後まで完走
- NFT画像が盤面カードに表示される（少なくとも手札/盤面で5枚以上）
- low/medium/high を切り替えても破綻しない
- `?ui=mint` は一切壊れない（フォールバックとして保持）

---

## 9. AIへの作業指示テンプレ（Claude Code / Cursor 用）

> **重要**：1回で全部やらせず、EPIC単位で指示してPRを切る。

```
あなたはこのリポジトリに対して変更を加えるエージェントです。
目的：/match に PixiJS レンダラを段階導入する（ui=engine）。
制約：
- 既存 ui=mint は壊さない
- Pixi Application は1回だけ初期化、state更新は差分適用
- VFX品質は data-vfx と同期（off/low/medium/high）
作業：
1) ENG-001〜ENG-003 を実装
2) pnpm -C apps/web typecheck と build を通す
3) 変更点を簡潔に説明し、次のタスクENG-101へ繋げる
```

---
