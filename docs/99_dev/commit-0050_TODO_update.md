# commit-0050 TODO update

## Done
- [x] nyano-warudo snapshot sender (POST /v1/snapshots)
- [x] viewer command format decided + parser supports it
- [x] provide sample state/transcript/protocol (docs/02_protocol/samples)

## Next
### nyano-warudo側の効率化に合わせる
- [ ] snapshot state_json の content schema を固定化（互換性管理）
- [ ] `ai_prompt` を nyano-warudo 側の system prompt に合わせて整形（話芸・短い指示）

### AI Nyano 対戦への道
- [ ] AI move suggestion: state_json → engine evaluate → top3 moves
- [ ] Twitch EventSub/IRC bridge（commands/votes の自動収集）
