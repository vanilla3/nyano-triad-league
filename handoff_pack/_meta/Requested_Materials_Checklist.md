# Requested Materials Checklist (for frontend)

このファイルは、フロント担当からの要求を「生成物にどう入るか」対応表にしたものです。

## 構造把握（最優先）
1. apps/web のディレクトリ構造全体  
   -> `apps_web_tree.txt`

2. apps/web/package.json  
   -> `apps_web_package.json`

## 主要ページ（4画面）
3. Match.tsx -> `apps_web_pages/Match.tsx`  
4. Stream.tsx -> `apps_web_pages/Stream.tsx`  
5. Overlay.tsx -> `apps_web_pages/Overlay.tsx`  
6. Replay.tsx -> `apps_web_pages/Replay.tsx`

## コンポーネント
7. components のディレクトリ一覧  
   -> `apps_web_components_tree.txt`

8. 主要コンポーネント（BoardView, CardMini, TurnLog, NyanoImage など）  
   -> `apps_web_components/` 以下（該当ファイルを含めてコピー）

## スタイル/アセット
9. tailwind.config.*  
   -> `tailwind.config.*`（見つかるもの）

10. グローバルCSS（index.css / globals.css 等）  
   -> `global_css/` に収集（存在するもののみ）

11. nyano_assets.ts  
   -> `nyano_assets.ts`

## エンジン（カード性能の理解用）
12. packages/triad-engine/src の主要ファイル  
   -> `triad_engine_src/` + `triad_engine_src_tree.txt`

