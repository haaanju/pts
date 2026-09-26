# 0007. Primitive Files by Category

- Status: accepted
- Date: 2026-09-25

## What we learned

Semantic tokens were split into `semantic/<category>.tokens.json` (ADR 0002), but primitives stayed in a single `primitive.tokens.json` at the source root. After adding typography and a 10-step palette, that one file held five unrelated groups and most of its length was palette.

## Why it matters

- **Both tiers share one layout**: `primitive/<category>.tokens.json` and `semantic/<category>.tokens.json`. Where a file lives tells you its tier.
- **Smaller files, clearer diffs**: palette changes no longer touch the file that holds dimensions and font stacks.

## Implementation notes

- `primitive/dimension.tokens.json` — `dimension`
- `primitive/typography.tokens.json` — `typeface`, `weight`, `ratio`
- `primitive/palette.tokens.json` — `palette`
- `pts.resolver.json` lists the three files in the `base` set. Token IDs are unchanged, so aliases and the CSS output are identical before and after the move.

## Documented in

- `CLAUDE.md` — Structure, Token Rules (Files)
- `packages/tokens/src/pts.resolver.json`
