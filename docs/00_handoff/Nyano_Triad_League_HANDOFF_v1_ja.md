# Nyano Triad League ハンドオフ資料 v1（JA）

このドキュメントは、別スレッド/別担当者が **Triad League を迷子にならずに継続開発できる** ように、
目的・仕様・現状・次の実装計画・重要ファイルをまとめたものです。

> 更新: 2026-02-06  
> 直近コミット: commit-0070（/overlay 視認性改善: HUD常設 + flip理由/進行/投票/strictAllowed 可視化）

---

## 1. このプロジェクトの目的（Why）

### 1-1. 作品としてのゴール
Nyano NFT を “カード” として使い、オンチェーン文脈に強い「観戦・参加・拡散」が回るゲーム体験を作ります。

- **Nyano NFTの特性を活かす**
  - 既存NFTの trait / triad（4辺）/ ステータスから **カード性能が自動決定**
  - 同じNFTが “個体差” としてゲーム内に反映される

- **運営が薄くても回る（Autonomy）**
  - ルール/配信/参加導線がコード化され、コミュニティが勝手にイベントを回せる方向へ
  - 配信（nyano-warudo）連携により、視聴者参加（投票）を荒れにくく設計

### 1-2. 技術的なゴール（Eth-only）
- Oasys ブリッジ等はやめ、**ETH上のみ**で成立する設計に寄せています。
- 「オフチェーンで試合を進める → transcript を作る → オンチェーンで検証/記録/集計」の分業構造。

---

## 2. 全体アーキテクチャ（What / How）

### 2-1. 大きな構成
- **contracts/**（Foundry）
  - on-chain 検証/記録/ルールセット管理（テストあり）
- **packages/triad-engine/**
  - オフチェーンの “正” のエンジン
  - transcript生成、boardHistory、turn summaries、matchId など
  - on-chain subset と整合を取るためのテストベクタも保持
- **apps/web/**（Vite + React）
  - プレイ画面、配信画面、OBS Overlay、リプレイ
  - Nyano NFT をRPCで読み取りカード化
  - nyano-warudo へ snapshot 送信

### 2-2. 重要概念
- **CardData**
  - Nyano NFT 由来の trait / stats / triad edges / じゃんけん手などを含む
- **TranscriptV1**
  - 1試合分の行動列（誰がどのカードをどこに置いたか、warning mark 等）
- **MatchResultWithHistory**
  - 盤面履歴（boardHistory）と turn summaries を含むシミュレーション結果

> JSON化時は BigInt を含むため、通常の JSON.stringify は不可。  
> `apps/web/src/lib/json` の `stringifyWithBigInt` を使用（前提）。

---

## 3. 画面（UI）と用途

### 3-1. /match
プレイ画面（最重要）。  
- Nyano NFT 読み込み → デッキ作成/選択 → 盤面に配置 → transcript生成
- `?ui=rpg` を付けると **RPGテーマUI**（盤面・手札・ログ・結果が統一）

### 3-2. /replay
リプレイ表示。  
- step操作 + Auto Play（速度付き）
- `?ui=rpg` で盤面のみRPG表示（ページ全体RPG化は今後）

### 3-3. /stream
配信者向けの運用画面。  
- nyano-warudo への `POST /v1/snapshots` を送信
- overlay へ状態を配信する（streamer_bus）
- “投票開始時点でも state_json を送る” の改善余地あり（P2）

### 3-4. /overlay
OBSに貼る前提の表示。  
- streamer_bus の state を購読して表示
- ✅ 常設HUD（turn/tiles/flip理由/strictAllowed/vote/sync）を実装済み
- 次の改善: 配信テンプレ化（サイズ/余白プリセット）と、情報の優先順位調整

---

## 4. 現在の実装状況（Where we are）

### 4-1. 直近までに入った改善（要点）
- **commit-0066**
  - BoardViewRPG（RPGテーマ）導入
  - `/match?ui=rpg` `/replay?ui=rpg` で盤面を切替可能
- **commit-0067**
  - ScoreBar（tiles / 進行）を /match /replay に追加
  - TurnLog に flipTraces の表示基盤（badges + 詳細パネル）
  - engine が TurnSummary に flipTraces を付与
- **commit-0068（外部作業のマージ対象）**
  - P0-1: /match 入力盤面を BoardView/BoardViewRPG に統一（selectableCells/onCellSelect）
  - P0-2: `?ui=rpg` 時にページ全体をRPG UIへ（手札/ログ/結果）
  - P1-1: flipTraces の日本語説明（配信用 readout も含む）
  - P1-2: Nyano リアクション（glow/badge/吹き出し）

- **commit-0070**
  - P0-1: /overlay 視認性改善（HUD常設: 進行/flip理由/投票/strictAllowed/sync）
  - /match & /replay: overlay publish に lastTurnSummary.flips（flipTraces）を追加
  - winner が draw のときの表示/型崩れを修正（overlay & result）

### 4-2. いま “できること”
- ローカルでカードを読み込み、対局を成立させ、ログ/リプレイを観戦できる
- 配信画面から nyano-warudo へ snapshot を送れる
- UIはまだ荒いが、“ゲーム感” を出す部品（RPGテーマ/ScoreBar/リアクション）が揃い始めた

---

## 5. 次の実装計画（Roadmap / TODO）

### P0（配信/体験の土台を固める）
1. **/overlay の視認性改善（DONE）**
   - 進行（turn/tiles）・flip理由（flipTraces）・投票状態・strictAllowed hash を常時表示
   - `flipTraceDescribe.ts` の `flipTracesReadout()` を overlay に適用
   - `NyanoReactionBadge` を overlay に追加（小さくても感情が伝わる）
   - ✅ HUD: flip理由（readout）/ turn・tiles / strictAllowed（件数+hash）/ vote状態 / sync

