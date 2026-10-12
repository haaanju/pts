# 0054. Keep Main's History

- Status: accepted
- Date: 2026-10-13

## Decision

Chosen: a repository ruleset that blocks force pushes to `main` and deleting it, and nothing more, because several Claude sessions push to this repository and none should rewrite or remove `main`, while a pull-request gate would still guard one person against themselves (ADR 0042).

## What we learned

The owner asked whether `main` needs protection now that colleagues have the public link. Being public doesn't add anyone who can push:

- The owner is the only collaborator, so only they can push.
- A pull request from a fork runs CI with `pull_request`, a read-only token and no secrets, and a first-time contributor's run waits for approval (the repository's `first_time_contributors` policy).
- The Release workflow runs only after CI succeeds on a push to `main` (`workflow_run`, `event == 'push'`).

What had changed is who pushes: several Claude sessions, in parallel, share this checkout or work in worktrees. An agent's mistaken force push or branch deletion would rewrite or remove history that the docs, tags, and releases point to.

Options considered:

- **Leave `main` unprotected** (ADR 0042 as it was): no friction, but nothing stops a force push or a deletion.
- **Protect `main` with required pull requests and the `verify` check**: the setup ADR 0042 removed; every docs fix becomes a pull request again, for one person.
- **A ruleset that blocks only force pushes and deletion**: no pull request or status required, so direct pushes and releases work as before.

## Why it matters

- **`main`'s history can't be rewritten or deleted**, by the owner or by any session pushing as them. GitHub now reports `main` as protected.
- **Nothing else changes**: workspace changes still go through a pull request by habit, and docs, ADRs, and agent rules may go straight to `main` (ADR 0042).

## Trade-offs

- **An admin can still turn the ruleset off** in the settings; it guards against mistakes, not against the owner.
- **A bad commit is undone with a revert**, never by rewriting `main`.

## Implementation notes

- Ruleset "Keep main's history" (id 24956191): target the default branch, enforcement active, rules `non_fast_forward` and `deletion`, no bypass list.
- Checked: the branches API reports `protected: true`; the next commit (`ef32d5c`) pushed straight to `main`, and CI and the docs deploy ran on it as before.
- First recorded as a section appended to ADR 0042, then moved here when ADRs stopped growing after acceptance.

## Documented in

- `CLAUDE.md` — Git Convention
- `docs/how-it-works.md` — Gates
- `docs/progress.md` — Current state
- ADR 0042 — amended by this ADR
