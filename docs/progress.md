# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.3.0`: semantic colors renamed by property and intent (ADR 0017), interaction states only on pressable fills (ADR 0018). The Figma `Theme` collection uses the same names and scopes; primitives are hidden from pickers.
- `main` is stable. CI and the pre-commit hook run check, lint, and typecheck.
- Figma `pts` file: every specimen page uses one table style (header with token count, section title with its path such as `space/*`, column headers, short token names; Color adds a contrast column). Every frame pins its Theme mode. Specimens are drawn by hand, so the contrast badges and hex values are static text: redraw them when values change.

## In flight

- `feature/color-surface-pairs`: ADR 0019 (proposed) renames semantic colors to fill / `on-` pairs (`surface`/`on-surface`, `inverse`/`on-inverse`), moves disabled to a `disabled/` group, and turns hover/pressed into `strong`/`stronger`. Next: try the names in the Figma test collection, then implement in `generate-color.ts` and `pairs.ts`.

## Next

Candidates, in the recommended order (not decided yet):

1. First component (Button): validates `inverse` and its states, `danger` hover/pressed, the focus ring, disabled, and control height, and starts the component tier (ADR 0018).
2. JS/TS and SCSS outputs in `@pts/web`: Terrazzo plugins in `packages/web/terrazzo.config.ts` plus subpath exports. Smallest, but nothing consumes them yet.

Still deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android).

## Open questions

- Which of the candidates above comes first.
