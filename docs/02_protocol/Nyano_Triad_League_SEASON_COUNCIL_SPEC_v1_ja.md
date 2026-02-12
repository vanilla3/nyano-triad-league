# Nyano Triad League - SEASON_COUNCIL_SPEC（v1）

## 目的
- 「シーズンの議会」を最小構成で運用するための、決定論な proposal / vote / adopt 仕様を定義する。
- 公式運営の有無に依存せず、第三者が同じ入力から同じ採択結果を再現できる状態を作る。

## スコープ（v1）
- off-chain 集計前提の最小プロトコル。
- on-chain 実装を阻害しないよう、`abi.encode` 互換のハッシュ規則を採用。
- voting power（`weight`）の算出元（保有NFTやステーキング残高）は v1 の外に置く。

## データモデル

### 1. Proposal
- `seasonId: uint32`
- `startsAt: uint64`（Unix seconds）
- `endsAt: uint64`（Unix seconds, `endsAt > startsAt`）
- `quorumWeight: uint96`（採択に必要な総投票重み）
- `candidates: bytes32[]`（候補 `rulesetId` 群）
- `proposer: address`
- `salt: bytes32`

`proposalId` は以下で決定する。

```text
candidateSetHash = keccak256(abi.encode(canonicalCandidates))
proposalId = keccak256(
  abi.encode(
    protocolVersion(=1),
    seasonId,
    startsAt,
    endsAt,
    quorumWeight,
    candidateSetHash,
    proposer,
    salt
  )
)
```

### 2. Vote
- `proposalId: bytes32`
- `voter: address`
- `rulesetId: bytes32`
- `weight: uint96`
- `nonce: uint64`
- `deadline: uint64`（この時刻以降は無効）

### 3. Adoption
- `proposalId`
- `seasonId`
- `rulesetId`（採択された候補）
- `adoptedAt`
- `turnoutWeight`
- `quorumWeight`
- `uniqueVoters`
- `tieBreakUsed`

## 決定論ルール

### A. Candidate canonicalization
- `candidates` は `bytes32` として検証。
- 重複を除去し、`0x...` 小文字化して昇順ソート。
- この canonical set を `proposalId` 計算に使う（候補順の違いでIDが分裂しない）。

### B. Vote 採用ルール（同一 voter）
- 同一 `voter` は **最大 nonce の vote** を1件だけ採用。
- 小さい nonce は無視する。
- 同一 nonce で内容が異なる vote が複数ある場合は不正データとしてエラー。

### C. 無効票
以下は tally から除外する。
- `proposalId` 不一致
- `deadline < asOfTime`
- `rulesetId` が候補集合外

### D. 勝者決定
- `rulesetId` ごとに `weight` を合計。
- 最大重みの候補を勝者とする。
- 同率の場合は **`rulesetId` 昇順（辞書順）** で先頭を勝者にする。
- `turnoutWeight >= quorumWeight` を満たしたときのみ adopt 可能。

## EIP-712 投票署名（v1）
- Domain:
  - `name = "NyanoTriadLeagueSeasonCouncil"`
  - `version = "1"`
  - `chainId`
  - `verifyingContract`
- PrimaryType: `SeasonCouncilVoteV1`

```text
SeasonCouncilVoteV1(
  bytes32 proposalId,
  address voter,
  bytes32 rulesetId,
  uint96 weight,
  uint64 nonce,
  uint64 deadline
)
```

署名検証は「recover した signer が `vote.voter` と一致するか」で判定する。

## 参照実装（TS）
- `packages/triad-engine/src/season_council.ts`
  - `buildSeasonCouncilProposalIdV1`
  - `buildSeasonCouncilVoteHashV1`
  - `buildSeasonCouncilVoteTypedDataDigestV1`
  - `recoverSeasonCouncilVoteSignerV1`
  - `verifySeasonCouncilVoteSignatureV1`
  - `tallySeasonCouncilVotesV1`
  - `adoptSeasonCouncilRulesetV1`

## 非目標（v1）
- vote weight の算出ロジック（snapshot / staking / delegation）
- bribery/買収耐性などの高度なガバナンス設計
- on-chain finalize 契約の実装詳細
