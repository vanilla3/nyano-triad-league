# 配置方法（最短）

1) このzip（またはフォルダ）を **リポジトリのルート**に展開します  
   例：`nyano-triad-league/AGENTS.md` ができる場所

2) 追加されたファイルはコミット推奨（チーム共有向け）
- `AGENTS.md`
- `apps/web/AGENTS.md`
- `packages/triad-engine/AGENTS.md`
- `codex/`
- `.agents/skills/`（任意）

3) 動作確認（Codex CLI）

> `--ask-for-approval` は `untrusted | on-request | never` を推奨（`on-failure` はdeprecated）。

### まずは“読むだけ”で確認（安全）
```bash
echo "Summarize the current repo instructions." | \
  codex exec --model gpt-5.3-codex --sandbox read-only --ask-for-approval never -
```

### 自動実装まで含めて確認（ローカル作業向け）
```bash
echo "List the work orders and propose the next one to run." | \
  codex exec --model gpt-5.3-codex --full-auto --ask-for-approval on-request -
```
