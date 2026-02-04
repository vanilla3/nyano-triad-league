# commit-0046 IMPLEMENTATION LOG

## What
- /overlay を「配信で読める」状態へ整備
  - vote card（OPEN/countdown/top votes）を常時扱えるように復元
  - Last move に flip×N / flipped cells / MARK を追加（実況の取っ掛かり）
  - Next: A/B を表示（手番把握の高速化）
- /stream に Suggested moves（3案）を追加
  - center→corner→edge の “型” を提示して参加のハードルを下げる

## Why
配信運用は “入力ミスで空気が止まる” と “視聴者が置いていかれる” が最大の敵です。  
- 誤りを UI の制約で防ぎ（制約/シグニファイア）
- 状態を一目で理解できる粒度で提示し（プログレッシブ開示/チャンキング）
- 選択肢を減らして決断を早くする（Hick's law）

この方針はアップロードいただいたUI分析のフレームに沿っています。fileciteturn1file0

## Manual test checklist
- /match（host: stream=1） + /stream + /overlay を同時に開く
- vote開始 → overlayに投票カードが出る
- suggested moves を押す → chat command が埋まり、投票に使える
- 手を進める → overlay の flip×N / MARK が表示される
