# Nyano Triad League — “スマホゲー級UI” × “任天堂レベルUX” 統合仕様書＋ロードマップ＋TODO（Cute Mint / v3）

対象リポジトリ: `vanilla3/nyano-triad-league`  
対象範囲: `apps/web` 全体（特に `/home` → `/match`）  
作成日: 2026-02-09  
目的: 既存の「Mint風かわいい高品質UI」路線を維持しつつ、**UI/UX を“任天堂レベル（直感的に分かる／説明なしで遊べる／失敗しても納得できる）”**へ引き上げる。  
方針: “見た目” と “分かりやすさ” を別軸にせず、**見た目の素材設計がそのまま理解の導線になる**よう統合する。

---

## 0. このドキュメントの読み方

- **第1部: 任天堂レベルUXの原則（根拠つき）**  
  → 何を「任天堂レベル」と定義するかを、公開情報から抽出して言語化します。
- **第2部: Nyano Triad への翻訳（設計原則）**  
  → 原則を、Nyanoの文脈（対戦・NFT・配信）に落とします。
- **第3部: ロードマップ（並行2ストリーム）**  
  → Mint UI（外観）と Nintendo UX（体験）を同時並行で進める計画。
- **第4部: TODO（完全版まで、作業単位）**  
  → Claude Code に投げられる粒度（Where / AC / Deps）で分解。

---

# 第1部: 「任天堂レベルUX」リサーチ要約（公開情報から抽出）

> ここでは **任天堂の開発者インタビュー（Iwata Asks）** を中心に、任天堂らしさを“実装要件”へ落とします。  
> ※内部の非公開ガイドラインは参照できないため、公開されている一次情報を根拠にしています。

## 1.1 任天堂レベルUXの6原則

### 原則A: “一目で目的が分かる” — ゴール/ルールが画面に書いてあるのではなく、**見れば分かる**
- 「楽しいゲームは見ただけで何をすべきか分かる」「失敗してもゲームではなく自分のせいだと思える構造」「周りで見ている人も楽しめる」  
  ── という思想を、**UI＝説明書ではなく、UI＝理解そのもの**として扱っている。

→ Nyanoへの翻訳:  
- 初見の人が **説明を読まずに 30秒以内に1手目を置ける**  
- “置けない/負けた” が起きても **理由が自然に理解できる**（納得感）

### 原則B: “説明なしで触れる” — 文字のチュートリアルより **触って分かる設計**
- 家族（5〜6歳〜70歳）が説明なしで触り、自然に理解して遊ぶ、というテスト観点が語られている。  
- 「直感で遊べる入力」を強く意識した話もある。

→ Nyanoへの翻訳:  
- “ゲスト即プレイ” の導線を極端に短く  
- `/match` 内は **直接操作（タップ/スワイプ/ドラッグ）** が基本で、フォーム要素は補助へ

### 原則C: “Design follows Function” — デザインは装飾ではなく、**機能の説明**
- 弱点が分かりやすい形状、数字を大きくして把握しやすくする等、デザインが「理解」を担う。

→ Nyanoへの翻訳:  
- セル/合法手/危険/連鎖/優勢が **図形・色・動き**で説明される  
- 文字で説明する前に “分かる絵” を作る

### 原則D: “見えないものを見える化” — VFX/SEで、内部状態や因果を瞬間的に伝える
- Effect design は「本来見えないものを見えるようにして、何が起きているかを即時に伝える」役割、と語られる。

→ Nyanoへの翻訳:  
- フリップの原因（どの方向が勝ったか）を **光の走査・矢印・ライン**で示す  
- AIの意図は文章ではなく、まず “短いバッジ/表情/簡潔な理由” で示す

### 原則E: “身近なメタファーで理解のハードルを下げる”
- “テレビのチャンネル”という身近な比喩でUIを理解しやすくした例、  
- 「Simple & Comfortable」「手に取りたくなる」「敵に見えない」入力思想が語られる。

→ Nyanoへの翻訳:  
- Homeは **タイル（チャンネル）**で導線を統一  
- “デッキ”はカードバインダー、“リプレイ”はカセット、“配信”はスタジオ、など **日常/玩具の比喩**でUIを整理

