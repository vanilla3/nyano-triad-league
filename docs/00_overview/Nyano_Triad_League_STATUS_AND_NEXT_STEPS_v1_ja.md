# Nyano Triad League Current Status & Roadmap v1 (JA)

このドキュメントは、別スレッド／別メンバーでもすぐ全体像が掴めるように、
**現状の到達点**・**仕様の核**・**次に実装する予定**をまとめたものです。

---

## 1. これは何か（プロダクトの核）

Nyano NFT をカードとして使う、トライアド系の対戦ゲームです。

- **オフチェーン**: ルールに基づいて deterministic に対戦をシミュレーション（`packages/triad-engine`）
- **オンチェーン（サブセット）**: transcript（対局ログ）を受け取り、リプレイ耐性・検証可能性を担保（`contracts`）
- **フロント**: 対戦UI・配信UI・OBS overlay・nyano-warudo連携（`apps/web`）

---

## 2. いま出来ていること（実装到達点）

### A) Contracts / Engine（基盤）
- Foundry テストが通る状態
- Transcript v1 概念が存在し、同じ transcript を再生すれば同じ結果になる設計

### B) Web（動くもの）
- `/match`: 対戦進行（stream=1 で overlay bus に state publish）
- `/replay`: transcript から再生
- `/overlay`: 配信用オーバーレイ（理由の短いバッジ + 詳細は controls=1）
- `/stream`: Stream Studio（投票、チャット入力、nyano-warudo bridge、サンプルDL）

### C) nyano-warudo 連携（Puzzle Show 用の最短ルート）
- `POST /v1/snapshots`
  - `source: "triad_league"`
  - `kind: "ai_prompt"`（文章）
  - `kind: "state_json"`（JSON）
- 投票開始時に **state_json → ai_prompt** を送る設計（strictAllowed を活かす）

### D) UI（最低限のブランド要素）
- Nyano 画像（Arweave）をUI上で表示できる（fallbackあり）

---

## 3. 仕様の中心（壊してはいけない契約）

### state_json v1（nyano-warudo strictAllowed の根幹）
- `protocol: "triad_league_state_json_v1"`（固定）
- `legalMoves`（viewer command 付き）
- `strictAllowed`（allowlist + hash）
- `protocolV1`（Transcript-like）
- `board / hands / warningMark`（投票の合法性を支える）

### viewer command（視聴者提案）
- canonical: `#triad A2->B2 wm=C1`
- 揺れ吸収: unicode矢印、空白区切り、順序入替

---

## 4. まだ足りないこと（課題）

### UI/UX（ゲーム感）
- 現状は「機能の露出」が中心で、ゲームとしての情緒（演出・導線・没入感）が弱い
- 盤面演出、勝敗演出、オンボーディングが不足

### Twitch 接続（現場の自動化）
- 現状は Stream Studio 上の入力が中心
- 目標は “配信だけで回る” ため、Twitch chat / EventSub からの入力を繋ぐ必要がある

### AI Nyano 対戦（イベントの核）
- ai_prompt/state_json は用意した
- 次は “AIが合法手から1つ返す” 実装（まずは簡易ヒューリスティック→LLMへ）

---

## 5. これから実装する予定（ロードマップ）

### Phase 1: UIをゲームにする
- 盤面の演出（flip/chain）
- 勝敗の体験（リザルト、称号、短いセリフ）
- Nyano の世界観（ヒーロー帯、吹き出し、テーマ統一）

### Phase 2: 配信運用の自動化
- Twitch chat の `#triad` を受けて vote に反映
- strictAllowed allowlist/hash による荒れ防止（nyano-warudo 側）

### Phase 3: AI Nyano 対戦
- `ai_prompt` から 1手提案（PoC）
- 難易度調整（視聴者参加向けの“勝てそう感”）
- Twitch 配信での “解説” まで含めた体験

### Phase 4: コミュニティ自走（運営が薄くても盛り上がる）
- ルールセットの提案/投票/採用
- イベントテンプレートの自動運用
- 参加者がデータ（transcript）を蓄積し、配信が資産になる構造
