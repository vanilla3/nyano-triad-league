# commit-0062 IMPLEMENTATION LOG

## What
- Show `GameResultOverlay` automatically when a match finishes (turns >= 9)
- Wire overlay buttons:
  - Replay -> open /replay (new tab)
  - Share -> copy replay URL
  - Close -> dismiss (does not re-open unless match state changes)

## Why
UIが「機能」に見えてしまう最大の理由は、プレイの終端（勝敗）が体験として弱い点です。
結果を “1枚の演出” として出すことで、ゲームとしての手触りを早く獲得します。

## Notes
- Only triggers on completed matches (turns.length >= 9)
- Does not trigger for preview states (partial turns)
