# commit-0052 IMPLEMENTATION LOG

## What
- nyano-warudo strictAllowed 対応:
  - 投票開始時点（vote start）でも `state_json` を送信するように変更
  - 送信順: `state_json` → `ai_prompt`
    - state_json で合法手 allowlist を最新化してから、ai_prompt で Puzzle Show をトリガーできる
- Stream UI:
  - auto send checkbox の文言を更新（vote start → state_json + ai_prompt）
  - strictAllowed の意図を説明する注記を追加

## Why
投票開始時に ai_prompt だけ送ると、投票中に合法手 allowlist がズレる可能性がある。  
state_json を先に送って strictAllowed を効かせることで、荒れにくい視聴者参加になる。fileciteturn1file0

## Manual test checklist
- `/stream` で `vote start → state_json + ai_prompt` を ON
- `Start vote` すると nyano-warudo に 2リクエスト送られる（state_json が先）
- nyano-warudo 側で strictAllowed が合法手の allowlist を更新していること
