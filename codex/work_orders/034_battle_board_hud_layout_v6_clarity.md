# WO-034: Battle Board HUD/Layout v6 (Clarity & Stability)

## ゴール

Match画面で「いま何をすべきか」「勝っている/負けている」「残り手数」を
**0.5秒で理解できる**情報設計にする。

さらに、Nyanoコメントや演出で **レイアウトがガタつかない**（layout shiftしない）こと。

## 参照

- `docs/01_design/reference_ui/board_reference.png`
- `docs/01_design/NYTL_BATTLE_BOARD_UI_QUALITY_GUIDE_SAKURAI_LENS_v1_ja.md`

## 触るべき主ファイル

- `apps/web/src/components/BattleTopHudMint.tsx`
- `apps/web/src/components/BattleHudMint.tsx`
- `apps/web/src/components/PlayerSidePanelMint.tsx`
- `apps/web/src/components/NyanoReactionSlot.tsx`
- `apps/web/src/components/BoardViewMint.tsx`
- `apps/web/src/mint-theme/mint-theme.css`

## 実装タスク

### 1) 視線誘導の“主役”を決める

- 画面上部: **スコア** と **TURN** が最優先
- 画面下部: **次の行動（プロンプト）** が最優先
- サイド: キャラクター性（Nyano/プレイヤー情報）だが、邪魔しない

→ これを崩す要素（過剰な装飾/アニメ）を削る判断も含む。

### 2) Top HUD を“ゲームUI”の比率に合わせる

参考画像のように:
- スコアカプセルは「中央で視線が止まる」
- TURN は「右上でサッと読める」
- 余白と角丸を大きめにして、タップしやすさも担保

要件:
- 数字は背景から沈まない（影/縁取り）
- A/Bの区別が色だけに依存しない（アイコン/ラベル）
- `prefers-reduced-motion` でバウンス等は最小化

### 3) Prompt（指示文）を“責任あるUI”にする

盤面下のプロンプトは、
- いつも同じ位置
- いつも同じ高さ
- 指示が短く、二言語でも読みやすい

が理想。

要件:
- 2行構成（日本語/英語）は維持しつつ、文字サイズと行間を調整
- `NyanoReactionSlot` と競合しない（ガタつかない）

### 4) 盤面とHUDの衝突を防ぐ（レスポンシブ）

小さい端末で
- HUDが盤面に被る
- 手札が見切れる
- 盤面が押せない

を防ぐ。

実装案:
- `mint-stage__main` の grid/flex を見直し
- `clamp()` を多用して、端末幅で自然に縮む
- 重要要素だけは最小サイズを保証

### 5) “残り”を迷わせない

- 残りカード数（手札）が重要。
- 現状の表示が弱い場合:
  - アイコン + 数字
  - もしくはスロット数で視覚化

いずれかを追加。

### 6) アクセシビリティ

- ボタン/カード/セル: `aria-label` を適切に
- フォーカスリングが見える
- タップ領域が十分

## 受け入れ基準

- 初見でも「カードを選ぶ→置く」の流れが迷いにくい
- Score/Turn/Prompt が視線の流れで自然に読める
- Nyanoコメントが出ても layout shift が起きない
- 画面幅320px相当でも操作不能にならない
- `pnpm -C apps/web build` が通る

## 手動チェック

- iPhone SE相当の幅で、盤面/手札/ボタンが押せる
- TURNの更新が見落とされない
- 連鎖演出中でも数字が読める