### P1（観戦で“面白い”を強化）
2. **TurnLog の flipTraces を日本語版に統合**
   - badges と詳細パネルを `flipTraceShort/Full` の出力に差し替え
3. **/replay にも NyanoReaction を追加**
   - step で “そのターンの反応” を再現（配信素材として強い）

### P2（nyano-warudo / Twitch 連携）
4. **投票開始時点でも state_json を送る**
   - strictAllowed（合法手 allowlist）が投票中にズレないようにする（荒れ防止）
5. **視聴者提案フォーマットを確定**
   - 例: `#triad A2->B2`（座標式）を固定し、正規表現・UI例・集計に繋げる

### P3（AI Nyano と対戦イベント）
6. **vs_nyano_ai モードを本格化**
   - まずは “合法手からランダム/簡易評価” のAIで成立させ、配信でイベント運用できるところまで
   - 後で nyano-warudo から提案/投票/AI判断を受け、match を進められるように

---

## 6. 重要ファイル（最短で追うための索引）

### Web
- `apps/web/src/pages/Match.tsx`  
  プレイ画面の核。入力/シミュレーション/overlay publish まで集まる。
- `apps/web/src/pages/Replay.tsx`  
  リプレイ + Auto Play
- `apps/web/src/pages/Stream.tsx`  
  nyano-warudo 送信 / streamer bus コントロール
- `apps/web/src/pages/Overlay.tsx`  
  OBS用。視認性改善の主戦場。
- `apps/web/src/components/BoardView.tsx`  
  通常テーマ盤面
- `apps/web/src/components/BoardViewRPG.tsx`  
  RPGテーマ盤面 + HandDisplayRPG/TurnLogRPG/ResultOverlayRPG
- `apps/web/src/components/ScoreBar.tsx`  
  tiles/進行の常設表示
- `apps/web/src/components/TurnLog.tsx`  
  ログ（flipTraces）
- `apps/web/src/components/flipTraceDescribe.ts`  
  flipTraces 日本語化ユーティリティ（badge/詳細/要約/読み上げ）
- `apps/web/src/components/NyanoReaction.tsx`  
  Nyanoリアクション（overlay用 Badgeも同梱）
- `apps/web/src/lib/nyano_rpc.ts`  
  Nyano NFT 読み取り（RPC URL / コントラクトアドレス）
- `apps/web/src/lib/nyano_warudo_bridge.ts`  
  `POST /v1/snapshots`（ai_prompt/state_json）
- `apps/web/src/lib/streamer_bus.ts`  
  overlay state / vote state / commands の publish/subscribe

### Engine / Contracts
- `packages/triad-engine/src/engine.ts`
- `packages/triad-engine/src/types.ts`
- `contracts/`（Foundryテスト）

---

## 7. 開発の作法（運用ルール）

### 7-1. コミット運用
- 1コミット = 1テーマ（UI改善、配信連携、エンジン整合など）
- 毎回 `docs/99_dev/commit-XXXX_IMPLEMENTATION_LOG.md` と `docs/99_dev/commit-XXXX_TODO_update.md` を更新する（履歴が資産）

### 7-2. テスト/確認の最低ライン
- `pnpm -C packages/triad-engine test`
- `cd contracts && forge test`
- Web起動して `/match` `/replay` `/overlay` の最低導線確認

---

## 8. よくある落とし穴（Tips）
- **RPCエラー / contract revert**
  - tokenIdが未mintだと revert するケースがあるため、「存在するtokenIdの一覧取得」や「revertを握ってUIで表示」の設計が重要
- **BigInt**
  - JS側で BigInt を含むデータを JSON に入れると落ちる。必ず `stringifyWithBigInt` を通す
- **UIテーマ衝突**
  - RPGテーマは `.rpg-*` に閉じる（既存UIを壊さないのが正解）

---

## 9. 次スレッドでのお願い（最短で立ち上がるために）
- まず `docs/99_dev` の直近コミットログ（0067/0068）を読み、/match の挙動を触る
- 次に /overlay を “配信画面として成立するレベル” に上げる（P0最優先）
- nyano-warudo 側の要望（投票開始時の state_json）を満たすため、Stream/Overlay の publish 点を詰める
