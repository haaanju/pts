# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.7.0`: spacing is one `space` scale (0–64px, `space/700` = 28px new) with role tokens on top, `padding/*`, `gap/*`, and `gap/section/*`; `layout/*` is removed (ADR 0026). Since `v0.6.0`, breakpoints hold their px values and the dimension scale is 0–64 plus `max` (ADR 0024). Since `v0.5.1`: size/icon 16, 24, 40; size/control 32, 48, 56 (`dimension/56`); motion durations 150, 300, 500ms. Since `v0.5.0`, `font-size/100` (10px) is removed, so the scale starts at 12px, the text minimum, and `pts/min-font-size` checks it (ADR 0023). Every semantic token has a `$description`, shown in the docs. The color names are those of `v0.4.0` (ADR 0019: layers and strength steps).
- Unreleased on `main`: the gap rename (ADR 0027): `gap/within/xs–lg` and `gap/between/sm–lg` replace `gap/xs–xl`; and the type scale logic (ADR 0028): `font-size/text/xs–lg` (12–20) and `font-size/display/sm–xl` (24, 40, 64, 104), line heights paired per size on the 4px grid, letter spacing per display step, every heading bold, `ratio/*` removed, checked by `pts/type-scale` and `pts/line-height-grid`. Both ship with density as `0.8.0`, so consumers see one breaking release.
- `main` is stable. CI and the pre-commit hook run check and typecheck. `npm run check` is `tz check` in `tokens/`: Terrazzo's built-in rules plus the `pts/*` plugin rules, which check every theme (ADR 0021).
- Contribution flow (ADR 0020, proposed): token JSON is edited by hand, color included (the color generator is gone); `npm run check` enforces the rules it guaranteed; a pull request template and `CONTRIBUTING.md` guide designers. Steps 5–6 (Storybook on GitHub Pages, branch protection on `main`) wait until the repository goes public, since a private repo needs a paid plan for both; the ADR becomes `accepted` then.
- Figma `pts` file: the `Semantic` and `Theme` collections match the tokens (values, scopes, descriptions; every semantic variable is described), and `Theme` holds the theme-dependent values plus `always/*`, so all semantic colors are in one collection. `Semantic` variables sit in the seven docs-page folders (`Spacing/space/400`); every variable's code syntax is its CSS variable (fixed on 2026-09-28: 118 were stale `--palette-*` or pre-ADR 0017 names, 18 were missing). The Storybook pages follow the specimens (same sections, paths, and leads, slash notation); text and effect styles start their descriptions with the token's usage, and `text/caption` is bound to `font-size/200` (12px); shadow offsets, blurs, and spreads are in `Semantic`. Every specimen page uses one table style (header with token count, section title with its path, column headers, short token names; Color adds a contrast column), and every frame pins its Theme mode. Specimens are drawn by hand, so the contrast badges and hex values are static text: redraw them when values change.
- The Figma MCP must be authenticated with the personal account that owns the `pts` file; a work account only has view access. To switch, clear the figma server's authentication in `/mcp` and reconnect.

## In flight

- Figma for ADR 0028: the `Typography/` variables (`font-size`, `line-height`, `letter-spacing` renamed and revalued; `ratio/*` gone from `Primitive`; `tracking/neg-25`, `neg-125`, `neg-250` and `dimension/104` new), the text styles (new sizes, px line heights, bold headings), and the Typography and Scales specimens (sections and leads as in the docs). Until then, the Figma notes under Current state describe the old scale.

## Next

First (decided 2026-09-30):

1. Density modes: implement ADR 0025 (proposed, amended by ADR 0026 and 0027). Decided: two modes, `relaxed` (default, today's values) and `compact` (one `space` step tighter); only `padding/*`, `gap/within/*`, `gap/between/*` (not `gap/section/*`), and `size/control/*` change, every `within` gap stays below every `between` gap in both modes, never the `space` scale; a `density` resolver modifier; `[data-theme="light"]` repeats only the theme groups so nested regions don't reset each other; a `Density` Figma collection; release `0.8.0` together with the unreleased gap rename (ADR 0027) and type scale (ADR 0028), with all three in the tag message.

Then, order not decided yet:

- JS/TS and SCSS outputs in `@pts/web`: official Terrazzo plugins (`@terrazzo/plugin-js`, `@terrazzo/plugin-sass`) in `packages/web/terrazzo.config.ts`, plus subpath exports next to `./tokens.css`. Both themes must survive: check how each plugin handles the resolver's `theme` modifier before choosing its options (Terrazzo lint only saw the default theme, ADR 0021; builds use `permutations`). Then decide with the user, one question at a time: the JS shape (one object per theme, or values keyed by theme), typed exports (`.d.ts`), SCSS as variables or maps, and the subpath names (`@pts/web/tokens.js`, `tokens.scss`).
- First component (Button): validates `inverse` and its `strong`/`stronger` steps, an intent's `surface/base`/`strong`/`stronger` (danger for destructive buttons), the focus ring, `disabled/*`, and control height, and starts the component tier (ADR 0018). Decide first, one question at a time: CSS classes or React, where the code lives (ADR 0016 roles), component tokens or semantic tokens directly, a Figma component too, and which variants and sizes.
- Dark-mode letter spacing: light text on a dark page reads tighter, so fine-tune letter spacing in dark. That makes `letter-spacing` (and the `text/*` composites that use it) theme-dependent: it would move into the theme files, the dark CSS blocks, and the Figma `Theme` collection. Since ADR 0028, text sizes share `letter-spacing/normal` (0), so dark may need per-size text values too. Needs an ADR.
- Responsive type: display and heading sizes are fixed (ADR 0028); for now consumers step down one style on small screens. Options: a viewport modifier like density, or fluid `clamp()` sizes through a custom output plugin.

Still deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android; through a custom Terrazzo plugin, ADR 0022).

## Open questions

- Whether `padding/*` gets a similar split; for now only `gap/*` changed (ADR 0027).
- The order of the three items after density. Suggested: dark-mode letter spacing (another theme-dependent change, best designed alongside density), then the JS/TS and SCSS outputs (once the modifiers are final), then Button.
