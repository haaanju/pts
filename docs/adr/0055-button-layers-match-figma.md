# 0055. Button Layers Match Figma

- Status: accepted
- Date: 2026-10-13

## Decision

Chosen: build `<pts-button>` the way its Figma set is built, padding `padding/icon-side`, a label with `padding/base − padding/icon-side` on both sides, and a gap of `gap` minus that, because the owner wants Figma and code to share one structure, and ADR 0052 had made them differ.

## What we learned

ADR 0052 turned the Figma button's icons into booleans. Since a boolean can't change a padding, the Figma set pads the icon-side step and lets a label frame and a smaller gap make up the rest. The code kept padding each side by itself (`has-start`, `has-end`). Both drew the same button, but Dev Mode showed padding 8 and gap 4 where the code said 12 and 8, and five Figma variables had no code counterpart.

Options considered:

- **Keep the difference** (ADR 0052): properties match, layers don't; the set's description told developers not to read paddings from Dev Mode.
- **Go back to an `Icon` variant** (240 variants): layers match, but the Figma property is one the code doesn't have.
- **Build the code like Figma**: properties and layers both match. The values Figma keeps in variables come from existing tokens with `calc()`, so no token changes.

## Why it matters

- **One structure in both.** The button pads `--button-<size>-padding-icon-side`; a `.label` wrapper pads `calc(base − icon-side)`; `.content` gaps `calc(gap − (base − icon-side))`. The code no longer tracks which side has an icon; it still tracks whether there is a label, for icon-only buttons.
- **Dev Mode shows what the code uses.** `button/<size>/label-inset` and `gap-inner` (now one per size) carry those `calc()` expressions as their code syntax.
- **A new check, `pts/icon-side-padding`**: in every permutation, `padding/icon-side` ≤ `padding/base` and `gap` ≥ their difference. A negative CSS gap is invalid and dropped without a warning, so the tokens are where to catch it.
- **Nothing ships differently**: no token or output changes, so the changeset is empty.

## Trade-offs

- **Two `calc()` values in the component** instead of plain token reads. They use only the component's own tokens (`.claude/rules/components.md`).
- **The rule fixes the structure in the tokens**: a design that wants a larger icon-side cut than the gap must change this decision, not just a value.

## Implementation notes

- `apps/components/src/button.ts`: `hasStart` / `hasEnd` and their classes removed; the default slot sits in `<span class="label">`, hidden for icon-only buttons.
- `tokens/lint/rules/icon-side-padding.ts`, registered in `index.ts` and `terrazzo.config.ts`, with a case per message in `rules.test.ts`.
- Figma: `button/gap-inner` split into `button/sm/gap-inner` and `button/md/gap-inner` (both alias `Spacing/gap/button-inner`) and rebound in all 40 variants; code syntax added to them and to `label-inset`; the set description and the Overview (Component 35, 340 variables) updated.
- Checked: the built button against its measurements before the change, in sm and md × relaxed and compact × no icon, start, end, both (16 cases): the same width, height, and label position; icon-only buttons are square with the icon centered; loading keeps the width; a full-width label stays centered. In Figma, all 40 variants × 4 icon arrangements × 2 densities put the label at the expected padding. `npm run check`, `npm test` (45 and 37), and `npm run typecheck` pass.

## Documented in

- `.claude/rules/components.md` — Code
- `docs/how-it-works.md` — What the rules cover
- `.claude/skills/figma/SKILL.md` — Collections, Variables, Components
- `CLAUDE.md` — Commands (`pts/icon-side-padding`)
- ADR 0052 — amended by this ADR
