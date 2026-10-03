# 0035. Releases with Changesets

- Status: accepted
- Date: 2026-10-03

## What we learned

Fourteen releases (`v0.1.0` to `v0.9.3`) were cut by hand, as ADR 0014 describes: bump every workspace with `npm version`, commit, write the notes into an annotated tag, push. ADR 0014 deferred Changesets "until releases are frequent enough to need it"; fourteen releases in a week are.

The manual flow had three gaps:

- **The notes were written at release time**, from memory and `git log`, not when the change was made, by whoever made it.
- **They lived only in tag messages.** There was no changelog file and no GitHub Release, so a reader had to know to run `git tag -n99`.
- **The change type was a checkbox in the PR template**, read by nobody when the version was chosen.

Three ways to automate were compared:

- **Changesets, with its GitHub Action**: each PR adds a small file with the bump type and a summary; on `main`, the action keeps a release PR open that applies them (versions, changelog). This is how most design system monorepos release (Primer, Radix, Chakra), so it is the practice worth showing colleagues. It needs GitHub Actions to be allowed to open pull requests.
- **Changesets, run locally**: the same files, but the owner runs the release from a laptop. No repository setting, less automation.
- **A custom script**: no dependency, but it teaches nothing transferable.

Changesets doesn't fit the project as is, in three places:

- **Tags**: for private packages it tags each package (`@pts/web@0.9.4`), and the action creates one GitHub Release per tag. ADR 0014 wants one `vX.Y.Z` tag for all.
- **Changelogs**: it writes one per package, and with one fixed version most would read "No changes in this release".
- **Bump types are SemVer words**, and in `0.x` they shift (ADR 0014): a breaking change is `minor`. A `major` changeset would release `1.0.0` by accident.

Release notes were also compared by where they live: a root changelog (Changesets can't write one), one per package (noise), or the changelog of the one package that ships, `@pts/web`.

## Why it matters

- **Every PR that changes a package has a changeset** in `.changeset/`, written with the change: the bump type and a summary. A change that ships nothing (docs, tooling, CI) gets an empty one (`npx changeset --empty`). A change outside the workspaces needs none.
- **Each changeset names `@pts/web`**, and the `fixed` group bumps every `@pts/*` package with it, so one version stays (ADR 0014). `packages/web/CHANGELOG.md` is the project's changelog; the other packages keep a stub that points to it. It starts with the notes of the fourteen tags so far.
- **The summary starts with `Breaking:`, `New:`, or `Fix:`**, as the tag messages did, and the bump must match it: in `0.x`, Breaking is `minor` and New and Fix are `patch`; from 1.0, `major`, `minor`, `patch`. A `major` changeset in `0.x` is refused: 1.0 is a decision (ADR 0014), not a changeset. CI checks all of this on every pull request.
- **Releasing is merging the release PR.** The `Release` workflow keeps a PR titled "Release" open while changesets are pending on `main`; merging it bumps the versions and the changelog. The next run tags `vX.Y.Z` on `main` (annotated, with that version's changelog section as the message, as before) and creates the GitHub Release with the same notes.
- **When to release is still the owner's choice**: the release PR waits until it is merged, collecting changesets meanwhile.

## Trade-offs

- **The release PR runs no CI**: a pull request opened with the workflow's own token triggers no workflows. It only changes versions, the changelog, and the lockfile; the Release workflow checks its commit and reports a `verify` status, which the branch protection requires (ADR 0020), and verifies again before tagging. A personal access token or a GitHub App would run the full CI at the cost of a secret to manage.
- **Tags are made by `github-actions[bot]`**, not the owner.
- **Changeset files are written by hand** more often than with `npx changeset`: its prompt offers only the packages a branch changed, and `@pts/web` is often not one of them (a token change edits `tokens/`).

## Implementation notes

- `@changesets/cli` 3 as a root devDependency. `.changeset/config.json`: `fixed: [["@pts/*"]]`, `privatePackages: { version: true, tag: false }`, no commit, no formatter.
- `.changeset/changelog.mjs`: changelog lines without commit hashes or dependency notes.
- `npm run version-packages`: `changeset version`, then restores the other packages' stub changelogs (it writes "No changes in this release" into them) and updates `package-lock.json`. The stubs can't simply be deleted: `changesets/action` reads every released package's changelog for the release PR's body, and the first release failed on the missing files.
- `.github/scripts/check-changesets.mjs` (CI, pull requests): `changeset status` plus the rules above. Verified to reject a changeset without `@pts/web`, a `New:` with `minor`, and a summary without a prefix.
- `.github/workflows/release.yml`: when the version on `main` has no tag or GitHub Release yet, check, typecheck, build, and `npm run release` (`.github/scripts/release.mjs`), which skips whichever already exists; then `changesets/action@v2` for the release PR (its own releases off). The action runs last because it leaves the next version's bumps in the working tree. The action's `has-changesets` output can't gate this, since an empty changeset counts as pending: the first run, with only an empty changeset on `main`, skipped the release step. On the next push it creates the missing GitHub Release for `v0.9.3`.
- Repository setting: GitHub Actions may create pull requests.
- ADR 0014 is marked `amended by 0035`; its release steps are replaced by the ones above.

## Documented in

- `CLAUDE.md` — Git Convention
- `CONTRIBUTING.md` — The flow, Releases
- `.github/pull_request_template.md` — the changeset replaces the type-of-change checkboxes
- `README.md` — the changelog
