# 実装ログ

> 1コミット=1まとまりで追記する（Why/What/Verify）。


## 2026-02-01: repo正規化 + transcript keccak hash

### Why
- 初コミット段階で `triad-engine` がワークスペース直下に無く、CI/開発導線が混乱しやすかった。
- 公式戦（オンチェーン決済）の前提となる `matchId`（トランスクリプトの同一性）を、Solidity互換の keccak256 に固定したかった。

### What
- `packages/triad-engine` をルートワークスペースへ配置（重複スターター削除）。
- `matchId = keccak256(abi.encode(...))` を TS参照実装に実装。
  - optional u8 フィールドは 255 sentinel へ正規化。
  - `reserved` も常に hash 対象に含める（将来の拡張のため）。
- `.github/workflows/ci.yml` の install を `pnpm install` に変更（lockfile未導入でもCIが落ちないように）。
- トランスクリプト仕様（docs）に v1 の ABI 型・順序を追記。

### Verify
```bash
pnpm i
pnpm -C packages/triad-engine test
```

