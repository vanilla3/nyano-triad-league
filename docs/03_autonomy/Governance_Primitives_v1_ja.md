# Governance Primitives（v1 / Notes）

この文書は「運営がいなくても勝手に盛り上がる」ための基礎部品の整理です。

## 1) Ruleset Registry（最優先）
- ルール提案→共有→採用を “permissionless” にする
- v1 は balance-gated（Nyano保有者のみ登録）
- v2 で staking / vote を導入し、注目度の高い ruleset が自然に浮上する仕組みにする

## 2) Nyano Staking（ガバナンス担保）
- Nyano を escrow して stakedBalance を得る（投票重みの種）
- 報酬は “通貨” より “称号/コスメ/可視化” を優先（P2W回避）
- 例：
  - ruleset 提案の投票権
  - season featured ruleset の決定
  - tournament factory の「公式」フラグ付け

## 3) ERC-6551（Token Bound Account / TBA）
- Nyano 1体ごとに “持ち物/称号/装備（コスメ）” をぶら下げるのに向く
- ゲーム強度を上げずに “語り/収集” を増やす：運営不在でもコミュニティが盛り上がる方向性

## 4) 段階導入ロードマップ（要点）
- まず：rulesetId と transcript が検証できる（本リポのプロトコル部分）
- 次：RulesetRegistry + LeagueFactory（誰でもリーグ作成）
- その次：NyanoStaking で featured/公式の意思決定を分散化
- 最後：ERC-6551 を称号/コスメに接続して自己増殖する文化装置にする
