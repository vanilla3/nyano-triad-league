# Nyano Triad League UI Style Guide v1（暫定）

このドキュメントは「Nyanoらしい、かわいくて、なおかつ理解しやすい」UIをチームで揃えるためのガイドです。
ゲームの体験価値を損なわず、管理・検証・議論（コミュニティ運営）の導線を磨くことを目的にします。

## 1. ゴール

- **かわいらしさ**：丸み、余白、やわらかい配色、軽い遊び心（絵文字/タグ）でNyanoらしさを出す
- **読みやすさ**：階層・強弱・意味色（info/warn/danger）で「何が重要か」を明確にする
- **迷わなさ**：入力→実行→結果→共有 の流れをページ内で自然に辿れる
- **運営がいなくても回る**：再生・共有・検証のUIを強化し、議論がURLで回るようにする

参考トーン：Nyano公式の mint.nyano.ai

## 2. 情報設計の原則

### 2.1 レイヤリング（下から積む）
1) **データ**：JSON/ID/アドレス/ログ  
2) **意思決定**：何を選ぶ？（ルール/デッキ/ケース）  
3) **行動**：実行/コピー/共有/再生  
4) **フィードバック**：成功/失敗/差分/注意点  
5) **物語**：Nyanoらしさ、コミュニティの遊び

UIを「見た目から」ではなく、「理解の段階」から組み立てます。

### 2.2 進行を分割する
- 1ページ内で **Step** を暗黙に分ける（選ぶ→実行→読む→共有）
- いきなり全部見せない（Advanced を折りたたむ、あるいは callout にまとめる）

## 3. 目標となるビジュアルトーン

- 背景：**やわらかいグラデーション**（rose ↔ sky）
- 角丸：カードは **rounded-2xl**、ボタンは **rounded-xl/rounded-full**
- 影：強い影は避け、**shadow-sm**で統一
- アクセント：rose/fuchsia 系（主ボタン・アクティブ表示）
- 情報色：info=sky, warn=amber, danger=rose

## 4. UIコンポーネントの規約

### 4.1 Card
- `card` / `card-hd` / `card-bd`
- ヘッダはタイトル + 1行説明まで（長文は callout へ）

### 4.2 Button
- 標準：`btn`
- 主アクション：`btn btn-primary`
- 補助：`btn btn-soft`
- 破壊的：`btn btn-danger`（できれば confirm 付き）
- 小型：`btn btn-sm`

### 4.3 Badge
- `badge`（補助ラベル、状態表示）
- 例：`badge-slate` / `badge-sky` / `badge-nyano` / `badge-amber`

### 4.4 Callout
- `callout callout-info`：使い方や意図
- `callout callout-warn`：注意点や差分（Replay と Playground のズレ等）
- `callout callout-muted`：環境情報（RPC/Contract）など

## 5. ページ設計の型（管理画面/ツール）

- **Deck Studio**：入力（tokenIds）→保存→プレビュー→Matchへ
- **Nyano Inspector**：入力→チェーン読込→カード変換→JSON/リンク共有
- **Ruleset Registry**：目的（WHY）→検索→一覧→コピー
- **Nyano Lab (Playground)**：ケース選択→盤面→ログ→共有

## 6. 次の改善候補（v1以降）

- 視覚要素：Nyanoの小さなマスコット（SVG/アイコン）導入
- 「コピーした」フィードバックの一貫化（toast）
- データ表示の“折りたたみ”（特に JSON / 長いURI）
- Arena / Match の体験を「ゲーム」へ寄せる（演出・音・アニメ）

## 4.5 Toast（フィードバックの一貫化）
- 目的：**一時的な成功/コピー**など、ページを汚さずに「ちゃんと起きた」を伝える
- 使いどころ：
  - Copy（rulesetId / URL / JSON など）
  - Save / Delete / Clear（local storage など）
  - Preview loaded など軽い通知
- 原則：
  - 重要なエラーは toast ではなく **callout-warn** で残す
  - toast は「短く」「具体的に」（例：Copied / transcript JSON）

実装：`ToastProvider`（AppLayout） + `useToast()`

## 4.6 Disclosure（折りたたみ / Progressive disclosure）
- 目的：**JSON/長文**を常時表示しない（読む人だけが開く）
- 例：
  - Replay / Playground の “Show raw JSON (debug)”
- 原則：
  - summary（見出し）は 1行で要点
  - 中身は code/pre を使って読みやすく

実装：`<Disclosure title="..."> ... </Disclosure>`

## 4.7 CopyField（長い値を見やすく + Copy/Open）
- 目的：RPC/Contract/URI のような長い値を **短く表示しつつ**、コピー/参照を迷わせない
- 構成：
  - label（何の値か）
  - value（短縮表示 + Expand/Fold）
  - actions（Copy / Open）

実装：`<CopyField label="Contract" value={contract} href="..."/>`

## 4.8 Badge（状態色の追加）
- active/OK 系は `badge-emerald` を使用可能にしました。
- 例：Event status（active/always）

