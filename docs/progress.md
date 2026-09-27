# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.4.0`: semantic colors as layers and strength steps (ADR 0019): `background` / `surface` / `inverse`, one `content` group with `content/inverse`, `subtle` < `base` < `strong` < `stronger` (hover and pressed are `strong` / `stronger`), a `disabled/` group, and `intent/<role>/{surface, content, border}`. Every semantic color has a `$description`.
- `main` is stable. CI and the pre-commit hook run check, lint, and typecheck.
- Figma `pts` file: the `Theme` collection matches the tokens (names, values, scopes, descriptions) and holds only theme-dependent values; shadow offsets, blurs, and spreads are in `Semantic`. Every specimen page uses one table style (header with token count, section title with its path, column headers, short token names; Color adds a contrast column), and every frame pins its Theme mode. Specimens are drawn by hand, so the contrast badges and hex values are static text: redraw them when values change.
- The Figma MCP must be authenticated with the personal account that owns the `pts` file; a work account only has view access. To switch, clear the figma server's authentication in `/mcp` and reconnect.

## In flight

- `feature/operating-flow`: ADR 0020 (proposed), the public contribution flow: hand-edited token JSON (the color generator is retired), CI as the merge gate, Storybook deployed from `main`. Implementation steps are listed in the ADR; none started.

## Next

Candidates, in the recommended order (not decided yet):

1. First component (Button): validates `inverse` and its `strong`/`stronger` steps, an intent's `surface/base`/`strong`/`stronger` (danger for destructive buttons), the focus ring, `disabled/*`, and control height, and starts the component tier (ADR 0018).
2. JS/TS and SCSS outputs in `@pts/web`: Terrazzo plugins in `packages/web/terrazzo.config.ts` plus subpath exports. Smallest, but nothing consumes them yet.

Still deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android).

## Open questions

- Which of the candidates above comes first.
