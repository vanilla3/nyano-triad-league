# Codex Agent Guide — apps/web (Frontend)

このディレクトリは **Nyano Triad League の Web UI** です。
Vite + React + TypeScript + Tailwind + Pixi.js を使い、「検証ツール」から「運営品質のゲーム体験」へ段階的に寄せています。

---

## 0) 最重要のゴール

- **触り心地（操作感）**：手札→配置→確定の導線が短く、誤タップしにくい。
- **視認性**：盤面、手札、ターン進行、勝敗理由が “3秒で分かる”。
- **演出は短く気持ちよく**：テンポを損なわず、要所だけ強く。
- **モバイル最優先**：390px 幅でも破綻しない。

---

## 1) 壊してはいけないもの（Frontend Invariants）

- 既存 URL 互換（`/match` `/replay` と `ui=...` `focus=1` など）を壊さない。
- `state_json v1`（nyano-warudo 連携）と viewer command の canonical 形式を壊さない。
- `streamer_bus` の state 形状を勝手に変えない（Overlay/Stream/Match の結節）。
- Pixi/WebGL が落ちてもフォールバックで継続できる（無限ローディング禁止）。
- `prefers-reduced-motion` と `data-vfx`（VFX quality）を尊重し、低性能端末で破綻しない。

---

## 2) コマンド（変更後は必ず実行）

```bash
pnpm -C apps/web test
pnpm -C apps/web typecheck
pnpm -C apps/web build
```

手元で動作確認:
```bash
pnpm -C apps/web dev
```

---

## 3) 主要コードの入口（迷ったらここ）

- ルーティング: `src/main.tsx`
- レイアウト/ナビ: `src/App.tsx`

Pages:
- Match: `src/pages/Match.tsx`
- Replay: `src/pages/Replay.tsx`
- Stage: `src/pages/BattleStage.tsx` / `src/pages/ReplayStage.tsx`
- Stream/Overlay: `src/pages/Stream.tsx` / `src/pages/Overlay.tsx`

Pixi/Stage Engine:
- `src/engine/components/BattleStageEngine.tsx`
- `src/engine/renderers/pixi/PixiBattleRenderer.ts`

UI コンポーネント:
- `src/components/*`

---

## 4) 変更方針（品質を上げるための作法）

- **Presentational と Stateful を分ける**
  - 表示の純度が高い部品は `components/` に寄せる。
  - スキーマ/連携/組み立ては `pages/` や `lib/`。

- **アクセシビリティ**
  - タップ領域は原則 44×44px 以上。
  - 色だけに依存しない（形/アイコン/ラベルで補助）。

- **VFX/音**
  - VFX は段階導入（`data-vfx=off|low|medium|high` を想定）。
  - 音（SFX）を入れる場合は `src/lib/sfx.ts` を起点に、無音/ミュートも担保。

- **依存追加は慎重に**
  - 追加するなら目的・代替・影響（バンドル/パフォ）を明記。

---

## 5) テストの感覚（何を増やすべきか）

- UI の挙動は `src/components/__tests__` / `src/pages/__tests__` に増やす。
- Pixi/renderer は `src/engine/__tests__` に増やす（WebGL失敗/フォールバック/texture解決など）。
