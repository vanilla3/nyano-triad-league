# Stream Recovery Runbook — Nyano Triad League

Troubleshooting and recovery procedures for live stream operations.

## Symptom-Based Troubleshooting

### "No signal yet" / Overlay shows nothing

**Cause**: Overlay has no data — Match tab is not running or BroadcastChannel disconnected.

**Steps**:
1. Check that the **Match** page tab is open and running a game
2. Verify the browser console (F12) shows no errors
3. Reload the Overlay tab (`Ctrl+Shift+R`)
4. If still blank, reload the Match tab as well
5. Check that both tabs are in the **same browser profile** (BroadcastChannel requires same origin)

### "Data stale" / Age shows "5m ago" or longer

**Cause**: BroadcastChannel messages stopped arriving.

**Steps**:
1. Check the Match tab — is the game progressing?
2. If Match tab is frozen, reload it
3. Reload the Overlay tab
4. If both reloads fail, check browser DevTools > Application > BroadcastChannel for errors
5. Nuclear option: close all tabs, clear localStorage (see below), restart

### RPC Error / "warudo POST failed"

**Cause**: Backend server connection issue (Warudo integration).

**Steps**:
1. Check that the backend server is running
2. Verify network connectivity to the backend URL
3. Check the **StreamOperationsHUD** error banner for details
4. If `500 Internal Server Error`: restart the backend service
5. If `ECONNREFUSED`: backend is not running or wrong port
6. Error is displayed in the overlay for 30 seconds (sticky error display)

### Vote TURN MISMATCH

**Cause**: Stream Studio and Overlay are on different turns.

**Steps**:
1. Open **Stream Studio** page
2. Check the current turn number matches the Overlay
3. If mismatched, click "Sync" in Stream Studio to resend state
4. If Stream Studio shows correct state but Overlay is behind:
   - Reload Overlay tab
   - Check that vote state is being broadcast correctly

### Overlay theme looks wrong / CSS broken

**Cause**: Theme parameter mismatch or cached CSS.

**Steps**:
1. Check URL parameters — is `theme=` set correctly?
2. Try hard reload: `Ctrl+Shift+R` (bypasses cache)
3. Check that the correct theme class is applied (inspect element, look for `overlay-theme-*`)
4. If using OBS, try removing and re-adding the Browser Source

### Cards not showing / Empty board cells

**Cause**: Board data incomplete or card data missing.

**Steps**:
1. Check Match tab — are cards placed on the board?
2. Verify `state.board[i]` has card data (use browser console)
3. If cards show as "..." placeholder, the data is arriving but card details are missing
4. Reload Match tab to trigger a fresh state broadcast

## General Recovery Procedure

When in doubt, follow this escalation path:

### Level 1: Soft Recovery (< 5 seconds)
```
1. Reload Overlay tab (Ctrl+Shift+R)
```

### Level 2: Full Tab Recovery (< 15 seconds)
```
1. Reload Overlay tab
2. Reload Match tab
3. Wait 2-3 seconds for BroadcastChannel reconnection
```

### Level 3: Stream Studio Recovery (< 30 seconds)
```
1. Open Stream Studio tab
2. Click "Resync" or trigger a state broadcast
3. Reload Overlay tab
4. Verify data is flowing
```

### Level 4: Nuclear Recovery (< 60 seconds)
```
1. Close ALL Nyano tabs
2. Open browser console (any tab): localStorage.clear()
3. Re-open Match page
4. Start or resume the game
5. Re-open Overlay page with correct URL parameters
6. Verify everything is working
```

## Pre-Stream Checklist

Run through this checklist before going live:

- [ ] Backend server is running and healthy
- [ ] Match page loads without console errors
- [ ] Overlay page shows correct theme (`?controls=1` for testing)
- [ ] Board cells show correct owner colors (sky for A, rose for B)
- [ ] Last move panel updates when a move is made
- [ ] Advantage bar shows score when tiles are placed
- [ ] Vote panel shows "OPEN"/"CLOSED" status correctly (if enabled)
- [ ] OBS Browser Source captures the overlay
- [ ] Transparent background is working (if using `bg=transparent`)
- [ ] Switch to production URL: `?controls=0&bg=transparent&theme=<your-theme>`
- [ ] Do a test move and verify the overlay updates in OBS

## Key Architecture Notes

- **BroadcastChannel**: All tabs communicate via `BroadcastChannel` (same-origin only)
- **localStorage**: Theme preferences and event IDs are persisted in localStorage
- **No polling**: Data arrives via push (BroadcastChannel), not polling
- **Sticky errors**: Error messages remain visible for 30 seconds after the last error
- **Panel priority**: Primary panels (Last move) are always visible; Secondary/Tertiary panels hide in `minimal` density
- **Dramatic mode**: Panels automatically upgrade to `ol-panel-dramatic` for big moments (3+ flips, domination combo, trap triggered)
