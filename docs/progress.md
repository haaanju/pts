# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.8.0`: density (ADR 0025): a `density` resolver modifier, `relaxed` (default) and `compact`, for `padding/*`, `gap/within|between/*`, and `size/control/*`, with `[data-density]` blocks, and `[data-theme="light"]` repeating only the theme groups; gaps within and between groups (ADR 0027): `gap/within/xs–lg` and `gap/between/sm–lg` replace `gap/xs–xl`; the type scale logic (ADR 0028): `font-size/text/xs–lg` (12–20) and `font-size/display/sm–xl` (24, 40, 64, 104), line heights paired per size on the 4px grid, letter spacing per display step, every heading bold, `ratio/*` removed. Since `v0.7.0`, spacing is one `space` scale (0–64px) with `padding/*` and `gap/*` role tokens on top (ADR 0026). The color names are those of `v0.4.0` (ADR 0019: layers and strength steps).
- `main` is stable. CI and the pre-commit hook run check and typecheck. `npm run check` is `tz check` in `tokens/`: Terrazzo's built-in rules plus the `pts/*` plugin rules, which check every theme × density × viewport permutation (ADR 0021, 0025, 0029).
- Contribution flow (ADR 0020, proposed): token JSON is edited by hand, color included (the color generator is gone); `npm run check` enforces the rules it guaranteed; a pull request template and `CONTRIBUTING.md` guide designers. Steps 5–6 (Storybook on GitHub Pages, branch protection on `main`) wait until the repository goes public, since a private repo needs a paid plan for both; the ADR becomes `accepted` then.
- Figma `pts` file: the `Semantic` and `Theme` collections match the tokens (values, scopes, descriptions; every semantic variable is described), and `Theme` holds the theme-dependent values plus `always/*`, so all semantic colors are in one collection. `Semantic` variables sit in the seven docs-page folders (`Spacing/space/400`); every variable's code syntax is its CSS variable (fixed on 2026-09-28: 118 were stale `--palette-*` or pre-ADR 0017 names, 18 were missing). The Storybook pages follow the specimens (same sections, paths, and leads, slash notation); text and effect styles start their descriptions with the token's usage; text styles bind family, size, weight, and letter spacing, and set line height in px (the token is a ratio, and Figma binds line-height variables as px); page titles use `text/heading-lg`, as in the docs; shadow offsets, blurs, and spreads are in `Semantic`; the `Density` collection (modes `relaxed`, `compact`) holds `Spacing/padding/*`, `Spacing/gap/within|between/*`, and `Size/size/control/*`, and the Spacing and Size pages have a relaxed and a compact frame side by side, each pinning its Density mode. Every specimen page uses one table style (header with token count, section title with its path, column headers, short token names; Color adds a contrast column), and every frame pins its Theme mode. Specimens are drawn by hand, so the contrast badges and hex values are static text: redraw them when values change.
- The Figma MCP must be authenticated with the personal account that owns the `pts` file; a work account only has view access. To switch, clear the figma server's authentication in `/mcp` and reconnect.

## In flight

- `feature/viewport-type` (ADR 0029, accepted): a `viewport` modifier, `narrow` (default, mobile first) and `wide` from `breakpoint/md` (768px), for `font-size|line-height|letter-spacing/display/*`; on narrow screens `display/xl` and `display/lg` step down to 64 and 40px. Tokens, lint, CSS (`@media (min-width: 768px)` block), and docs are done; not merged. Left before the `0.9.0` release:
  - Figma: a `Viewport` collection (modes `narrow`, `wide`) for `Typography/font-size|line-height|letter-spacing/display/*`, and narrow and wide frames on the Typography page; update the Typography leads to match the docs. Catch: text styles set line height in px, not bound, so a frame in `narrow` would show 64px text on a 104px line. Decide first: bind line heights to px variables in `Viewport`, or keep separate narrow text styles.
  - The docs pages themselves don't fit a phone width (the specimen grid overflows); separate from the tokens.

## Next

Order not decided yet:

- JS/TS and SCSS outputs in `@pts/web`: official Terrazzo plugins (`@terrazzo/plugin-js`, `@terrazzo/plugin-sass`) in `packages/web/terrazzo.config.ts`, plus subpath exports next to `./tokens.css`. Both themes must survive: check how each plugin handles the resolver's `theme` modifier before choosing its options (Terrazzo lint only saw the default theme, ADR 0021; builds use `permutations`). Then decide with the user, one question at a time: the JS shape (one object per theme, or values keyed by theme), typed exports (`.d.ts`), SCSS as variables or maps, and the subpath names (`@pts/web/tokens.js`, `tokens.scss`).
- First component (Button): validates `inverse` and its `strong`/`stronger` steps, an intent's `surface/base`/`strong`/`stronger` (danger for destructive buttons), the focus ring, `disabled/*`, and control height, and starts the component tier (ADR 0018). Decide first, one question at a time: CSS classes or React, where the code lives (ADR 0016 roles), component tokens or semantic tokens directly, a Figma component too, and which variants and sizes.
- Dark-mode letter spacing: light text on a dark page reads tighter, so fine-tune letter spacing in dark. That makes `letter-spacing` (and the `text/*` composites that use it) theme-dependent: it would move into the theme files, the dark CSS blocks, and the Figma `Theme` collection. Since ADR 0028, text sizes share `letter-spacing/normal` (0), so dark may need per-size text values too. Needs an ADR.

Still deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android; through a custom Terrazzo plugin, ADR 0022).

## Open questions

- Whether `padding/*` gets a similar split; for now only `gap/*` changed (ADR 0027).
- The order of the items under Next. Suggested: the JS/TS and SCSS outputs (they must carry three modifiers now), then Button. Dark-mode letter spacing is low value for its cost (it makes typography theme-dependent); keep it until dark text visibly needs it.
