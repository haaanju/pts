# 0044. Storybook Token Copies Checked

- Status: superseded by 0046
- Date: 2026-10-06

## What we learned

The Storybook UI (the manager: sidebar, toolbar) is themed in JavaScript and can't read CSS variables, so `.storybook/theme.ts` held eleven hex copies of color tokens across the two themes, plus the sans and mono font names and `radius.md`. A comment named each token, and `CLAUDE.md` asked to update them by hand after a token change. Nothing checked it: a changed `content.subtle` would leave the UI on the old color with every check passing. The pipeline audit listed it (ADR 0039).

## Why it matters

- **The copies live in one map**, `.storybook/token-copies.ts`, keyed by token id per theme (`light`, `dark`, and `any` for values no theme changes). `theme.ts` reads the map instead of holding literals.
- **`npm test` compares the map with the tokens** as Terrazzo resolves them in each theme (`scripts/token-copies.test.ts`). A color is compared by hex, a font family by its first name, a dimension by its px number. Every mismatch and every id that isn't a token is listed in one failure.
- **The copies stay hand-written.** The manager is bundled separately from the docs, and importing the token build into it would add a build step for fourteen values. The check is what keeps them honest.

## Trade-offs

- **A copy can still be the wrong token.** The test checks that each value matches the token it names, not that the UI uses the right token in each slot; that stays a review question in `theme.ts`.
- **Fallbacks aren't compared.** A font stack's fallbacks in `theme.ts` (`system-ui, sans-serif`) are written there, not copied.

## Implementation notes

- `@pts/storybook` gains a `test` script (`node --test scripts/token-copies.test.ts`), so the root `npm test` and CI run it.
- Verified: a copy changed to another value, and an id that isn't a token, both fail with the token, its value, and the copy.
- The UI is unchanged: dark `textInverseColor` copies `background` (`#181818`), as before, not `content.inverse.base` (`#000000`).

## Documented in

- `CLAUDE.md` — Commands, After a token change
- `.claude/rules/storybook.md` — Files, Manager
- `docs/how-it-works.md` — Checks as code
- `README.md`, `CONTRIBUTING.md` — the `npm test` row
