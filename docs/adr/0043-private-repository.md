# 0043. Private Repository

- Status: accepted
- Date: 2026-10-06

## What we learned

The repository went public on 2026-10-03 for two features a free GitHub plan offers only on public repositories: branch protection and GitHub Pages (ADR 0020). Branch protection is off since ADR 0042. That left the hosted docs as the only reason to stay public.

The docs are for the owner and a few colleagues. Colleagues can be invited to a private repository at no cost, and the docs run locally with `npm run storybook`. Releases (tags and GitHub Releases, ADR 0035) work the same on a private repository.

## Why it matters

- **The repository is private.** Colleagues get access as collaborators.
- **No hosted docs.** The Pages deploy is removed from CI, and the Pages site is turned off. The docs are read locally: `npm run storybook` (http://localhost:6006), or `npm run build-storybook` for a static copy.
- **CI is unchanged otherwise.** It still builds Storybook and runs the docs accessibility check on every push to `main` and every pull request.

## Trade-offs

- **The docs need a checkout.** Reading them takes Node 22.18 and `npm install`; there is no link to send.
- **Actions minutes are limited** on a private repository (2,000 a month on the free plan). A CI run takes about 3 minutes and a Release run under 1.
- **If hosted docs are needed again**, a host that deploys from a private repository for free (Netlify, Cloudflare Pages) can take the `apps/storybook/dist` that CI already builds.

## Implementation notes

- `ci.yml`: the `upload-pages-artifact` step and the `deploy` job are removed.
- GitHub: the Pages site deleted, then the visibility set to private.

## Documented in

- `CLAUDE.md` — Commands, Git Convention
- `README.md` — the docs link
- `CONTRIBUTING.md` — The flow
- `docs/how-it-works.md` — Checks as code, Documentation
- `docs/progress.md` — Current state
- ADR 0020, 0042 — amended by this ADR
