# ExecPlan 011: Battle Board Gamefeel v5（Sakurai Lens）

Status: PROPOSED

## Intent

Match（Mint UI）の**バトル盤面**を、参照画像の「かわいいモバイルゲーム UI」へさらに近づける。
ただし、桜井目線の最重要条件として **“明瞭さ / 迷わなさ / 触った感”** を優先し、
見た目の豪華さで操作性・視認性を落とさない。

---

## Ground rules (must not break)

- URL/クエリ互換を壊さない（既存 share URL / stage route は保持）
- `prefers-reduced-motion` / `data-vfx=off|low` を尊重（演出/粒子/音を抑制）
- 低スペック端末でも破綻しない（過度な blur/filter を避ける）
- Layout shift を増やさない（HUD/通知は fixed/overlay を優先）

---

## Read first (docs)

- `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md`
- `docs/01_design/NYTL_BATTLE_BOARD_UI_QUALITY_GUIDE_SAKURAI_LENS_v1_ja.md`
- `docs/01_design/NYTL_BATTLE_BOARD_VISUAL_GAPLIST_v1_ja.md`
- `docs/01_design/NYTL_UI_ASSET_MANIFEST_v2_ja.md`

---

## Work breakdown (preferred order)

### WO-028: Material v5（盤面/セル/トレイの厚み・凹み・斜めシーン・薄ノイズ）

Goal:
- 空セルが「置ける場所」に見える（凹み・縁・シーンがある）
- 盤面全体が“置き台”に見える（外枠/内枠/影の整合）
- press/hover/selected の共通言語が揃う（MintPressable と同系統）

### WO-029: Classic Rules の“見える化”

Goal:
- 対戦中に「いま有効なルール」が迷わず見える（チップ/リボン）
- Open/Order/Reverse/Plus/Same などが UI 上で理解できる
-（可能なら）Open ルールの“公開カード”が盤面 UI に反映される

### WO-030: Micro-juice v5（盤面の触感）

Goal:
- hover/press の物理感（沈み/戻り/影の変化）
- 配置/奪取の気持ちよさ（既存演出を崩さず補強）
- 必要なら SFX を最小限拡張（うるさくしない）

---

## Verification

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- UI 変更が大きい場合: `pnpm -C apps/web e2e`

---

## Definition of Done

- 参照画像の雰囲気に近づいたことが、Match（Mint UI）で体感できる
  - 盤面セルの“凹み/縁/シーン”が明確
  - 押下/選択のフィードバックが “気持ちいい”
  - ルールが試合中に見える
- `prefers-reduced-motion` / `data-vfx` で演出が抑制される
- lint/typecheck/test/build を通過
