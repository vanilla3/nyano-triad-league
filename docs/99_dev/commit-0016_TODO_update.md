# commit-0016 TODO update（差分）

## Done（commit-0016）
- 警戒マークの **失効タイミング（踏まれなくても1ターンで消える）** を shared vector で固定
- Solidity generated vectors test を更新

## Next（commit-0017）
- Fever の “次手効果（警戒マーク無視）” が意味を持つ拡張フォーマット（v2）を切り出し
  - 仕様（board/turns/deck）と vectors を v1 と分離して設計（4x4 等）
- v2 の最小エンジン（TS参照実装）を先に導入し、オンチェーンは v2 contract として分離（将来拡張の安全策）
