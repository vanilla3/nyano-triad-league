# commit-0067 IMPLEMENTATION LOG

## Summary
- UI: /match & /replay に ScoreBar を追加（tiles + 進行）
- UI: TurnLog に flipTraces（engine出力）を badges と詳細パネルで表示
- engine: TurnSummary に flipTraces を載せる（未適用環境でも確実に有効になるよう同梱）

## Why
- 画面が “機能” に寄っていてゲーム感が弱い → 進行/優勢が一目でわかる UI を先に追加
- 配信/観戦で「何が起きたか」を説明可能にするための基盤整備（flipTraces）
