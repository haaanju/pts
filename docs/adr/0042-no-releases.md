# 0042. No Releases

- Status: accepted
- Date: 2026-10-06

## What we learned

Every `@pts/*` package is `"private": true`, so nothing is published to npm. A version number reached no one: it produced a git tag and a GitHub Release, and no consumer installs either. Keeping that version correct took five parts:

- a changeset in every pull request (ADR 0035);
- the Release workflow and its release pull request (ADR 0035, 0041);
- a `verify` status the Release workflow posted itself, since its pull request runs no CI (ADR 0020);
- a CI check that the changeset matched the token changes (ADR 0040);
- branch protection, so that check couldn't be skipped by pushing to `main`.

That was the largest part of the repository's automation, and it guarded something nothing uses. The project is a study of the token pipeline (tokens, checks, outputs, docs); releasing was one more thing to learn, and it is learned.

## Why it matters

- **No versions, no releases.** The packages stay at `0.9.4`. Nothing bumps them, and nothing tags.
- **History stays.** The tags `v0.1.0` to `v0.9.4`, their GitHub Releases, and `packages/web/CHANGELOG.md` remain as a record; the changelog says it is no longer updated. The changelogs Changesets required in the other packages held nothing and are removed.
- **`main` is not protected.** CI still runs on every push to `main` and every pull request, and the docs deploy only after it passes, so a failing change can reach `main` but not the docs. Small changes may go straight to `main`; larger work goes through a pull request.
- **If a consumer appears**, publishing comes back as a new decision: ADR 0014 and 0035 are in git history and can be restored.

## Trade-offs

- **Renaming or removing a token is no longer marked anywhere.** Nothing depends on the names outside this repository, and `npm run check` still reports an alias left pointing at a removed token.
- **A red commit can land on `main`.** The pre-commit hook runs check and typecheck first; CI reports the rest after the push.

## Implementation notes

- Removed: `.changeset/`, `.github/workflows/release.yml`, `.github/scripts/release.mjs` and `check-changesets.mjs`, the `version-packages` and `release` scripts, `@changesets/cli`, the changeset step in `ci.yml`, the Changeset section of the pull request template, and the stub `CHANGELOG.md` files in `tokens/`, `apps/components/`, and `apps/storybook/`.
- Branch protection on `main` removed in the repository settings.
- ADR 0014, 0035, and 0041 are superseded; ADR 0020 and 0040 are amended (the Release workflow's `verify` status, branch protection, and the changeset check).

## Documented in

- `CLAUDE.md` — Structure, After a token change, Git Convention
- `CONTRIBUTING.md` — The flow, The pull request (Releases removed)
- `README.md` — Development, Decisions and conventions
- `docs/how-it-works.md` — Where to start, Checks as code, Releases (removed), Not done yet
- `docs/progress.md` — Current state
- `packages/web/CHANGELOG.md` — no longer updated
