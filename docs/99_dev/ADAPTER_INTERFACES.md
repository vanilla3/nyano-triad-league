# Adapter Interfaces

> Plugin/Adapter boundary reference for Nyano Triad League integrations.
> Phase 3 quality hardening document.

---

## 1. BroadcastChannel Bus

Cross-tab communication layer between Match/Stream/Replay pages and the OBS Overlay.
Falls back to `localStorage` + `StorageEvent` when `BroadcastChannel` is unavailable.

### Channels

| Channel Name | localStorage Key | Message Envelope | Direction |
|---|---|---|---|
| `nyano-triad-league.overlay.v1` | `nyano_triad_league.overlay_state_v1` | `{ type: "overlay_state_v1", state: OverlayStateV1 }` | Match/Replay -> Overlay |
| `nyano-triad-league.stream_vote.v1` | `nyano_triad_league.stream_vote_state_v1` | `{ type: "stream_vote_state_v1", state: StreamVoteStateV1 }` | Stream -> Overlay |
| `nyano-triad-league.stream_cmd.v1` | `nyano_triad_league.stream_cmd_v1` | `{ type: "stream_command_v1", cmd: StreamCommandV1 }` | Stream -> Match |

### Validation

All **consumer** functions (`subscribe*`, `readStored*`) apply runtime validators before invoking callbacks.
Invalid payloads are logged via `console.warn` and silently dropped (graceful degradation).

| Validator | Required Fields | Key Optional Checks |
|---|---|---|
| `isValidOverlayStateV1` | `version=1`, `updatedAtMs` (finite), `mode` ("live"\|"replay") | `turn` 0-9, `board` length 9, `lastMove` ranges, `comboEffect` enum, `deckA/B` length 5 |
| `isValidStreamVoteStateV1` | `version=1`, `updatedAtMs` (finite), `status` ("open"\|"closed") | `turn` 0-8, `top[].move.cell` 0-8, `top[].move.cardIndex` 0-4 |
| `isValidStreamCommandV1` | `version=1`, `id` (non-empty string), `issuedAtMs` (finite), `type="commit_move_v1"`, `by` 0\|1, `forTurn` 0-8 | `move.cell` 0-8, `move.cardIndex` 0-4, `warningMarkCell` 0-8 or null |
| `isValidBoardCellLite` | `owner` 0\|1, `card.tokenId` exists, `card.edges` (4 numbers), `card.jankenHand` 0-2 | |

**Publish functions do NOT validate** (trusted source boundary).

### localStorage Fallback

When `BroadcastChannel` is unavailable:
1. `publish*` writes state to localStorage AND sets a `:tick` key with `Date.now()` to trigger `StorageEvent`.
2. `subscribe*` listens on `window.addEventListener("storage", ...)` for the primary key.
3. `readStored*` reads directly from localStorage on demand (e.g., overlay recovery after refresh).

### Serialization

`BigInt` values (e.g., `tokenId`) are serialized as decimal strings via custom `safeStringify()`.
Consumers must accept `string | number` for `tokenId` after JSON roundtrip.

---

## 2. Nyano Warudo HTTP Bridge

External HTTP integration for forwarding game state to [nyano-warudo](https://github.com/vanilla3/nyano-warudo) (VTuber companion).

### Endpoint

```
POST {baseUrl}/v1/snapshots
Content-Type: application/json
```

### Request

```typescript
{
  source: "triad_league";
  kind: "ai_prompt" | "state_json";
  content: string;  // stringified prompt text or JSON state
}
```

### Response

```typescript
{
  ok: boolean;
  status: number;
  text: string;
}
```

### Retry Policy

- **Max retries**: 2 (total 3 attempts)
- **Backoff**: Exponential, 500ms base (500ms, 1000ms)
- **Retry scope**: Network errors and 5xx responses only
- **No retry**: 4xx responses (returned immediately)
- **Cancellation**: Supports `AbortSignal`

### Configuration

Base URL is set per-session in the Stream page's Warudo Bridge panel.
Stored in component state (not persisted across page loads by default).

### UI Controls (`WarudoBridgePanel`)

- Base URL input field
- Auto-send toggles: on vote start, on vote end, during vote
- Manual send / download buttons
- Last payload display for debugging

---

## 3. Twitch Bridge (Planned)

> Status: Design phase. Not yet implemented.

### Design Principles

1. **Same bus contract**: Twitch Bridge will publish `StreamCommandV1` messages to the same `stream_cmd.v1` channel. Match page code does not change.
2. **Server-side secrets**: Twitch OAuth tokens and EventSub secrets stay server-side. The bridge process translates Twitch chat messages into `StreamCommandV1` and publishes via the browser bus (e.g., via WebSocket relay to a tab).
3. **Source tagging**: `StreamCommandV1.source` field identifies origin (e.g., `"twitch_chat"`, `"stream_studio"`).
4. **Opt-in only**: Match page must have `stream=1` URL parameter to accept stream commands.

### Planned Flow

```
Twitch Chat -> EventSub/IRC -> Bridge Server -> WebSocket -> Browser Tab -> BroadcastChannel -> Match Tab
```

### Command Translation

Chat messages matching viewer command format (e.g., `!play A3 card2`) are parsed by the bridge server and emitted as:

```typescript
{
  version: 1,
  id: "twitch_<random>",
  issuedAtMs: Date.now(),
  type: "commit_move_v1",
  by: 0 | 1,          // controlled side
  forTurn: <current>,
  move: { cell, cardIndex, warningMarkCell? },
  source: "twitch_chat"
}
```

The vote aggregation logic (currently in `/stream` page) will be adapted to work with real Twitch chat input.

---

## Architecture Diagram

```
                    ┌─────────────┐
                    │  Twitch     │
                    │  EventSub   │  (planned)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Bridge     │
                    │  Server     │  (planned)
                    └──────┬──────┘
                           │ WebSocket
           ┌───────────────▼───────────────┐
           │       BroadcastChannel Bus     │
           │  (localStorage fallback)       │
           │                                │
    ┌──────┼──────┬──────────┬─────────┐   │
    │      │      │          │         │   │
┌───▼──┐ ┌─▼───┐ ┌▼────┐ ┌──▼──┐ ┌───▼──┐│
│Match │ │Over-│ │Str- │ │Re-  │ │Warudo││
│ Page │ │ lay │ │eam  │ │play │ │Bridge││
│      │ │     │ │Page │ │Page │ │Panel ││
└──────┘ └─────┘ └─────┘ └─────┘ └──┬───┘│
                                     │    │
                              POST   │    │
                           ┌─────────▼──┐ │
                           │nyano-warudo│ │
                           │  /v1/snap- │ │
                           │  shots     │ │
                           └────────────┘ │
           └───────────────────────────────┘
```
