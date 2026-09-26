# 0014. Versioning Policy

- Status: accepted
- Date: 2026-09-26

## What we learned

The packages sat at `0.0.0` with no tags, so there was no way to tell which state of the tokens a consumer was on, or whether an update was safe to take. Even as a solo project, the goal is to version it the way a published design system would.

For design tokens, the public API is the set of token names (the CSS custom property names). Consumers break when a name disappears or starts meaning something else, not when a new token appears.

Two monorepo strategies were considered: independent versions per package (`@pts/css@0.2.1`) or one fixed version for all packages. The packages are built from the same source and change together, so a single version is simpler and says more.

## Why it matters

- **Semantic Versioning, fixed across the monorepo.** Every `@pts/*` package carries the same version, and a release is one git tag on `main`: `vX.Y.Z`.
- **`0.x` while the system is in initial development.** Anything may change, and the version shifts down one place:

  | Change | Before 1.0 | From 1.0 |
  |---|---|---|
  | Breaking | MINOR (`0.3.0` → `0.4.0`) | MAJOR |
  | New tokens or features | PATCH | MINOR |
  | Fixes | PATCH | PATCH |

  This matches how npm reads caret ranges: `^0.3.0` accepts `0.3.x` but not `0.4.0`.
- **What counts as breaking:** renaming or removing a token; changing what a name means (e.g. the `space/N` = N ÷ 25 rule); changing the output format, file paths, or selector structure (`:root`, `[data-theme]`); dropping a theme.
- **What counts as a feature:** new tokens or groups, new themes, new platform outputs.
- **What counts as a fix:** adjusting a value without changing its role (color tuning, contrast fixes), and docs-only changes.
- **1.0 is a promise, not a finish line.** Release `1.0.0` when token names are stable enough to commit to not renaming them casually, and at least one real consumer uses the tokens.

## Implementation notes

- All four workspaces bumped from `0.0.0` to `0.1.0` with `npm version 0.1.0 --workspaces --no-git-tag-version`; `main` tagged `v0.1.0` as the first baseline.
- Internal dependencies stay `"*"`: workspaces always link the local copy, and the fixed version keeps them in step.
- Release steps: merge to `main`, bump every workspace to the same version, commit, then `git tag -a vX.Y.Z`.
- Changesets was considered for automating bumps and changelogs and deferred until releases are frequent enough to need it.

## Documented in

- `CLAUDE.md` — Git Convention
