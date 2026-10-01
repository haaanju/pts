# 0002. Layout and Border Tokens

- Status: accepted (amended by 0026)
- Date: 2026-09-25

## What we learned

Limiting `space` to 0–32px (ADR 0001) left the larger primitives (40, 48, 64) and `dimension/max` without a semantic consumer. Continuing the `px = N ÷ 25` formula for them would bring back large names like `space/1600`, which was the reason for the cut.

## Why it matters

- **`space` is the only px-derived scale.** It is the most frequently used and benefits from the name encoding the value.
- **`layout` uses ordinal step numbers** (100, 200, 300…) that carry order but not px. Names stay short, and a value can still be inserted between steps (`layout/150`).
- **`radius` uses t-shirt sizes** (`none, xs, sm, md, lg, xl`). The scale is short and rarely needs in-between steps, so readable names win over insertability. `radius/full` stays as a named special case.
- **`stroke` uses weight names** (`thin, thick, thicker`), which describe line weight more naturally than sizes. There is no zero-width stroke token: "no border" is expressed by removing the border, not by a 0 value.
- **Semantic files are split by category** (`semantic/spacing.tokens.json`, `semantic/border.tokens.json`) so each file stays small as categories grow.

## Implementation notes

- `layout/100, 200, 300` → 40, 48, 64px — gaps larger than component-level spacing.
- `radius/none, xs, sm, md, lg, xl` → 0, 2, 4, 8, 12, 16px; `radius/full` → `dimension/max` (9999px) for pills and circles.
- `stroke/thin, thick, thicker` → 1, 2, 4px. `dimension/1` was added to primitives for this.
- `layout` lives with `space` in `spacing.tokens.json`; `radius` and `stroke` live in `border.tokens.json`.

## Documented in

- `CLAUDE.md` — Token rules section
- `packages/tokens/src/semantic/`
