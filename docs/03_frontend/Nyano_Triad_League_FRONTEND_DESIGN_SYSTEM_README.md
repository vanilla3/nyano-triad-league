# Nyano Triad League - Frontend Design System

## 概要

Nyano Triad Leagueのフロントエンドデザインシステムです。
「かわいく、かつハイクオリティな企業クオリティ」を目指した設計になっています。

## デザイン方針

### ブランドアイデンティティ

- **プライマリカラー**: Nyano Orange (`#FF8A50`) - 温かみがあり親しみやすい
- **Player A**: Sky Blue (`#0EA5E9`) - 落ち着いて信頼感のある青
- **Player B**: Rose (`#F43F5E`) - エネルギッシュで情熱的なピンク

### デザイン原則

1. **清潔感 + 小さな遊び心**: シンプルで読みやすいが、退屈ではない
2. **視認性が最優先**: ゲーム状態が一目でわかる
3. **プログレッシブ開示**: 必要な情報から順に表示
4. **アニメーションは意味を持つ**: 単なる装飾ではなくフィードバック

## ファイル構成

```
output/
├── tailwind.config.ts       # Tailwindカスタム設定
├── globals.css              # グローバルスタイル（カスタムクラス含む）
├── design-preview.html      # デザインプレビュー（ブラウザで開く）
├── components/
│   ├── index.ts             # コンポーネントエクスポート
│   ├── CardNyano.tsx        # カードコンポーネント（フル/コンパクト）
│   ├── BoardView.tsx        # ゲームボード
│   ├── NyanoImage.tsx       # Nyanoマスコット画像
│   ├── GameResultOverlay.tsx # 勝敗演出オーバーレイ
│   ├── TurnLog.tsx          # ターンログ
│   └── Toast.tsx            # トースト通知
├── pages/
│   ├── Home.tsx             # ホームページ（リニューアル版）
│   └── Overlay.tsx          # OBS配信用オーバーレイ
└── README.md                # このファイル
```

## 使い方

### 1. design-preview.htmlを確認

まずはブラウザで`design-preview.html`を開いて、デザインの方向性を確認してください。
インタラクティブなデモが含まれています。

### 2. Tailwind設定を適用

既存の`tailwind.config.ts`を新しいものに置き換えてください：
- ブランドカラー
- プレイヤーカラー
- カスタムアニメーション
- シャドウ
- フォント設定

### 3. グローバルCSSを適用

`globals.css`（または`index.css`）を新しいものに置き換えてください：
- Google Fontsのインポート
- カスタムCSS変数
- `.card`, `.btn`, `.badge`などのコンポーネントクラス
- ゲーム固有のスタイル（`.board-cell`, `.game-card`など）

### 4. コンポーネントを導入

`components/`内のファイルを適宜導入してください。
既存コンポーネントとの互換性を保ちつつ、段階的に移行できます。

## カスタムクラス一覧

### カード
```css
.card          /* 基本カード */
.card-hd       /* カードヘッダー */
.card-bd       /* カードボディ */
.card-ft       /* カードフッター */
.card-glass    /* ガラス効果付きカード */
```

### ボタン
```css
.btn           /* 基本ボタン */
.btn-primary   /* Nyanoカラーボタン */
.btn-player-a  /* Player Aカラー */
.btn-player-b  /* Player Bカラー */
.btn-ghost     /* 透明ボタン */
.btn-sm        /* 小サイズ */
.btn-lg        /* 大サイズ */
```

### バッジ
```css
.badge         /* 基本バッジ */
.badge-nyano   /* Nyanoカラー */
.badge-sky     /* Player A用 */
.badge-rose    /* Player B用 */
.badge-amber   /* フリップイベント用 */
.badge-emerald /* 勝利/成功用 */
.badge-violet  /* チェーン/特殊用 */
```

### ゲーム要素
```css
.board-cell              /* ボードセル */
.board-cell-selected     /* 選択中 */
.board-cell-owner-a      /* Player A所有 */
.board-cell-owner-b      /* Player B所有 */
.game-card               /* ゲーム内カード */
.game-card-owner-a/b     /* 所有者別スタイル */
```

## アニメーション

```css
.animate-card-place      /* カード配置アニメーション */
.animate-card-flip       /* カードフリップアニメーション */
.animate-fade-in         /* フェードイン */
.animate-fade-in-up      /* 下からフェードイン */
.animate-pulse-soft      /* ソフトパルス（ターン表示用） */
.animate-victory         /* 勝利時のパルス */
.animate-shake           /* 敗北時のシェイク */
```

## フォント

- **Display**: Nunito - 見出し、ボタン、ゲームUI
- **Body**: Noto Sans JP - 本文、説明文
- **Mono**: JetBrains Mono - トークンID、ハッシュ、座標

## 色のCSS変数

```css
:root {
  --nyano-500: #FF8A50;        /* メインブランドカラー */
  --player-a: #0EA5E9;         /* Player A */
  --player-b: #F43F5E;         /* Player B */
  --color-flip: #F59E0B;       /* フリップハイライト */
  --color-chain: #8B5CF6;      /* チェーンコンボ */
  --color-victory: #10B981;    /* 勝利 */
}
```

## 今後の拡張予定

1. **ダークモード対応**: `[data-theme="dark"]`でのスタイル切り替え
2. **OBS透過モード**: `[data-theme="transparent"]`
3. **アクセシビリティ強化**: フォーカス状態、コントラスト比
4. **モバイル最適化**: タッチ操作、レスポンシブレイアウト

## 質問・フィードバック

デザインの方向性について質問やフィードバックがあれば、お気軽にどうぞ。
カラーパレット、コンポーネントサイズ、アニメーションのタイミングなど、
細かい調整も可能です。
