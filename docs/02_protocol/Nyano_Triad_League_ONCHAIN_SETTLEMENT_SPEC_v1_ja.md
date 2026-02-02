# Nyano Triad League — オンチェーン決済仕様（v1 / Draft）

この文書は、**Ethereum 上のみ**で公式戦を「検証可能」にするための最小仕様です。  
本コミットでは **勝敗計算（TriadEngine）をまだ実装せず**、まず「トランスクリプトの真正性」と「二重提出防止」を確定させます。

## ゴール
- 公式戦は **1 tx** で「提出・検証・確定」できる方向に寄せる
- “運営が消えても”第三者が検証できるよう、**トランスクリプト**と**イベントログ**を中核にする
- 所有権は **Nyano Peace の ownerOf** が真実（外部アテステーション不要）

## Non-goal（本段階ではやらない）
- Trait / Formation を含むフルルールのオンチェーン勝敗計算（次段階）
- 賞金プール等の資金移動（安全設計が固まってから）

---

## コントラクト
- `NyanoTriadLeague.sol`
  - `submitMatchV1(transcript, sigA, sigB)` を提供
  - 検証：
    - EIP-712署名（playerA / playerB）
    - `deadline` 期限
    - `ownerOf(tokenId)` によるデッキ所有確認
    - `matchId` による二重提出防止

- `TranscriptV1.sol`
  - `matchId(transcript)`：EIP-712 domain を含まない “ID”
  - `structHash(transcript)`：EIP-712署名検証用

---

## トランスクリプト（TranscriptV1）
### フィールド
- `version`：1固定
- `seasonId`：シーズン番号（任意だが hash 対象）
- `rulesetId`：ruleset canonical bytes の keccak（commit-0008）
- `playerA / playerB`
- `deckA[5] / deckB[5]`
- `moves`：9 bytes（各byteで cellIndex と cardIndex を表現）
- `warningMarks`：9 bytes（各byteが 0..8 or 255）
- `earthBoostEdges`：9 bytes（各byteが 0..3 or 255）
- `reserved`：将来拡張用（hash対象）
- `deadline`：署名有効期限

### 重要：長さの固定
- moves / warningMarks / earthBoostEdges は **必ず length=9**
- 未使用は 255 を入れる（NONE_U8）

---

## EIP-712 署名
- Domain:
  - name: `Nyano Triad League`
  - version: `1`
  - chainId: `block.chainid`
  - verifyingContract: `NyanoTriadLeague` address

- Typed struct:
  - `TranscriptV1(...)`（deckとbytesは hash 化して格納）

---

## イベント（インデクサ前提）
- `MatchSubmitted(matchId, rulesetId, submitter, playerA, playerB)`

将来：勝敗計算が入ったら `MatchSettled` 等へ拡張する。

---

## 次ステップ（commit-0010 以降）
1. `TriadEngine`（オンチェーン）を Core ルールから実装
2. テストベクタ：TS参照エンジンの同一入力と一致させる
3. ruleset registry 連携（active ruleset のみ accept）
