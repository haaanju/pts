# 0038. One Terrazzo Resolver for Lint, Build, and Docs

- Status: accepted
- Date: 2026-10-03

## What we learned

A review pointed out that the docs and the build read the tokens differently. Looking closer, the repository had three ways of turning the token files into values:

| Where | What | Engine |
|---|---|---|
| `tokens/lint/source.ts` | the lint rules, every permutation | Terrazzo's resolver |
| `packages/web/terrazzo.config.ts` | the CSS values | Terrazzo's resolver |
| the same config, before the build | which component tokens to repeat in the theme and density blocks: an alias walk with a regex over the raw files | its own |
| `apps/storybook/src/tokens.ts` | every value the docs show | its own: merged the files (density → base → theme → viewport, not the resolver's base → theme → density → viewport) and resolved aliases |

Three copies of the same `flatten` read the files. Nothing was wrong in the output yet: no token is defined in two layers, so the merge order changed nothing. But two resolvers can disagree without anyone noticing. Moving the docs to Terrazzo showed two differences that were already there: Terrazzo normalizes a shadow to a list of layers (DTCG allows several) and gives every color an explicit `alpha`. The docs' own resolver did neither.

Terrazzo 2.7 already offers what the hand-written parts did:

- **`resolver.apply(input, { modifiers: [m], sets: [], resolveAliases: false })`** returns only the tokens a modifier's contexts define (theme 62, density 15, viewport 12).
- **Each token carries its aliases**: `aliasChain` for a whole-token alias, `partialAliasOf` for each property of a composite.
- **`resolver.source`** keeps every file's tokens as written, in resolver order.
- **`resolver.orthogonal`** says whether any token is defined by two modifiers.
- **A plugin's `build` hook gets the resolver**, and `build()` from `@terrazzo/parser` returns the output files in memory.
- **`@terrazzo/token-tools`** parses alias syntax (`isAlias`, `parseAlias`).

## Why it matters

- **Terrazzo resolves; nothing else does.** Lint, the `@pts/web` build config, and the docs take tokens from Terrazzo through one module, `tokens/source.ts`. None of them reads a file to resolve an alias. Terrazzo's API is used wherever it has one:
  - `modifierTokens()` asks the resolver which tokens a modifier defines.
  - `files()` reads Terrazzo's copy of the files.
  - The build config follows `aliasChain` and `partialAliasOf`.
  - `pts/line-height-grid` reads a text style's aliases from `partialAliasOf` instead of the file.
  - The rules that check what a file says (`color-hex`, `tier-aliases`, `component-pairs`) still read the files as written, now Terrazzo's copy, with alias syntax parsed by `token-tools`.
- **The docs are a Terrazzo build.** A Terrazzo plugin (`apps/storybook/scripts/docs-tokens.ts`) writes every permutation as the resolver applies it. A Vite plugin runs that build in memory and serves it as `virtual:pts-tokens`. When a token file changes, the plugin invalidates the module and the page reloads. Nothing is written to disk, so typecheck still needs no build.
- **`pts/orthogonal-modifiers`** makes the review's concern a rule: no token may be defined by two modifiers. `tokens.css` repeats each modifier's tokens in that modifier's own selectors, and those nest in any order. A token defined twice would take the nearer selector's value, not the resolver's.

## Trade-offs

- **The docs data is larger.** Every permutation's resolved values are inlined: 280 KB, or 18 KB gzipped, up from 9 KB for the raw files. Only the docs load it.
- **Lint parses the tokens a second time.** Terrazzo doesn't hand a rule its resolver, so `loadResolver()` parses once per process, next to `tz check`'s own parse. Both use the same engine, so they can't disagree, but it isn't one parse.
- **More of Terrazzo's API.** `resolver.source`, `listPermutations`, and partial `apply` are less central than `parse`. A Terrazzo upgrade that changes them breaks lint, the build, and the docs together and loudly. The rule tests (ADR 0037) and the byte comparison below catch it.
- **File names still come from the resolver document.** Terrazzo's normalized resolver keeps each file's tokens but not its `$ref`, so `files()` reads the `$ref` paths from `pts.resolver.json` and pairs them by position.
- **The docs' order is a docs choice.** Terrazzo returns tokens in id order. The docs list them in file order, with density files first and viewport files last (`LAYERS` in `docs-tokens.ts`), as before.

## Implementation notes

- `tokens/source.ts` (was `tokens/lint/source.ts`):
  - `parseSource(plugins)` parses with a config that holds the given plugins; `loadResolver()` parses once and keeps the resolver.
  - `permutations(r)` (was `themes()`), `files(r)` (with each file's `layer`), `modifierTokens(r, m)`, `primitiveGroups(r)`, `registered()`, `onDisk()`.
- `packages/web/terrazzo.config.ts` asks the resolver through top-level await: modifier tokens by id, the component tokens that reach a theme or density token through `aliasChain` and `partialAliasOf`, and `breakpoint/md`.
- `apps/storybook`:
  - `scripts/docs-tokens.ts`: the Terrazzo plugin `docsTokens()` and the Vite plugin `tokensModule()`.
  - `src/tokens-data.ts`: the data's types; `src/virtual-tokens.d.ts`: the module declaration.
  - `vite.config.ts` moved to the Node-typed program (`scripts/tsconfig.json`).
- `pts/orthogonal-modifiers`, with a case in `tokens/lint/rules.test.ts`.
- Verified:
  - `@pts/web` `dist/` is byte-identical to `main`.
  - The docs data is identical to the old reader's in every permutation: ids, order, type, CSS variable, alias, display and CSS values, description, and component ids. `resolved` differs only by the shadow list and explicit `alpha: 1`.
  - `test-a11y` passes.
  - The dev server reloads with the new value after a token file is edited.

## Documented in

- `CLAUDE.md` — Structure, Commands
- `.claude/rules/storybook.md` — Files
- `docs/how-it-works.md` — Checks as code, docs row
- ADR 0009, 0021, 0025, 0032 — amended by this ADR
