# Nyano Triad League — Ladder Format 仕様（v1）

目的：運営サーバや特定indexerに依存せず、第三者が同じランキングを再計算できる最小フォーマットを定義する。

---

## 1. v1の前提

- ラダー計算は **recordの集合** から決定論で再計算できること
- 1 record には以下を含める
  - transcript（`TranscriptV1`）
  - MatchSettled相当のイベント情報
  - playerA / playerB の両署名（EIP-712）
- 実装参照：`packages/triad-engine/src/ladder.ts`

---

## 2. レコード構造（LadderMatchRecordV1）

### 2.1 settled event（最小）

- `matchId: bytes32`
- `rulesetId: bytes32`
- `seasonId: uint32`
- `playerA: address`
- `playerB: address`
- `winner: address`（`playerA` / `playerB` / `address(0)`）
- `tilesA: uint8`（0..9）
- `tilesB: uint8`（0..9）
- `pointsDeltaA: int32`
- `pointsDeltaB: int32`
- `replayHash: bytes32`
- `settledAt: uint64`（unix seconds）
- `source`
  - `chainId: uint64`
  - `blockNumber: uint64`
  - `txHash: bytes32`
  - `logIndex: uint32`

### 2.2 transcript

- `TranscriptV1` 全体を保持する
- `hashTranscriptV1(transcript) == settled.matchId` を必須にする

### 2.3 signatures

- `signatureA`: playerA が attestation に署名
- `signatureB`: playerB が attestation に署名

---

## 3. Attestation（EIP-712）

### 3.1 Domain

- `name: "NyanoTriadLeagueLadder"`
- `version: "1"`
- `chainId`
- `verifyingContract`

### 3.2 Primary Type

`LadderMatchAttestationV1`

- `seasonId: uint32`
- `rulesetId: bytes32`
- `matchId: bytes32`
- `playerA: address`
- `playerB: address`
- `replayHash: bytes32`
- `sourceChainId: uint64`
- `sourceTxHash: bytes32`
- `sourceLogIndex: uint32`

---

## 4. レコード検証ルール（必須）

1. `settled` フィールドの型・範囲を検証
2. `TranscriptV1` を検証し、`hashTranscriptV1` が `settled.matchId` と一致すること
3. transcript header の `rulesetId/seasonId/playerA/playerB` が settled と一致すること
4. attestation に対し `signatureA` が `playerA`、`signatureB` が `playerB` であること

---

## 5. ランキング集計ルール（決定論）

### 5.1 重複処理

- sourceキーを以下で定義する
  - `chainId:blockNumber:txHash:logIndex`
- 同一sourceキーで同一内容なら duplicate として無視
- 同一sourceキーで内容が異なる場合は reject

### 5.2 集計

受理recordごとに playerA / playerB を更新する

- `points`: `pointsDeltaA/B` を累積
- `matches`: +1
- `wins/losses/draws`: `winner` から更新
- `tileDiff`:
  - playerA += `tilesA - tilesB`
  - playerB += `tilesB - tilesA`
- `lastSettledAt`: 最大値

### 5.3 順位のtie-break順（固定）

1. `points` 降順
2. `wins` 降順
3. `tileDiff` 降順
4. `losses` 昇順
5. `player address` 昇順（最終決定）

この順序を変更する場合は v2 として扱う。

---

## 6. 参照実装API（v1）

- `validateLadderMatchSettledEventV1`
- `buildLadderMatchAttestationInputFromSettledV1`
- `buildLadderMatchAttestationTypedDataV1`
- `buildLadderMatchAttestationTypedDataDigestV1`
- `recoverLadderMatchAttestationSignerV1`
- `verifyLadderMatchAttestationSignatureV1`
- `verifyLadderMatchRecordV1`
- `buildLadderStandingsV1`

---

## 7. v1の制約

- rank計算は pointsDelta ベース（Elo/K-factor等のアルゴリズム自体は別レイヤ）
- source eventの真偽（実チェーン照合）は呼び出し側責務
- 互換性を壊す変更（tie-break順、署名対象、必須フィールド追加）は v2 で行う
