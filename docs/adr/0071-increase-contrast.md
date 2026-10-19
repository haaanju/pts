# 0071. Increase Contrast

- Status: proposed
- Date: 2026-10-20

## Decision

Proposed: derive iOS's increased-contrast colors from the tokens' own steps, one step further from the background for content, borders, and fills, and write them into each color set's high-contrast slots, without a new modifier, because the HIG asks every custom color for an increased-contrast variant, and the steps already hold the stronger values.

## What we learned

The HIG (Color, Accessibility) asks for light, dark, and increased-contrast variants of every custom color, and for the contrast a style lacks by default to be there when Increase Contrast is on. An asset catalog color set holds four values: light, dark, and each at high contrast. ADR 0063 left it out; ADR 0070 found it in the review. Options:

- **A `contrast` modifier in the resolver** (`normal`, `high`), with its own color files: the web could use it too (`prefers-contrast: more`), but every color gets a second value by hand in each theme, and `pts/contrast` and `pts/visible-steps` double their permutations.
- **Derived on iOS from the steps**: `content/subtle` takes `content/base`'s value, `border/subtle` `border/base`'s, a surface step the next stronger one. No new tokens; the rules hold, since a stronger step only raises contrast. The web and Android get nothing.
- **Leave it out**: the system's own colors (Toggle, Liquid Glass, text fields) still adapt; the tokens' don't.

## Why it matters

- The recommendation is the derived option: the HIG's ask, met with values the checks already cover, and no hand-edited colors.
- A `contrast` modifier is the step after it, if the web wants `prefers-contrast` too.

## Trade-offs

- **Derived values are a rule, not a design**: a designer may want a different high-contrast blue than the next step.
- **Two steps meet**: with `content/subtle` as `content/base`, the two read alike at high contrast, which is the point of the setting.

## Implementation notes

- To decide: the step map (which token takes which in high contrast), and whether `pts/contrast` should check the derived pairs.
- Then: `plugin-ios.ts` writes the color sets' `contrast: high` appearances; a test checks each against the map.

## Documented in

- `docs/progress.md`: Open questions
