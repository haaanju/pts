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

The inset is `padding/base` − `padding/icon-side`: 4px for `sm` and 8px for `md` and `lg`, the same in both densities. The gap-inner is the button's gap minus the inset. With every gap at `gap/within/sm` (8 / 4), `md` and `lg` in compact needed 4 − 8 = −4px. A variable holding a negative space makes no sense, so `md` and `lg` take the next gap step instead, `gap/within/md` (12 / 8). Then every size's gap-inner is 4px relaxed and 0 compact.

## Why it matters

- **A rule for Figma components: variant and boolean properties are what a designer chooses, as the code's attributes and slots are; what follows from a choice is built from layers and variables.** A new property passes the test "is this an attribute or a slot in code?"
- **The `Button` set has 60 variants**: Variant × Size × State. `Start icon` and `End icon` are booleans that show the icon layers, next to the instance swaps (`↳ Start icon`, `↳ End icon`). The icon side still pads one step less, measured equal to the old variants in all 60 × 4 arrangements and both densities.
- **`md` and `lg` buttons space icon and label 12px relaxed and 8px compact**, from 8 and 4. A 24px icon next to 16px text had 4px in compact, which read tight; `sm` keeps 8 / 4 for its 16px icon. A value change within the gap's role: a patch with a `Fix:` changeset (ADR 0014).
- **Figma's layers differ from the code**, and the set's description says so: the button pads `icon-side`, the label frame adds the inset, and `button/gap-inner` makes up the gap, where the code pads each side. Dev Mode shows the Figma layers' paddings; the `button/*` tokens are the reference.

## Trade-offs

- **Five Figma-only variables**: `Spacing/gap/button-inner` in `Density` (`space/100` relaxed, `space/0` compact), and `button/gap-inner` and `button/<size>/label-inset` (`space/100` for sm, `space/200` for md and lg) in `Component`. They alias the scale, so no raw number is kept, but the relation is worked out by hand: a change to a button gap or padding means checking them, and `npm run check` can't see Figma.
- **The relation holds only while the gap is at least the inset.** A smaller gap, or a larger difference between `padding/base` and `icon-side`, would need a negative gap-inner again: revisit this decision rather than add one.
- **A wider gap for `md` and `lg`.** Products using those buttons with icons see 4px more between icon and label.

## Implementation notes

- `tokens/src/component/button.tokens.json`: `button/md/gap` and `button/lg/gap` alias `{gap.within.md}`. No build, lint, or docs change: the component token tables show the new values.
- Figma (2026-10-12): the five variables above; `button/md/gap` and `button/lg/gap` alias `Spacing/gap/within/md`. In each of the 60 `Icon=None` variants, the label sits in a `label` frame bound to the size's `label-inset`, and the start and end icon layers, copied from the `Both` variant of the same Variant, Size, and State, show with the booleans; the button pads `padding/icon-side` and gaps `button/gap-inner`. The 15 instances using `Icon=Start` (the Preview, two sketches, a sandbox mock) moved to the booleans before the other 180 variants were deleted. The set's grid has a column per size; the Medium and Large tables show the new gap; Overview: Density 16, Component 40, 345 variables.
- ADR 0032 is marked `amended by 0052`.

## Documented in

- `.claude/skills/figma/SKILL.md` — Collections, Components
- ADR 0032 — amended: the md and lg gap, and the `Icon` variant
