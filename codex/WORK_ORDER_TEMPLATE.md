# Work Order: <NNN> <Title>

## 1) 背景 / 目的
- なぜ今これをやるのか
- ユーザー価値（プレイヤー/配信者/検証者）

## 2) 期待するアウトカム（Before/After）
- Before:
- After:

## 3) スコープ

### MUST（必須）
- 

### SHOULD（望ましい）
- 

### COULD（任意）
- 

### NOT DO（非ゴール）
- 

## 4) 受け入れ基準（Acceptance Criteria）
- [ ] 操作手順: ... / 期待結果: ...
- [ ] 390px 幅端末で破綻しない
- [ ] URL互換 / schema互換を壊さない
- [ ] WebGL フォールバックが機能する

## 5) 実装メモ（任意）
- 触るべきファイル候補:
  - 
- デザイン方針（タイポ/余白/モーション）:
  - 

## 6) 検証

```bash
pnpm -C apps/web test
pnpm -C apps/web typecheck
pnpm -C apps/web build
```

（必要に応じて）
```bash
pnpm -C packages/triad-engine test
cd contracts && forge test
```
