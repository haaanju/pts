# Plan: A Custom MDX Docs Site

- Status: next, once this plan is refined with the owner (owner, 2026-11-06). It becomes a `proposed` ADR when it starts, and this file is deleted once that ADR is accepted.

## Why

To learn how a docs site of its own works, the way larger systems publish theirs, and to make room for what Storybook's docs pages don't take well: long guideline prose, docs per release (the open question in [`automated-delivery.md`](automated-delivery.md), step 6), and free layouts.

## The rule

**MDX never holds a token value.** Prose is written by hand; every value, name, and description comes from a component that reads the resolver (`tokens/source.ts`), such as `<TokenTable group="size" />`. The Storybook docs already work this way (`.claude/rules/storybook.md`, Content); the new site keeps it.

Reference: the Washington Post's docs (https://build.washingtonpost.com/foundations/size/, checked 2026-11-06) are a Next.js site with one MDX file per page, and the Size page's table is `<Table useTokenData data="size" calculateValue />`, with no value in the MDX. Its source repository is no longer public.

## Direction

- **Split with Storybook**: the site holds the guidelines and the token docs; Storybook stays the component playground, linked or embedded. Rebuilding its controls costs more than it gives.
- **Designers editing**: a git-based CMS (Keystatic, Tina, Decap) writes MDX commits, so a web editor doesn't add a second source.
- **Framework**: Astro (Starlight) first, since it is built for content and takes the Lit components (`<pts-button>`) as they are.

## What carries over (checked 2026-11-06)

- **The data**: `apps/storybook/scripts/docs-tokens.ts` is a Vite plugin serving `virtual:pts-tokens`, and Astro builds with Vite, so it should plug in as it is.
- **The blocks**: `TokenTable`, `ColorTable`, `Palette`, and the rest are React components, which Astro renders at build time.
- **To redo**: the blocks that keep state and the theme, density, and shape toggles (now Storybook's toolbar) become client components; `test-a11y` walks Storybook's URLs; Storybook's own blocks (Source, Controls) are replaced or dropped.

## Open

- Where the site lives (`apps/docs`?) and whether it replaces the Storybook docs on GitHub Pages or sits beside them.
- What stays in Storybook: the component stories only, or also the token pages until the site has them all.
- Whether the CMS is part of the first step or a later one.

## Done means

The new site keeps every guarantee the Storybook docs have: data only from the resolver, axe-core on every page in light and dark (ADR 0036), the phone layout down to 360px, and the pages aligned with the Figma specimens.
