# ExecPlan 010 — UI「かわいさ」v3 + Classic Rules を“実際に遊べる”状態へ

この ExecPlan は living document です。作業とともに `Progress` / `Decision Log` / `Surprises & Discoveries` / `Outcome` を更新します。

参照:
- アプリ全体の参照画像分解: `docs/01_design/NYTL_MINT_UI_REFERENCE_APP_SCREENS_v1_ja.md`
- 参照画像（Match / Home / Arena / Deck Builder / Onboarding）:
  - `docs/01_design/reference/ui_mockups_20260215/01_main_menu_reference.png`
  - `docs/01_design/reference/ui_mockups_20260215/02_onboarding_reference.png`
  - `docs/01_design/reference/ui_mockups_20260215/03_arena_mode_select_reference.png`
  - `docs/01_design/reference/ui_mockups_20260215/04_deck_builder_reference.png`
  - `docs/01_design/reference/ui_mockups_20260215/05_match_screen_reference.png`
- Classic Rules 仕様: `docs/02_protocol/Nyano_Triad_League_CLASSIC_RULES_SPEC_v0_ja.md`

---

## 1) Purpose / Big Picture

### UI（v3）
Mint UI は既に「ガラス + パステル + 影」の基盤があり、ゲームらしさは出てきている。
次の段階では **“かわいさ” の密度** を上げる（＝情報の見せ方をより直感的に、背景/アイコン/装飾の統一感を強める）。

### ルール（Classic）
Classic Rules のエンジン実装はあるが、
- 選べる項目が限定的
- ルール同士を組み合わせられない
- 選んだルールが Replay/Share まで一貫して説明できない

という状態だと “実際の遊び” に繋がりにくい。

**最終的にユーザーができるようになること**
- Match のルール選択が「触れば分かる」
- Classic Rules を（単体だけでなく）複数組み合わせて遊べる
- 共有 URL で見た人が同じルールで再生できる

---

## 2) Scope

### In-scope
- Classic Rules を UI から選択できるようにする
  - まずは “プリセット拡充”（Reverse / AceKiller / TypeAscend / TypeDescend など）
  - 次に “カスタムビルダー”（複数チェック）
  - Share/Replay でルール情報を失わない（URL で保持する）
- Mint UI の v3 polish
  - 参照画像の「かわいさ」を阻害している箇所を整理し、視線誘導をより強める
  - アイコン/ピル/バッジ/背景の統一感
  - 必要なら画像アセット（生成/手作業）を導入できる土台

### Out-of-scope
- triad-engine の決定論を変える
- transcript の canonical schema を破壊する
- 大規模な状態管理リファクタ
- ルールの新規追加（未実装の classic rule を増やす等）

---

## 3) Non-negotiable constraints (Invariants)

- 決定論（transcript 再現）を壊さない
- URL 互換（Match/Replay の既存 query）を壊さない
  - 新しい param は追加可（後方互換で読む）
- `state_json v1` / viewer command / `streamer_bus` の互換を壊さない
- `prefers-reduced-motion` と `data-vfx` を尊重する

---

## 4) Current State (What exists today)

### Classic Rules
- エンジン: `packages/triad-engine/src/engine.ts` に classic 捕獲（plus/same/reverse/aceKiller 等）が実装済み
- `resolveClassicForcedCardIndex` / `resolveClassicOpenCardIndices` / `resolveClassicSwapIndices` も Web 側で利用済み
- ただし Web の ruleset registry / UI は **一部 classic のみ**が選択可能

### Mint UI
- Mint コンポーネント群（GameShell/GlassPanel/TopHud/HandTray/PlayerPanel）は存在
- 参照画像に近い見た目は出ているが、
  - ルール選択 UI
  - 画面間の統一
  - “かわいさ” を支える小物（アイコン/装飾）

の密度がまだ足りない

---

## 5) Proposed Design

### Classic Rules の「使える」定義
- **選択**できる（Match setup で迷わない）
- **説明**される（何が起きるルールか分かる）
- **共有**できる（URL で同じルールが再現できる）

### UI v3 の方針
- “完全一致” ではなく “印象（統一感・視線誘導・厚み）” を優先
- 背景は CSS で成立させつつ、必要なら `assets/gen` に画像を足せる構造にする
- ルール選択は **説明文を増やすより、UI の型（ラジオ/トグル/アイコン）**で理解させる

---

## 6) Implementation Steps (Milestones)

### Milestone A: Classic プリセット拡充（まず遊べるように）
- 主作業: WO-025

### Milestone B: Classic カスタムビルダー（複数ルールを組み合わせる）
- 主作業: WO-026

### Milestone C: ルール選択 UI の “Nintendo 品質” 化（迷わない操作）
- 主作業: WO-027

### Milestone D: かわいさ v3（アセット/背景/アイコンの統一）
- 主作業: WO-028（必要になったら追加）

---

## 7) Verification

### Commands
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C packages/triad-engine test`

### Manual checks
- /match?ui=mint
  - ルール選択が直感的にできる
  - Classic を複数選べる
  - コピーした Replay URL で同じルールが再現される

---

## 8) Risks / Rollback

- 追加 param による URL の複雑化
  - 対策: param は短く、後方互換で読む（未知は無視/デフォルト）
- Replay で ruleset が解決できず “別ルールで再生” してしまう
  - 対策: rulesetId と URL param から再構成した config の不一致を検知して警告する

---

## 9) Progress

- [ ] WO-025: Classic preset 拡充 & UI surfaced
- [ ] WO-026: Classic custom builder + share/replay support
- [ ] WO-027: ルール設定 UI の Nintendo polish

---

## 10) Decision Log

- 2026-02-17: Classic custom のルール情報は transcript に埋めず、まず URL param で保持する方針（互換と影響範囲を局所化）

