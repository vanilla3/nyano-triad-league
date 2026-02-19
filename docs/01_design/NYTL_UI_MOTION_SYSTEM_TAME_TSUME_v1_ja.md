# NYTL UI Motion System（タメとツメ） v1

対象: Nyano Triad League のサイト全体 UI（Home / Decks / Arena / Match / Replay / Settings）

目的: 参照画像のような「スマホゲー品質の触り心地」を、
**コードとして再現・再利用できる“モーション規格”**に落とす。

> 重要: 本ドキュメントは **ゲームロジックを変えない**。
> 触感（モーション / VFX / レイヤー）を揃え、
> **迷い・誤操作・退屈**を減らす。

---

## 0) まず守るべき前提

- UI は飾りではなく **情報**。
  - 何が起きたか／何ができるか／次に何をすべきか、を“動き”で伝える。
- 動きは **統一**しないと「安っぽさ」になる。
  - 画面ごとにスピードや質感が変わると、触り心地が崩れる。
- 演出は `prefers-reduced-motion` と `data-vfx` で必ず段階制御する。
  - 「派手にできる」より「抑えられる」が品質。

---

## 1) タメとツメ（加速・減速・オーバーシュート）

### タメ
- **動き出しを少し抑える**ことで、“質量”と“意図”を感じさせる。
- 例: 退出、閉じる、引っ込む、リストから消える。

### ツメ
- **止まる直前を丁寧に減速**し、視線を置かせる。
- 例: 入場、開く、出現、確定。

### オーバーシュート（1回だけ）
- 「止まり際に 1 回だけ行き過ぎて戻る」。
- “ぷにっ”とした可愛さが出るが、**多用すると幼稚**になる。
- 使いどころ: 重要な出現（カード出現、勝利表示、主役ボタンのアテンション）。

---

## 2) フレーム設計（60fps を基準に ms へ落とす）

> 60fps の 1f ≒ 16.67ms

### 基本の目安

- 4f: 約 67ms（最小の反応。押した感・軽い点灯）
- 6f: 約 100ms（入力→反応の“即時感”ライン）
- 8f: 約 133ms（軽いトグル、hover）
- 10f: 約 167ms（ボタン解除、軽い移動）
- 12f: 約 200ms（小さなパネル出現）
- 15f: 約 250ms（カード出現、モーダル入場）
- 18f: 約 300ms（画面内の大きめ遷移）
- 24f: 約 400ms（勝敗演出の導入。頻発させない）

> 重要: “何 ms か” より、
> **同じ種類の動きは同じテンポ**に揃えることが体験品質。

---

## 3) NYTL 用の標準イージング（CSS 変数として定義する）

### 3.1 標準カーブ（推奨）

- `--ease-out`: 入場（速く入って、ゆっくり止まる）
- `--ease-in`: 退出（ゆっくり動き出して、速く消える）
- `--ease-in-out`: 画面内の往復やバウンド（中間が一番速い）
- `--ease-out-back`: 入場 + 1回オーバーシュート（“かわいい”用）

### 3.2 使い分けルール

- **入場**: `ease-out`（主役だけ `ease-out-back`）
- **退出**: `ease-in`（戻りは速く）
- **押下**: `ease-out` で沈み込み、復帰は `ease-out-back` を *薄く*（1回だけ）
- **連鎖/ひっくり返し**: `ease-in-out`（視線が追える速度）

---

## 4) レシピ（NYTL で頻出する“気持ちよさ”の型）

### 4.1 ボタン（押した瞬間の返事）

- onPointerDown（即時）
  - 4〜6f
  - translateY(+1〜2px) + shadow 縮む + face が少し暗くなる
- onRelease（確定の気持ちよさ）
  - 6〜10f
  - 1回だけ軽く戻り（オーバーシュート薄）

### 4.2 カード出現（Linear → EaseOutBack で“質量感”）

- scale(0.96) + opacity(0) → scale(1.02) → scale(1)
- 12〜15f
- `data-vfx=off` / reduce motion では overshoot 無し（scale(1) 直）

### 4.3 盤面の“置ける/置けない”

- selectable cell: 常時点滅ではなく
  - rim が少し明るい
  - 内側に薄い sheen
  - hover/tap で一瞬だけ pulse

- invalid: error shake（4〜6f） + 軽い赤み（すぐ戻す）

### 4.4 カタルシス（置いた/奪った/連鎖した）

- “置いた”: ring ripple（短い、情報）
- “奪った”: flip burst（少し派手、気持ちよさ）
- “連鎖”: burst + 収束（主役イベントだけ）
- “勝利”: 画面全体の軽い breath + confetti（`vfx=high` のみ）

---

## 5) 実装への落とし込み（このリポジトリの前提）

### 5.1 追加するべきもの（推奨）

- `mint-theme.css` に **motion tokens** を追加
  - duration / easing / amplitude（変化量）の CSS 変数
- “motion utility class” を用意
  - `mint-motion-enter`, `mint-motion-exit`, `mint-motion-pop`, `mint-motion-soft-bounce` など
- React 側で必要なら `useIdle()` / `useMotionPreference()` を追加
  - ただし基本は CSS で完結させ、JS は最小にする

### 5.2 触る場所（目安）

- トークン / Keyframes:
  - `apps/web/src/mint-theme/mint-theme.css`
- ページ遷移:
  - `apps/web/src/components/AnimatedOutlet.tsx`
- ボタン:
  - `apps/web/src/components/mint/MintPressable.tsx`
  - `apps/web/src/mint-theme/mint-theme.css`（`.mint-ui-pressable`）
- Match:
  - `apps/web/src/components/DuelStageMint.tsx`
  - `apps/web/src/components/BoardViewMint.tsx`

---

## 6) 低負荷・アクセシビリティの基準

- `prefers-reduced-motion: reduce`
  - ループアニメは停止
  - overshoot / shake を無効
  - 代わりに opacity / outline など“静的な差”で状態を伝える

- `data-vfx`（`off/low/medium/high`）
  - off: VFX 停止
  - low: 1回だけ（リップルのみ等）
  - medium: バースト許可
  - high: confetti / sparkles / 収束 など追加

---

## 7) QA（Done の最低ライン）

- 同じ種類の UI（ボタン/ピル/カード）が、画面ごとにテンポが変わらない
- 「押した → 返事」が 100ms 程度で返る（体感）
- `reduce motion` / `vfx=off` でも破綻せず、状態差が分かる
- ループ演出が“うるさくない”（主役が負けない）
