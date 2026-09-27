# 0006. Primary, Interaction States, Focus, and Disabled Colors

- Status: accepted (amended by 0015, 0017, 0018)
- Date: 2026-09-25

## What we learned

The first color set (ADR 0005) only had status roles. Building an actual button needs four more things: a primary color, hover and pressed states, a visible focus indicator, and a disabled look. Once interaction states exist, the text on a solid background has to stay readable across three backgrounds, not one. That turned out to be the binding constraint: several base steps from ADR 0005 could not carry the same text color through a darker (or lighter) hover and pressed state.

## Why it matters

- **Primary is monochrome** (neutral: near-black in light, near-white in dark). It never competes with status colors, so a danger button can't be mistaken for the main action.
- **States are explicit tokens** (`-hover`, `-pressed`), not translucent overlays. Every rendered color exists as a token, so every state is contrast-checked and maps directly to Figma.
- **State direction follows the theme**: light gets darker on interaction, dark gets lighter.
- **Solid backgrounds are picked as a trio.** Base, hover, and pressed are consecutive palette steps that all carry one `on-` color at 4.5:1 and stay at 3:1 against every page background.
- **Page backgrounds include `default-hover` and `default-pressed`.** Plain foregrounds and borders must pass on those too, because list items and ghost buttons put text on them.
- **Focus ring is monochrome** (`border/focus`, 2px width, 2px offset), checked at 3:1 against page backgrounds. The offset keeps it separate from the near-black primary button in light mode.
- **Disabled colors are exempt from contrast**, as WCAG exempts inactive components. They are excluded from `npm run check` by name.

## Implementation notes

- Primary: light `neutral.900 → 950 → 1000` with white text; dark `neutral.200 → 100 → 50` with black text.
- Role solids moved to satisfy the trio constraint:
  - Light: danger 500→600, info 500→600, warning 600→700, success 600→700; recommend stays 500. All light role solids now use white text (previously black for most).
  - Dark: danger 500→400, info 500→400, recommend 400→300; warning and success stay 500. All dark role solids use black text.
- Stricter page backgrounds shifted some dark foregrounds: `foreground/muted` neutral.500→400, `foreground/danger` red.300→200, `border/strong` neutral.600→500, `border/recommend` purple.400→300.
- Disabled: light background neutral.100, foreground neutral.400, border neutral.200; dark neutral.900 / 600 / 800.
- `npm run check` now covers `on-X` on `X`, `X-hover`, `X-pressed`, and uses four page backgrounds. 304 pairs pass across both themes.

## Documented in

- `CLAUDE.md` — Token rules (color, focus-ring, accessibility)
- `packages/tokens/src/semantic/color.{light,dark}.tokens.json`
- `packages/tokens/src/semantic/border.tokens.json` — `focus-ring`
- `packages/tokens/scripts/check.ts`
