# Codex Agent Guide — contracts (Foundry)

ここは **公式戦のオンチェーン検証/決済** のための Solidity です。
UI 目的の変更で触る範囲としては通常「最終段」に近いので、原則は慎重に。

---

## 0) Invariants

- `matchId` / EIP-712 / transcript hash の互換性を壊さない。
- `NyanoPeace ownerOf` による所有確認の前提を壊さない。
- 既存テスト（`contracts/test/*`）は必ず維持。

---

## 1) コマンド

```bash
cd contracts
forge test
```

---

## 2) 入口ファイル

- メイン: `src/NyanoTriadLeague.sol`
- transcript: `src/lib/TranscriptV1.sol`
- settlement engines: `src/lib/TriadEngineV1.sol`, `src/lib/TriadEngineV2.sol`
- governance: `src/governance/RulesetRegistry.sol`

---

## 3) 変更方針

- **UI/UX 改修のためだけにコントラクトを変えない**（必要なら理由を ExecPlan に明記）。
- 変更する場合は、先にテスト追加→実装→`forge test` を通す。
- TS 側の test-vectors / docs との整合を必ず確認。
