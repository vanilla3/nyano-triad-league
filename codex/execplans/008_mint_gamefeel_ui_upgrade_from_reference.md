# ExecPlan 008 — Mint Battle UI “Gamefeel” 強化（参照画像ベース）

この ExecPlan は living document です。作業とともに `Progress` / `Decision Log` / `Surprises & Discoveries` / `Outcome` を更新します。

参照: `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md`

---

## 1) Purpose / Big Picture

- Mint UI を「スマホゲー級の没入感」に近づける。
- 具体的には、参照画像で表現されている **レイヤーの厚み（BG/HUD/Board/Hand/Prompt）** と **定位置情報設計（スコア/ターン/次アクション）** を実装に落とす。

ユーザーができるようになること:
- 盤面に入った瞬間に “ゲーム画面” として理解できる
- 次に何をすべきか（カード選択→セル選択）が迷わず分かる
- Nyano コメント表示など、イベント演出が入っても UI が崩れない

---

## 2) Scope

### In-scope
- /match（Mint UI）におけるビジュアル強化
  - BG（グラデ/肉球/粒子）
  - Board（セルのトレイ感、ガラス反射、奥行き）
  - Top HUD（スコア/ターンの定位置化）
  - Player panel / Hand tray / Prompt（操作の起点を明確化）
- NyanoReaction の **レイアウト安定**（CLS対策）
- `prefers-reduced-motion` / `data-vfx` を尊重した演出制御
- 最低限の回帰防止（UI regression guardrails）

### Out-of-scope
- triad-engine のロジック/決定論の変更
- ルール追加（classic rules 等）
- 大規模な状態管理リファクタ
- 新しい外部アセット導入（ライセンス不明）

---

## 3) Non-negotiable constraints (Invariants)

- 決定論（transcript 再現）を壊さない
- URL互換（Match/Replay の query）を壊さない
- `state_json v1` / viewer command / `streamer_bus` の互換を壊さない
- WebGL/Pixi 失敗時のフォールバックを残す
- `prefers-reduced-motion` と `data-vfx` を尊重する

---

## 4) Current State (What exists today)

- Mint UI の基盤（ガラス/角丸/アクセント）は既に存在
  - `apps/web/src/mint-theme/mint-theme.css`
  - `BoardViewMint` / `DuelStageMint` / `BattleHudMint` / `HandDisplayMint`
- ただし「ゲーム画面の一体感（BG/HUDの定位置）」はまだ薄い
- NyanoReaction は Slot を用意しているが、表示時に縦方向の伸び・揺れが残る可能性

---

## 5) Proposed Design

設計の核:
- **BG → Stage → Board → Cards → HUD → FX** の序列を固定
- “上(状況) / 中(盤面) / 下(操作)” の視線誘導を崩さない
- 見た目の強化は **Mint theme の CSS と薄いコンポーネント追加**で行い、Match の状態管理は触りすぎない

参照画像要素は以下の Work Order に分割して実装する:
- WO-011: BG/Stage 基盤
- WO-012: Top HUD（score/turn）
- WO-013: Player panel（左右）
- WO-014: Hand tray + Prompt
- WO-015: NyanoReaction layout stability v2
- WO-016: Microinteraction & polish + regression guardrails追補

---

## 6) Implementation Steps (Milestones)

### Milestone A: Design tokens / BG / Stage shell
- 目標: 盤面の外側まで含めて “ゲーム画面” にする
- 主作業: WO-011

### Milestone B: Top HUD を参照画像の構成に寄せる
- 目標: スコア/ターンの定位置化
- 主作業: WO-012

### Milestone C: Player panel + Hand tray
- 目標: 対戦相手/自分/手札の認知を早くする
- 主作業: WO-013, WO-014

### Milestone D: レイアウト安定 + microinteraction
- 目標: “動くほど崩れない” を担保
- 主作業: WO-015, WO-016

---

## 7) Verification

### Commands

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

（変更範囲により）
- `pnpm -C apps/web e2e`

### Manual checks

- /match?ui=mint
  - 端末幅: 360px / 768px / 1280px
  - 1手目〜数手進行して、HUD/Prompt/Hand が定位置で読める
  - NyanoReaction 表示で UI がガタつかない
- /battle-stage（stage focus）でも破綻しない（可能な範囲で）

---

## 8) Risks / Rollback

- リスク: CSS 変更で既存 Mint UI の可読性が落ちる
  - 対策: `density` / `tone` / `data-vfx` を尊重し、極端な演出は opt-in にする
- ロールバック: work order 単位で revert 可能（1PR=1WO）

---

## 9) Progress

- [x] WO-011: BG/Stage
- [ ] WO-012: Top HUD
- [ ] WO-013: Player panel
- [ ] WO-014: Hand tray + Prompt
- [ ] WO-015: Reaction stability
- [ ] WO-016: Microinteraction + guardrails

---

## 10) Decision Log

- 2026-02-15: 参照画像の再現は “完全一致” ではなく “印象（レイヤー/厚み/定位置）” を優先
- 2026-02-15: WO011は外部画像を増やさず、`mint-theme.css` の gradient + inline svg(data-uri) + 疑似要素で背景を構成

---

## 11) Surprises & Discoveries

- `data-vfx` / `prefers-reduced-motion` の既存分岐がすでに整備されていたため、WO011は追加レイヤーへの分岐追記だけで実装可能だった

---

## 12) Outcome / Retrospective

- WO011完了。Mint stageに pastel gamefeel の背景土台（gradient/paw pattern/sparkle+bokeh）を追加し、`vfx` と `reduced-motion` で安全に制御できる状態にした。
