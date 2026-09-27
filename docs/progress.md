# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.4.0`: semantic colors as layers and strength steps (ADR 0019): `background` / `surface` / `inverse`, one `content` group with `content/inverse`, `subtle` < `base` < `strong` < `stronger` (hover and pressed are `strong` / `stronger`), a `disabled/` group, and `intent/<role>/{surface, content, border}`. Every semantic color has a `$description`.
- `main` is stable. CI and the pre-commit hook run check, lint, and typecheck.
- Contribution flow (ADR 0020, proposed): token JSON is edited by hand, color included (the color generator is gone); `check.ts` enforces the rules it guaranteed; a pull request template and `CONTRIBUTING.md` guide designers. Steps 5–6 (Storybook on GitHub Pages, branch protection on `main`) wait until the repository goes public, since a private repo needs a paid plan for both; the ADR becomes `accepted` then.
- Figma `pts` file: the `Theme` collection matches the tokens (names, values, scopes, descriptions) and holds only theme-dependent values; shadow offsets, blurs, and spreads are in `Semantic`. Every specimen page uses one table style (header with token count, section title with its path, column headers, short token names; Color adds a contrast column), and every frame pins its Theme mode. Specimens are drawn by hand, so the contrast badges and hex values are static text: redraw them when values change.
- The Figma MCP must be authenticated with the personal account that owns the `pts` file; a work account only has view access. To switch, clear the figma server's authentication in `/mcp` and reconnect.

## In flight

- `feature/terrazzo-lint`: ADR 0021 (proposed), all validation moves to `tz check` in `tokens/`: Terrazzo's built-in rules first, `pts/*` plugin rules for per-theme and source checks. Order: semantic descriptions and `text/caption` 12px, then the config and plugin, then remove `check.ts`. Figma descriptions and caption size are updated after the branch.


## Next

Candidates after Terrazzo lint, in the recommended order (not decided yet):

1. First component (Button): validates `inverse` and its `strong`/`stronger` steps, an intent's `surface/base`/`strong`/`stronger` (danger for destructive buttons), the focus ring, `disabled/*`, and control height, and starts the component tier (ADR 0018).
2. JS/TS and SCSS outputs in `@pts/web`: Terrazzo plugins in `packages/web/terrazzo.config.ts` plus subpath exports. Smallest, but nothing consumes them yet.

Still deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android; through a custom Terrazzo plugin, ADR 0022).

## Open questions

- Which of the candidates above comes first.
