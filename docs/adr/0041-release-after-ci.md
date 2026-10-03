# 0041. Releases Follow CI

- Status: accepted
- Date: 2026-10-03

## What we learned

The pipeline audit (ADR 0039) found two gaps in how releases are gated:

- **The Release workflow could tag before CI finished.** Both workflows started on the same push to `main`. Release ran check, typecheck, and build, then tagged `vX.Y.Z` and created the GitHub Release. Meanwhile CI was still running the rule and output tests, the Storybook build, and the accessibility check. A merged release PR whose docs build or accessibility check failed would already be tagged.
- **The changeset check was skipped by branch name alone.** A pull request from any branch named `changeset-release/main` skipped it.

Neither has happened. The Release workflow hasn't run a real release yet.

## Why it matters

- **Release runs on `workflow_run`, after CI completes on `main`**, and only if CI succeeded on a push (not a pull request into `main`). It checks out the commit CI checked (`workflow_run.head_sha`), so the tag lands on a commit every check passed on.
- **A run for an older commit stops.** CI runs for two quick merges can finish out of order. The `tip` job compares the commit with `main`'s tip and skips the release job when `main` has moved on; the newer commit's own CI run releases. Without it, a late run could reset the release PR to older changes.
- **No second build before tagging.** CI already ran every check on that commit, so the release job's own check, typecheck, and build step is gone.
- **The release PR's `verify` adds `npm test`.** That PR runs no CI (it's opened with the workflow token), so the Release workflow still verifies its commit itself, now with check, test, typecheck, and build. It skips Storybook and the accessibility check: the release PR only changes versions and changelogs.
- **The changeset check is skipped only for the bot's release PR**: branch `changeset-release/main` and author `github-actions[bot]`.

## Trade-offs

- **A release waits for the whole CI**, about two minutes longer than before.
- **`workflow_run` only runs from the workflow file on the default branch.** A change to `release.yml` takes effect once merged, and can't be tried from a pull request.
- **Still not exercised end to end.** The first real release will be its first run. `docs/progress.md` says to watch it.

## Implementation notes

- `.github/workflows/release.yml`:
  - `on: workflow_run` (`workflows: [CI]`, `types: [completed]`, `branches: [main]`), `concurrency: release`.
  - Job `tip`: reads `main`'s tip through the API and outputs `current`. Job `release`: `needs: tip`, checks out `head_sha`.
- `.github/workflows/ci.yml`: the Changesets step's `if` also requires `github.event.pull_request.user.login == 'github-actions[bot]'` to skip.
- Verified: both workflow files parse, and `workflows: [CI]` matches `ci.yml`'s `name`. The run itself can only be verified on `main`.

## Documented in

- `CLAUDE.md` — Git Convention
- `docs/how-it-works.md` — Releases
- `docs/progress.md` — Current state
- ADR 0035 — amended by this ADR
