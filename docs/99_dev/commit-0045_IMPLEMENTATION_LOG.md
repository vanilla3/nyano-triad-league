# commit-0045 IMPLEMENTATION LOG

## What
- /match → overlay bus に **usage hints** を追加（usedCells / usedCardIndicesA/B / warningMarksUsedA/B）
- /stream に **Quick move picker** を追加
  - 空きセル・残りカード・wm残数をUIで可視化し、誤入力を減らす
  - picker → chat command を自動生成 / そのまま投票として追加できる
- /overlay の情報設計を整理
  - 投票カードを Last move から分離（チャンキング）
  - flip×N / MARK / NO FLIP のサマリーを追加
  - 次の手番（Next: A/B）を表示

## Why
配信運用では「操作の速さ」と「理解の速さ」が体験の質を決めます。  
- 誤入力を **設計で防ぐ**（制約・アフォーダンス）
- 必要な情報だけを段階的に提示する（プログレッシブ開示）
- 情報を意味単位で分割して見せる（チャンキング）

これらは UI品質の基本原則に沿った改善です。fileciteturn1file0

## Manual test checklist
- /stream を開く（host link で /match?stream=1 も開く）
- vote open → picker で cell/card を選択 → Fill chat command → Add vote (me)
- overlay で vote card が独立して表示される（Last move と分離）
- last move 後に flip×N / MARK が表示される
