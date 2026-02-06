# commit-0063 TODO update

## ✅ Done in this commit
- [x] Merge UI improvement pack into production pages (/match, /replay, /stream)
- [x] Add reusable animation utilities (cell place / cell flip / banner / HUD pulse)
- [x] Add OPS HUD for stream operation visibility

## 🔎 Verify (you should run)
- [ ] `pnpm -C apps/web build` (or `pnpm -C apps/web typecheck`)
- [ ] `/match` → place + flip animation does not break click handling
- [ ] `/stream` → HUD shows allowlist count/hash and vote timer behaves on repeated votes
- [ ] `/replay` → banner actions (Copy/Share/Save) work and don’t block stepping

## 🔜 Next (UI/game polish candidates)
- [ ] **Sound + haptics**: optional SFX (place/flip/chain/fever) with toggle + volume
- [ ] **Better move explanation**: show “why flips happened” (edge compare trace) on hover
- [ ] **Autoplay replay**: play/pause + speed + step scrubbing slider
- [ ] **Card art pipeline**: show Nyano NFT image per card (tokenId→image URL), fallback to placeholder
- [ ] **Accessibility**: keyboard shortcuts (1..5 for card, QWE/ASD/… for cell) + ARIA labels