### 原則F: “機能追加で分かりにくくしない” — 複雑化に抗う
- 機能が増えるほど分かりにくくなるのを避ける、という意思決定が語られる。  
- ＝**高度な機能は隠す**。必要なときだけ出す。

→ Nyanoへの翻訳:  
- 対戦画面の高度情報（AI解析/ログ/配信HUD）は “Drawer” に押し込み、通常は要点だけ  
- 初心者は迷わない、上級者は深掘れる（Progressive disclosure）

---

## 1.2 Nyano Triad に効く “任天堂流” 検証方法（そのまま運用にする）

- **無説明テスト**：初見の人に何も言わず触ってもらい、  
  1) 1手目までの時間、2) 誤操作回数、3) 迷った瞬間、4) 離脱点を記録  
- **観戦テスト**：プレイしていない人が画面を見て、  
  「今誰が優勢？」「何が起きた？」に答えられるか  
- **失敗納得テスト**：わざとミスをしてもらい、“なぜダメか” がUIから自然に理解できるか

---

# 第2部: Nyano Triad の “任天堂レベルUX” 設計原則（実装に落とす）

## 2.1 UX Pillars（Nyano版）
1) **At-a-glance**（一目で状況が分かる）  
2) **Direct Manipulation**（直接操作感）  
3) **Feedback First**（フィードバックが先、説明が後）  
4) **Forgiveness**（誤操作しても立て直せる）  
5) **Progressive Disclosure**（情報は段階的に開示）  
6) **Delight but Quiet**（可愛く、しかし邪魔しない）

## 2.2 “画面ごと” 最重要UXゴール（測れる形）

### Home（最重要）
- **10秒で試合開始**（ゲスト vs Nyano AI）  
- 難易度選択は “説明不要” なラベル（例: ねこ初心者/ふつう/ガチ/伝説 なども可）
- Advanced は折りたたみ（UI密度を下げる）

### Decks
- **30秒でデッキができる**（Auto Build / 推奨セット）
- NFT未所持でも遊べる “レンタルデッキ/デモデッキ” を最上段に

### Match（最重要）
- **初見でも 30秒で1手目**  
- “次に何をすれば良いか” が常に画面のどこかに出ている（1行で）
- 置けるセルが **先に光る**（押した後ではない）
- 置けない時は “なぜ” が短く分かる（例: 既にカードがある/今は警戒モード etc）
- 重要演出は短く、普段は静か

### Replay / Stream
- 共有はワンタップ、配信はウィザード（手順を一本道に）

---

# 第3部: 統合ロードマップ（2ストリーム同時並行）

> ストリームA = “見た目（スマホゲー級の高品質UI）”  
> ストリームB = “分かりやすさ（任天堂レベルUX）”

## Phase 0（準備）: “分割・測定・旗” を立てる
- A0: `ui=mint` 導入（feature flag）＋Mint UI kit（HoloPanel等）
- B0: UXスコアカード導入（後述）＋イベント計測（最小）＋無説明テスト準備

## Phase 1（入口）: Home→Match を “説明ゼロで開始” にする
- A1: Home/共通UIをMint風統一（タイル/ボタン）
- B1: “10秒で試合開始” UXに再設計（Advanced折りたたみ、誘導文、エラーの救済）

## Phase 2（核）: Match を “直接操作＋奥行き＋HUD” にする
- A2: BattleStageMint + BoardViewMint + HandDisplayMint（見た目）
- B2: “1手目30秒” UX（合法手ハイライト、操作プロンプト、誤操作防止）

## Phase 3（理解）: 何が起きたか分かる（見えないものを見える化）
- A3: FX/SFX（sparkle/foil/chain line）
- B3: 因果の可視化（フリップ理由の矢印/ライン、AI理由の短縮表示、ログの段階開示）

## Phase 4（全体）: サイト全体を “同一ブランド＋同一操作” にする
- A4: /arena /decks /replay /stream のmint統一
- B4: “迷いゼロ” 導線（命名/アイコン/配置ルールの統一）

