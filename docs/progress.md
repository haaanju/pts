# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.3.0`: semantic colors renamed by property and intent (ADR 0017), interaction states only on pressable fills (ADR 0018). The Figma `Theme` collection uses the same names and scopes; primitives are hidden from pickers.
- `main` is stable. CI and the pre-commit hook run check, lint, and typecheck.

## In flight

- None.

## Next

- JS/TS and SCSS outputs in `@pts/web`: add Terrazzo plugins to `packages/web/terrazzo.config.ts` and subpath exports.
- Deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android).

## Open questions

- None.
