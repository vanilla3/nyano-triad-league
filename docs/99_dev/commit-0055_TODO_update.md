# commit-0055 TODO update

## Done
- [x] /stream: download buttons wired (state_json/transcript/ai_prompt)

## Next
### 実戦サンプルの“品質”を上げる
- [ ] transcript に `winner/tilesA/tilesB/matchId` 等の結果要約を追加（1ゲーム完走の提出向け）
- [ ] state_json の `legalMoves` を compact + hash（nyano-warudo 側の strictAllowed 更新を軽量化）

### 入力のゆらぎ吸収（視聴者コマンド）
- [ ] #triad の alias を追加（全角矢印/空白/小文字など）
- [ ] nyano-warudo 側の正規表現と完全一致する canonicalizer を docs に明記
