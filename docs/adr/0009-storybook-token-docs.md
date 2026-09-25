# 0009. Storybook Token Documentation

- Status: proposed
- Date: 2026-09-25

## What we learned

With ~260 tokens across two themes, the JSON files are no longer a practical way to review the system. Documentation needs to show values, alias chains, previews, and contrast, and it must not drift from the source. Terrazzo can emit token data, but writing the docs data layer against the DTCG files and the resolver keeps the docs independent of any one build output.

## Why it matters

- **Docs are generated from the source.** `src/tokens.ts` loads `pts.resolver.json`, merges the base set with each theme context, and resolves aliases (including inside composites like shadow and typography). New tokens in an existing group appear without code changes.
- **Themes are shown side by side**, not through a toolbar switch. Color and shadow tables render light and dark columns so differences are visible at a glance. `ThemeCell` sets `data-theme` so every CSS variable inside a cell resolves to that theme.
- **The docs chrome is forced to light.** Storybook's docs page is white; without this, an OS in dark mode would flip the token variables and put dark-theme text on a white page.
- **Contrast uses the same pairing rules as `npm run check`**, so the badges in the docs and the pre-commit check agree.
- **React + Vite** gives MDX pages with live components, and leaves room for a component library later.

## Implementation notes

- Package: `@pts/storybook` (Storybook 10.6, React 19, Vite 8). `prestorybook` / `prebuild-storybook` build `@pts/css` first.
- TypeScript is pinned to 5.9: TypeScript 7 (native) does not yet expose the JS API used by Storybook's React docgen.
- Pages: Introduction, Color (Palette, Semantic), Typography, Spacing, Border, Elevation, Size, Motion, Layout.
- IBM Plex fonts are loaded from Google Fonts in `preview-head.html` for the docs only; the token packages still do not ship fonts.
- Design: the docs are styled with PTS tokens themselves (`docs.css`), with a custom manager/docs theme (`.storybook/theme.ts`) in the same monochrome palette and IBM Plex. Blocks are wrapped in `sb-unstyled` to opt out of Storybook's markdown styles.
- Sidebar groups: Overview, Color, Foundations. The onboarding checklist, what's-new notifications, and canvas toolbar are disabled, since this Storybook has docs only.
- Storybook MDX has no GFM tables by default; tables are React components instead.
- All docs content and sample text are English.
- Layout (revised, inspired by an editorial reference that also uses Aspekta): a two-column grid with meta and section headings on the left and content on the right, hairlines instead of cards, content width 1280px, collapsing to one column below 1024px.
- Verified by building the static Storybook and screenshotting every page with headless Chrome.

## Documented in

- `CLAUDE.md` — Structure, Commands, Token Docs (Storybook)
- `packages/storybook/`
