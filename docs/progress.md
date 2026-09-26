# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.1.1`.
- `main` is stable. CI and the pre-commit hook run check, lint, and typecheck.

## In flight

- `feature/restructure-packages`: source moved to `tokens/`, docs to `apps/storybook`, `@pts/css` + `@pts/fonts` merged into `@pts/web` (ADR 0016). Built CSS is byte-identical. After merge: release `v0.2.0` (breaking: package names and import paths).

## Next

- JS/TS and SCSS outputs in `@pts/web`: add Terrazzo plugins to `packages/web/terrazzo.config.ts` and subpath exports.
- Deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android).

## Open questions

- None.
