# commit-0071 IMPLEMENTATION LOG

## Summary
- **P2-1（DONE）**: 投票開始の瞬間に `state_json` を送る（strictAllowed allowlist を固定しやすくし、荒れを防ぐ）
- `/stream` の Nyano Warudo Bridge を運用向けに整理：
  - `vote start → state_json`（既定ON）
  - `vote start → ai_prompt`（任意）
  - `vote open → refresh state_json on state updates`（任意）
  - `vote end → state_json`（任意）
- 上記トグルを localStorage に保存し、配信中のリロード/タブ落ちでも設定が復元される

---

## Why
- nyano-warudo 側の `strictAllowed` は **投票開始時点の allowlist が正** であるほど強く効きます。
- 従来は `ai_prompt` 送信トグルに state_json が “ぶら下がって” いたため、
  運用で「promptはいらないが allowlist は送りたい」ケースが漏れやすかった。
- 配信運用は “人間が忘れる” 前提で設計する必要があります（設定の永続化）。

---

## What
- `apps/web/src/pages/Stream.tsx`
  - `autoSendStateOnVoteStart` を追加（既定ON）
  - `autoSendPromptOnVoteStart` は ai_prompt のみに責務を限定（state_json と分離）
  - `autoResendStateDuringVoteOpen` を Nyano Warudo Bridge セクションへ移動（意味が明確）
  - すべての送信トグルを localStorage に保存
  - `startVote()` で `state_json` を vote start 時点に送る（best-effort / 非ブロッキング）

---

## Verify
- `/stream` を開き、`nyano-warudo Base URL` を設定
- `Start vote` を押すと、**state_json が自動送信**される（Last payload / result が更新される）
- `vote start → ai_prompt` を ON にした場合のみ、ai_prompt も送られる
- リロード後もトグル設定が保持される
