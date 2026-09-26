# 0001. Spacing Token Foundation

- Status: accepted (amended by 0002, 0003, 0007)
- Date: 2026-09-25

## What we learned

Starting the design tokens from scratch, the first slice needs to be small enough to focus on structure rather than content. Spacing is a plain numeric scale, which makes it a good vehicle for settling format, layering, naming, and repo layout before tackling harder categories like color (modes) or typography (composite values).

## Why it matters

These choices become the conventions every later category follows:

- **Two tiers (primitive → semantic)**: primitives hold raw values; semantic tokens express intent and only alias primitives. A component tier is deferred until components exist.
- **px units in DTCG object form** (`{ "value": 16, "unit": "px" }`): maps 1:1 to Figma's unitless numbers, keeping any future Figma sync simple. rem conversion, if needed, belongs in a build step.
- **Numeric semantic scale** (`space/N`, px = N ÷ 25): values can be inserted between steps (e.g. `space/150`) without renaming, and the order is obvious.
- **npm workspaces from day one**: package boundaries (`@pts/tokens` as source, future output packages alongside it) are part of what this project is meant to explore.

## Implementation notes

- `packages/tokens/src/primitive.tokens.json`: `dimension/0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`, plus `dimension/max` (9999px)
- `packages/tokens/src/semantic.tokens.json` (later moved to `semantic/spacing.tokens.json`, see ADR 0002): `space/0 … space/800` (0–32px), each aliasing `{dimension.*}`. Spacing is scoped to component-level gaps; larger gaps (40px+) will live in a separate layout tier, so the numeric names stay small
- Every token declares `$type` explicitly; no group-level inheritance.
- Aliases use the full path from the top-level group, regardless of file.
- Deferred: Figma sync mechanism, build tool, platform outputs. (Build tool and CSS output: see ADR 0003.)

## Documented in

- `CLAUDE.md` — Token rules section
- `packages/tokens/src/`
