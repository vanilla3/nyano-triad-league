# Work Order: 003 Upgrade Pixi battle visuals to "mobile game quality" (quality tiers)

## 1) 背景 / 目的
現状：
- Pixiレンダラは導入済みだが、素材/質感/演出の“上品さ”が不足しやすい

目的：
- 盤面・カード・演出を、DOMより一段上の品質へ（スマホゲー級）
- ただし端末差を考慮し、`data-vfx`（off/low/medium/high）で重さを調整

## 2) 成果物
- [x] Pixi盤面のベース素材（背景/セル/影/枠）を差し替え
- [x] カード枠 + ガラス + 箔（highのみ）で高級感
- [x] “うるさい常時キラキラ”を排除し、イベント同期の短い演出に変更
- [x] 低品質モードでも視認性は落とさない

## 3) 要件
### MUST
- vfx=off/low で重いフィルタを使わない
- vfx=medium/high で「置いた瞬間」「反転」「勝敗」の演出が分かる
- 盤面/カードが安っぽく見えない（影/ハイライト/素材感）

### SHOULD
- アセットは `apps/web/public/assets/engine/` に集約
- sprite atlas（任意）でロード効率を上げる

## 4) 非要件
- 3D化（Babylon等）は別PR

## 5) 受け入れ条件
- `?ui=engine`（または相当フラグ）で最後まで対戦できる
- `pnpm -C apps/web test` が通る（レンダラテスト含む）
- vfxを切替えても破綻しない

## 6) 調査ポイント
- `apps/web/src/engine/renderers/pixi/PixiBattleRenderer.ts`
- `apps/web/src/engine/renderers/pixi/cellAnimations.ts`
- `apps/web/src/engine/renderers/pixi/textureResolver.ts`
- `apps/web/src/lib/visual/visualSettings.ts`（data-vfx）

## 7) 実装方針
- まずは“素材差し替え + 影 + 枠”で安っぽさを消す
- 次に“イベント同期の短い演出”を導入（常時ノイズ禁止）
- 最後に high 限定で箔/ホロ（軽量実装）

## 8) タスク
- [x] 003-A: アセット配置（board/cell/card/fx）
- [x] 003-B: 盤面レイヤー（背景/枠/影/セル）
- [x] 003-C: 演出（place/flip）を上品に（短い/意味のある）
- [x] 003-D: high限定で箔/ホロ（または疑似表現）
- [x] 003-E: vfx切替のテスト/手順書

## 9) 検証
- `pnpm -C apps/web test`
- 手動：低性能想定（DevTools CPU throttle）で quality が落ちても操作できる
- 重点ユニット: `pnpm -C apps/web test -- cellAnimations foilFx vfxQualitySwitchGuard boardLayerTokens preloadPolicy`
- 手順書（VFX切替）
  1. `/match?ui=engine` を開き、フォーカスツールバーの VFX セレクタを `off → low → medium → high` の順で切替。
  2. `off/low` で重い演出が抑制されること、`high` でのみカードの箔ベース + place/flip時の短いフラッシュが出ることを確認。
  3. 同じ確認を Replay 画面（フォーカスツールバー）でも行い、切替時に進行不能や描画破綻がないことを確認。

## 10) リスク/ロールバック
- アセット差し替えで見え方が変わる → feature flag で旧見た目へ戻せる道を残す
