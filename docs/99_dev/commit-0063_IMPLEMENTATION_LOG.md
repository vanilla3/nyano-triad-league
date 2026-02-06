# commit-0063 IMPLEMENTATION LOG

## What
Merged the external “UI improvements pack” into the real app (not just demo files):

1) **/match: flip + placement animation**
- Added `useBoardFlipAnimation()` + `LastMoveFeedback` (banner)
- Wired last-move animation to:
  - Draft board (click-to-place grid)
  - Turn Log board (`<BoardView ... placedCell flippedCells />`)

2) **BoardView polish**
- Replaced infinite “pulse/bounce” highlights with **one-shot** animations:
  - `animate-cell-place`
  - `animate-cell-flip` (+ optional chain delays)

3) **/replay: always-visible result banner**
- Added persistent `GameResultBanner` when `step >= 9`
- Included quick actions (Copy / Share / Save) in the banner footer

4) **/stream: OPS HUD**
- Added `StreamOperationsHUD` showing:
  - Turn / mode / who controls
  - strictAllowed allowlist count + hash (derived from live state)
  - Vote timer + progress
  - Quick snapshot debug info (cards/cells remaining, warning mark uses)

5) **CSS animation utilities**
- Added `game-animations.css` utilities (merged into `apps/web/src/index.css`)

## Why
- 現状の画面は「機能が揃っている」一方で、**触感（演出）**と **配信運用（状態把握）** が弱く、ゲーム体験としての魅力が伝わりづらい段階でした。
- 盤面演出（置く/裏返る）と、勝敗の常設表示、配信向けHUDを加えることで、**“遊び物”としての密度** と **運用の安定性** を同時に上げます。

## Notes / Design decisions
- アニメーションは **状態差分ベース**（prevBoard と boardNow を比較）で検出。
  - “正しい盤面”を壊さずに演出だけを追加できるため、決定性を維持できます。
- `flip-delay-*` は flippedCells の順序に基づき簡易付与（最大3段）。
  - さらに厳密なチェイン順に合わせたい場合は、engine の `flipTrace` を使って順序付け可能。
- OPS HUD の strictAllowed は **live state から再構築**しています。
  - Triad League が nyano-warudo に送る `state_json.strictAllowed` と一致する設計ですが、
    将来的には “送信した strictAllowed そのもの” を stream state に保持して HUD へ渡すと最も安全です。

## How to verify (manual)
- `pnpm -C apps/web dev`
  - `/match`: 盤面に置いた瞬間の pop + flip 演出が出る（Draft grid / TurnLog）
  - `/replay`: step>=9 で結果バナーが常設され、Copy/Share/Save が動く
  - `/stream`: 画面上部に OPS HUD が出て、投票中は pulse + progress が動く

## Files changed
- Added:
  - `apps/web/src/components/BoardFlipAnimator.tsx`
  - `apps/web/src/components/StreamOperationsHUD.tsx`
  - `docs/03_frontend/ui-improvements/*`
- Updated:
  - `apps/web/src/pages/Match.tsx`
  - `apps/web/src/pages/Replay.tsx`
  - `apps/web/src/pages/Stream.tsx`
  - `apps/web/src/components/BoardView.tsx`
  - `apps/web/src/index.css`
