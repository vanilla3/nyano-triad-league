# UI Gamefeel v4 — “触って分かる” Mint Material / Board / 図鑑 / ルール導線

この ExecPlan は living document です。`Progress` / `Decision Log` / `Surprises & Discoveries` / `Outcome` を作業とともに更新します。

> 合言葉: **UI は飾りではなく、ゲーム体験そのもの。**

---

## 1) Purpose / Big Picture

Nyano Triad League の UI を「Webアプリ」から「モバイルゲーム」へ寄せます。

ユーザーができるようになること:

- 画面を眺めるだけで「押せる」「選べる」「今なにをすべきか」が分かる
- 触った瞬間に「気持ちよさ（手触り・反応）」が返ってくる
- ルール（とくに Classic 追加ルール）を **迷わず** 選んで対戦を開始できる
- 図鑑/デッキ（カード閲覧〜編成）を「遊び」として眺められる
- バトル盤面が “ゲーム画面” として成立する（面の奥行き・スロット感・視線誘導）

この改善は「任天堂品質（触るだけで理解できる）」へ向けた **UIの地盤工事** です。

---

## 2) Scope

### In-scope

- Mint UI の **マテリアル表現 v4**（ボタン/ピル/パネル/チップ）
- 盤面（BoardViewMint）の **トレイ/スロット表現** と “置ける感” の強化
- 図鑑（CardBrowser / Decks）を Mint トーンで再設計
- ルール選択 UI を「迷わない」形へ（Classic 追加ルールを使えるように）
- （任意）背景/装飾アセットを Gemini（Nano Banana Pro）で生成し、適用

### Out-of-scope

- ルールそのものの追加・変更（triad-engine のロジック拡張）
- カードアート（Nyano NFT）生成・差し替え
- Pixi ステージ側の大型刷新（最小の見た目調整は可）

---

## 3) Non-negotiable constraints (Invariants)

- 決定論（transcript 再現）を壊さない
- URL 互換を壊さない（既存クエリ/ハッシュの意味は維持）
- `state_json v1` / `streamer_bus` / viewer command の互換を壊さない
- Pixi/WebGL 失敗時のフォールバックを残す
- `prefers-reduced-motion` と `data-vfx` を尊重する（演出は切れる）

---

## 4) Current State (What exists today)

### 4.1 既にあるもの（強み）

- Mint UI 基盤
  - `MintGameShell` / `MintAppChrome`
  - `GlassPanel` / `MintPressable` / `MintBigButton` / `MintTabNav` / `MintTypography`
  - `apps/web/src/mint-theme/mint-theme.css`
- 盤面（BoardViewMint）は “パフ感” のあるセル/発光/アニメが既にある
- Gemini 画像生成パイプライン（任意）
  - `scripts/gemini_image_gen.mjs`
  - `docs/01_design/NYTL_ASSET_GEN_GEMINI_NANO_BANANA_PRO_v1_ja.md`
  - `scripts/asset_prompts/nytl_ui_assets.v2.json`
- Classic 追加ルールのロジック/レジストリは存在
  - `packages/triad-engine/src/classic_rules/*`
  - `apps/web/src/lib/ruleset_registry.ts` に classic ルール ID がある

### 4.2 まだ弱いところ（今回のターゲット）

- **ボタンの“厚み”と“手触り”** が足りない
  - 枠/影/内側ハイライトが 1層で、ゲームUI特有の立体が出ていない
  - 押下時に “影が潰れて沈む” 表現が不足
- **盤面の“トレイ/スロット感”** が弱い
  - ボード外周はあるが、セルが “置き場” として沈み込んで見えにくい
- **図鑑（カードブラウザ）** が Tailwind 直書き UI のままで、Mint トーンから浮く
  - `CardBrowser.tsx` / `MatchSetupPanelMint.tsx` の一部が legacy styling
- Classic 追加ルールは「存在する」ものの、UI が **迷路** になりやすい

---

## 5) Proposed Design

必読:

- `docs/01_design/NYTL_GAME_UI_QUALITY_PRINCIPLES_SAKURAI_LENS_v1_ja.md`
- `docs/01_design/NYTL_MINT_MATERIAL_SPEC_v1_ja.md`
- `docs/01_design/NYTL_UI_ASSET_MANIFEST_v2_ja.md`

設計方針（要約）:

- **“触れるものは触れそうに見える”**（押せる感＝縁/影/光の整合）
- 一画面一主役：迷わせない情報設計（主導線は 1本に太く）
- 演出は “気持ちいい最短距離”。過剰にしないが、無反応にもしない
- 背景/装飾は UI と喧嘩させない（彩度/密度/コントラストを制御）

