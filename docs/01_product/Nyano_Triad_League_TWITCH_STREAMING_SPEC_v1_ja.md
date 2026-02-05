# Nyano Triad League · Twitch Streaming Spec (v1 / ja)

## 目的
最終的に **AI Nyano が Twitch で配信しながら、ユーザーと対戦できる** 状態を作る。
ただし最初から「完璧な運営」を前提にしない。

- 運営が不在でも勝手に盛り上がる
- それでも “ゲームとして気持ちよく遊べる” UI/演出がある
- コミュニティ文脈（参加・観戦・二次創作・イベント）と相性が良い

## 重要な前提
- Triad League は「正しい勝敗」が大切：**transcript → engine で完全再現可能**であることが核
- Nyano NFT の on-chain 属性がカード性能に直結するため、対戦は「コレクション × 戦略」になりやすい
- Twitch と on-chain は速度が違う：**配信は off-chain を主軸**にし、段階的に on-chain 提出へ

## フェーズ設計（段階導入）
### Phase 0: Replay共有（いま回せる形）
- 視聴者は「Nyano AI Challenge」リンクで遊ぶ
- 勝った replay URL をチャットに貼る
- 配信者は replay を拾って解説（採点・ランキングに繋げられる）
- さらに、Replay を overlay に同期して “配信の絵” にできる

### Phase 1: OBS Overlay（導入済み）
- ブラウザだけで成立する overlay: `/overlay`
- Match の進行を overlay にブロードキャスト（BroadcastChannel / localStorage fallback）
- **Replay の step も overlay に同期**できる（解説・採点に向く）
- OBS Browser Source に貼るだけで試合が映る

### Phase 2: “Chat ↔ Match” の接続（次の実装）
- Twitch チャット（IRC or EventSub）からコマンドを受け取る
- “単発入力” ではなく **投票/合議** を標準にする（荒れにくい）
- コマンドを Match Coordinator が検証し、進行を overlay に流す

### Phase 3: 参加者アイデンティティ（任意）
- 「Twitchアカウント ↔ Wallet」をリンク（署名）して本人性・保有NFTを担保
- 1v1 の “指名試合” を成立させる
- ただし重いので、**Phase 2 の “Chat総意” で十分盛り上がる**可能性も高い

### Phase 4: 自律運営に寄せる（Autonomy）
- ルールセット更新、イベント追加、Nyano AI 設定の変更などを「提案→投票」可能に
- “運営がいなくても回る” を現実にする

## 配信で成立させたい体験
### 1) 観戦者が迷わない
- いま何が起きているか（ターン、手番、勝敗条件）
- どこに置いたのか（セル番号/座標）
- なぜその勝敗になったか（flip の理由、ボーナスの発動）

### 2) 参加者が混ざれる
- “視聴するだけ” と “参加する” の間に段階がある
  - replay 投稿（最も軽い）
  - チャット投票（中）
  - 1v1 指名試合（重い）

### 3) Nyanoらしい配信
- AI Nyano が “性格” を持ち、盤面に反応する（短いコメント/表情）
- ただし強すぎ/長すぎはNG：テンポが命

## 技術構成（高レベル）
- Web（Vite/React）: Match / Replay / Overlay / Stream Studio
- Engine（@nyano/triad-engine）: transcript を deterministic に再現
- Twitch Bridge（予定）:
  - Chat受信（IRC または EventSub）
  - 投票集計/レート制限
  - Match Coordinator へ “正規コマンド” を送る

## コマンド方針（案）
- 直接操作より “投票” を基本にする
  - 例: `!vote 4 2`（cell=4, cardIndex=2）
- 投票期間を 10〜20秒で切る（配信テンポ優先）
- 不正/無効コマンドは静かに落とす（荒れを助長しない）

## セキュリティ/運用
- Twitch OAuth token や秘密情報は **ブラウザに入れない**
- Bot はローカル or サーバ（別プロセス）で動かす
- まずは “overlay + replay” で成立させ、接続は後で足す

## 参照
- 実装: `/overlay` と `/stream`
- 次の実装: Twitch Bridge / Chat投票 / Coordinator

## 段階的導入（Phase）
### Phase 2: Chat voting（Twitch前のプロトタイプ）
目的は「Twitch API と接続する前に、ゲーム側のインターフェース（コマンド）を固定する」こと。

- `/stream` が **投票集計（chat simulation）** を担当
- `/match?stream=1` が **投票結果を適用**（opt-in）
- Tab間の通信は `BroadcastChannel` / `localStorage` fallback で行う（バックエンド不要）
- 後から Twitch Bridge（EventSub/IRC）に置換しても、`/match` 側の契約は変えない

**採用する最小コマンド**
- commit_move_v1: `turn`, `by(A/B)`, `cell`, `cardIndex`, `warningMarkCell?`

**UX**
- “投票が成立した” → toast
- turnが進んだら vote は自動で閉じる（誤適用防止）

### Overlay に投票状況を表示（Phase 2.5）
- /stream が vote state を broadcast し、/overlay が countdown と top votes を表示
- 視聴者が「いま投票中」を理解できることで参加率が上がる（配信の絵が成立）


## UI改善（配信の“理解速度”を上げる）
- Overlay: flip×N / MARK などの即時サマリー
- Stream Studio: legal move helper（空きセル・残りカード・wm残数）


## Stream Studio の運用改善（Phase 2.5）
- Quick move picker: 空きセル/残りカード/wm残数を明示
- Suggested moves: “center→corner→edge” の型で3案を提示（参加しやすさ優先）
- Overlay: vote/flip の要点を短いバッジで表示（実況が自然に出る）


## Overlay: turn summary badges（Phase 2）
- flip×N（engine turn summary 由来）
- COMBO: MOMENTUM/DOMINATION/FEVER
- PLUS +X / IGNORE MARK / TRIGGERED MARK / PLACED MARK

※ 次フェーズで trace を導入し、EDGE/FORMATION 等の理由も確定表示へ。


## Overlay: Flip traces（Phase 3）
- triad-engine の TurnSummary.flipTraces を転送し、flipごとに
  - DIRECT/CHAIN
  - DIAG
  - JANKEN（tie-break）
  - aVal/dVal
  を表示（controls=1 のときのみ）

これにより実況で「なぜ？」が説明しやすくなる。


## Reason badges（Phase 3.1）
- overlay の Last move に CHAIN× / DIAG× / JANKEN× の集計バッジを追加
- 詳細（from/to/aVal/dVal）は controls=1 のときのみ表示


## nyano-warudo 連携（Puzzle Show trigger）
- Triad League から `POST /v1/snapshots` を送信できることが最短。
- `kind=ai_prompt` / `kind=state_json` の両方を用意し、配信運用で使い分ける。
- **投票開始時点でも state_json を送る**（strictAllowed の合法手 allowlist を投票中にズラさない）


- 詳細: `docs/01_product/Nyano_Triad_League_NYANO_WARUDO_BRIDGE_SPEC_v1_ja.md`


### nyano-warudo strictAllowed
- vote start: state_json を送って合法手 allowlist を確定
- vote open: state が更新された場合に state_json を再送（任意 / debounced）


## サンプル提出（nyano-warudo 実装確定用）
`/stream` の Bridge から以下をエクスポートできる。
- state_json（strictAllowed の allowlist 検証に使用）
- transcript/protocolV1（正規表現/表示/集計の実装確定に使用）
- ai_prompt（Puzzle Show trigger / LLM 用）
