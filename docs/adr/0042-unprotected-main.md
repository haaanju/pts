# 0042. Unprotected Main

- Status: accepted (amended by 0043)
- Date: 2026-10-06

## What we learned

`main` was protected (ADR 0020): every change arrived by pull request, and the `verify` check had to pass, for admins too. The protection was set up for designers opening pull requests. No one else changes the repository, so it guarded one person against their own direct pushes, and turned every typo fix into a pull request.

What the protection did beyond that:

- **It forced the changeset check.** That check compares a pull request with `main` (ADR 0035, 0040), so it runs only on pull requests.
- **It made the release PR need a status.** The release PR runs no CI, so the Release workflow posts a `verify` status on it (ADR 0035, 0041).

The docs never depended on it: the deploy job runs only after CI passes on `main`.

## Why it matters

- **`main` is not protected.** CI still runs on every push to `main` and every pull request, and the docs deploy only after it passes.
- **A change to a workspace (`tokens/`, `packages/`, `apps/`) goes through a pull request**, so the changeset check runs. A change that touches none (docs, ADRs, agent rules, CI) may go straight to `main`.
- **Releases continue as before** (ADR 0035, 0041). The Release workflow still posts `verify` on the release PR, now as a result to read before merging rather than a required check.

## Trade-offs

- **A red commit can land on `main`.** The pre-commit hook runs check and typecheck first; CI reports the rest after the push, and the docs stay on the last passing commit.
- **The changeset check is a habit, not a gate.** A workspace change pushed straight to `main` skips it, and its release note is missing until someone adds one.

## Implementation notes

- Branch protection on `main` removed in the repository settings.
- A first version of this ADR also removed releases; it was reverted before any release depended on the change. The comment-only `preview-head.html`, an unused re-export, and the docs trimmed with it stay removed.

## Documented in

- `CLAUDE.md` — Git Convention
- `docs/how-it-works.md` — Checks as code
- `docs/progress.md` — Current state
- ADR 0020, 0035 — amended by this ADR
