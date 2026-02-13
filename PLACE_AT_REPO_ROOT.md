# 配置方法（最短）

1) このzip（またはフォルダ）を **リポジトリのルート**に展開します  
   例：`nyano-triad-league/AGENTS.md` ができる場所

2) 追加されたファイルをコミットしても良いです（チーム共有推奨）
- `AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/triad-engine/AGENTS.md`
- `codex/`
- `.agents/skills/`（任意）

3) 動作確認（Codex CLI）
```bash
codex --model gpt-5.3-codex --ask-for-approval never "Summarize the current instructions."
```

