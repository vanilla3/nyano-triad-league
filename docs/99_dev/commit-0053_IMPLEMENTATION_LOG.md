# commit-0053 IMPLEMENTATION LOG

## What
- Stream Studio: nyano-warudo bridge を “本番運用向け” に調整
  - `sendNyanoWarudo(kind, { silent })` を導入し、自動送信時は toast を抑制
  - vote open 中に state が更新された場合、state_json を再送できるオプションを追加（debounced）
- finalizeVote の deps などを整理（WIP感の除去）

## Why
nyano-warudo の strictAllowed をフル活用するには、投票開始時に state_json を送り allowlist を最新化するのが最短。  
さらに “投票中に状態が変わる” ケースに備え、状態更新での再送（任意）を用意すると荒れにくくなる。fileciteturn1file0
