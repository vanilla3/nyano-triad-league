# Viewer Command Format Sample

## Canonical
`#triad A2->B2 wm=C1`

- `A2` = hand slot 2 (1..5)
- `B2` = board cell coordinate (A1..C3)
- `wm=C1` = optional warning mark coordinate

## Examples
- `#triad A1->B2`
- `#triad 3->C3`
- `#triad B2 2`
- `#triad 3 B2` (swap order)
- `#triad A2→B2` (unicode arrow)
- `#triad A5->A1 wm=B3`

## Regex (nyano-warudo side) example
```regex
/#triad\s+(?:A?([1-5])|([0-4]))\s*->\s*([A-C][1-3])(?:\s+wm=([A-C][1-3]))?/i
```

Triad League 側は上記の形式を parse できます。

補足: Triad League 側は unicode 矢印（→/⇒ 等）を `->` に正規化して parse します。
