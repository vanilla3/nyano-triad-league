# Event Config Schema (NyanoAiEventV1)

Events are defined in `events.json` and validated by `isValidEventV1()` at runtime.

## Required Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique event identifier (non-empty) |
| `title` | `string` | Display title |
| `description` | `string` | Event description |
| `kind` | `"nyano_ai_challenge"` | Event type (only one kind currently) |
| `rulesetKey` | `RulesetKey` | Must be a valid registered ruleset (`"v1"`, `"v2"`, etc.) |
| `seasonId` | `integer` | Season number |
| `firstPlayer` | `0 \| 1` | Which player goes first (0=A, 1=B) |
| `aiDifficulty` | `"easy" \| "normal"` | AI difficulty level |
| `nyanoDeckTokenIds` | `string[5]` | Array of exactly 5 decimal token ID strings |

## Optional Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `startAt` | `string (ISO8601)` | always active | Event start time |
| `endAt` | `string (ISO8601)` | no end | Event end time |
| `tags` | `string[]` | `[]` | Categorization tags |
| `voteTimeSeconds` | `integer (>0)` | system default | Vote window duration in seconds |
| `maxAttempts` | `integer (>0)` | unlimited | Max attempts per player |
| `deckRestriction` | `string (non-empty)` | none | Deck restriction rule name (see valid values below) |

## Deck Restriction Values

| Value | Behavior |
|---|---|
| `"none"` (or omitted) | No deck restriction — any cards allowed |
| `"mint_only"` | Only cards from the initial mint set (token IDs 1-100) are allowed |

Unknown restriction strings are treated as `"none"` with a console warning (forward-compatible).

## Example

```json
{
  "id": "nyano-open-challenge",
  "title": "Nyano Open Challenge",
  "description": "Open challenge event",
  "kind": "nyano_ai_challenge",
  "rulesetKey": "v1",
  "seasonId": 1,
  "firstPlayer": 0,
  "aiDifficulty": "normal",
  "nyanoDeckTokenIds": ["1", "2", "3", "4", "5"],
  "voteTimeSeconds": 30,
  "maxAttempts": 5
}
```
