# 0071. Increase Contrast

- Status: accepted
- Date: 2026-10-20

## Decision

Chosen: iOS's increased-contrast colors are derived from the tokens' own steps, each color taking the next step of its ladder, one further from the background, written into each color set's high-contrast slots, without a new modifier, because the HIG asks every custom color for an increased-contrast variant, and the steps already hold stronger values whose pairs `pts/contrast` checks.

## What we learned

The HIG (Color, Accessibility) asks for light, dark, and increased-contrast variants of every custom color, and for the contrast a style lacks by default to be there when Increase Contrast is on. An asset catalog color set holds four values: light, dark, and each at high contrast. ADR 0063 left it out; ADR 0070 found it in the review. Options:

- **A `contrast` modifier in the resolver** (`normal`, `high`), with its own color files: the web could use it too (`prefers-contrast: more`), but every color gets a second value by hand in each theme, and `pts/contrast` and `pts/visible-steps` double their permutations.
- **Derived on iOS from the steps**: chosen (owner, 2026-10-20). No new tokens.
- **Leave it out**: the system's own colors (Toggle, Liquid Glass, text fields) still adapt; the tokens' don't.

The step map: within a ladder (`subtle`, `base`, `strong`, `stronger`), a color takes the next step that exists:

- `content/subtle` → `content/base`, `content/inverse/subtle` → `content/inverse/base`
- `border/subtle` → `border/base`, and each intent's
- `surface/subtle` → `surface/strong` (the neutral ladder has no `base`), `surface/strong` → `stronger`
- `inverse/base` → `strong` → `stronger`, and each intent's `surface/base` → `strong` → `stronger`
- **Unchanged**: the strongest step of a ladder (`content/base`, `border/base`, `stronger`), an intent's `surface/subtle` (its `content/base` is checked on it alone, so a stronger soft fill would form an unchecked pair), `background`, `border/focus`, `disabled/*`, `utility/*`, `always/*`.

22 of the 60 colors change.

## Why it matters

- **Every pair at high contrast is a pair `pts/contrast` already checks**: a derived color is a token of the same role, paired with the same backgrounds. A test proves it from `tokens/lint/pairs.ts`, so no lint rule is needed.
- **The web and Android get nothing**: `prefers-contrast` and Android's high-contrast text would need the modifier.

## Trade-offs

- **Derived values are a rule, not a design**: a designer may want a different high-contrast value than the next step.
- **Two steps meet**: `content/subtle` reads as `content/base`, `surface/strong` as `stronger`. iOS has no hover, and pressed is native, so only the soft and strong levels lose their difference, which is the point of the setting.

## Implementation notes

- `packages/ios/terrazzo.config.ts`: `contrast`, the map, derived from the names. `plugin-ios.ts`: a `contrast: high` value, light and dark, in each color set the map changes.
- `packages/ios/test/output.test.ts`: the map's steps and exclusions; every pair of `contrastPairs` maps to one of `contrastPairs`; each high-contrast value equals the resolver's for the next step in both themes, and a color the map leaves has none.
- Checked: `npm test` (the iOS suite: 21 tests; changing `contentSubtle`'s generated high-contrast red by hand fails one), `npm run compile -w @pts/ios`; the demo's Home in the simulator with Increase Contrast off and on (`simctl ui increase_contrast`), light and dark: the card one step darker (lighter in dark), its subtle text as `content/base`, the divider stronger.

## Documented in

- `docs/how-it-works.md`: the iOS row
- `docs/progress.md`: Open questions (removed)
