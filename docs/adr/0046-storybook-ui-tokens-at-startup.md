# 0046. Storybook UI Tokens Resolved at Startup

- Status: accepted
- Date: 2026-10-06

## What we learned

ADR 0044 kept the Storybook UI's token values as hand-written copies (`.storybook/token-copies.ts`) and had `npm test` compare them with the tokens. It weighed resolving the values instead and turned it down as a build step for fourteen values.

That build step already exists. `.storybook/main.ts` runs in Node every time Storybook starts, dev server and static build alike, and a token change means a restart anyway: `tokens.css` is built before Storybook starts. Resolving the values there needs no extra step, and values that are never copied can't drift, so the copies and their test have nothing left to do.

Storybook writes `managerHead` and `previewHead` into the `<head>` of the manager and the preview. An inline script there runs before the module bundles, which are deferred, so `theme.ts` can read a global set by it in both places.

## Why it matters

- **`main.ts` resolves the UI values at startup** (`scripts/ui-tokens.ts`, with `tokens/source.ts`, ADR 0038) and writes them into both heads as `window.PTS_UI_TOKENS`. `theme.ts` builds the light and dark UI themes from it.
- **`.storybook/ui-tokens.ts` lists what the UI uses**: six color ids per theme, the sans and mono font stacks, and `radius.md`. A color `theme.ts` uses that isn't listed fails typecheck; a listed id that isn't a token stops Storybook with its name, so `npm run build-storybook` in CI fails too.
- **Font stacks come whole from the tokens**, fallbacks included, instead of a first name with fallbacks written in `theme.ts`.
- **ADR 0044 is superseded**: `token-copies.ts`, `scripts/token-copies.test.ts`, and the `@pts/storybook` test script are removed.

## Trade-offs

- **The values reach the UI through a global**, not an import, so `theme.ts` depends on `main.ts` having run. Both run in every Storybook start, so it holds wherever Storybook does.
- **`main.ts` is checked by the Node tsconfig** (`scripts/tsconfig.json`), since it now imports the token resolver.

## Implementation notes

- `main.ts`: `managerHead` and `previewHead` append `uiTokensScript()`.
- Verified on the static build (both heads hold the values; the UI renders light and dark with them, no page errors) and on the dev server.

## Documented in

- `CLAUDE.md` — Commands, After a token change
- `.claude/rules/storybook.md` — Files, Manager
- `docs/how-it-works.md` — Checks as code
- `README.md`, `CONTRIBUTING.md` — the `npm test` row
- ADR 0044 — superseded by this ADR
