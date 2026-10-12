# 0053. Remove the Large Button

- Status: accepted
- Date: 2026-10-12

## What we learned

ADR 0032 gave the button three sizes, and ADR 0033 moved the `md` label and icon up to `lg`'s, so `md` and `lg` differed by height only: 48 and 56px, 40 and 48px compact. After ADR 0052 they also shared padding and gap. Two things made `lg` redundant:

- **Density already does it.** `lg` in compact is 48px, the same as `md` in relaxed: a layout that wants a larger button can use relaxed density, so there were two controls for one difference.
- **It tests nothing else.** Components here are fixtures for the component tier (ADR 0034). `sm` and `md` already cover sizes that change with density; `lg` added 6 tokens, 40 Figma variants, and a docs section without a case the others miss.

`lg` was kept in ADR 0033 for prominent actions and touch-first layouts, such as a full-width call to action at the bottom of a phone screen. No product uses the button, so nothing needs it now. The other library compared in ADR 0052 has two sizes as well.

## Why it matters

- **The button has two sizes, `sm` and `md`.** `button/lg/*` (height, padding base and icon side, gap, icon, label) is removed, and `<pts-button size="lg">` falls back to the default `md`.
- **`size/control/lg` stays**, for large inputs and selects; its description no longer names buttons. `text/label-lg` stays: the `md` button uses it.
- **Breaking** (ADR 0014): removing tokens and an attribute value. In 0.x that bumps MINOR, with a `Breaking:` changeset.

## Trade-offs

- **A 56px button is gone.** A product that needs one again (a touch-first call to action) adds a size back with its own reason, rather than one kept for symmetry.
- **`size/control/lg` has no consumer** until an input or select exists.

## Implementation notes

- `tokens/src/component/button.tokens.json`: `button/lg` removed (6 tokens; the Button docs page counts 33). `size/control/lg` and `text/label-lg` descriptions updated.
- `apps/components/src/button.ts`: `ButtonSize` is `"sm" | "md"`, and the `size="lg"` block is gone. Storybook: the Large section, the `lg` option in Controls, and the `lg` button in Preview.
- Figma (2026-10-12): the 20 `lg` variants of `Button` and of `Button/Icon-button` (40 each now), the six `button/lg/*` variables, the Large table, and the `lg` buttons in Preview are removed; the grids have two size columns. Overview: Component 34, 339 variables. While checking Preview, the start icons of the instances moved to booleans in ADR 0052 had lost their color: setting an instance-swap property through the plugin API re-swaps the nested icon and drops its fill override. The 21 icons were bound back to the button's content color, and every instance's icons now match their main component.
- ADR 0032 and ADR 0033 are marked `amended by 0053`.

## Documented in

- `README.md` — Components
- `.claude/skills/figma/SKILL.md` — Components
- ADR 0032, ADR 0033 — amended: the sizes
