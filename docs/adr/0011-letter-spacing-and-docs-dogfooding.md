# 0011. Letter Spacing Tokens and Docs Dogfooding

- Status: proposed
- Date: 2026-09-26

## What we learned

An audit of the Storybook styles found values that weren't tokens. Most were oversights (2px paddings, inline paddings, a checkerboard hex) with existing tokens available. One was a real gap: large headings used negative tracking (`-0.02em`) and uppercase labels positive tracking (`0.08em`), but the token set only had `letter-spacing/normal`. Tight tracking on large display and heading text is a product need, not a docs quirk.

The rest were docs layout values (content width, sample sizes) that have no place in the product token set.

## Why it matters

- **Letter spacing becomes part of the type system.** Display and large heading styles now carry negative tracking in their `text/*` composites, so products get it without extra CSS.
- **px, not em.** DTCG dimensions allow only px and rem. Em would scale with font size, but isn't valid. Tracking values are chosen per size band instead: -1px for 40–48px display, -0.5px for 24–32px headings.
- **Docs dogfood the tokens, with a clear boundary.** Everything visual in the docs comes from tokens. Layout and sample geometry live in `--docs-*` variables, so it's obvious they are not product tokens and no token is added only for documentation.

## Implementation notes

- Primitives: `tracking/neg-100` (-1px), `neg-50` (-0.5px), `0`, `100` (1px), in `primitive/typography.tokens.json`.
- Semantics: `letter-spacing/tighter, tight, normal, wide`.
- Text styles: display-lg/md → tighter; heading-lg/md → tight; others → normal.
- `docs.css`: `--docs-*` block for layout/sample values; tracking, small spacing, hairlines, and the checkerboard now use tokens. Card preview illustrations keep raw geometry, marked with a comment.
- The Storybook manager theme keeps hex copies (documented in `CLAUDE.md`).

## Documented in

- `CLAUDE.md` — Primitives, Semantic, Token Docs
- `packages/tokens/src/primitive/typography.tokens.json`, `semantic/typography.tokens.json`
- `packages/storybook/src/docs.css`
