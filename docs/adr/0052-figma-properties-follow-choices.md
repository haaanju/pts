# 0052. Figma Properties Follow the Designer's Choices

- Status: accepted
- Date: 2026-10-12

## What we learned

The Figma `Button` set had 240 variants: Variant 4 × Size 3 × State 5 × Icon 4. `Icon` (None, Start, End, Both) was a variant property, not a boolean, because the side with an icon pads one `padding/*` step less (ADR 0032) and a boolean can only show or hide a layer, not change a padding.

Compared with another team's button library (40 variants: Size 2 × Style 4 × State 5, icons as booleans, the same padding on both sides), the count came from one rule. Both libraries keep icon-only buttons in a separate set, since a square can't come from a boolean either. The comparison showed two things:

- **The token binding is right here and stays.** The other library binds colors to semantic tokens directly and types heights, paddings, and gaps as numbers, so it has no density mode and a padding change means editing every variant. Here every value goes through `button/*`, and a frame's modes switch theme, density, and shape for the whole set.
- **The property model leaked an implementation detail.** In code, `<pts-button>` has no icon property: an icon goes in the `start` or `end` slot, the element sees it (`has-start`, `has-end`), and the padding follows. The padding is a consequence, but the Figma set offered it as a choice. Variants multiply where booleans add, so every rule of this kind would multiply the set again.

The owner sketched a way to keep the padding rule with booleans: the button pads `padding/icon-side`, and a frame around the label adds the difference. Padding only one side of the label frame fits one icon arrangement; padding both sides and taking the same amount off the gap fits all four:

- without an icon, a side is `icon-side` + inset = `padding/base`;
- next to an icon, the space is gap-inner + inset = the button's gap.

The inset is `padding/base` − `padding/icon-side`, and the gap-inner is the button's gap minus the inset, so the relation holds only while the gap is at least the inset. It didn't for `md` and `lg`: `padding/xl` (24 / 20) − `padding/lg` (16 / 12) is 8px, more than the compact gap, `gap/within/sm` (4), which left −4px. A variable holding a negative space makes no sense. Two fixes were tried in Figma:

- **A wider gap for `md` and `lg`**, `gap/within/md` (12 / 8): every gap-inner becomes 4 / 0, but the icon moves away from the label, the opposite of what the owner wanted.
- **A smaller step for `padding/xl`**, adjusted by eye in Figma: the owner set `md`'s label inset to 4px, which keeps the 8 / 4 gap and makes the side without an icon 20 / 16. That is `padding/xl` at 20 / 16.

The second won. `padding/*` was 4, 8, 12, 16, 24 (compact 2, 4, 8, 12, 20); with `xl` at 20 (compact 16) every step is 4px apart, so ADR 0032's "one padding step less" on the icon side is 4px at every size, and the inset is the same everywhere.

## Why it matters

- **A rule for Figma components: variant and boolean properties are what a designer chooses, as the code's attributes and slots are; what follows from a choice is built from layers and variables.** A new property passes the test "is this an attribute or a slot in code?"
- **The `Button` set has 60 variants**: Variant × Size × State. `Start icon` and `End icon` are booleans that show the icon layers, next to the instance swaps (`↳ Start icon`, `↳ End icon`). The icon side still pads one step less: in all 60 × 4 arrangements and both densities, the label sits at the expected padding (plus the 1px border, which the code's border adds too).
- **`padding/xl` is 20px relaxed and 16px compact**, from 24 and 20: `md` and `lg` buttons are 8px narrower, and cards, modals, and other large containers pad 4px less. A value change within the role: a patch with a `Fix:` changeset (ADR 0014).
- **Figma's layers differ from the code**, and the set's description says so: the button pads `icon-side`, the label frame adds the inset, and `button/gap-inner` makes up the gap, where the code pads each side. Dev Mode shows the Figma layers' paddings; the `button/*` tokens are the reference.

## Trade-offs

- **Five Figma-only variables**: `Spacing/gap/button-inner` in `Density` (`space/100` relaxed, `space/0` compact), and `button/gap-inner` and `button/<size>/label-inset` (`space/100` at every size) in `Component`. They alias the scale, so no raw number is kept, but the relation is worked out by hand: a change to a button gap or padding means checking them, and `npm run check` can't see Figma.
- **The relation holds only while the gap is at least the inset.** A smaller gap, or icon-side more than one 4px step below base, would need a negative gap-inner again: revisit this decision rather than add one.
- **Large containers pad less.** `progress.md` already asked whether they need more than `padding/xl`; at 20px that question is closer, and the answer would be a new role token, not a larger `xl`.

## Implementation notes

- `tokens/src/semantic/spacing.relaxed.tokens.json`: `padding/xl` → `{space.500}`; `spacing.compact.tokens.json`: `{space.400}` (`pts/density-order`: the next smaller step). No component token changes: `button/md` and `lg` keep `padding/xl` and `padding/lg`, and their gap stays `gap/within/sm`.
- Figma (2026-10-12): `Spacing/padding/xl` aliases `space/500` and `space/400`; the five variables above. In each of the 60 `Icon=None` variants, the label sits in a `label` frame bound to the size's `label-inset`, and the start and end icon layers, copied from the `Both` variant of the same Variant, Size, and State, show with the booleans; the button pads `padding/icon-side` and gaps `button/gap-inner`. The 15 instances using `Icon=Start` (the Preview, the owner's sketches, a sandbox mock) moved to the booleans before the other 180 variants were deleted. The set's grid has a column per size; the Spacing page's `padding/xl` row and the Medium and Large tables show 20 / 16; Overview: Density 16, Component 40, 345 variables.
- `docs.css` lays out one docs block with `padding/xl`; it pads 4px less.
- ADR 0032 is marked `amended by 0052`.

## Documented in

- `.claude/skills/figma/SKILL.md` — Collections, Components
- ADR 0032 — amended: `padding/xl`'s value, and the `Icon` variant
