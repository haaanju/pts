# Plan: A Custom MDX Docs Site

- Status: not scheduled (owner, 2026-11-06). Storybook is enough for a study repository; this records the direction if the docs outgrow it. It becomes an ADR when it starts, and this file is deleted once that ADR is accepted.

## When to start

When Storybook gets in the way: long guideline prose, docs per release (the open question in [`automated-delivery.md`](automated-delivery.md), step 6), or layouts its docs pages can't take. Not before.

## The rule

**MDX never holds a token value.** Prose is written by hand; every value, name, and description comes from a component that reads the resolver (`tokens/source.ts`), such as `<TokenTable group="size" />`. The Storybook docs already work this way (`.claude/rules/storybook.md`, Content); the new site keeps it.

Reference: the Washington Post's docs (https://build.washingtonpost.com/foundations/size/, checked 2026-11-06) are a Next.js site with one MDX file per page, and the Size page's table is `<Table useTokenData data="size" calculateValue />`, with no value in the MDX. Its source repository is no longer public.

## Direction

- **Split with Storybook**: the site holds the guidelines and the token docs; Storybook stays the component playground, linked or embedded. Rebuilding its controls costs more than it gives.
- **Designers editing**: a git-based CMS (Keystatic, Tina, Decap) writes MDX commits, so a web editor doesn't add a second source.
- **Framework**: Astro (Starlight) first, since it is built for content and takes the Lit components (`<pts-button>`) as they are.

## Done means

The new site keeps every guarantee the Storybook docs have: data only from the resolver, axe-core on every page in light and dark (ADR 0036), the phone layout down to 360px, and the pages aligned with the Figma specimens.
