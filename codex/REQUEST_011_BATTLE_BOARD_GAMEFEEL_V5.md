# Codex Request: Battle Board Gamefeel v5（そのまま貼れる指示）

あなたはこのリポジトリ内で実装を行うエージェントです。

目的: Mint UI の Match（バトル盤面）を、参照画像のように“ゲームっぽく・かわいく・触り心地よく”改善してください。
ただし、最優先は「迷わない」「読みやすい」「押した感がある」です。

---

## 事前に読む

1) `docs/01_design/NYTL_BATTLE_BOARD_UI_QUALITY_GUIDE_SAKURAI_LENS_v1_ja.md`
2) `docs/01_design/NYTL_BATTLE_BOARD_VISUAL_GAPLIST_v1_ja.md`
3) `docs/01_design/NYTL_UI_ASSET_MANIFEST_v2_ja.md`
4) `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md`

---

## 実装手順（Work Order を順番に実施）

### 1) WO-028（Material v5）

`codex/work_orders/028_battle_board_material_v5.md` を実装してください。

- 盤面トレイと空セルを“凹みスロット”に見せる
- 光の方向を統一する
- `prefers-reduced-motion` / `data-vfx` で演出を段階制御する
- アセットはあれば使い、無ければ CSS fallback で成立させる

### 2) WO-029（Rules Ribbon + Open 可視化）

`codex/work_orders/029_battle_rules_ribbon_and_open_visibility.md` を実装してください。

- 試合中に classic rules がチップで見える
- All Open/Three Open で“公開カード”が UI に反映される
- Order/Chaos の固定カードが UI 上で分かる

### 3) WO-030（Micro-juice v5）

`codex/work_orders/030_battle_board_microjuice_v5.md` を実装してください。

- press/hover/selected の差をはっきり作る
- 配置/奪取の気持ちよさを補強する
-（任意）tap_soft を追加するなら控えめに。うるさくしない。

---

## 検証

各 Work Order の完了時に以下を実行し、通ることを確認してください。

```bash
pnpm -C apps/web test
pnpm -C apps/web typecheck
pnpm -C apps/web build
```

UI 変更が大きい場合は `pnpm -C apps/web e2e` も実行。

---

## 出力の約束

- 変更点を要約し、どの UI がどう良くなったかを書いてください。
- パフォーマンス/アクセシビリティ（reduced motion / low vfx）に配慮した点を明記してください。
- スコープ外の変更（全体リファクタ、不要な依存追加）はしないでください。
