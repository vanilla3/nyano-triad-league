# Work Order 023: Gemini（Nano Banana Pro）画像生成パイプライン導入

## Goal

UI 改修で必要になる
- 背景（雲/きらめき/バナー）
- アイコン（線画パステル）
- 装飾（バッジ/ステッカー）

などを、**repo 内のスクリプトで生成・管理**できるようにする。

## Scope

- Node スクリプト追加: Gemini API（`gemini-3-pro-image-preview` 推奨）に POST し、PNG を保存
- バッチ生成のための JSON フォーマット定義とサンプル追加
- `docs/01_design/NYTL_ASSET_GEN_GEMINI_NANO_BANANA_PRO_v1_ja.md` の追加
- `apps/web/public/assets/gen/`（または同等）に生成物を配置できるルールを作る

## Non-goals

- 生成素材を “最終アセット” として確定する
- API Key を repo にコミットする

## Acceptance Criteria

1) `GEMINI_API_KEY` がセットされていれば、単発生成ができる
   - 例: `node scripts/gemini_image_gen.mjs --prompt "..." --out apps/web/public/assets/gen/test.png`

2) バッチ生成（複数アセット）ができる
   - 例: `node scripts/gemini_image_gen.mjs --batch scripts/asset_prompts/nytl_ui_assets.v1.json`

3) API Key が無い場合は、エラーを分かりやすく表示して終了する（silent failure しない）

4) 生成後に `pnpm -C apps/web build` が通る（ビルドへ悪影響を出さない）

## Implementation Notes

- 依存追加を最小にするため、Node の `fetch` を使って REST API を直接叩いて良い
- 画像の最適化は optional。
  - 既に repo には `sharp` があるので、必要なら `--also-webp` などのオプションで追加生成
- 生成物の命名は「目的 + サイズ + v」など、差し替えが容易なルールに

## References

- `docs/01_design/NYTL_MINT_UI_REFERENCE_APP_SCREENS_v1_ja.md`

## Files

- (new) `scripts/gemini_image_gen.mjs`
- (new) `scripts/asset_prompts/nytl_ui_assets.v1.json`
- (new) `docs/01_design/NYTL_ASSET_GEN_GEMINI_NANO_BANANA_PRO_v1_ja.md`
- `apps/web/public/assets/`（生成物置き場）

## Test

- `pnpm -C apps/web build`

Manual:
- `GEMINI_API_KEY=... node scripts/gemini_image_gen.mjs --prompt "..." --out apps/web/public/assets/gen/smoke.png`
