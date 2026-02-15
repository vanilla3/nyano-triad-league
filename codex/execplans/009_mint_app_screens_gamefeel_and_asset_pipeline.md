# ExecPlan 009: Mint UI をアプリ全体へ拡張（Home / Arena / Deck Builder / Onboarding）+ 画像生成パイプライン

## Why

現在の Mint UI は /match（対戦画面）での表現力が上がってきた一方、
Home / Arena / Decks などのページは「Web サービスの管理画面」寄りの印象が残り、
参照画像のような **“スマホゲームの画面”** に到達していない。

また、ゲーム UI の完成度を上げるためには、背景素材・アイコン・バナー等の **アセット整備** が必要。
可能であれば Gemini（Nano Banana Pro）を使って高速にプロトタイプ資産を生成し、
以後の UI 改修を滑らかにする。

## Goals

1. Mint Theme 時に、アプリ全体（Home/Arena/Deck Builder/Onboarding）が参照画像に近い「ゲーム画面」になる
2. UI を構成するプリミティブ（GlassPanel/BigButton/TabNav/Icon）が揃い、横展開できる
3. 画像生成（Gemini Nano Banana Pro）で UI 用の“仮アセット”を作れる開発パイプラインが repo 内にある
4. 決定論・URL 互換・配信/ステージ要件を壊さない

## Non-goals

- triad-engine のロジック改変、トランスクリプト互換に関わる変更
- ルール実装や AI ロジックなどゲーム仕様の追加
- 画像生成で作った素材を「最終アセット」と断定する（あくまでプロトタイプ/補助）

## References

- 参照画像要素分解: `docs/01_design/NYTL_MINT_UI_REFERENCE_APP_SCREENS_v1_ja.md`
- 既存 Mint UI: `apps/web/src/mint-theme/mint-theme.css` と Mint 系コンポーネント

## Constraints (must keep)

- Transcript 再現性（決定論）
- URL schema / query param 互換
- Stage/Overlay での UI 破綻防止（特に focusRoute）
- `prefers-reduced-motion` / `data-vfx` による演出制御

## Execution Strategy

### Phase A: 土台（プリミティブと Shell）

- `MintGameShell`（背景/セーフエリア/中央カラム）を作る
- `GlassPanel / GlassCard / GlassPill` を部品として定義
- `MintIcon`（SVG）をスタイル統一して用意
- Mint theme 時は AppLayout のヘッダー/フッターを “ゲーム UI のクローム” に置換

### Phase B: 画面移植

- Home を「メインメニュー」へ（大ボタン4 + 3ステップ）
- Arena を「モード選択」へ（左サイドナビ + 右 Quick Play + 下難易度）
- Decks を「Deck Builder」へ（左 stats/filter + 中央グリッド + 右 summary）
- Onboarding（既存 onboarding.ts を活用）を 3 カード UI へ

### Phase C: アセット生成パイプライン

- Gemini API（Nano Banana Pro）を叩いて PNG を生成する Node スクリプトを追加
- 生成物の置き場/命名/プロンプトテンプレを整備
- 生成物は Sharp で Web 用最適化（必要なら）

### Phase D: ガードレール

- Playwright (or existing e2e) で最低限のスクショ/レイアウトシフト検知を追加
- 390px 幅 / 1024px 幅のレイアウト崩れを予防

## Work Orders

- WO-017: MintGameShell + App Chrome（Mint でヘッダー/フッターをゲームUI化）
- WO-018: Home をメインメニュー UI に刷新
- WO-019: Arena をモード選択 UI に刷新
- WO-020: Decks を Deck Builder UI に刷新
- WO-021: Onboarding を 3ステップカード UI へ刷新
- WO-022: Icon/タイポ/ボタン押下の統一（MintIcon/pressable）
- WO-023: Gemini（Nano Banana Pro）画像生成パイプライン導入
- WO-024: e2e / Visual guardrails（基本ページのスモーク）

## Validation

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

必要に応じて:
- `pnpm -C apps/web e2e`

## Rollback Plan

- Mint の AppChrome は feature flag（theme= mint のみ）に限定
- 画面移植は 1 Work Order = 1 PR で段階的に戻せる

