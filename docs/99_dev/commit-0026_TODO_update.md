# commit-0026 TODO update（差分）

## Done（commit-0026）
- Nyano tokenId を read-only で読み出してカード化する UI（Nyano Inspector）
- transcript JSON 貼り付け→オンチェーン読み取り→再現する UI（Replay）
- RPC設定を env で差し替え可能に（.env.example 同梱）

## Next（commit-0027）
- Replay の “共有” をさらに軽量化：
  - transcript JSON の圧縮（短縮URL or base64）
  - URL クエリ復元（貼り付け不要に近づける）
- Turn explanation（なぜ flip したか：edge/janken/power）を TurnLog に付与して「読み物」を強化
- Playground から “現在の transcript を Replay に渡す” ボタン（共有導線の短絡）
