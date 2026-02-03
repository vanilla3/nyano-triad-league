# commit-0018 TODO update（差分）

## Done（commit-0018）
- v1 core+tactics の不変条件：earthBoostEdges は全 turn で NONE(255) 必須（TS throw / Solidity revert）をテスト化

## Next（commit-0019）
- Synergy 導入は v2 として分離（ルール/ベクタ/オンチェーン対応範囲を明確化）
  - v2: traitEffects のうち “決定論で説明しやすい” 1要素（例：Shadow or Forest）だけ先に入れる
  - v1: core+tactics の互換を絶対に壊さない（CIで常に green）
