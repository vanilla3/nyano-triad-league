# commit-0061 IMPLEMENTATION LOG

## 目的
- “別で作成されたフロント実装” を本体リポジトリに取り込み、UIのゲーム感を底上げする
- Nyano画像をローカルアセット化し、安定して表示できるようにする（リモート依存の排除）

---

## 取り込み内容（要点）

### 1) Nyano画像（添付画像）をプロジェクト同梱に変更
- `apps/web/public/nyano.png`（1024pxに最適化 / 透過保持）
- `apps/web/public/nyano.webp`（WebP 版・軽量）
- `apps/web/src/lib/nyano_assets.ts` をローカル優先に更新
- `apps/web/src/components/NyanoImage.tsx`
  - `<picture>` で webp→png の順に読み込み
  - ローカルが無い場合は Arweave にフォールバック
  - さらに失敗した場合はプレースホルダを表示

### 2) Tailwind トークン + グローバル CSS を導入
- `apps/web/tailwind.config.ts`：Nyanoカラー、player色、shadow/animation 等を追加
- `apps/web/src/index.css`：ベーススタイルと「カード/ボタン/バッジ」などの UI primitives を定義
  - 既存の画面が “機械的” に見える問題を、CSS側の骨格から改善

### 3) 新 UI コンポーネント群の追加（ゲームっぽさの核）
- `apps/web/src/components/CardNyano.tsx`
  - Nyanoトーンのカード UI（compact / full / hand 表示など）
- `apps/web/src/components/BoardView.tsx`
  - 盤面 UI を刷新（カードの見栄え、所有者色、演出）
  - 互換性重視：既存の `focusCell`, `onClickCell` 等も受けられる設計
- `apps/web/src/components/CardMini.tsx`
  - 既存の `CardMini` API は維持しつつ内部を新カード UI に差し替え（既存ページに副作用少なく見た目を改善）
- `apps/web/src/components/GameResultOverlay.tsx`
  - 結果演出用の UI（このコミットでは “部品” の追加まで。表示タイミングの統合は次の段階でOK）
- `apps/web/src/components/TurnLogCompact.tsx`
  - ストリーム用の短いターンログ表示（視聴者参加導線向け）

### 4) デザイン実装の “参照用” ページを格納
- `apps/web/src/pages/_design/Home.tsx`
- `apps/web/src/pages/_design/Overlay.tsx`
※ルーティングへの接続は行っていません（既存動作への影響を最小化しつつ、フロント担当が参照しやすい状態にするため）

---

## 影響範囲 / 互換性メモ

- `CardMini` と `BoardView` を UI差し替え対象にしているため、既存ページ（Match/Replay/Overlay等）が **見た目だけ大きく改善** されます。
- `BoardView` は旧API互換のため、既存呼び出しのままでも動くことを想定しています。
- Tailwind config / index.css を更新しているため、クラス名衝突が起きた場合は `index.css` 側の primitives を優先して調整します。

---

## 次にやる（TODOの方向性）
- Match で `GameResultOverlay` を “試合終了時に自動表示” する統合
- `Home.tsx` の採用（既存トップページがあるなら置換/統合）
- `Overlay` を “Premium UI” に移行（state_json + strictAllowed を活かした表示）
- UI/UX の最終磨き（余白・タイポ・アイコン・アニメーションの節度）

