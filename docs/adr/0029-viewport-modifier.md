# 0029. Viewport Modifier for Display Sizes

- Status: accepted
- Date: 2026-10-01

## What we learned

ADR 0028 left display and heading sizes fixed: on small screens, consumers were to use the next smaller style by hand. A 104px hero on a 375px phone fits three or four letters a line, so every page needed that manual step, and nothing in the tokens said where "small" starts.

Two ways were weighed:

- **Fluid `clamp()` sizes**: continuous, but they need a custom output plugin, Figma can only show fixed values, and between the two ends the line heights leave the 4px grid and the ×1.5 display ratio no longer holds, so `npm run check` couldn't verify them.
- **A resolver modifier, like density** (ADR 0025): fixed values per context, checked by the same `pts/*` rules on every permutation, and a Figma collection with one mode per context.

The modifier is simpler and keeps every rule checkable.

The ×1.5 display ratio (ADR 0028) limits what a small-screen scale can be: four display steps that stay ×1.5 apart from 24px reach 84px, too large for a phone. So the narrow scale doesn't shrink every step; the two largest step down one place each.

## Why it matters

- **A `viewport` modifier with contexts `narrow` and `wide`, default `narrow`.** Width names, not device names: a tablet is `wide`, a narrow desktop window is `narrow`. `sm`/`md`/`lg` were avoided since they are the breakpoint steps.
- **Mobile first.** `narrow` is the default, so `:root` holds the narrow values and `@media (min-width: 768px)` switches to `wide`. The query uses `breakpoint/md`, which is already a min-width (ADR 0024); `terrazzo.config.ts` reads it from the token, since custom properties can't be used in media queries.
- **Scope: the display zone only**: `font-size/display/*`, `line-height/display/*`, and `letter-spacing/display/*` move out of `semantic/typography.tokens.json` into `semantic/typography.{narrow,wide}.tokens.json`. Text sizes (12–20px), the other typography groups, and the `text/*` composites stay in the base file. The composites alias the display tokens, so `text/display-lg` and the others follow the viewport without changes. All four display steps move, even the two whose values don't change, so the rule is one sentence: the viewport sets the display zone.
- **Narrow values reuse the steps below**, so no new primitive, ratio, or tracking value is needed:

  | Step | Style | Narrow | Wide |
  |---|---|---|---|
  | `display/xl` | `text/display-lg` | 64/64px, −1.25px | 104/104px, −2.5px |
  | `display/lg` | `text/display-md` | 40/44px, −0.5px | 64/64px, −1.25px |
  | `display/md` | `text/heading-lg` | 40/44px, −0.5px | 40/44px, −0.5px |
  | `display/sm` | `text/heading-md` | 24/28px, −0.25px | 24/28px, −0.25px |

  The distinct narrow sizes (24, 40, 64) keep the ×1.6 rhythm. `display/lg` equals `display/md` on narrow screens; ADR 0028 allows levels of the same size, and the two styles (a page-level headline and a page title) both open a page, so they aren't stacked together.
- **Descriptions are the same in both files** (`pts/theme-parity`), so the display steps that change name both values ("64px on narrow screens, 104px on wide").
- **CSS**: one more block, `@media (min-width: 768px) { :root { … } }`, with the display tokens only. No `data-viewport` attribute: the viewport is the window, not something a subtree picks.
- **Checks**: `pts/min-font-size`, `pts/type-scale`, and `pts/line-height-grid` read the default permutation only, which would leave the wide values unchecked once `narrow` is the default. They now run on every permutation, like the other `pts/*` rules. `pts/type-scale` allows a step equal to its neighbour when another permutation sets them apart (a collapsed step), and still reports steps that are equal everywhere.
- **Docs**: the display groups show `narrow` and `wide` side by side. Previews use the resolved value, not the variable, since a cell can't change the media query. The text style specimens follow the window.
- **Figma**: a `Viewport` collection (modes `narrow`, `wide`) holding the display variables, the same principle as `Density`. The text styles keep their bindings; a frame pins its `Viewport` mode.

### Breaking

The output gains a media-query block and the default display sizes at `:root` shrink, a selector and value change, so the release that ships it is `0.9.0` (ADR 0014). Token names don't change.

## Implementation notes

- `pts/type-scale`, `pts/min-font-size`, and `pts/line-height-grid` iterate `themes()` and report a problem once, with the first permutation that shows it. Each was broken on purpose and reported it: `display/lg` set to 40px in `wide` too (equal in every permutation), a wide `display/xl` line height of 1.1 (114.4px), a narrow `display/xl` of 48px (×1.2), and a narrow `display/sm` of 8px. A different description in the wide file is reported by `pts/theme-parity`.
- `packages/web/terrazzo.config.ts` lists the viewport tokens by id from the wide file, like density, and builds the query from `breakpoint/md`.
- Checked in headless Chrome on the Storybook Typography page: `text/display-lg` renders at 104px in a 1280px window and 64px in a 420px one; `display-md` and `heading-lg` are both 40px at 420px.
- `letter-spacing/display/md`'s description now says about −0.0125em (−0.5px on 40px), the same figure the narrow `display/lg` uses; it said −0.015em.
- Docs: `tokens.ts` builds every theme × density × viewport permutation and loads the viewport files last, so the display steps follow the text steps in every table (`letter-spacing` now lists `normal` and `wide` first). `TokenTable` adds narrow and wide columns; previews receive the column's viewport, and the font-size preview takes its line height resolved from the same column.

## Documented in

- `CLAUDE.md` — Structure, Commands, Token Rules (Viewport, Semantic), Figma, Token Docs
- `README.md` — Usage
- `CONTRIBUTING.md` — files per modifier
- ADR 0028 — amended: responsive sizes
