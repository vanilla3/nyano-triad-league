# Nyano Triad League — Events 仕様（v1）

目的：運営サーバがなくても、コミュニティが
- ランキング
- リプレイ閲覧
- 大会運営
- 分析/統計
を構築できるように、オンチェーンのログを設計する。

---

## 1. 原則
- 1イベントで「最小限の再構築情報」が取れる
- インデクサが扱いやすい（検索キーがある）
- 個人情報は載せない（アドレスとハッシュ中心）

---

## 2. コアイベント案

### 2.1 MatchSettled（公式戦結果）
**必須**

- `matchId: bytes32`
- `rulesetId: bytes32`
- `seasonId: uint32`
- `playerA: address`
- `playerB: address`
- `winner: address`（引き分けなら address(0) でも良い）
- `tilesA: uint8`
- `tilesB: uint8`
- `replayHash: bytes32`（トランスクリプト全文のhash、またはIPFS CIDのhash）
- `pointsDeltaA: int32`
- `pointsDeltaB: int32`

> replayの実体はIPFS/HTTPなど自由。  
> オンチェーンは hash だけで十分（検証の入口）。

### 2.2 RulesetRegistered（ルールセット登録）
**自律化で重要**

- `rulesetId: bytes32`
- `creator: address`
- `configHash: bytes32`（またはCID hash）
- `uri: string`（任意：IPFS URIなど。長すぎるなら省略）

### 2.3 FeaturedSeasonSet（“公式”の選定）
- `seasonId: uint32`
- `rulesetId: bytes32`
- `start: uint64`
- `end: uint64`

### 2.4 LeagueCreated / TournamentCreated（任意）
- `leagueId: bytes32` / `tournamentId: bytes32`
- `creator: address`
- `rulesetId: bytes32`
- `paramsHash: bytes32`

---

## 3. イベントから構築できること（運営ゼロ想定）

- matchId単位で対戦履歴が追える
- rulesetId単位でメタ分析ができる
- replayHashから任意の場所にあるトランスクリプトを引いて再生できる
- pointsDeltaを集計してランキングが作れる（オフチェーンでOK）
