# 0020. Hand-Edited Tokens and CI Gates

- Status: accepted (amended by 0021, 0042, 0043)
- Date: 2026-09-27

## What we learned

So far every change has been made in a working session with an assistant, and it didn't matter whether a step was scripted or done by hand. Once the repository is public, other people, designers first, will change tokens, so the flow has to be clear without that context.

The intended flow: a designer tries a change in the Figma `pts` file, then edits the token JSON and opens a pull request. Nothing lands on `main` until the automated checks pass, and the docs rebuild from `main` on their own.

Two parts of the current setup don't fit it:

- **Color JSON is generated.** `generate-color.ts` writes `primitive/color.tokens.json` and `semantic/color{,.light,.dark}.tokens.json` from palette anchors and selection rules. A designer who edits the JSON has their change overwritten the next time the script runs, and changing a color means editing TypeScript. Two sources of truth for the same values is the problem the token source exists to avoid.
- **The checks don't gate anything yet.** CI runs on every pull request, but a red run doesn't block a merge. The pre-commit hook only runs where `npm install` was run, so an edit made in the GitHub web editor skips it. The docs build in CI but aren't published anywhere.

Some guarantees currently come from the generator, not from `npm run check`, and are lost if it goes:

| Guarantee | Today |
|---|---|
| Contrast pairs pass, states are visible | `check.ts` (also enforced by the generator's step selection) |
| Every semantic color has a `$description` | generator only |
| Semantic colors alias a primitive, never a raw value | generator only |
| A color's `hex` and `components` describe the same color | generator only (the CSS uses `hex`, other formats may use `components`) |

## Why it matters

### The token JSON is the source, edited by hand

- `tokens/src/**/*.tokens.json` is the only source of truth, including color. People edit it directly.
- `generate-color.ts` and `npm run generate:color` are removed. The OKLab midpoints and step choices it made are already in the JSON; git history keeps the script for reference.
- The generator's guarantees move to `check.ts` (see Gates), so a hand edit is held to the same rules.

### Flow

```
1. Explore     Figma pts file (Theme / Semantic collections)
2. Edit        feature branch, tokens/src/**/*.tokens.json (+ resolver, + docs page for a new group)
3. Pull request
4. Gates       CI must pass; the owner reviews
5. Merge       into main
6. Publish     CI builds @pts/web and Storybook from main and deploys the docs
7. Release     when ready: bump every workspace, tag vX.Y.Z (ADR 0014)
```

- **Figma first, JSON second.** Figma stays a consumer of the tokens: there is no sync, and nothing detects Figma drifting from the JSON. The pull request template asks whether Figma matches, and the reviewer checks it.
- **Checks gate the merge, not the release.** A value that fails contrast never reaches `main`, so the docs only ever show a valid state.
- **The docs show `main`, not the last release.** A merged change is visible before it is tagged. This is fine while nothing consumes a published package; revisit when packages are published.

### Gates

`main` is protected: changes arrive through pull requests, and the `verify` job must pass.

| Step | Catches |
|---|---|
| `npm run check` | missing `$type`, broken aliases, token-name mismatches between themes, contrast (4.5:1 / 3:1), invisible steps; **added:** a semantic color without a `$description`, a semantic token with a raw value where the tier rules require an alias, a color whose `hex` and `components` disagree, a token file missing from the resolver (otherwise silently left out of the build) |
| `npm run lint` | Terrazzo's DTCG validation (`tz check`): value shapes, units, types |
| `npm run typecheck` | the scripts and Storybook still compile against the token data |
| `npm run build` | Terrazzo can produce `tokens.css` |
| `npm run build-storybook` | the docs render every token |

The pre-commit hook stays as fast local feedback, but CI is the gate.

### Publishing the docs

A second job, run only on pushes to `main` after `verify` passes, uploads `apps/storybook/dist` to GitHub Pages. Pull requests build the docs but don't deploy them.

### Prerequisites

Branch protection and Pages on a private repository need a paid GitHub plan. Both are set up when the repository goes public.

## Implementation notes

1. Extend `check.ts` with the three generator guarantees above; confirm it passes on the current JSON.
2. Remove `generate-color.ts`, the `generate:color` script, and the references in `CLAUDE.md` and `README.md`.
3. Add a pull request template: what changed, breaking or not (ADR 0014), Figma updated.
4. Add `CONTRIBUTING.md`: the flow above, where each kind of change goes (value, new token, new file, new group), and how to run the checks locally.
5. Add the Pages deploy job to `.github/workflows/ci.yml`.
6. On going public: protect `main` (pull request required, `verify` required), enable Pages.

Steps 5 and 6 were done on 2026-10-03, when the repository went public:

- `ci.yml`: on a push to `main`, `verify` uploads `apps/storybook/dist`, and a `deploy` job publishes it to https://haaanju.github.io/pts/.
- `main` requires a pull request with no approvals (the owner is the only reviewer) and the `verify` check, for admins too; no force pushes or deletion.
- The release PR runs no CI, since it is opened with the workflow's token (ADR 0035), so it could never pass the required check. The Release workflow verifies its commit (check, typecheck, build) and reports the result as a `verify` commit status, which the protection accepts like the CI job.

## Documented in

- `CLAUDE.md` — Commands, Token Rules → Color
- `README.md` — Development
- `CONTRIBUTING.md` (new)
