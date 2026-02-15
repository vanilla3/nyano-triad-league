# Nyano Triad League Frontend タスクボード v5 (JA)

更新: 2026-02-15

このタスクボードは、フロント側の中〜長期の改善項目を **「依頼しやすい作業単位」**に分割したものです。
Codex へ依頼する場合は、原則 `codex/work_orders/*.md` を 1 本ずつ回します。

---

## Done（済 / 基盤）
- [x] /overlay 視認性改善（HUD: turn/tiles/flip理由/strictAllowed/vote）
- [x] /replay: Auto Play + speed（play/pause）
- [x] /match: 入力盤面を BoardView 系に統一（selectableCells/onCellSelect）
- [x] Mint UI の導入（カード/盤面のガラス調）
- [x] Classic Rules 導入（engine/web）

---

## P3（最優先）: Mint Battle UI の “ゲーム画面” 化（参照画像ベース）

参照仕様:
- `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md`

対応する ExecPlan / Work Orders:
- ExecPlan: `codex/execplans/008_mint_gamefeel_ui_upgrade_from_reference.md`
- Work Orders:
  - `011_mint_gamefeel_background_and_stage.md`
  - `012_mint_gamefeel_top_hud.md`
  - `013_mint_gamefeel_stage_layout_and_player_panels.md`
  - `014_mint_gamefeel_hand_tray_and_prompt.md`
  - `015_nyano_reaction_no_layout_shift_v2.md`
  - `016_mint_gamefeel_microinteraction_polish.md`

狙い:
- 「上(状況) / 中(盤面) / 下(操作)」の定位置化
- 背景レイヤーとトレイ/パネルの厚みで “スマホゲー感” を作る
- Nyano コメントや演出が入ってもレイアウトが崩れない

---

## P4（高）: 任天堂品質のセットアップ導線（触れば分かる）

- Match Setup の情報設計（既存 UI は機能が多く、初見が迷う）
  - Work Order: `008_match_setup_nintendo_quality.md`
- Rulesets ページの “一見で分かる” 化
  - Work Order: `009_rulesets_page_make_it_obvious.md`

---

## P5（中）: UX 回帰の予防線（テスト/計測）

- UI/レイアウトの回帰を自動検知する仕組み
  - Work Order: `010_ux_regression_guardrails.md`

---

## 依頼しやすい作業単位（協力者向け）

### CSS/見た目中心（影響範囲が限定される）
- P3: 011 / 014 / 016

### レイアウト/コンポーネント追加（確認が必要）
- P3: 012 / 013

### 安定性・テスト（地味だが効く）
- P3: 015
- P5: 010
