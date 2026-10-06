# 0045. A Minimum Difference Between Surface Steps

- Status: accepted
- Date: 2026-10-06

## What we learned

`pts/visible-steps` only checked that the steps of a surface ladder, and hover and pressed against disabled, were not the same color. Measured in OKLab (ΔE ×100), three pairs differed by 1.8, under the usual noticeable difference of about 2:

| Theme | Pair | What it hides |
|---|---|---|
| light | `surface/subtle` ↔ `surface/strong` | hover on a card or another subtle surface |
| light | `surface/strong` ↔ `disabled/surface` | a hovered control against a disabled one |
| dark | `inverse/strong` ↔ `inverse/stronger` | hover against pressed on a primary button |

All three are one gap: `color/neutral/50` (`#f8f8f8`) to `color/neutral/100` (`#f2f2f2`). Every other ladder pair was 2.1 or more.

Three answers were weighed: change the color and require a minimum, document "differ at all" as the bar, or require 1.5 so nothing gets worse without changing a color. The last two accept steps that are hard to see.

## Why it matters

- **`color/neutral/100` is `#f0f0f0`** (was `#f2f2f2`). It sits halfway between its neighbors: ΔE 2.4 to `neutral/50`, 2.4 to `neutral/200` (was 3.0). Only light `surface/strong` and dark `inverse/strong` alias it.
- **`pts/visible-steps` requires ΔE 2** between every pair it checks, in every permutation (`TOO_CLOSE`, replacing `SAME_COLOR`, which ΔE 0 now covers).
- **A fix, not a breaking change** (ADR 0014): a value adjusted within its role.

## Trade-offs

- **2 is a rule of thumb.** Near white, where the light surfaces sit, a ΔE 2 step is still faint on many screens; the threshold catches steps that are too close, it doesn't promise they look distinct.
- **The direction of each step isn't checked** (darker in light, lighter in dark, intents on their hue). The tokens follow it; it waits with the other unchecked audit rules (`docs/progress.md`).

## Implementation notes

- `tokens/src/primitive/color.tokens.json`: `neutral.100` hex and components (240 ÷ 255 = 0.9412).
- `tokens/lint/rules/visible-steps.ts`: `deltaEOK` from `colorjs.io/fn` on `tokenToColor`, as `pts/contrast` computes its ratio.
- `tokens/lint/rules.test.ts`: a same-color case and a ΔE 1.8 case (the old `neutral.100`).
- Figma: the `color/neutral/100` variable; the hex labels on Palette and Button (four); the badges for `neutral/100` on Palette (W 1.14, B 18.43, were 1.12, 18.76) and for dark `inverse/strong` on Color and Button (9.10 against `surface/stronger`, was 9.26).

## Documented in

- `CLAUDE.md` — Accessibility (Visible steps)
- `docs/progress.md` — Open questions
