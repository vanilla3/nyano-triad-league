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
