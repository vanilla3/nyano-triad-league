# commit-0030 TODO update（差分）

## Done（commit-0030）
- TurnLog の Δ 表示を「反転の理由」まで拡張（edge / triadPlus / warning / janken）
- edge/janken では説明できない flip を明示（chain/extra rule の可能性）

## Next（commit-0031）
- Replay の partial failure UX：複数 tokenId のうち「どれが失敗したか」を一覧表示して再試行できる
- Turn explanation をさらに“実況化”：
  - 反転の対象カードの edge 値を表（my vs their）で見やすく
  - warning ignored（fever等）の理由ラベルを強化
- share link の短縮をもう一段：compact transcript schema（JSONではなく短い文字列）
