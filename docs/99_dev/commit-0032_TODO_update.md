# commit-0032 TODO update（差分）

## Done（commit-0032）
- Match（ローカル対戦ドラフト）を追加（Decks → Match → Replay）
- Arena / Decks から Match へ遷移できる導線を追加
- 9手固定 transcript 前提のまま “途中経過”を preview できるように placeholder 補完を導入

## Next（commit-0033）
- Match の UI polish（カード選択/警告マーク/ログの視認性改善）
- warning mark の残り回数や、禁止操作（同一セル/同一カード）の事前表示
- “Match setup” の保存（URLだけで再開できる：deck/ruleset/firstPlayer/seed）
- 署名導入の下地（typed data 生成・Signer 接続はまだしない）
