# Nyano Motion Language 仕様表 v0.1

この仕様は「かわいさ」を装飾ではなく**操作の手触り**として設計するための“動きの言語”です。

- 目的：
  - 押した瞬間に返事が返る（Response）
  - 状態変化が一瞬で分かる（Transition）
  - 成功にご褒美がある（Reward）
  - Idleでも“死んでない”（Ambient）

- 重要：
  - `prefers-reduced-motion` を尊重し、非本質モーションを置換する
  - `data-vfx=off|low|medium|high` で端末性能に合わせて段階導入

## 参考
- yui540 モーション集: https://yui540.com/motions

---

## トークン（Duration / Easing / Amplitude）

### Duration（60fps換算）

| Token | 用途 | 既定 | 60fps目安 |
|---|---|---:|---:|
| `--m-dur-press` | 押下反応 | 90ms | 5–6f |
| `--m-dur-snap` | 確定（カチッ） | 120ms | 7–8f |
| `--m-dur-enter` | 入場（ポップ） | 200ms | 12f |
| `--m-dur-exit` | 退出 | 160ms | 10f |
| `--m-dur-swap` | 切替 | 220ms | 13f |
| `--m-dur-reward` | 成功演出（小） | 360ms | 22f |
| `--m-dur-rewardL` | 成功演出（大） | 520ms | 31f |
| `--m-dur-ambient` | 背景/呼吸 | 6000ms | 360f |

### Easing（意味で使い分け）

| Token | 用途 | 推奨 |
|---|---|---|
| `--m-ease-standard` | 画面内切替 | `cubic-bezier(0.4,0,0.2,1)` |
| `--m-ease-out` | 入場 | `cubic-bezier(0,0,0.2,1)` |
| `--m-ease-in` | 退出 | `cubic-bezier(0.4,0,1,1)` |
| `--m-ease-sharp` | 反応/スナップ | `cubic-bezier(0.4,0,0.6,1)` |

### Amplitude（強さ）

| Token | 用途 | 既定 |
|---|---|---|
| `--m-scale-press` | 押下縮小 | `0.97` |
| `--m-scale-pop` | ポップ最大 | `1.06` |
| `--m-scale-bounce` | ボヨン最大 | `1.08` |
| `--m-ty-press` | 押下沈み込み | `1px` |
| `--m-ty-drop` | 置く落下 | `10–14px` |

---

## VFXティア

| Tier | 許可 | 禁止 |
|---|---|---|
| `off` | 反応（色/影/輪郭）、フェード | 粒子、シェイク、連続バウンス、背景ループ |
| `low` | 微グロー、粒子0–3個 | シェイク、派手な爆発 |
| `medium` | 粒子3–8個、短い光スイープ | 強シェイク、長い連鎖 |
| `high` | 粒子8–20個、微シェイク、連鎖強調 | 持続的な画面揺れ |

---

## Motion辞書（14種）

### Core（常用してよい：8種）

| ID | 名称 | レイヤ | 伝えたいこと | 主な適用先 | 時間 | イージング |
|---|---|---|---|---|---:|---|
| MOT-01 | むにゅ / Press Squish | Response | 押せた | ボタン/カード/チップ | 90ms | sharp |
| MOT-02 | カチッ / Snap Confirm | Response | 確定 | 確定/トグル/配置直後 | 120ms | sharp→out |
| MOT-03 | ニョキッ / Pop | Transition | 出てきた | トースト/バッジ/小パネル | 200ms | out |
| MOT-04 | 入れ替え / Swap | Transition | 切替 | タブ/モード/デッキ切替 | 220ms | standard |
| MOT-05 | 折りたたみ / Fold | Transition | 開閉 | 詳細/ルール説明 | 200/160ms | out/in |
| MOT-06 | 磁石 / Magnet | Response | 置ける | 置けるマス/ドラッグ | 90–160ms | out |
| MOT-07 | スポットライト / Spotlight | Guidance | 次はここ | 次操作の誘導 | 200ms | out |
| MOT-08 | インジケーター / Indicator | Ambient | 待ちの軽減 | ロード/処理中 | 600–1200ms | standard |

### Accent（ここぞ：6種）

| ID | 名称 | レイヤ | 伝えたいこと | 主な適用先 | 時間 | イージング |
|---|---|---|---|---|---:|---|
| MOT-09 | ぽちょん / Drop | Reward | 置いた感 | カード配置 | 240ms | out |
| MOT-10 | ガチャン / Heavy Impact | Reward | 強い確定 | 奪取/勝敗確定 | 160–220ms | sharp |
| MOT-11 | ボヨンボヨン / Double Bounce | Reward | 喜び | レア/勝利 | 360ms | keyframes |
| MOT-12 | キキーッ / Hard Stop | Response | NG | 置けない | 160ms | sharp |
| MOT-13 | ペラペラ / Flip | Reward | 反転 | 奪取反転 | 240–320ms | standard |
| MOT-14 | 連鎖 / Chain | Reward | 因果 | Same/Plus連鎖 | 320–520ms | out |

---

## 導入順（推奨）

1. MOT-01/02（全UIの手触り統一）
2. MOT-06/07（迷いを減らす）
3. MOT-09/13/10（盤面の気持ちよさ）
4. MOT-14（連鎖のカタルシス）
5. Ambient/Indicator（邪魔になりやすいので最後）
