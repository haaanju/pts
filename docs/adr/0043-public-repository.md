# 0043. Public Repository

- Status: accepted
- Date: 2026-10-08

## What we learned

The repository stayed private while the pipeline took shape. It is a study project shared with colleagues for reference, so once the pipeline was in place there was nothing left to keep private, and every link to it (from a colleague, or from an issue filed upstream with Terrazzo) works only if it is public.

## Why it matters

- **The repository is public.** Anyone can read and clone it; colleagues need no invitation.
- **The docs run locally**: `npm run storybook` (http://localhost:6006), or `npm run build-storybook` for a static copy. There is no hosted copy; when a link is needed, a GitHub Pages deploy can take the `apps/storybook/dist` that CI already builds.
- **Nothing else changes.** `main` stays unprotected (ADR 0042), and CI and releases run as before.

## Implementation notes

- GitHub: the visibility set to public.
- `ci.yml` builds Storybook for the accessibility check and doesn't deploy it.

## Documented in

- `CLAUDE.md` — Git Convention
- `docs/how-it-works.md` — Documentation
- `docs/progress.md` — Current state
- ADR 0020, 0042 — amended by this ADR
