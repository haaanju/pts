# 0010. Raised Surface Background

- Status: proposed
- Date: 2026-09-25

## What we learned

The Storybook overlay demo showed a modal with `background/default` in dark: the same `#181818` as the page, sitting on a 70% black scrim. It was barely distinguishable. In light, a white modal on a white page is fine because the shadow separates them, but dark shadows are nearly invisible against a dark page. Elevation in dark needs to come from surface lightness, not only shadow.

## Why it matters

- **`background/raised`** gives cards, popovers, and modals their own surface token, so components don't have to choose between `default` and `subtle` for elevated content.
- **Light and dark use different strategies**: light keeps the surface white and relies on `shadow/*`; dark lifts the surface one step (`neutral.900`) and keeps the shadow as a secondary cue. This matches common dark-mode elevation practice.
- **Text on raised surfaces is contrast-checked.** `raised` is added to the page backgrounds in `npm run check`, so every plain foreground and border must pass on it too.

## Implementation notes

- Light: `background/raised` → `palette.white`. Dark: `background/raised` → `palette.neutral.900` (#242424).
- `npm run check` now covers 368 pairs (was 304); all pass without changing any other token.
- Storybook shadow cards, the modal demo, and the z-index layers use `background/raised`.

## Documented in

- `CLAUDE.md` — Color (page backgrounds, raised surfaces)
- `packages/tokens/src/semantic/color.{light,dark}.tokens.json`
- `packages/tokens/scripts/check.ts`
