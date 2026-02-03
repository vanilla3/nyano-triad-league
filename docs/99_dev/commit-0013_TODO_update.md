# commit-0013 TODO update

## DONE ✅
- Core + Tactics の共有ベクタを拡充（B勝利 / チェーン反転 / じゃんけん反転）
- ベクタ生成スクリプトの address checksum 問題を根本解決（追加依存なし）
- TS側で Momentum（comboCount=3）の付与・適用を明示テスト化

## NEXT（commit-0014候補）🧭
- Domination（comboCount=4 → +2）/ Fever（comboCount>=5 → 警戒無視）をカバーするベクタとテストを追加
  - 可能なら「ボーナスが勝敗を反転させる」ようなケースを作り、退行検出力を強化
- 警戒マークの境界ケースを追加
  - 警戒マークの無効配置（既に埋まっているセル、範囲外など）を TS/solidity の validator で一致させる
- （設計）Autonomy/コミュニティ運営のための権限最小化
  - RulesetRegistry の “誰でも提案でき、最終的に運営なしでも回る” 運用形（staker投票 or 代表DAO）を具体化
