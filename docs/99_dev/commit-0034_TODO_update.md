# commit-0034 TODO update（差分）

## Done（commit-0034）
- Events ページ（公式イベント v1）追加
- Match: event パラメータ対応（条件固定、Nyanoデッキ固定）
- Arena からイベント導線を追加
- Docs: Events Spec v1 + 計画/仕様更新

## Next（commit-0035）
- Event の “挑戦結果の共有” UX を磨く
  - replay URL をイベントカードに紐付けて共有しやすく（copy/open）
  - replay のタイトル/タグ（eventId）を表示
- Event ごとの “簡易ランキング”
  - まずは local（手元）保存（replay URL と結果）で十分
  - 将来：オンチェーン提出→集計
- Nyano（AI）をより “キャラ” に寄せる
  - AIの説明（なぜその手？）を TurnLog に自然言語で表示
  - difficulty を増やす前に「語りやすさ」を優先
