# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.4.1`: every semantic token has a `$description`, `text/caption` is 12px (the text minimum), and `npm run check` is Terrazzo lint with the `pts/*` rules for every theme (ADR 0021). The token names are those of `v0.4.0` (ADR 0019: layers and strength steps).
- `main` is stable. CI and the pre-commit hook run check and typecheck. `npm run check` is `tz check` in `tokens/`: Terrazzo's built-in rules plus the `pts/*` plugin rules, which check every theme (ADR 0021).
- Contribution flow (ADR 0020, proposed): token JSON is edited by hand, color included (the color generator is gone); `npm run check` enforces the rules it guaranteed; a pull request template and `CONTRIBUTING.md` guide designers. Steps 5–6 (Storybook on GitHub Pages, branch protection on `main`) wait until the repository goes public, since a private repo needs a paid plan for both; the ADR becomes `accepted` then.
- Figma `pts` file: the `Semantic` and `Theme` collections match the tokens (names, values, scopes, descriptions; every semantic variable is described), and `Theme` holds only theme-dependent values; text and effect styles start their descriptions with the token's usage, and `text/caption` is bound to `font-size/200` (12px); shadow offsets, blurs, and spreads are in `Semantic`. Every specimen page uses one table style (header with token count, section title with its path, column headers, short token names; Color adds a contrast column), and every frame pins its Theme mode. Specimens are drawn by hand, so the contrast badges and hex values are static text: redraw them when values change.
- The Figma MCP must be authenticated with the personal account that owns the `pts` file; a work account only has view access. To switch, clear the figma server's authentication in `/mcp` and reconnect.

## In flight

- `feature/remove-font-size-100` (ADR 0023): `font-size/100` (10px) removed and `pts/min-font-size` keeps the scale at 12px or larger. Breaking, so the next release is `0.5.0`. Figma still has the `font-size/100` variable and its Typography specimen row: delete both.

## Next

In this order (decided):

1. JS/TS and SCSS outputs in `@pts/web`: official Terrazzo plugins (`@terrazzo/plugin-js`, `@terrazzo/plugin-sass`) in `packages/web/terrazzo.config.ts`, plus subpath exports next to `./tokens.css`. Both themes must survive: check how each plugin handles the resolver's `theme` modifier before choosing its options.
2. First component (Button): validates `inverse` and its `strong`/`stronger` steps, an intent's `surface/base`/`strong`/`stronger` (danger for destructive buttons), the focus ring, `disabled/*`, and control height, and starts the component tier (ADR 0018). Decide first, one question at a time: CSS classes or React, where the code lives (ADR 0016 roles), component tokens or semantic tokens directly, a Figma component too, and which variants and sizes.

Still deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android; through a custom Terrazzo plugin, ADR 0022).

## Open questions

- None.
