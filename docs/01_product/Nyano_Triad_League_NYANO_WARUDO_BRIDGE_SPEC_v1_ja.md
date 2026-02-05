# Nyano Warudo Bridge Spec v1 (Triad League → nyano-warudo)

## Goal
Nyano の配信（nyano-warudo）側で **Puzzle Show** を起動するため、Triad League 側から snapshot を送れるようにする。

## Endpoint
`POST /v1/snapshots`

### Request JSON
```json
{
  "source": "triad_league",
  "kind": "ai_prompt",
  "content": "..."
}
```

- `source`: 固定 `"triad_league"`
- `kind`:
  - `"ai_prompt"`: AI向けに、盤面・手札・合法手・目的を文章化したもの
  - `"state_json"`: 盤面/手札/ターン/合法手/プロトコル(Transcript)を含むJSON（stringified）
- `content`: 文字列（prompt or JSON文字列）

## When to send
最短で動かすため、Stream Studio から手動送信 + オプションで自動送信を提供する。

- vote start → ai_prompt（Puzzle Show trigger）
- vote end → state_json（結果共有/次ターンへの導入）

## Viewer move format (chat)
nyano-warudo で正規表現・表示・集計しやすい “短い型” を定義する。

### Canonical
`#triad A2->B2 wm=C1`

- `A2`: 手札スロット2（1..5）
- `B2`: 盤面セル（A1..C3）
- `wm=C1`: optional warning mark (A1..C3)

### Also accepted
- `#triad B2 2`
- `!move 4 1 wm=6`（legacy / dev format）

## Samples
- `docs/02_protocol/samples/*` を参照（1ゲーム分の transcript/state_json 例）。
## Stream Studio UI
`/stream` に **Nyano Warudo Bridge** パネルを設置し、以下を提供する。

- Base URL input（`VITE_NYANO_WARUDO_BASE_URL` も参照）
- 手動送信:
  - Send ai_prompt
  - Send state_json
- 自動送信（任意）:
  - vote start → state_json + ai_prompt（strictAllowed 用）
  - vote end → state_json
- payload / result を CopyField で確認（nyano-warudo 側のログと突き合わせしやすい）

## state_json schema (v1)
`content` は JSON文字列（stringified）で、少なくとも以下を含む。

- `protocol`: `"triad_league_state_json_v1"`
- `sentAtMs`
- `eventId` / `eventTitle`
- `mode` / `turn` / `toPlay`
- `controlledSide`
- `viewerCommandFormat`
- `protocolV1`（Transcript: header + turns）
- `board`（9 cells / owner + cardSlot + tokenId）
- `hands`（deck slots + used）
- `legalMoves`（viewer command string 付き）
- `warningMark`（remaining + candidates）
