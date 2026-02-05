# Nyano Triad League · Twitch Chat Voting Spec (v1 / ja)

## 目的
最終的に **AI Nyano が Twitch で配信しながら、視聴者と対戦**できる状態へ到達するために、
「チャット入力 → ゲーム入力」部分を先に固定する。

Twitch連携（EventSub/IRC）は後から差し替え可能にして、
ゲーム本体（/match）に秘密情報やAPI依存を持ち込まない。

## 全体構成（最小）
- **/match（Host）**: 状態を進める。`stream=1` のときだけ外部コマンドを受け付ける。
- **/stream（Console）**: 投票を集計して、勝った move を /match に送る。
- **/overlay（OBS）**: 状態を表示する（入力はしない）。

通信は `BroadcastChannel` を優先し、ダメなら `localStorage` の storage event にフォールバックする。

## コマンド（最小契約）
### commit_move_v1
- `version: 1`
- `id`: string（重複適用防止）
- `issuedAtMs`: number
- `type: "commit_move_v1"`
- `by`: 0|1（A=0, B=1）
- `forTurn`: number（0..8）
- `move.cell`: number（0..8）
- `move.cardIndex`: number（0..4）
- `move.warningMarkCell?`: number|null（0..8, 省略可）

### 適用条件（/match 側）
- `stream=1` のときのみ適用
- `forTurn === currentTurn`（turn mismatch は無視）
- `by === currentPlayer`（手番違いは無視）
- `vs Nyano AI` のとき、Nyano側（AI）には適用しない（上書き禁止）

## 投票アルゴリズム（/stream 側）
- 1 user = 1 vote（上書き可）
- 集計は move の完全一致（cell/cardIndex/wm）
- 勝者決定:
  1. vote数 最大
  2. tie-break: cell 昇順 → cardIndex 昇順 → warningMarkCell（nullは最後）

## UX（配信運用）
- turn開始時に投票を開始（15秒が目安）
- 投票が 0 の場合は “No votes” として何もしない（事故防止）
- 投票確定の結果を overlay に出すのは Phase 3（現状は Host/配信者が見えればOK）

## Twitch Bridge（次フェーズの差し替え点）
/stream が現在 “chat simulation” をしている部分を、Twitch Bridge が置き換える。

- Bridge: Twitch chat -> vote state -> publishStreamCommand()
- 秘密情報（OAuth token / client secret）をブラウザに置かない
- Bridge の出力は **同じ StreamCommandV1** に統一する

---

## 付録：チャット入力例（プロトタイプ）
- `!move 4 2`
- `!m 4 2`
- `4 2`
- `4 2 wm=6`
- `!move 4 2 w 6`

## Overlay表示（Phase 2.5）
- vote status を overlay に表示する（OPEN/残り秒数/Top votes）
- overlay 側で `vote=0` を指定すれば非表示にもできる


## Stream Studio 補助UI（v1）
- legal move helper:
  - 空きセル（usedCells）
  - 残りカードIndex（usedCardIndicesA/B）
  - warning mark 残数（3 - used）

これらは /match が overlay bus に best-effort で送る。存在しない場合はUIが控えめにフォールバックする。


## Suggested moves（運用補助）
- 配信/イベント運用では “参加しやすさ” が最重要。
- 強さ最適化の前に、視聴者が迷わない **型（center→corner→edge）** を提示する。
- 次フェーズで engine trace を導入し、強さベースの推薦に置き換える。


## Overlay の turn summary（配信向け）
- /match, /replay から overlay bus に lastTurnSummary を送る。
- overlay は flip/COMBO/PLUS/MARK を短いバッジで表示し、実況の足場にする。


## Flip traces（実況補助）
- overlay bus の lastTurnSummary.flips に per-flip trace を入れる。
- OBS表示は原則OFF（controls=0）で、配信者の確認時（controls=1）だけ詳細を出す。


## Reason badges（短い実況用）
- overlay は per-flip trace から CHAIN/DIAG/JANKEN を集計し、短いバッジで表示する。


## 視聴者コマンド（提案の型）
### Canonical
`#triad A2->B2 wm=C1`

- A2: 手札スロット2（1..5）
- B2: 盤面セル（A1..C3）
- wm=...: optional warning mark

### 正規表現（例）
- `/#triad\s+([A][1-5]|[1-5])\s*->\s*([A-C][1-3])(\s+wm=([A-C][1-3]))?/i`

Triad League 側はこの形式も parse できるようにしてあります。
