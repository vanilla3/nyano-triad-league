# commit-0036 IMPLEMENTATION LOG

## What
管理画面（Decks / Rulesets / Playground / Nyano）を「Nyanoらしい、かわいくて分かりやすい」雰囲気に寄せるため、
デザインの土台（CSSコンポーネント）とナビゲーション、主要ページの情報設計を更新。

## Why
- いまは機能中心で、視線誘導/階層/意味色が弱く、機械的に見える
- コミュニティ運営を想定すると「共有・検証・議論」導線はUI品質が体験価値に直結する

## Changes
### Web UI
- Global theme: 背景を rose↔sky のソフトグラデーションへ
- コンポーネント: card / button / badge / callout / nav-pill を追加・統一
- ナビゲーション: “丸いピル + グラデ主色”でアクティブを明確化
- Decks: TIP callout + Delete を danger+confirm へ
- Nyano: mint.nyano.ai への導線、RPC/Contractのコピー、例ボタン、見やすい情報ブロック
- Rulesets: WHY/Filter/Count を分離、コピーアクションを追加

### Docs
- UI Style Guide v1（暫定）を追加：デザインの合意形成用

## Files
- apps/web/src/styles.css
- apps/web/src/App.tsx
- apps/web/src/pages/Decks.tsx
- apps/web/src/pages/Nyano.tsx
- apps/web/src/pages/Playground.tsx
- apps/web/src/pages/Rulesets.tsx
- docs/01_product/Nyano_Triad_League_UI_STYLE_GUIDE_v1_ja.md

## Check
- apps/web: 主要ページを開いて視認性・導線・コピー動作を確認
  - /decks, /rulesets, /nyano, /playground
