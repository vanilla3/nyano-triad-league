# REQUEST 013: Sitewide UI/UX Gamefeel + Motion（タメとツメ） + Alive Background + Catharsis

目的: Nyano Triad League のサイト全体を「スマホゲー品質」へ近づける。

- 見た目: かわいい / ガラス / ぷにっとした立体感 / 奥行き
- 体験: 触ると必ず“返事”があり、状態変化が分かり、重要な瞬間だけカタルシスが出る

---

## 重要な制約（Non-negotiables）

- triad-engine の挙動（勝敗/turn/flip/確率）は変えない
- 決定論（transcript 再現）を壊さない
- URL/プロトコル互換を壊さない
- WebGL/Pixi 失敗時のフォールバックを残す
- `prefers-reduced-motion` と `data-vfx` を尊重し、演出は段階的に止められる
- 大規模依存導入は避ける（必要なら最小導入 + 理由 + 代替案）

---

## 参照（必読）

- ExecPlan:
  - `codex/execplans/013_sitewide_ui_ux_gamefeel_motion_v1.md`

- Design specs:
  - `docs/01_design/NYTL_UI_MOTION_SYSTEM_TAME_TSUME_v1_ja.md`
  - `docs/01_design/NYTL_GAME_UI_QUALITY_PRINCIPLES_SAKURAI_LENS_v1_ja.md`

- Mint theme system:
  - `docs/01_design/NYTL_MINT_THEME_SYSTEM_v1_ja.md`

---

## 要望（アイデアの種 → 実装へ落とす）

このリポジトリに合う形で、以下を取り入れる。

- イージングの「タメとツメ」
  - 入場: ease-out（必要なら ease-out-back）
  - 退出: ease-in
  - 画面内のバウンド/弾性: 限定的に（やりすぎ禁止）
- Idle でも“生きている”背景
  - 微速スクロールするグリッド + 薄いノイズ（主役を邪魔しない）
- 状態変化の明確さ
  - 押せる/押せない、選べる/選べない、今のフェーズ
- カタルシス不足を補う
  - 置く/奪う/連鎖/勝利の瞬間にだけ粒子 + 軽いシェイク
- Z軸（奥行き）演出
  - 盤面/スロット/カードの前後関係を影/translateZで統一

---

## 実装手順（Work Orders）

この順で 1 PR = 1 WO を守って実装してください。

0) 既存の健全化（必要なら）
- WO-036: `codex/work_orders/036_repo_audit_consistency_cleanup_v1.md`

1) Motion
- WO-039: `codex/work_orders/039_motion_system_tame_tsume_tokens_v1.md`

2) Alive Background
- WO-040: `codex/work_orders/040_alive_background_grid_noise_shader_css_v1.md`

3) Catharsis
- WO-041: `codex/work_orders/041_catharsis_pack_particles_screen_shake_depth_v1.md`

4) Guidance
- WO-042: `codex/work_orders/042_guidance_idle_attention_next_action_v1.md`

5) Sitewide UX
- WO-043: `codex/work_orders/043_sitewide_ux_consistency_hit_targets_layout_stability_v1.md`

---

## 検証（各WOで必ず実行）

```bash
pnpm -C apps/web typecheck
pnpm -C apps/web test
pnpm -C apps/web lint
pnpm -C apps/web build
```

任意（可能なら）:

```bash
pnpm -C apps/web e2e
```

---

## Definition of Done

- サイト全体で、押下/出現/閉じるのテンポが統一され「違和感が減る」
- Idle 背景は“生きている”が、主役（カード/ボタン/文字）を邪魔しない
- 重要イベントだけ気持ちよく、常時うるさくならない
- `reduce motion` / `vfx=off` で安全に抑制できる

