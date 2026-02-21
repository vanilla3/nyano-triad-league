# Work Order: 008 — Match Board Motion Juice (Select→Place→Flip→Chain)

## Goal
バトル盤面の体験を「ゲーム感・質量感・カタルシス」で強化する。

## Spec
- Motion辞書:
  - MOT-06 Magnet（置けるマス）
  - MOT-09 Drop（配置）
  - MOT-13 Flip（奪取反転）
  - MOT-10 Impact（確定）
  - MOT-14 Chain（連鎖因果）

## Tasks
1) 置けるマスの Magnet
- `BoardViewMint` / 盤面セルで「置ける」状態を分かりやすく
- 常時点灯しない（プレイヤーの選択時だけ）

2) 配置の Drop + Snap
- 手札→盤面配置で、短い落下と着地（ぽちょん）
- 着地直後に小さな確定（カチッ）

3) 奪取の Flip + Impact
- 反転時に薄い3D or クロスフェード（vfx tierで切替）
- 反転完了で “重い確定” を短く

4) 連鎖の因果表示
- Same/Plus 連鎖が起きたとき
  - 対象マスを順番に点灯
  - 可能なら “線が走る” を `data-vfx>=medium` のときだけ

## Acceptance Criteria
- 盤面の「置ける」「置いた」「奪った」「連鎖した」が視覚で即理解できる
- 演出はテンポを壊さない（長引かない）
- reduce/off でも意味が伝わる（フェード・輪郭強調へ置換）

## Verification
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test`
- 手動: 3回対戦して “気持ちよさ” が増したか確認
