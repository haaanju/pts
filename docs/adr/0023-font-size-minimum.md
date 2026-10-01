# 0023. Font Size Minimum

- Status: accepted (amended by 0028)
- Date: 2026-09-28

## What we learned

ADR 0021 made 12px the minimum for text: `text/caption` moved from `font-size/100` (10px) to `font-size/200`, and `a11y/min-font-size` blocks any text style below 12px. `font-size/100` stayed, because removing a token is breaking.

That left the minimum half enforced. `a11y/min-font-size` checks `typography` composites only, so the scale still offered a 10px step and product code could use `var(--font-size-100)` directly. The docs did: the palette ramp's hex and alias labels were set in `font-size/100`. A description saying "don't use it for text" is not a check, and a font-size token has no other use.

## Why it matters

- **`font-size/100` is removed.** The scale starts at `font-size/200` (12px), so every step is a readable size. Nothing is published yet, so the breaking change costs nothing now and more later.
- **The other steps keep their numbers.** `font-size/N` is ordinal with `400` = 16px; renumbering would rename every step for no gain. The scale reads 200–1000.
- **The scale is checked too.** A new rule, `pts/min-font-size`, reports any `font-size/*` step below 12px. The built-in rule can't: it reads composites, not the dimensions they alias.
- **`dimension/10` stays.** Primitives are a value scale, not a list of approved text sizes; the semantic tier decides what 10px may be used for.

## Implementation notes

- `tokens/src/semantic/typography.tokens.json`: `font-size/100` removed.
- `tokens/lint/rules/min-font-size.ts`: the new rule, configured with `minSizePx: 12` next to `a11y/min-font-size` in `tokens/terrazzo.config.ts`. Verified by adding a 10px step back: `npm run check` failed naming `font-size.100`.
- `apps/storybook/src/docs.css`: the palette ramp labels use `font-size/200`.
- Figma: delete the `font-size/100` variable from the `Semantic` collection and its row from the Typography specimen.
- Breaking: the next release is `0.5.0` (ADR 0014).

## Documented in

- `CLAUDE.md` — Commands (`pts/*` rules), Token Rules › Semantic (`font-size`)
- `CONTRIBUTING.md` — what the checks catch
- `docs/adr/0021-terrazzo-lint.md` — amended by this ADR