## Phase 5（仕上げ）: QA・アクセシビリティ・パフォーマンス
- A5: アセット最適化、軽量化
- B5: a11y / reduced motion / 失敗納得テスト / 観戦テストを通す

---

# 第4部: TODO（完全版まで・作業単位）

表記:
- **Where**: 触る場所（ファイル/ディレクトリ）
- **AC**: 受け入れ条件（出来た判定）
- **Deps**: 依存（先に必要）

---

## 4.A 任天堂UXのための “UXスコアカード” を先に作る（計測と合意）

- [ ] **NIN-UX-001**: UXスコアカード（チェックリスト）を docs に追加  
  - Where: `docs/ux/UX_SCORECARD.md`（新規）  
  - 内容（例）:
    - 30秒で1手目（Yes/No）
    - 1画面で次の行動が分かる（Yes/No）
    - 置けない理由が短く出る（Yes/No）
    - 観戦者が状況説明できる（Yes/No）
    - reduced motion で破綻しない（Yes/No）
  - AC: チーム全員が“任天堂レベル”の判定基準を共有できる  
  - Deps: なし

- [ ] **NIN-UX-002**: 無説明テスト用の台本（手順）作成  
  - Where: `docs/ux/PLAYTEST_SCRIPT_NO_EXPLANATION.md`（新規）  
  - AC: “誰でも同じ手順で” テストできる  
  - Deps: NIN-UX-001

- [ ] **NIN-UX-003**: 計測イベント（最小）  
  - Where: `apps/web/src/lib/telemetry/*`（新規） or 既存analyticsに追記  
  - 計測例:
    - `first_interaction_ms`（初回操作まで）
    - `first_place_ms`（1手目置くまで）
    - `invalid_action_count`（置けない操作回数）
    - `tutorial_completed`  
  - AC: ローカルでもログが取れる（consoleでも可）  
  - Deps: NIN-UX-001

---

## 4.B “見れば分かる” を作る（Design follows function）

- [ ] **NIN-UX-010**: 盤面セルの機能を “形” で分ける（置ける/置けない）  
  - Where: `apps/web/src/components/mint-battle/BoardViewMint.tsx`（新規）  
  - 仕様:
    - 置けるセル: ぷっくり＋発光（控えめ）
    - 置けないセル: フラット＋沈む
  - AC: 初見が「押せる場所」を迷わない  
  - Deps: Mint UI Board 基盤

- [ ] **NIN-UX-011**: “今やること” を1行で常時表示（Match）  
  - Where: `apps/web/src/pages/match/MatchViewMint.tsx`（新規）  
  - 文言例:
    - 「カードを選んで、置きたいマスをタップ」
    - 「警戒モード：置きたいマスをタップ」
  - AC: 画面を見て次の操作が分かる  
  - Deps: MatchViewMint

- [ ] **NIN-UX-012**: 置けない理由を “短く出す”  
  - Where: `MatchViewMint` / `BoardViewMint`  
  - 仕様:
    - 不正操作は Toast ではなく、盤面の近くに短いヒント（例: “そこには置けないよ”）
  - AC: ユーザーが “ゲームが悪い” と思わない  
  - Deps: NIN-UX-011

---

## 4.C “説明なしで触れる” を作る（入力と導線）

- [ ] **NIN-UX-020**: Home の “ゲスト即対戦” を 1本道に  
  - Where: `apps/web/src/pages/Home.tsx`  
  - 仕様:
    - 画面中央に大きな「すぐ遊ぶ」ボタン
    - 難易度はボタン列（ラベル＋短い説明）
    - Advanced は折りたたみ
  - AC: 初見が 10秒で試合開始できる  
  - Deps: NIN-UX-003（計測があると検証が速い）

- [ ] **NIN-UX-021**: Match の入力を “モード” 化（配置/警戒）  
  - Where: `MatchViewMint`  
  - 仕様:
    - `mode = place | warning` を明確化
    - モード中は盤面の表示も変える（色・アイコン）
  - AC: 何をしているか迷わない  
  - Deps: BoardViewMint

- [ ] **NIN-UX-022**: Mobile の誤操作防止（選択→プレビュー→確定）  
  - Where: `HandDisplayMint` + `MatchViewMint`  
  - AC: 置き間違いが明確に減る（invalid_action_count 減少）  
  - Deps: NIN-UX-003

