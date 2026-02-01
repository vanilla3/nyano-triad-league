# Design Summary (v2 key points)

Design Document v2.0 の「面白さの核」を、実装可能な単位に圧縮した要約です。

## 4層戦略（レイヤー）
- Layer 1 CORE: Triad比較、じゃんけん決着、連鎖（コンボ）
- Layer 2 TACTICS: 警戒マーク、コンボボーナス、コンボ予測UI、先攻後攻補正
- Layer 3 SYNERGY: Trait効果（パッシブ/条件）、フォーメーションボーナス
- Layer 4 META: シーズンルール（盤面/triad調整/trait環境/デッキ制約/特殊）をモジュール化

## MVP優先（初期実装の順）
1) CORE: Triad + じゃんけん + 連鎖
2) TACTICS: 警戒マーク（3回/試合、1ターン有効）
3) SYNERGY: Trait効果（最初は読みやすい5種から）
4) META: シーズンルール（JSON定義）と適用順（レイヤー→priority）

## 実装メモ
- ルールは pure 関数で合成できる形にする（Replay/検証のため）
- 公式戦は transcript を署名し、オンチェーンで再計算して確定（1 tx）
