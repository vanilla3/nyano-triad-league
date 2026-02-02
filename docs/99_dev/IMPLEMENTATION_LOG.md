# 実装ログ

> 1コミット=1まとまりで追記する（Why/What/Verify）。


## 2026-02-01 — commit-0002

### Why
- 初期ZIPの構成上、`nyano-triad-league-starter/` が同梱されており、ワークスペースの中心が曖昧だった。
- 公式戦（検証可能）に必要な **matchIdの定義** を、JSON等の揺れる形式ではなく Solidity 互換の固定エンコードに寄せたかった。
- Design v2.0 の Layer2（TACTICS）の核である **警戒マーク** は、早期に入れることでゲームの“読み合い”が立ち上がる。

### What
- `packages/triad-engine` を正規位置へ移設し、starter同梱を解消。
- Transcript v1 の matchId を `keccak256(abi.encode(...))` 相当の **固定ABIエンコード** に変更（TS参照実装）。
- Layer2：警戒マークを実装（最大3回／1ターン有効／踏んだカードTriad-1）。
- ゴールデンテスト追加（警戒マークの有無で中心がフリップする/しない）。
- `TRANSCRIPT_SPEC` に固定ABIエンコードを明記。
- CI：lockfile未コミット段階を想定し `--frozen-lockfile` を一時解除。