---

## 4.D “見えないものを見える化” を作る（VFX/SEで因果を伝える）

- [ ] **NIN-UX-030**: フリップの因果表示（矢印/ライン）  
  - Where: `BattleFXMint` or `BoardViewMint` overlay  
  - 仕様:
    - 勝った方向に矢印が一瞬走る
    - 連鎖はラインが走る
  - AC: 観戦者が “何が起きたか” 理解できる  
  - Deps: BoardFlipAnimator 連携

- [ ] **NIN-UX-031**: 音で状態を伝える（最小）  
  - Where: `apps/web/src/lib/sound/*`  
  - 仕様:
    - 置けるとき: “ポン”
    - 置けないとき: “コツ”（短い）
    - フリップ: “キラ”
  - AC: 画面を見なくても “通った/通らない” が分かる  
  - Deps: 設定UI

- [ ] **NIN-UX-032**: Nyano の表情を “UIの一部” にする  
  - Where: `NyanoAvatar` / `NyanoReaction` の mint HUD 統合  
  - 仕様:
    - 良い手: 喜ぶ
    - 悪い手: 困る（でも責めない）
  - AC: AI対戦の温度感が上がる  
  - Deps: HUD

---

## 4.E “機能追加で分かりにくくしない” を担保（Progressive disclosure）

- [ ] **NIN-UX-040**: 詳細情報は Drawer へ集約（AI/ログ/配信）  
  - Where: `MintDrawer`, `BattleHUDMint`  
  - AC: 通常表示は要点だけで散らからない  
  - Deps: MintDrawer

- [ ] **NIN-UX-041**: “初心者UI密度 / 上級者UI密度” の切替  
  - Where: `localStorage` 設定 + HUD  
  - AC: 初心者は迷わない、上級者は欲しい情報にアクセスできる  
  - Deps: NIN-UX-040

---

## 4.F テストと運用（任天堂流の回し方）

- [ ] **NIN-UX-050**: “無説明テスト” を隔週で実施できる運用整備  
  - Where: `docs/ux/PLAYTEST_LOG.md`（新規）  
  - AC: テスト→改善→再テストのループが回る  
  - Deps: NIN-UX-002

- [ ] **NIN-UX-051**: 観戦テスト（スクショ1枚で状況説明）  
  - Where: `docs/ux/SPECTATOR_TEST.md`（新規）  
  - AC: HUDの改善点が明確になる  
  - Deps: HUD整備

---

# 付録A: Claude Code 依頼用（“任天堂UX”を含む短縮プロンプト）

```
あなたは任天堂レベルの直感的UI/UXを実現するゲームUIエンジニアです。
vanilla3/nyano-triad-league の apps/web を改修し、/match の ui=mint を追加。
見た目（mint風スマホゲー級）と同時に、説明なしで遊べるUXにしてください。

必須要件（任天堂UX）:
- 一目で目的と次の行動が分かる（画面内に常に1行の指示）
- 初見が30秒で1手目を置ける（モバイル前提）
- 置けない理由が短く分かる（ユーザーがゲームを責めない設計）
- 見えない因果をVFX/SEで可視化（フリップの理由、連鎖）
- 詳細情報はDrawerに隠し、通常は要点だけ（progressive disclosure）
- Reduced motion / mute / haptics 設定を用意
- 無説明テストの計測（first_place_ms, invalid_action_count など）を最小で入れる

実装は P0〜P5 の小分けで進め、既存 ui=rpg/classic を壊さないこと。
```

---

# 付録B: 参照した任天堂一次情報（公開インタビュー）
※リンクはファイル内にのみ記載（チャット本文にはURLを直接貼りません）

- Iwata Asks（Wii Remote）  
- Iwata Asks（New Super Mario Bros.）  
- Iwata Asks（Nintendo Land / Like Team Sports）  
- Iwata Asks（Wii Channels）  
- Iwata Asks（Super Mario Developers / effect design）  
- Iwata Asks（New Super Mario Bros. U）  
- Iwata Asks（Mario 25th interview / without explanation）

---

以上。