---

## 6) Implementation Steps (Milestones)

### Milestone A: Classic 追加ルールを「使えるUI」にする

- 対象 Work Order:
  - WO-025 `classic_rules_registry_and_cli.md`
  - WO-026 `match_setup_enable_classic_rules.md`
  - WO-027 `rules_setup_nintendo_quality.md`

受け入れ基準:

- `/rulesets` または対戦開始導線から Classic ルールを選べる
- 選んだルールが “現在の対戦に何が起きるか” を短い日本語で説明する
- 1〜2クリックで「おすすめプリセット（Classic）」を適用できる

### Milestone B: Mint Material System v4（ボタン/ピル/チップ/パネル）

- 対象 Work Order: WO-028

受け入れ基準:

- `MintPressable` が “厚み/縁/艶/影” を持つ（画像参照に近い）
- hover/active/selected/disabled の状態が視覚的に一貫
- 44px 以上のヒット領域（モバイルで押しやすい）

### Milestone C: 盤面を「トレイ + スロット」にする

- 対象 Work Order: WO-029

受け入れ基準:

- 空セルが “凹んだスロット” に見える（置き場が分かる）
- 置ける場所のハイライトが “ゲーム的” に強い（しかし目が痛くない）
- `data-vfx=off/low` で過剰演出が抑制される

### Milestone D: 図鑑/Deck Builder を Mint トーンに統一

- 対象 Work Order: WO-030

受け入れ基準:

- `CardBrowser` が Mint UI コンポーネントを使い、統一感が出る
- フィルタ/検索/選択が “触って分かる” UI になる
- 390px 幅でも破綻しない（E2Eガードレール維持）

### Milestone E: アセット生成 & 適用（任意・あると跳ねる）

- 対象 Work Order: WO-031

受け入れ基準:

- アセットがある環境では、背景/装飾が参考画像に近づく
- アセットが無い環境でも致命的な 404 連発にせず（または影響を最小化）

---

## 7) Verification

### Commands

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e:mint`（Mint画面のガードレール）
- `pnpm -C apps/web e2e:ux`（盤面/手札/フォーカス導線のガードレール）

（ルール関連を触る場合）
- `pnpm -C packages/triad-engine test`

### Manual checks

- `/`（Home）: 主導線が 1秒で理解できるか
- `/arena`（Mint）: Quick Play が迷わず押せるか
- `/decks`（Mint）: 図鑑/フィルタ/保存導線が直感的か
- `/match?ui=mint` : 盤面が “置ける” と直感できるか
- `/rulesets` : Classic ルールが見つかり、適用が簡単か

---

## 8) Risks / Rollback

- CSS のレイヤー増加でパフォーマンス低下（特に `backdrop-filter`）
  - 回避: blur を “大きい面だけ” に限定し、ボタンは疑似艶（擬似ハイライト）中心にする
- 影/縁の強化で可読性が落ちる
  - 回避: テキストは stroke/shadow をルール化（薄色背景でも沈まない）

ロールバック:

- `mint-theme.css` の新規クラス追加は後方互換を保つ
- 主要変更はクラス/変数で切り戻し可能にする

---

## 9) Progress

- [x] A: Classic 追加ルール UI（WO-025〜027）
- [x] B: Mint Material v4（WO-028）
- [x] C: Board tray / slots（WO-029）
- [x] D: 図鑑 Mint 化（WO-030）
- [x] E: Asset generation/integration（WO-031）

---

## 10) Decision Log

- 2026-02-18: ボタン表現は画像依存に寄せすぎず、**CSSで“基本形”** を作る（保守/解像度/テーマ変更を優先）
- 2026-02-18: アセットは `assets/gen` を参照しつつ、未配置でも成立するよう CSS 多層フォールバックを維持する

---

## 11) Surprises & Discoveries

- Playwright E2E はこの実行環境で `spawn EPERM` が発生し、ローカルでは自動実行できない
- `pnpm -C apps/web e2e:mint` は scripts 未定義のため、Mint系検証は `e2e:ux` + `mint-app-screens-guardrails` で補完する

---

## 12) Outcome / Retrospective

- WO028-031 の主要実装は完了。Mint材質/盤面/図鑑トーン統一と、任意アセット統合の基盤を揃えた。
- 必須の `test` / `typecheck` / `build` は通過。E2E は環境制約（`spawn EPERM`）で継続課題。
