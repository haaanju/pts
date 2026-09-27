# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.2.0`: source in `tokens/`, web output in `@pts/web`, docs in `apps/storybook` (ADR 0016).
- `main` is stable. CI and the pre-commit hook run check, lint, and typecheck.

## In flight

- `feature/color-naming`: new semantic color names (ADR 0017) and interaction-state scope (ADR 0018), both proposed. Only the ADRs are written; tokens, scripts, and docs are unchanged.
  - The proposed structure lives in the Figma `pts` file as the `Theme (naming test)` collection (58 variables, with scopes). The real `Theme` collection still has the old names.
  - The Figma `Primitive` collection already uses `color/*`; the repo still has `palette/*`.

## Next

- Implement ADR 0017 and 0018 in one pass (generator, check, Storybook, CLAUDE.md, Figma `Theme` collection), accept both, and release `0.3.0`.
- JS/TS and SCSS outputs in `@pts/web`: add Terrazzo plugins to `packages/web/terrazzo.config.ts` and subpath exports.
- Deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android).

## Open questions

- None.
