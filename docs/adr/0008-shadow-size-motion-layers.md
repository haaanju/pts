# 0008. Shadow, Size, Breakpoint, Motion, and Z-index Tokens

- Status: accepted (amended by 0024, 0051)
- Date: 2026-09-25

## What we learned

After color, the remaining gaps for building real components were depth (shadows, scrims), sizing (icons, control heights), responsive breakpoints, motion, and stacking order. Shadows are the second category whose values depend on the theme: at the same opacity, a shadow that reads on white almost disappears on a near-black page.

## Why it matters

- **Shadows are per theme** (`semantic/shadow.{light,dark}.tokens.json`) with identical geometry and higher opacity in dark (40–70% vs 10–20%). They reuse the resolver's `theme` modifier, so no new mechanism is needed.
- **No standalone opacity tokens.** Translucency is only needed for shadows and the modal scrim, so it lives in `palette/black-alpha/N` colors. `color/background/overlay` is the scrim.
- **Control heights are shared** (`size/control/sm, md, lg` = 32, 40, 48) so buttons, inputs, and selects align in a row; `lg` meets the 44–48px touch target guidance.
- **Motion has primitive and semantic layers** like other categories: `duration/N` and `easing/*` primitives, `motion/duration/*` and `motion/easing/*` semantics.
- **Z-index skips the primitive tier.** Stacking order has no meaning outside its role, so `z-index/*` holds values directly. This is a documented exception to "semantic only references primitives".
- **Dark CSS groups are derived from the resolver.** Adding shadows exposed that the CSS config listed theme groups by hand (`color.**` only), so dark shadows were silently missing. `terrazzo.config.ts` now reads the dark context files to find them.

## Implementation notes

- Shadows: `sm` 0/1/2, `md` 0/4/8, `lg` 0/8/16, `xl` 0/16/32 (x/y/blur, spread 0).
- Breakpoints: 640, 768, 1024, 1280 as `dimension` primitives. They are emitted as CSS variables for reference only, since custom properties cannot be used inside media queries.
- Easing: standard `(0.2, 0, 0, 1)`, enter/decelerate `(0, 0, 0, 1)`, exit/accelerate `(0.3, 0, 1, 1)`.
- Z-index: base 0, dropdown 1000, sticky 1100, overlay 1300, modal 1400, popover 1500, toast 1600, tooltip 1700.
- `npm run check` exempts `background/overlay` and now errors if a translucent color ever enters a contrast pair, since its effective color depends on what is underneath.

## Documented in

- `CLAUDE.md` — Structure, Commands, Token rules
- `packages/tokens/src/pts.resolver.json`
- `packages/css/terrazzo.config.ts`
