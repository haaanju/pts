# 0043. Public Repository

- Status: accepted
- Date: 2026-10-08

## What we learned

The repository stayed private while the pipeline took shape. It is a study project shared with colleagues for reference, so once the pipeline was in place there was nothing left to keep private, and every link to it (from a colleague, or from an issue filed upstream with Terrazzo) works only if it is public.

## Why it matters

- **The repository is public.** Anyone can read and clone it; colleagues need no invitation.
- **The docs are hosted** on https://haaanju.github.io/pts/, deployed from `main` after CI passes (ADR 0020), so reading them takes a link, not a checkout.
- **Nothing else changes.** `main` stays unprotected (ADR 0042), and CI and releases run as before.

## Implementation notes

- GitHub: the visibility set to public; Pages built by GitHub Actions.
- `ci.yml`: on a push to `main`, `verify` uploads `apps/storybook/dist`, and the `deploy` job publishes it.

## Documented in

- `CLAUDE.md` — Commands, Git Convention
- `README.md` — the docs link
- `CONTRIBUTING.md` — The flow
- `docs/how-it-works.md` — Documentation
- `docs/progress.md` — Current state
