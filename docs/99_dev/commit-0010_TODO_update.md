# commit-0010 TODO update（差分）

## Done（commit-0010）
- TriadEngineV1（Solidity）を追加：Core+Tactics の勝敗計算
- NyanoTriadLeague：submitMatchV1 が settlement を保存し MatchSettled を emit
- RulesetRegistry（active gating）を league に接続（任意）
- Foundry tests：MockNyanoPeace + submitMatchV1 の最小E2E（署名/ownerOf/replay/inactive ruleset）

## Next（commit-0011）
- TS参照エンジンと Sol エンジンの “テストベクタ共有” を導入（同一入力→同一 winner）
- Synergy の段階導入（まずは Earth/Shadow/Forest のような説明可能で決定論のもの）
- ruleset param を on-chain に渡す設計（canonical bytes を decode するか、registryから読む）
