# commit-0037 IMPLEMENTATION LOG

## What
UIの「機械っぽさ」をさらに減らし、Nyanoらしい可愛さと分かりやすさを上げるために、
**フィードバック（toast）**と**折りたたみ（disclosure）**を導入し、コピー/共有/デバッグ導線を整理しました。

## Why
- 管理/検証系の画面は「操作の成功/失敗」が多い割に、ページ内のテキスト表示だけだと視線が散る
- JSON/長いID/URLが増えてきたため、常時表示すると認知負荷が上がる（必要な人だけ開ける形にする）
- Replay/Playground の “検証装置” としての使い勝手を上げると、議論が回りやすい

## Changes
### Web UI
- Global:
  - ToastProvider（全ページ）を追加し、コピー等の成功通知を一貫化
  - `badge-emerald` を追加（active 状態などに使用）
  - Disclosure（details/summary）で “必要な人だけ開く” 表示を追加

- Components:
  - `Toast`（useToast）
  - `CopyField`（長い値を短縮表示 + Copy/Open + Expand/Fold）
  - `Disclosure`（progressive disclosure）

- Pages:
  - Decks: status行を廃止し、Copy/Save/Import/Delete を toast に寄せてスッキリ
  - Nyano: RPC/Contract を CopyField 化、コピーのフィードバックを toast に統一
  - Rulesets: コピーのフィードバックを toast 化、テーブルの視認性微改善（hover/URI truncate）
  - Playground: コピーを toast 化 + Raw JSON を Disclosure に折りたたみ
  - Replay: コピーを toast 化 + Raw JSON を Disclosure に折りたたみ
  - Events: status badge を統一 + attempt の Copy/Remove/Clear に confirm/toast を追加
  - Match: transcript/share のコピーを toast 化（AIのステータス表示を潰さない）

### Docs
- UI Style Guide v1 を更新（Toast / Disclosure / CopyField を追加）

## Files
- apps/web/src/styles.css
- apps/web/src/App.tsx
- apps/web/src/components/Toast.tsx (new)
- apps/web/src/components/CopyField.tsx (new)
- apps/web/src/components/Disclosure.tsx (new)
- apps/web/src/pages/Decks.tsx
- apps/web/src/pages/Nyano.tsx
- apps/web/src/pages/Rulesets.tsx
- apps/web/src/pages/Playground.tsx
- apps/web/src/pages/Replay.tsx
- apps/web/src/pages/Events.tsx
- apps/web/src/pages/Match.tsx
- docs/01_product/Nyano_Triad_League_UI_STYLE_GUIDE_v1_ja.md

## Check
- Web UI（目視）
  - /decks: 保存・コピー・インポート・削除の toast
  - /nyano: RPC/Contract の CopyField、Copy toast
  - /rulesets: Copy toast / URI truncate
  - /playground: Copy toast / Raw JSON disclosure
  - /replay: Copy toast / Raw JSON disclosure
  - /events: attempt の Copy/Remove/Clear
  - /match: Copy transcript/share が toast で出る（status表示はAIノート用に残る）
