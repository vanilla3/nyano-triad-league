---
name: nytl-ui-vfx-style
description: Apply Nyano UI/UX quality rules: Nintendo-level clarity + premium cute visuals + restrained VFX. Trigger when asked to improve UI, battle visuals, or to reduce cheap/noisy effects. Suggest specific UI changes and how to implement them without bloating complexity.
---

# nytl-ui-vfx-style

## 目的
UI/UXを「直感的で迷わない」方向へ整えつつ、見た目を上質にします。

## UX（任天堂レベルの直感）
- 主導線は常に1つ（Play / Watch / Replay のうち今の画面で最優先はどれか）
- 高度設定・拡張機能は“奥”へ（その他、詳細、開発者向け）
- ボタン文言は行動を表す動詞で統一（例：今すぐ対戦、リプレイを見る）

## ビジュアル（上質かわいい）
- 影・余白・素材感で高級感（派手なグラデより“光の設計”）
- エフェクトは短く、意味のある瞬間だけ
- 常時キラキラ/点滅はノイズ。主役（カード/NFTアート）を邪魔しない

## VFX品質段階
- vfx=off/low：フィルタ無し（bloom/blur禁止）、軽いトランジションのみ
- vfx=medium：短いフラッシュ/リップル/ライン
- vfx=high：箔/ホロ等の質感（ただし軽量）

## 出力
- UI改善案（画面単位）
- 実装案（コンポーネント/ファイル単位）
- 受け入れ条件（迷わないことをどう判定するか）

