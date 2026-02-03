# commit-0030 — Implementation Log（差分）

## Why
- いまの TurnLog は「flipCount」中心で、対戦の“読み物”としてはまだ弱い。
- コミュニティで議論する際に重要なのは、
  - **どのセルが**
  - **どの理由で**
  - **なぜ反転したか**
  が短時間で理解できること。
- そこで、エンジン内部ロジックを UI で複製しすぎない範囲で、boardHistory と TurnSummary から **反転理由の説明**を導出して提示する。

## What
### TurnLog: flip reason（説明）を追加
- 選択中ターンで Δ（board diff）を展開した際、各 flipped cell について以下を表示：
  - 方向（up/right/down/left）
  - 置いたカードの **有効 edge**（triadPlus / warning -1 を反映）
  - 相手カードの対向 edge
  - edge tie の場合は **janken の勝敗**で説明
- edge/janken だけでは説明できない flip（chain/extra rule の可能性）を、説明文で明示して可視化。

## Notes
- 現状の v1/v2（on-chain subset）では、flip は基本「置いたカード vs 隣接カード」比較で説明可能。
- 将来的に chain flip や複合ルールが入った場合、説明文の粒度を落として（“result-based”）に切り替える余地がある。

## Verify
- `pnpm -C apps/web dev`
- Playground/Replay で任意のターンを選択 → Δ を開く → flipped の各行に理由が表示される
- warning / triadPlus / ignoreWarning の違いが説明に反映される
