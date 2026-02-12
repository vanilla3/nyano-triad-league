# Nyano Triad League — UX Scorecard

> "任天堂レベルUX" の判定基準チェックリスト。
> 各項目を定期テスト（無説明テスト・観戦テスト）で記録し、改善ループを回す。

---

## A: "一目で目的が分かる" (At-a-glance)

| # | チェック項目 | 測定方法 | 目標 | 現状 |
|---|-------------|---------|------|------|
| A-1 | 初見が30秒以内に1手目を置ける | `first_place_ms` テレメトリ | < 30,000ms | 計測可能（Home > Settings） |
| A-2 | 画面内に "次にやること" が常に1行で表示されている | 目視 | Yes | ✅ Yes (Mint: ActionPrompt) |
| A-3 | スコア（タイル数）が常時見えている | 目視 | Yes | Yes |
| A-4 | 現在のターン（誰の番か）が一目で分かる | 目視 | Yes | ✅ Yes (Mint: ScoreBar turn indicator) |

## B: "説明なしで触れる" (Direct Manipulation)

| # | チェック項目 | 測定方法 | 目標 | 現状 |
|---|-------------|---------|------|------|
| B-1 | Home から試合開始まで10秒以内 | `quickplay_to_first_place_ms` テレメトリ | < 10s | 計測可能（Home > Settings） |
| B-2 | 置けるセルが "見れば分かる"（形・色で区別） | 無説明テスト | Yes | ✅ Yes (Mint: puffy+breathe vs flat) |
| B-3 | カード選択 → セル選択の2ステップが直感的 | 無説明テスト | Yes | ✅ Yes (Mint: HandDisplayMint + ActionPrompt) |
| B-4 | モバイルで誤タップなく操作できる | `invalid_action_count` | < 2回/試合 | 計測可能（Home > Settings） |

## C: "見れば分かるデザイン" (Design follows Function)

| # | チェック項目 | 測定方法 | 目標 | 現状 |
|---|-------------|---------|------|------|
| C-1 | 置けないセルが "押せない" と分かる外見 | 無説明テスト | Yes | ✅ Yes (Mint: flat+sunken vs selectable) |
| C-2 | 置けない理由がインラインで短く出る | 目視 | Yes | ✅ Yes (Mint: InlineError pill, auto-dismiss) |
| C-3 | カードの強さ（辺の数字）が直感的に読める | 無説明テスト | Yes | Yes |
| C-4 | プレイヤーA/Bが色で明確に区別できる | 目視 | Yes | Yes |

## D: "見えないものを見える化" (Feedback First)

| # | チェック項目 | 測定方法 | 目標 | 現状 |
|---|-------------|---------|------|------|
| D-1 | フリップの因果（どの方向が勝ったか）が矢印/ラインで分かる | 観戦テスト | Yes | ✅ Yes (Mint: FlipArrowOverlay SVG) |
| D-2 | 連鎖フリップが視覚的に追える | 観戦テスト | Yes | ✅ Yes (Mint: chain=violet, staged anim) |
| D-3 | 効果音で "通った/通らない" が画面を見なくても分かる | 音声テスト | Yes | ✅ Yes (Mint: sfx.ts Web Audio) |
| D-4 | NyanoのAI理由が短いバッジ/表情で分かる | 目視 | Yes | ✅ Yes (Mint: NyanoReaction mint + aiReasonCode) |

## E: "身近なメタファー" (Familiar Metaphor)

| # | チェック項目 | 測定方法 | 目標 | 現状 |
|---|-------------|---------|------|------|
| E-1 | 難易度ラベルが身近な言葉（はじめて/ふつう 等） | 目視 | Yes | ✅ Yes (Home: はじめて/ふつう/つよい/めっちゃつよい) |
| E-2 | UI要素が日常/玩具の比喩で整理されている | レビュー | Yes | 部分的 |

## F: "機能追加で分かりにくくしない" (Progressive Disclosure)

| # | チェック項目 | 測定方法 | 目標 | 現状 |
|---|-------------|---------|------|------|
| F-1 | 高度情報（AI解析/ログ/配信HUD）がDrawer/折りたたみに隠れている | 目視 | Yes | ✅ Yes (Mint: MatchDrawerMint) |
| F-2 | 初心者が迷わないUI密度になっている | 無説明テスト | Yes | ✅ Yes (Mint: density toggle シンプル/ふつう/すべて) |
| F-3 | 上級者は必要な情報にアクセスできる | レビュー | Yes | Yes |

## G: アクセシビリティ・パフォーマンス

| # | チェック項目 | 測定方法 | 目標 | 現状 |
|---|-------------|---------|------|------|
| G-1 | `prefers-reduced-motion` で演出が控えめになる | ブラウザ設定 | Yes | ✅ Yes (Mint: all animations + SFX) |
| G-2 | ミュート設定で音が完全に消える | UI設定 | Yes | ✅ Yes (Mint: 🔊/🔇 toggle + localStorage) |
| G-3 | LCP < 2.5s | `home_lcp_ms` テレメトリ + Lighthouse | Yes | 計測可能（Home > Settings） |

---

## 実装状況サマリ

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 0 | Mint UI 基盤 (CSS vars, keyframes, theme) | ✅ 完了 |
| Phase 1 | Home リデザイン (すぐ遊ぶ CTA) | ✅ 完了 |
| Phase 2 | 盤面/手札/結果画面 (BoardViewMint, HandDisplayMint, GameResultOverlayMint) | ✅ 完了 |
| Phase 3 | フィードバック+演出 (FlipArrowOverlay, sfx.ts, NyanoReaction mint) | ✅ 完了 |
| Phase 4 | Progressive Disclosure (MatchDrawerMint, UI Density Toggle) | ✅ 完了 |

---

## 計測テレメトリ一覧

| イベント名 | 型 | 説明 |
|-----------|-----|------|
| `first_interaction_ms` | number | ページ読み込みから最初の操作までの時間 |
| `first_place_ms` | number | ページ読み込みから1手目配置までの時間 |
| `quickplay_to_first_place_ms` | number | Home の「すぐ遊ぶ」押下から1手目配置までの時間 |
| `home_lcp_ms` | number | Home ページの Largest Contentful Paint |
| `invalid_action_count` | number | セッション内の不正操作回数 |

---

## テスト運用

- **無説明テスト**: 初見の人に何も言わず触ってもらい、A-1〜C-2 を記録
- **観戦テスト**: プレイしていない人に画面を見せ、D-1〜D-4 を記録
- **失敗納得テスト**: わざとミスをしてもらい、C-1〜C-2 を記録
- **クイック判定**: Home > Settings の `UX Target Snapshot` で A-1/B-1/B-4/G-3 の達成状況を確認
- **頻度**: 隔週（大きな変更の後は都度）
- **記録先**: `docs/ux/PLAYTEST_LOG.md`（別途作成）
