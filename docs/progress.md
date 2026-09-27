# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.2.0`: source in `tokens/`, web output in `@pts/web`, docs in `apps/storybook` (ADR 0016).
- `main` is stable. CI and the pre-commit hook run check, lint, and typecheck.

## In flight

- `feature/color-naming`: new semantic color names (ADR 0017) and interaction-state scope (ADR 0018), implemented and accepted. Not merged or released yet.
  - Remaining: apply the new names and scopes to the Figma `Theme` collection (the `Theme (naming test)` collection in the `pts` file has the final structure; delete it afterwards), merge to `main`, and release `0.3.0` (breaking: every semantic color name and the primitive group change).

## Next

- JS/TS and SCSS outputs in `@pts/web`: add Terrazzo plugins to `packages/web/terrazzo.config.ts` and subpath exports.
- Deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android).

## Open questions

- None.
