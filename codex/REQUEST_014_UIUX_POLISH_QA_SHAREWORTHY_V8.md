# REQUEST 014: UI/UX Polish + QA (Shareworthy v8)

目的:
- これまで追加した「Mint UI / Motion system / Alive background / VFX / SFX / Idle guide」改善が **“きれいに”**適用されていることを担保する
- 特に **バトル盤面（Match）を中心に**、触っていて気持ちよく、見た目で「ゲーム感」が伝わる品質へ引き上げる
- さらに「このUIいい！」と **シェアされる**体験（気持ちいい動き・見映え・共有導線）を作る

背景:
- 現状の実装は、見た目/演出の土台（Mintテーマ、ガラス質感、入場モーション、背景の生体感、粒子/シェイク、SFX）が揃いつつある
- 一方で、Match 周辺に **文字化け（mojibake）**や **私用領域アイコン（PUA）**など「品質を一瞬で壊すノイズ」が混入している
- 参照UI（添付画像）と比べると、ボード/ボタンの “質感” は **テクスチャ（微細ノイズ・シーン・柔らか影）**の品質が不足（現状は placeholder PNG）

---

## 絶対に守る思想（桜井政博レンズ）

- 入力の気持ちよさ = **反応の早さ + 変化の明確さ + 手触り（タメとツメ）**
- 何が起きたかは 0.2 秒以内に理解できる（勝敗/取得/反転/選択）
- かわいさは「丸み + 透明感 + 余白 + 柔らか影」。ただし “ボケすぎ” は情報を壊す
- 目立つ演出は「必要なところだけ」。常時ギラギラさせない（主役はカードと盤面）
- 低スペック/省電力/減光（reduced motion / vfx low）でも破綻しない

---

## 現状確認で見つかった P0（放置禁止）

1) Match 周辺の **文字化け（UTF-8/CP932の混線）**
- 対象（少なくとも）:
  - `apps/web/src/pages/Match.tsx`
  - `apps/web/src/features/match/*` の一部（複数）
  - `apps/web/src/features/match/__tests__/*` の一部
- 影響: UI文言が崩れ、シェア品質を毀損。さらに U+0080 の制御文字が混入。

2) 私用領域文字（PUA）の混入
- 例: `\uE05E` / `\uF8F0`
- フォントが無い環境では “豆腐” になり、UIが壊れる。

3) 参照UIに寄せるための “素材” が placeholder
- `apps/web/public/assets/gen/*.png` が 68 bytes のダミー（目に見える質感が出ない）

---

## この Request の成果物

### A) QA/健全化
- 文字化け/制御文字/PUA をゼロにする（検知スクリプトも追加）
- Match（Mintテーマ）で主要UI文言が **自然な日本語**で表示される
- 既存改善（Motion/VFX/SFX/Idle guide）が意図通り発火していることを確認できるチェックリストを用意

### B) 盤面のゲーム感・質感強化
- ボード/セル/ボタンの「厚み・光・影」を統一（Mint material spec に沿う）
- “置ける場所” と “選択中” が一目で分かる（視線誘導）

### C) シェアされる体験
- 共有導線（URL/JSON/リプレイ）の文言/見た目を整理し、押しやすくする
- 可能なら「共有用ビジュアル」（ミニ結果カード）を追加（依存は最小）

---

## 禁則（守らないと差し戻し）

- 重い動画背景のベタ貼りは禁止（現状の軽量 “擬似シェーダー” 方針を維持）
- アニメは `prefers-reduced-motion` と VFX設定に必ず従う
- 既存のルール/エンジン仕様を壊さない（ゲームロジックは最優先で安定）

---

## 参照ドキュメント（既存）

- `docs/01_design/NYTL_GAME_UI_QUALITY_PRINCIPLES_SAKURAI_LENS_v1_ja.md`
- `docs/01_design/NYTL_BATTLE_BOARD_UI_QUALITY_GUIDE_SAKURAI_LENS_v1_ja.md`
- `docs/01_design/NYTL_BATTLE_BOARD_VISUAL_GAPLIST_v1_ja.md`
- `docs/01_design/NYTL_UI_MOTION_SYSTEM_TAME_TSUME_v1_ja.md`
- `docs/01_design/NYTL_MINT_MATERIAL_SPEC_v1_ja.md`