### Verify
- `pnpm -C packages/triad-engine test`
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` と `docs/02_protocol/Nyano_Triad_League_TRANSCRIPT_SPEC_v1_ja.md` の更新確認


## 2026-02-01 — commit-0003

### Why
- Design v2.0 の Layer2（TACTICS）のもう一つの柱である **コンボボーナス** を早期に入れ、連鎖（コンボ）を「狙う理由」を作りたかった。
- 公式戦（検証可能）では、同じトランスクリプトから **同じ派生効果（次ターンバフ）** が再現できる必要があるため、コンボ数の定義を仕様として固定したかった。
- 「運営がいなくても盛り上がる」方向に向け、ERC-6551（TBA）とステーキングを **プロトコル部品** としてどう使うかを並行して整理しておきたかった。

### What
- TSエンジンに **コンボボーナス** を実装：
  - `comboCount = 1（配置） + flipCount（このターンでひっくり返した枚数）`
  - 3: Momentum（次の自分のカード 全辺+1）
  - 4: Domination（次の自分のカード 全辺+2）
  - 5+: Nyano Fever（次の自分のカードが警戒マークを無効化）
- 参照実装の出力に `turns: TurnSummary[]` を追加し、UI/解析が “運営なし” でも作りやすい形にした。
- ゴールデンテスト追加：Momentum が次ターンのカードに +1 として反映されるケース。
- `RULESET_CONFIG_SPEC` と `TRANSCRIPT_SPEC` に、コンボ数の定義と派生値の扱いを追記。
- 自律化検討として `ERC6551_and_Staking_Notes_v1_ja.md` を追加（TBA/ステーキングの使い所と段階導入案）。

### Verify
- `pnpm -C packages/triad-engine test`
- 仕様更新：`docs/02_protocol/*` と `docs/99_dev/*` の差分確認


## 2026-02-01 — commit-0004

### Why
- Layer2（警戒マーク/コンボボーナス/後攻補正）は「シーズンやルールセット」で ON/OFF を切り替えられる必要がある（運営が消えてもコミュニティが環境を作れるため）。
- 設計ドキュメント v2.0 にある「先攻・後攻バランス（後攻初手+1 もしくは後攻警戒+1回）」を、エンジン側で安全に選択できる形にしたかった。
- 警戒マークの Triad 下限（0 or 1）が曖昧だと、境界ケースの結果がズレて後から地獄になるため、v1の決定を固定したかった。

### What
- `RulesetConfigV1`（engine-side subset）を導入し、`simulateMatchV1(..., ruleset)` でルールを指定可能にした（未指定は `DEFAULT_RULESET_CONFIG_V1`）。
- 警戒マーク：
  - rulesetで `enabled` を切り替え可能（無効時は transcript フィールドを無視）。
  - 使用回数を `maxUsesPerPlayer` に明確化し、後攻に `secondPlayerExtraUses` を付与可能にした。
  - Triad下限は **0（0..10にクランプ）** を v1の決定として types/spec に明記。
- コンボボーナス：
  - rulesetで `enabled` を切り替え可能にし、閾値/効果量も設定で変更できるようにした（v2デフォルトは維持）。
- 後攻補正：
  - rulesetで `secondPlayerBalance.firstMoveTriadPlus` を指定すると、後攻の初手に全辺+Xを付与できる。
- テスト追加：
  - 後攻初手+1 の有無でフリップ結果が変わるケース。
  - 後攻だけ警戒マーク +1 回を許可するケース（4回目でthrowしない）。

### Verify
- `pnpm -C packages/triad-engine test`
- ドキュメント更新：`docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md` / `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` の差分確認

---

## Commit0005 — Layer3（Synergy / Trait効果 v1）

- 実装：`packages/triad-engine` に TraitEffectsConfig を追加し、v1のTrait効果を決定論で実装。
- 追加/更新した仕様：
  - `docs/02_protocol/Nyano_Triad_League_RULESET_CONFIG_SPEC_v1_ja.md`（TS shape に合わせて具体化）
  - `docs/02_protocol/Nyano_Triad_League_TRANSCRIPT_SPEC_v1_ja.md`（Earth選択の必須条件を明確化）
  - `docs/02_protocol/Nyano_Triad_League_TRAIT_EFFECTS_SPEC_v1_ja.md`（新規：Traitの厳密仕様）

### 実装したTrait（v1）
- Cosmic：角配置 allTriad +1
- Light：隣接味方 allTriad +1（非スタック既定）
- Shadow：警戒マーク debuff 無効化（消費はする）
- Forest：最初のフリップ試行を1回無効化（shield）
- Metal：連鎖攻撃ではフリップ不可
- Flame：Triad同値時、じゃんけんで常に勝つ（相手がFlameでない場合）
- Aqua：斜め4方向にも攻撃（斜め強度は `min(edgeA, edgeB)` 既定）
- Thunder：隣接敵カードの全辺 -1（永続、capture前に適用）
- Wind：先攻/後攻選択（transcriptのfirstPlayerで表現）
- Earth：辺選択 +2 / 対辺 -1（`earthBoostEdge`、requireChoice既定 true）

### ゴールデンテスト追加
- Shadow が警戒マークを無視するケース
- Forest shield が1回だけフリップを無効化するケース
- Earth の選択で結果が変わるケース
- Thunder の永続デバフ
- Light の隣接バフで結果が変わるケース

### 次の焦点
- Nyano Peace のオンチェーン属性 → TraitType 導出の暫定ルール（JSON公開＋議論可能な形）
- Formation bonuses（Layer3拡張）


## 2026-02-02 — commit-0006

### Why
- Layer3（Trait効果）を実装した時点で、次のボトルネックは「Nyano Peace のオンチェーン Trait（classId/seasonId/rarity）を、ゲーム内 TraitType（10種）へどう落とすか」だった。
- 導出規則が曖昧なままだと、インデクサやUIごとに解釈が割れて **replay / 公式戦オンチェーン決済が破綻**する。
- さらに、class/season/rarity がオンチェーンで公開されている以上、それをゲーム性（環境設計/デッキ予算など）に接続できる「拡張点」として、ルールセットに含めておきたかった。

### What
- `RulesetConfigV1.synergy.traitDerivation`（NyanoTraitDerivationConfigV1）を追加。
- TS参照実装に Nyano用ヘルパを追加（`packages/triad-engine/src/nyano.ts`）：
  - `DEFAULT_NYANO_TRAIT_DERIVATION_CONFIG_V1`
  - `deriveTraitTypeFromNyanoTraitV1(...)`
  - `makeCardDataFromNyano(...)`（on-chain read → CardData の組み立て）
- デフォルトルールセットに `traitDerivation` を同梱（ルールの“標準解釈”を固定）。
- 仕様追加：`Nyano_Triad_League_TRAIT_DERIVATION_SPEC_v1_ja.md`
- 既存仕様更新：ruleset/transcript/trait-effects が導出ルールを参照するように追記。
- テスト追加：rarityごとの導出分岐と `makeCardDataFromNyano` の組み立てをゴールデン化。

### Verify
- `pnpm -C packages/triad-engine test`
- `pnpm -C packages/triad-engine build`
- `docs/02_protocol/*` / `docs/99_dev/*` の差分確認
