# commit-0013-fix2 — Implementation Log（差分）

## Why
- `combo_bonus_momentum.test.js` が `makeCardDataFromNyano` の入力形（tokenId/combatStats/jankenHand 等）と一致しておらず、`undefined.hp` で落ちていた。
- 本テストの目的は **core+tactics subset における Momentum（comboCount=3）の適用**であり、Nyano trait/stats 生成は主眼ではない。
- したがって、shared vectors と同じ方式で **最小 CardData（edges/hand/combatStatSum）** を構築し、仕様差・入力検証ノイズを排除するのが適切。

## What
- `combo_bonus_momentum.test.js` を修正：
  - turns を `{cell, cardIndex, warningMarkCell, earthBoostEdge}` 形式でデコード（engine の validate と一致）
  - cards を `Map<bigint, CardData>` として構築（vectors の power を combatStatSum に使用）
  - `simulateMatchV1(transcript, cards, ruleset)` の正しいシグネチャで実行

## Verify
- `pnpm -C packages/triad-engine test`
