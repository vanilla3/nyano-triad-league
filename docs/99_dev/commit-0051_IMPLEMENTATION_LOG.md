# commit-0051 IMPLEMENTATION LOG

## What
- Fix Stream Studio compile/runtime issues around nyano-warudo bridge
  - warudoBaseUrl state ordering
  - define `sendNyanoWarudo(kind)` and wire auto triggers
  - add UI panel in `/stream` for POST /v1/snapshots
- Extend `OverlayStateV1` to include `protocolV1` so Match/Replay can publish Transcript-like data safely.
- Implement:
  - `ai_prompt` builder (board/hand/legal moves/objective in text)
  - `state_json` builder (board/hands/legalMoves/protocolV1)

## Why
nyano-warudo 側の Puzzle Show トリガーは `POST /v1/snapshots` が最短ルート。  
Triad League 側で “送れる・再現できる・サンプルを切れる” 状態を先に固めることで、  
配信の現場で詰まりにくい土台になります。fileciteturn1file0

## Manual test checklist
- `pnpm -C apps/web dev` → `/stream`
- Base URL を設定して `Send ai_prompt/state_json` が成功（200）する
- vote start/end の自動送信が動く（toggle ON）
- `/match?stream=1&ctrl=A` を開いて overlay bus が更新されること
