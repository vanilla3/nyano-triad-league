# ExecPlan 013: Sitewide UI/UX Gamefeel + Motion System（タメとツメ）

## 目的

Nyano Triad League のサイト全体（Home / Decks / Arena / Match / Replay / Settings）を、
**「触っていて・見ていて気持ちいい」ゲーム品質**へ引き上げる。

特に今回の焦点は以下:

- **モーションの統一**（タメとツメ、加速/減速、オーバーシュートの使い分け）
- **Idle でも“生きている”背景**（微速スクロール、薄ノイズ、主役を邪魔しない視線誘導）
- **カタルシス強化**（置く/奪う/連鎖/勝利の瞬間にだけ気持ちよく）
- **状態変化の明確さ**（今どこが触れるか／何が起きたか／次は何をするか）

> 注: triad-engine のゲームロジックや確率・数値は変更しない。
> 変更は UI / 演出 / 情報設計に限定する。

---

## 非目標（やらない）

- 大規模な依存追加（Framer Motion 全面採用、Three.js 常時稼働など）は避ける。
  - 必要なら「代替案」「性能影響」「導入範囲」を明記して最小導入。
- 画面全体を常時派手にする（常時点滅・常時爆発）はしない。
  - “主役が負けるUI” は品質を下げる。

---

## 参照（読む順）

1) `docs/01_design/NYTL_GAME_UI_QUALITY_PRINCIPLES_SAKURAI_LENS_v1_ja.md`
2) `docs/01_design/NYTL_UI_MOTION_SYSTEM_TAME_TSUME_v1_ja.md`
3) `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md`
4) `docs/01_design/NYTL_MINT_UI_REFERENCE_APP_SCREENS_v1_ja.md`

---

## 現状の実装（ここまでで揃っているもの）

- Mint テーマ（ガラス/縁/光/粒子）の土台は存在
  - `apps/web/src/mint-theme/mint-theme.css`
  - `MintPressable`, `GlassPanel`, `MintGameShell`, `DuelStageMint`
- `data-vfx=off/low/medium/high` と `prefers-reduced-motion` の段階制御が既に入っている
- Match 盤面は DOM（`BoardViewMint`）と Engine（`BattleStageEngine`）の両方で動く構造

今回の改善は「この土台を壊さず、規格化して上げる」ことが中心。

---

## Work Orders（実行順）

### 0) まず健全化（既存）

- **WO-036**: `codex/work_orders/036_repo_audit_consistency_cleanup_v1.md`
  - ロックファイル、テーマ混在、Codex文書の衝突などを先に潰す

### 1) 触感の統一（新規）

- **WO-039**: Motion Tokens & Easing の導入（タメとツメ）
- **WO-040**: Alive Background（グリッド微速スクロール + 薄ノイズ + きらめき）

### 2) 気持ちよさの核（新規）

- **WO-041**: Catharsis Pack（Particles / Screen Shake / Depth）

### 3) 迷わないUIへ（新規）

- **WO-042**: Guidance（次の一手の視線誘導、Idle時の控えめアテンション）
- **WO-043**: Sitewide UX Consistency（押せる/押せない、ヒット領域、レイアウト安定）

---

## 検証（Codexが必ず行う）

各 Work Order 完了時:

```bash
pnpm -w install
pnpm -C apps/web lint
pnpm -C apps/web typecheck
pnpm -C apps/web test
pnpm -C apps/web build
```

任意だが推奨:

```bash
pnpm -C apps/web e2e
```

---

## Definition of Done

- ボタン/パネル/カード/モーダルの **テンポが統一**され、画面ごとの違和感が減る
- Idle状態の背景が“生きている”が、主役（カード/盤面/HUD）を邪魔しない
- 置く/奪う/連鎖/勝利の瞬間に **カタルシス**が出る（ただし常時派手にしない）
- `prefers-reduced-motion` と `data-vfx=off/low` で、演出が段階的に抑制できる
- 触っていて「押せた」「変わった」「次が分かる」が迷わず成立する
