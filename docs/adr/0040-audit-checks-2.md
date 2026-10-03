# 0040. Checks from the Pipeline Audit, Part 2

- Status: accepted
- Date: 2026-10-03

## What we learned

The second group of audit findings (ADR 0039) are rules that `CLAUDE.md` states and no check enforced. Each was confirmed on the current code. The current tokens already follow every one of them, so the checks only fail a future change:

- **The changeset said what kind of change it was, and CI believed it.** `check-changesets.mjs` matched the summary's prefix to its bump. A removed token with `Fix: patch`, or with an empty changeset, passed.
- **A component state could disappear or collapse.** `pts/component-pairs` checked the content against each fill that exists. A missing `pressed`, or `hover` pointed at the same step as `rest`, kept every pair valid. `content/<state>` didn't match the rule's `.content` suffix at all.
- **Compact only had to be no larger than relaxed.** Equal to relaxed (no longer compact) or two steps down passed, though `CLAUDE.md` says compact takes the next smaller step. Checked: all 15 density tokens take exactly that step today.
- **A modifier could grow past its role.** `pts/orthogonal-modifiers` caught a token in two modifiers, but not, for instance, `size/icon/xl` added to both density files.
- **Role tokens could alias any semantic token.** The `semanticAliases` option let `padding`, `gap`, and `text` alias anything semantic: `padding/md → {size/control/sm}` passed.

## Why it matters

- **The changeset check compares the tokens.** Terrazzo resolves both sides: the base's `tokens/src` and `tokens/source.ts`, extracted with `git archive`, and the branch's.
  - A token id gone from every mode needs a releasing changeset whose summary starts `Breaking:`. A rename is a removal plus an addition.
  - An added id, or a `$type` or `$value` changed in any mode, needs a changeset that releases; an empty one fails.
  - What it can't see stays a person's call: a name whose meaning changed, or an output format change.
- **`pts/component-states`** (new): in the component tier, a property with state children names every state in `states` (rest, hover, pressed), and those states resolve to different values in every permutation. Ghost's surface has no `rest` on purpose (ADR 0032: transparent, and there is no transparent token), so `transparentRest` names it in the config.
- **`pts/component-pairs`** pairs `content/<state>` with the fill of the same state, and with every fill when that state has no fill of its own.
- **`pts/density-order`** reports `NOT_ONE_STEP`: where both modes alias a scale, compact aliases the next smaller px step of the relaxed one's group (`space/*`, `dimension/*`).
- **`pts/orthogonal-modifiers`** takes a `scope` per modifier and reports `OUT_OF_SCOPE`:
  - theme: color and shadow tokens;
  - density: `padding`, `gap/within`, `gap/between`, `size/control`;
  - viewport: `font-size`, `line-height`, and `letter-spacing` under `display`.
- **`pts/tier-aliases`** takes `roleAliases` instead of `semanticAliases`: each role group lists the only groups it may alias, primitive or semantic (`padding`, `gap` → `space`; `text` → the five typography properties). `ROLE_ALIAS` reports anything else.

## Trade-offs

- **The changeset check resolves the tokens twice**, about two seconds in CI. It needs `tokens/source.ts` at the base; on an older base it skips the comparison.
- **"Changed" is any resolved value in any mode.** A primitive change that moves 20 semantic values lists them all, which is accurate but long, so the message shows the first eight.
- **Scopes and role targets are config, not derived.** They copy `CLAUDE.md` → Modifiers and Spacing; changing a scope means changing the config, which is the point.

## Implementation notes

- `.github/scripts/check-changesets.mjs`: `baseSource()` (`git archive` of `tokens/src` and `tokens/source.ts`, with `node_modules` linked) and `resolveAt()` (`permutations()` per side).
- `tokens/lint/rules/component-states.ts`, registered in `lint/index.ts`. Options in `terrazzo.config.ts`.
- `density-order.ts`: `scaleOf()`; `orthogonal-modifiers.ts`: `scope`; `tier-aliases.ts`: `roleAliases`; `component-pairs.ts`: state-specific content.
- `tokens/lint/rules.test.ts`: a case for each new message (38 cases).
- Verified on a scratch branch against `main`:
  - removing `z-index/toast` fails with an empty changeset and with `Fix: patch`, and passes with `Breaking:` / `minor`;
  - changing its value fails with an empty changeset and passes with `Fix:` / `patch`.

## Documented in

- `CLAUDE.md` — Commands, Component tier, Modifiers, Git Convention
- `CONTRIBUTING.md` — Releases, What the checks catch
- `docs/how-it-works.md` — Checks as code, Releases
- ADR 0026, 0032, 0035, 0038 — amended by this ADR
