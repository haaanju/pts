---
paths:
  - "apps/storybook/**"
---

# Token docs (Storybook)

## Files

- `src/tokens.ts`: the data layer. Formats every token of every theme × density × viewport permutation from `virtual:pts-tokens`, which `scripts/docs-tokens.ts` builds with Terrazzo (a Terrazzo plugin, run in memory by a Vite plugin in `vite.config.ts`; ADR 0038). Nothing in the docs resolves an alias.
- `src/components.tsx`: the doc blocks (`PageHeader`, `Section`, `TokenTable`, `ColorTable`, `Palette`, …). `src/docs.css`: their styles.
- `src/Introduction.mdx` (Overview), `src/component/*.mdx` (Button), `src/semantic/*.mdx` (Color, Typography, Spacing, Border, Elevation, Size, Motion, Layout), `src/primitive/*.mdx` (Palette, Scales).
- `.storybook/`: `main.ts`, `preview` (imports `tokens.css`, syncs `data-theme` and `data-density`), `manager.tsx` (the toggles), `theme.ts` (the light and dark UI themes, from `token-copies.ts`), `density.ts`.

## Content

- Docs are generated from the token JSON. New tokens in an existing group appear without code changes.
- A token's `$description` shows between its name and its CSS variable (`TokenTable`, text style specimens, shadow cards), in `text/body-sm` sans against the mono name and variable. Edit the description in the JSON, not in the docs.
- The sidebar mirrors the tiers: Overview → Component → Semantic → Primitive. Each page shows only its tier's tokens; primitive pages are reference for defining tokens and say so, since product code uses semantic tokens. A component page (`src/component/<Name>.mdx`) has one section per variant (`ColorTable`), per size (`TokenTable`), and for shared parts; a component color's contrast badge uses the pairs of the semantic token it aliases (`pairsOf` in `tokens.ts`).
- Sample text is English only.

## Pages

- Layout: `<PageHeader eyebrow title groups>` (stacked, left-aligned: eyebrow · token count, title, lead), then `<Section title path lead>…</Section>` blocks (heading, the token path it covers such as `space/*`, lead, full-width content). Sections are separated by space, not lines; only the Introduction uses `<Section divider>`. Table rows keep hairlines for scanning. No cards or boxes; `ThemeCell` is the only filled surface because its background is the information.
- A new top-level **group**: wrap its block in a section on the matching `.mdx` page (`<Section title="New group" path="new-group/*"><TokenTable prefix="new-group" /></Section>`) and add the prefix to the page's `groups`.
- **Aligned with the Figma specimens** (the `figma` skill has the Figma side): the same pages in the same order, the same token sections with the same titles, paths, and leads. Each side may add explanatory sections of its own. A lead differs only by a platform-specific sentence (CSS usage here). Token paths read with slashes (`surface/subtle`, `→ color/neutral/50`); only CSS variables use dashes, and the code props (`prefix`) keep the JSON's dots. When a section or lead changes here, change Figma too.

## Modes

- Groups that differ by theme show light and dark side by side: `ThemeCell` sets `data-theme`, so CSS variables inside it resolve to that theme. Density works the same way through `DensityCell` (`data-density`).
- Groups that differ by viewport show narrow and wide side by side. A cell can't switch a media query, so their previews use resolved values; the text style specimens follow the window.
- Contrast badges use the same pairing rules as `npm run check` (both import `tokens/lint/pairs.ts`); each badge shows the lowest ratio among a token's pairs.
- The sun/moon button at the top right toggles a `theme` global; the preview sets `data-theme` on `<html>` from it, so the whole page switches through token variables, and the manager switches between the two UI themes. Saved in localStorage; `?globals=theme:dark` also works. The density button next to it does the same for `data-density` (`.storybook/density.ts`, `?globals=density:compact`).

## Accessibility

- `npm run test-a11y` (`scripts/a11y.ts`) checks every docs page and story with axe-core (WCAG 2.2 A and AA) in light and dark; CI runs it (ADR 0036). `addon-a11y` shows the same checks in a story's Accessibility panel while developing (`parameters.a11y` in `preview.ts`).
- A sample of a color exempt from contrast (`isExempt`, from `tokens/lint/pairs.ts`) carries `data-a11y-exempt`, and both checks skip it: the docs show disabled colors at their real contrast. Nothing else is exempt; fix a violation instead of excluding it.
- Storybook's own blocks (Source, Controls) are styled for its static light theme: `docs.css` restyles them with tokens so they follow the toggle. A new Storybook block on a page needs the same, and the check shows where.

## Styling

- Docs styling dogfoods the tokens: color, type, spacing, radius, stroke, shadow, and motion come from `@pts/web` variables. Values that only describe the docs layout or sample geometry are `--docs-*` variables at the top of `docs.css`; never add product tokens just for the docs. Card preview illustrations may use raw geometry.
- The docs fit phones down to 360px without page-level horizontal scroll. Container queries on the content width (`docs.css`) switch layouts: below 640px the gutter shrinks, side-by-side blocks stack, and every table row becomes a block (the first cell across, the other cells labeled by their header); tables with a preview per mode stack below the full 1080px, and palette ramps stand upright below about 880px. A new table sets its stacked columns (`cols()` in `components.tsx`) and gives each cell after the first a `data-label`.

## Manager

- The Storybook UI themes (`.storybook/theme.ts`) use copies of token values, since the manager can't read CSS variables. The copies live in `.storybook/token-copies.ts`, keyed by token id; `npm test` checks them against the tokens (`scripts/token-copies.test.ts`, ADR 0044). A UI color needs its token in that map, not a literal in `theme.ts`.
- Manager files (`.storybook/manager.tsx`, `theme.ts`, `token-copies.ts`, `density.ts`, `main.ts`) are only compiled at startup: restart `npm run storybook` after editing them. The manager uses the classic JSX runtime, so `manager.tsx` imports React.
