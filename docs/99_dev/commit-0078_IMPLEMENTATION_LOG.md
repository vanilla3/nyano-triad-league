# commit-0078 IMPLEMENTATION LOG

## Summary
- **長期ロードマップ（超長期）**を新規作成し、作業者が「何を優先し、何に注意し、どう作業するか」を俯瞰できる状態にした。
- 目的: 手戻り・属人化・仕様ブレを減らし、配信イベント品質（視認性/安定性/参加性/運営性/説明性）を段階的に引き上げる。

## Added
- `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md`
  - 品質の柱（Visual/Extensibility/Stability/Participation/Operability/Explainability）
  - 変更の原則（単一ソース化、契約の扱い、best-effort）
  - Phase 0〜Phase 6（2〜3年+）のロードマップ
  - 作業者ガイド（DoD、落とし穴、運用ルール）

## How to use
- 移行先作業者は、まず Phase 0/1 の項目を「イベント成立の最低条件」として扱い、上から順に潰す。
- 仕様が揺れそうな箇所（viewer command / state schema / strictAllowed hash）は、このロードマップの「変更の原則」に立ち返る。
