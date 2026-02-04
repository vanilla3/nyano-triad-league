# commit-0047 IMPLEMENTATION LOG

## What
- overlay bus: `OverlayStateV1.lastTurnSummary` を追加
  - flipCount / comboCount / comboEffect
  - triadPlus / ignoreWarningMark
  - warningTriggered / warningPlaced
- /match と /replay から lastTurnSummary を送信
- /overlay:
  - flip×N を engine summary 優先で表示（diff推定はfallback）
  - COMBO/PLUS/MARK系のバッジを表示（実況の取っ掛かりを作る）

## Why
配信で重要なのは「結果」よりも **理解の速度** です。  
- flip×N だけだと “なぜそうなったか” が伝わらない  
- まずは engine がすでに持っている turn summary を使って、  
  **COMBO / PLUS / MARK** を確定表示にします

これは「プログレッシブ開示」「チャンキング」「フィードバック設計」の実践です。fileciteturn1file0

## Manual test checklist
- /match?stream=1 を開いて1手以上進める
- /overlay に:
  - flip×N
  - COMBO: XXXX（条件時）
  - PLUS +X（条件時）
  - IGNORE/TRIGGERED/PLACED MARK（条件時）
  が出ること
- /replay でも同様に表示されること
