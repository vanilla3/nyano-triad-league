# Nyano Triad League — オンチェーン Core Engine 仕様（v1 / Draft）

本書は `TriadEngineV1.sol` がサポートする **Core+Tactics** の厳密仕様です。  
TS参照実装と一致させるため、判定順序と tie-break を固定します。

## 盤面・ターン
- 盤面：3×3（cellIndex 0..8、row-major）
- ターン：9手
  - turn 0,2,4,6,8：PlayerA
  - turn 1,3,5,7：PlayerB

## moves のエンコード
- 1 byte / turn
- 上位4bit：cellIndex（0..8）
- 下位4bit：cardIndex（0..4）

## カード使用制約
- 各プレイヤーは deck の cardIndex を **1回だけ**使用可能
- cell は空である必要

## フリップ判定（Core）
- 置いたカード（またはコンボで反転したカード）が、隣接する敵カードと比較し、勝てば反転
- 比較は「向かい合う辺」
  - 上：up vs neighbor.down
  - 下：down vs neighbor.up
  - 左：left vs neighbor.right
  - 右：right vs neighbor.left

### tie-break（決定論）
1. Triad値が大きい方が勝ち
2. 同値なら じゃんけん（0=Rock,1=Paper,2=Scissors）
3. じゃんけんも同値なら combatPower（atk+matk+agi）が大きい方
4. それも同値なら “勝てない”（反転しない）

## コンボ（連鎖）
- 反転したカードは “そのターンの残り” でさらに周囲を反転し得る（BFS）
- flipCount：そのターンに反転した枚数（連鎖含む）
- comboCount = 1 + flipCount

## コンボボーナス（Tactics）
- comboCount==3：次の自分のカード all edges +1（cap 10）
- comboCount==4：次の自分のカード all edges +2（cap 10）
- comboCount>=5：次の自分のカードが警戒マークの debuff を無視（mark自体は消費/失効する）

## 警戒マーク（Tactics）
- `warningMarks[turn]` が 0..8 の場合、手番の最後に「空きマス」へ設置（最大3回）
- 相手が次ターンにそのマスへ置いた場合、そのカードの edges を -1（floor 0）
- 相手が踏まなくても、次ターン終了時に失効（1ターン有効）

## まだ未対応（v1）
- `earthBoostEdges`：全 turn で 255（NONE）である必要
- Trait効果 / Formation / Season modules
