# Work Order: 013 — Mint Gamefeel ステージレイアウト＆プレイヤーパネル（左右）

参照: `docs/01_design/NYTL_MINT_UI_REFERENCE_PASTEL_GAMEFEEL_v0_ja.md`

## 1) 背景 / 目的（ユーザー視点）
- 参照画像では、盤面を中心にして左右にプレイヤーパネルが配置され、対戦相手/自分が“存在する”感覚を作っている。
- 現状の Mint UI は、情報は揃っているが「対戦レイアウト」としての一体感が弱い。

## 2) 成果物（Deliverables）
- [x] 左右のプレイヤーパネル（Avatar + Player label + Remaining cards）を追加
- [x] 盤面周辺の“ゲーム画面レイアウト”を強化（Boardの横にパネルが入る構成）
- [x] Mobile では過密にならないように縮小/折りたたみ（常設しないでもOK）
- [x] 既存の state/props を再利用し、データ二重管理をしない

## 3) 要件（Requirements）
### MUST
- 既存の盤面入力（セルタップ/ドラッグドロップ）を邪魔しない
- プレイヤー情報は **既存 state から算出**する
  - remaining cards は `used.usedA / used.usedB` から計算（原則: 5 - used.size）
- `ui=mint` のみ適用

### SHOULD
- パネルはガラス + ぷっくり + 影で“厚み”を出す
- currentPlayer 側を少し強調（リング/発光/小さいバッジ）
- Openルールに応じて「残り表示」を控えめにできる（例: All Open なら枚数OK、非Openならアイコンのみ等）

### COULD
- パネル内に「小さな矢印UI」や“ターンの矢印”を追加（参照画像の雰囲気）

## 4) 非要件（Non-goals）
- 完全な任天堂UIの再現
- ルール/AI/ロジックの変更

## 5) 受け入れ条件（Acceptance Criteria）
- Desktop 幅（>= 1024px）で
  - 盤面の左右に Player A/B パネルが表示される
  - クリック/ドラッグの邪魔をしない
- Mobile 幅（<= 420px）で
  - 盤面が潰れない（パネルは縮小/非表示/折りたたみのいずれか）
- remaining cards 表示が正しく更新される（手が進むと減る）

## 6) 調査ポイント（Investigation）
- `apps/web/src/pages/Match.tsx`
  - `used.usedA`, `used.usedB`, `currentPlayer`, deck情報
- 既存 Avatar:
  - `apps/web/src/components/NyanoAvatar.tsx`
  - `apps/web/src/components/NyanoImage.tsx`
- Mint theme:
  - `apps/web/src/mint-theme/mint-theme.css`

## 7) 実装方針（Approach）
- 新規コンポーネントを追加し、Match（Mint UI レイアウト）で配置。
- レイアウトは CSS grid を基本にし、
  - Desktop: `panel | board | panel`
  - Mobile: `top HUD / board / hand` を優先し panel は縮小
 で切替。

## 8) タスクリスト（細分化）
- [x] A-1: `PlayerSidePanelMint.tsx`（新規）
  - props: `side`, `playerIndex`, `isActive`, `remainingCards`, `avatarKind` 等（必要最小）
- [x] A-2: `mint-theme.css` に `mint-player-panel` スタイル追加
  - avatar ring / panel glass / shadow / label
- [x] A-3: `Match.tsx` の Mint UI レイアウトで配置
  - board の wrapper に `mint-battle-layout` 等の class を付ける
  - CSS で breakpoint 切替
- [x] A-4: remainingCards の算出を実装
  - `Math.max(0, 5 - used.usedA.size)` / `Math.max(0, 5 - used.usedB.size)`

## 12) 実装メモ（2026-02-15）
- `apps/web/src/components/PlayerSidePanelMint.tsx`
  - 新規プレイヤーパネル（Avatar / Playerラベル / Remaining cards）を追加
  - `isActive` で現在手番側の見た目を強調
  - `aria-label` / `aria-live` 付きで残枚数更新を読み上げ可能に
- `apps/web/src/pages/Match.tsx`
  - `ui=mint` かつ非stage-focusで `mint-battle-layout` を有効化
  - 盤面左右へ `PlayerSidePanelMint` を配置
  - remaining cards を `used.usedA/used.usedB` から算出（5 - used.size）
- `apps/web/src/mint-theme/mint-theme.css`
  - `mint-battle-layout` / `mint-player-panel` 系スタイルを追加
  - Desktopは `panel | board | panel`、`<=1024px` はパネル非表示で盤面優先
- `apps/web/src/components/__tests__/PlayerSidePanelMint.test.tsx`
  - export smoke + ラベル/残枚数表示の最小テストを追加

## 9) 検証（Verification）
### 自動
- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

### 手動
- `/match?ui=mint`
  - Desktop: board左右にパネル、盤面操作可能
  - Mobile: boardが主役、パネルが邪魔しない
  - 数手進めて remaining が減る

## 10) リスク / ロールバック
- リスク: パネルが盤面領域を削って遊びにくくなる
  - 対策: Mobile では panel を常設しない、Desktop でも最小幅で
- ロールバック: レイアウト class 差分を revert

## 11) PR説明（PR body 雛形）
- What: Mint UI に左右プレイヤーパネルを追加し、盤面中心のゲームレイアウトへ
- Why: 対戦の存在感と認知速度を上げるため
- How: 新規コンポーネント + CSS grid レイアウト
- Test: `pnpm -C apps/web test && pnpm -C apps/web build`
