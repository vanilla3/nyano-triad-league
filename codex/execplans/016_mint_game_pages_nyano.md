# Mint game pages with Nyano mascot

This ExecPlan is a living document. `Progress` / `Decision Log` / `Surprises & Discoveries` / `Outcome` will be updated as the work proceeds.

## 1) Purpose / Big Picture

- Players should recognize Nyano as the in-game guide across Arena, Events, and Stream.
- Secondary pages should feel like game facilities: arena gate, challenge board, and broadcast booth.

## 2) Scope

### In-scope

- Add the provided Mini Nyano transparent PNG as a public UI asset.
- Improve Arena, Events, and Stream Mint surfaces with game-like hero compositions, player-facing copy, and mascot usage.
- Keep current event archive, stream vote, overlay, and bridge behavior intact.

### Out-of-scope

- Engine, transcript, streamer bus, or state_json schema changes.
- New external dependencies.
- Full E2E suite maintenance unrelated to these page visuals.

## 3) Non-negotiable constraints (Invariants)

- Determinism remains untouched.
- Match/Replay/Stream URLs and query params stay backward compatible.
- `state_json v1`, viewer command, and streamer bus shapes stay stable.
- WebGL fallback behavior remains untouched.
- New responsive visuals must not create horizontal overflow at 390px.

## 4) Current State

- Arena is still mostly legacy card/admin copy.
- Events and Stream have useful logic but read as operations dashboards.
- The provided Mini Nyano character is not yet available as a local public asset.

## 5) Proposed Design

- Visual thesis: pastel Mint game facilities with Mini Nyano as a guide standing beside action panels.
- Content plan: hero orientation, immediate primary action, compact guide, then deeper operational details.
- Interaction thesis: keep existing buttons and forms, but add stronger hover/press surfaces and compact game-state chips.

## 6) Implementation Steps

- [x] Add Mini Nyano asset and export its URL.
- [x] Rebuild Arena as a Mint arena gate with difficulty cards and quick-play panel.
- [x] Add Events challenge-board hero and guide while preserving archive/attempt logic.
- [x] Add Stream broadcast-booth hero and guide while preserving vote/overlay/Warudo logic.
- [x] Add responsive CSS and verify desktop/mobile.

## 7) Verification

- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm release:check`
- Local preview smoke on `/arena`, `/events`, `/stream` at 390px and desktop.

## 8) Risks / Rollback

- Risk: large transparent PNG increases first load if overused.
- Mitigation: use it as hero/thumbnail asset with lazy loading outside critical icons.
- Rollback: remove the page visual layer and asset references; no protocol files touched.

## 9) Decision Log

- 2026-05-01: Use the provided character only in page UI and mascot slots instead of replacing NFT/card art logic.
- 2026-05-01: Keep route/query behavior intact and limit this pass to Mint visual/copy layers.

## 10) Outcome

- Arena, Events, and Stream now share a Mint game-page treatment with Mini Nyano mascot art, player-facing Japanese copy, and page guides.
- Local preview smoke passed at 1280px and 390px with no horizontal overflow and with mascot assets loading.
