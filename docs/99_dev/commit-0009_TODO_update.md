# commit-0009 TODO update（差分）

## Done（commit-0009）
- contracts/ に Foundry scaffold を追加（ETH-only）
- TranscriptV1（matchId / EIP-712 structHash）を Solidity 側に実装
- NyanoTriadLeague：署名検証 + ownerOf 検証 + replay protection（submitted）
- RulesetRegistry（v1）：Nyano保有者のみ登録、active切替
- NyanoStaking（v1）：ステーク/アンステークの最小実装（報酬なし）
- 仕様：ONCHAIN_SETTLEMENT_SPEC / RULESET_REGISTRY_SPEC / Governance_Primitives を追加

## Next（commit-0010）
- Solidity TriadEngine（Coreルール）実装開始（TS参照エンジンと一致させる）
- submitMatchV1 → settleMatchV1（勝敗確定＋イベント拡張）へ拡張
- RulesetRegistry を league で参照（active ruleset のみ受付）
- NyanoStaking を ruleset featured 決定に使う設計を確定（投票の最小形）
