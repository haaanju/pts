# 0037. Regression Tests for the Lint Rules

- Status: accepted
- Date: 2026-10-03

## What we learned

The 12 `pts/*` rules (ADR 0021) were only ever run against tokens that pass. That proves the rules don't misfire, not that they fire: a rule that stops reporting looks exactly like tokens with nothing wrong. Several ways to get there are ordinary:

- **A Terrazzo upgrade changes a shape the rules read.** Most rules start with `if (!tokens) continue` per permutation, or match a value's shape before comparing; a renamed field turns the whole rule into a no-op.
- **An edit to `pairs.ts` or `source.ts`** drops a pair or a permutation, and every rule built on it checks less.
- **A rule refactor** inverts a condition. Disabling `pts/visible-steps` this way during the work below passed `npm run check` and failed two tests.

A review also pointed out that nothing tested the checks themselves.

## Why it matters

- **Every message of every `pts/*` rule has a case** that breaks it on purpose and expects `tz check` to report it: 28 cases, plus one that expects the unchanged tokens to pass. The one message without a case is `pts/contrast` `MISSING`: pairs come from the ids of the same permutation, so it can't happen today.
- **The real pipeline, nothing mocked.** Each case copies `src/`, `lint/`, and `terrazzo.config.ts` to a temporary directory, edits the token JSON there, and runs the `tz` CLI. The copy reads its own files because `source.ts` resolves paths from its own location.
- **Assertions name the rule and part of its message** (`lint:pts/<rule>: …`), so a case passes only when the intended rule reports the intended problem. Other rules may report too; a mutation often breaks more than one rule.
- **`npm test` runs in CI**, not in the pre-commit hook: it only matters when `tokens/lint/` changes, and it takes a few seconds on all cores.

## Trade-offs

- **Cases are written against the current token names.** Renaming a token used in a case (`content.base`, `button.primary.content`, `font-size.text.sm`) means updating the case. A case that no longer matches a token fails loudly; it doesn't pass silently.
- **One process per case.** About 30 `tz check` runs, parallel; slower than calling the rules in-process, but the rules see exactly what `npm run check` gives them.
- **Built-in rules aren't tested here.** Terrazzo tests its own rules; only their configuration is ours.

## Implementation notes

- `tokens/lint/rules.test.ts`: `node:test`, run by Node's type stripping (`node --test`), type-checked with the lint plugin (`tokens/tsconfig.json`).
- `npm test` (root) runs every workspace's `test` script; `@pts/tokens` is the only one.
- `.github/workflows/ci.yml`: `npm test` after `npm run check`.

## Documented in

- `CLAUDE.md` — Commands
- `CONTRIBUTING.md` — What the checks catch
- `docs/how-it-works.md` — Checks as code
