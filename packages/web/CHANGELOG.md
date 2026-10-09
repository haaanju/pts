# @pts/web

The changelog of every `@pts/*` package, which share one version (ADR 0014). Entries from 0.9.4 on come from changesets (ADR 0035); earlier ones are the release tag messages.

## 0.9.8

### Patch Changes

- New: `motion/easing/emphasized` (0.5, 0, 0, 1) for dialogs, sheets, and screen changes, and `motion/duration/slower` (600ms) for full-screen transitions. Fix: `motion/duration/normal` is 200ms (was 300) and `motion/duration/slow` 400ms (was 500), the values used for tooltips and for dialogs and sheets. New primitives `easing/emphasized`, `duration/400`, and `duration/600` (ADR 0051).

## 0.9.7

### Patch Changes

- New: `radius/2xl` (32px) and `radius/container`, the corners of cards, panels, dialogs, and sheets, set by the `shape` modifier: 8px (`radius/md`) in soft, 32px (`radius/2xl`) in round. The `[data-shape]` blocks and the `roomy-app` and `dense-app` outputs include it. `radius/md`, `lg`, and `xl` have new descriptions pointing containers at the role; no value changes (ADR 0049).

## 0.9.6

### Patch Changes

- New: per-product outputs, `@pts/web/products/<name>.css` and `@pts/web/products/<name>.js` (typed by `<name>.d.ts`), for two example products: `dense-app` (density compact) and `roomy-app` (density relaxed). A product's CSS holds every token at its density on `:root`, keeps the theme blocks and the viewport media query, and has no `[data-density]` blocks. Its JS holds resolved values from Terrazzo's resolver, one token set per theme × viewport (ADR 0047). `tokens.css`, `tokens.js`, and `tokens.scss` are unchanged.
- New: a `shape` modifier (`soft`, the default, and `round`) and the `radius/control` token it sets: 8px (`radius/md`) in soft, fully rounded (`radius/full`) in round. `tokens.css` adds `[data-shape="soft"|"round"]` blocks, which work on any element like `data-density`. `button/radius` now aliases `radius/control`, so it is still 8px by default and a pill in round. The example product `roomy-app` fixes `shape: round` and `dense-app` `shape: soft`, so their JS `apply()` takes a `shape` input too (ADR 0048).

## 0.9.5

### Patch Changes

- Fix: color/neutral/100 is #f0f0f0 (was #f2f2f2), so light surface/strong (hover) and dark inverse/strong (hover) are visibly apart from the steps next to them, ΔE 2.4 instead of 1.8 (ADR 0045).

## 0.9.4

### Patch Changes

- Fix: the packages are licensed under MIT (`LICENSE`); the fonts in `@pts/web` stay under the SIL Open Font License 1.1, so its `license` is `(MIT AND OFL-1.1)`. No token changes.

## 0.9.3

The md button (ADR 0033). Fix: button/md/label aliases text/label-lg (16/24) and button/md/icon aliases size/icon/md (24), like lg, so md and lg differ by height only. The descriptions of text/label-md, text/label-lg, font-size/text/sm, and font-size/text/md say which controls use them. Nothing is renamed or removed.

## 0.9.2

Button (ADR 0032). New: a component tier with 39 button/* tokens aliasing semantic tokens, text/label-lg, the pts/component-pairs lint rule, and @pts/components with <pts-button> (Lit). tokens.css adds the --button-* variables to :root and repeats them in the theme and density blocks; nothing is renamed or removed.

## 0.9.1

New outputs in @pts/web (ADR 0030). No token changes; tokens.css is unchanged.

JS/TS and SCSS
- @pts/web/tokens.js (+ tokens.d.ts), from @terrazzo/plugin-css-in-js: nested camelCase objects of CSS variable references, e.g. surface.subtle = "var(--surface-subtle)"; text styles as { fontFamily, fontSize, fontWeight, letterSpacing, lineHeight }
- @pts/web/tokens.scss, from @terrazzo/plugin-sass: t.token("padding.md") and @include t.typography("text.heading-md")
- Both are references, not values: import tokens.css too; theme, density, and viewport keep working through it
- Primitives included, as in tokens.css
- @pts/web is an ES module package ("type": "module")

## 0.9.0

Breaking: the default display sizes at :root are the narrow ones, and the output gains an @media (min-width: 768px) block. Token names don't change.

Viewport (ADR 0029)
- New viewport modifier: narrow (default, mobile first) and wide, from breakpoint/md (768px)
- Changes with the viewport: font-size/display/*, line-height/display/*, letter-spacing/display/*
- Narrow: display/xl 64px (line 64, -1.25px), display/lg 40px (line 44, -0.5px); display/md and display/sm unchanged
- Wide: the values so far (104, 64, 40, 24px)
- text/* styles alias the display tokens and follow without changes
- CSS: :root holds the narrow sizes; @media (min-width: 768px) { :root { ... } } repeats only the viewport tokens. No attribute: the viewport is the window
- letter-spacing/display/md description: about -0.0125em (was -0.015em)

Tooling
- pts/type-scale, pts/min-font-size, and pts/line-height-grid check every theme x density x viewport permutation; type-scale allows two equal steps where another permutation sets them apart

Docs and Figma
- Storybook shows the display groups with narrow and wide columns
- Figma: a Viewport collection (narrow, wide) with the display variables, plus Figma-only line-height/display/*-px that the display and heading text styles bind

## 0.8.0

Breaking: gap and typography token names change, and the [data-theme="light"] block now holds only the theme groups.

Density (ADR 0025)
- New density modifier: relaxed (default, the values so far) and compact (one step tighter)
- Changes with density: padding/* (compact 2, 4, 8, 12, 20px), gap/within/* (2, 4, 8, 12), gap/between/* (16, 20, 28), size/control/* (28, 40, 48)
- CSS: data-density="compact" or "relaxed" on <html> or any element; [data-density] blocks repeat only the density tokens
- Selector change: [data-theme="light"] repeats only the theme groups, so a light region inside a compact page stays compact

Gaps within and between groups (ADR 0027)
- gap/xs, sm, md, lg -> gap/within/xs, sm, md, lg (4, 8, 12, 16px)
- gap/xl -> gap/between/md (24px)
- New gap/between/sm (20px) and gap/between/lg (32px)

Type scale (ADR 0028)
- font-size/200, 300, 400 -> font-size/text/xs, sm, md (12, 14, 16); font-size/600 -> font-size/text/lg (20); font-size/500 (18) removed
- font-size/700 -> font-size/display/sm (24); font-size/800, 900, 1000 -> font-size/display/md, lg, xl (40, 64, 104)
- line-height/tight, normal, loose -> line-height/<zone>/<step>, one per font size on the 4px grid
- letter-spacing/tighter, tight -> letter-spacing/display/*; ratio/* removed
- Text styles: display-lg 104, display-md 64, heading-lg 40, every heading bold, body-lg 20

Tooling
- pts/density-order, pts/gap-order, pts/type-scale, and pts/line-height-grid; the pts/* rules check every theme x density permutation

## 0.7.0

Breaking: layout/100, layout/200, and layout/300 are removed (ADR 0026). Use gap/section/sm, md, and lg (same values: 40, 48, 64px), or space/1000, 1200, 1600 where no role fits.

Tokens
- space/* is the one spacing scale, 0-64px: space/1000, 1200, 1600 continue N / 25 = px, and space/700 (28px) fills the gap between 24 and 32
- New primitive dimension/28
- New role tokens that alias the scale: padding/xs-xl (inside an element), gap/xs-xl (between elements), gap/section/sm-lg (between page regions)

Tooling
- pts/tier-aliases lets padding/* and gap/* alias the space scale, like text/*

Docs
- The Spacing page shows Padding, Gap, and the Space scale

## 0.6.0

Breaking: dimension/640, dimension/768, dimension/1024, and dimension/1280 are removed (ADR 0024). They existed only for the breakpoints; primitives are not for product code, so nothing should depend on them.

Tokens
- breakpoint/sm, md, lg, xl hold their values directly (640, 768, 1024, 1280px), like z-index; names, values, and CSS variables are unchanged
- The dimension scale is 0-64 plus max

Tooling
- pts/tier-aliases allows raw values in breakpoint as well as z-index

## 0.5.1

Tokens
- size/icon/md 20 → 24px, size/icon/lg 24 → 40px
- size/control/md 40 → 48px, size/control/lg 48 → 56px; md now meets the 44-48px touch target
- New primitive dimension/56
- motion/duration/fast, normal, slow 100, 200, 300ms → 150, 300, 500ms
- No token is renamed or removed

Docs
- Every token section shows its path (space/*), leads match the Figma specimens, and token paths read with slashes
- Palette shows the Base section (white, black)
- The z-index stack is an aligned column, front to back, and no longer overlaps its table

Figma
- Semantic variables sit in one folder per docs page (Spacing/space/400)
- Every variable's code syntax is its CSS variable

## 0.5.0

Breaking: font-size/100 (10px) is removed (ADR 0023). The scale starts at font-size/200 (12px), the minimum for text. Use font-size/200 or a text style instead.

Tokens
- The other font-size steps keep their names and values
- dimension/10 (primitive) stays

Tooling
- New lint rule pts/min-font-size: npm run check fails on any font-size step below 12px (a11y/min-font-size checks text styles only)

Docs
- Token descriptions show in the docs, between the name and the CSS variable
- The palette ramp labels use font-size/200

## 0.4.1

Fix: text/caption is 12px (font-size/200, was font-size/100 = 10px). 12px is now the minimum for text styles.

Tokens
- Every semantic token has a $description saying when to use it (88 new: space, layout, radius, stroke, focus-ring, font-*, line-height, letter-spacing, text, size, breakpoint, motion, z-index, shadow)
- No names change; the CSS output format is unchanged

Tooling
- npm run check is tz check in tokens/: Terrazzo's built-in rules plus pts/* rules that check every theme (ADR 0021). It now catches a broken alias or a contrast failure in the dark theme. npm run lint is removed.
- Token JSON is edited by hand, color included; the color generator is removed (ADR 0020)
- CONTRIBUTING.md and a pull request template for designers
- Terrazzo over Style Dictionary recorded (ADR 0022)
- CI actions updated to v7 (Node 24)

## 0.4.0

Breaking: semantic color names (ADR 0019)
- Layers: background, surface/{subtle, strong, stronger}, inverse/{base, strong, stronger}
- One content group: content/{base, subtle}, content/inverse/{base, subtle}
- Hover and pressed are strong / stronger in every group
- disabled/{surface, content, border}
- Intents: intent/<role>/{surface/{subtle, base, strong, stronger}, content/{base, inverse}, border/{base, subtle}}
- Removed: background/surface/raised (cards use surface/subtle), intent content/subtle (use content/base)
- New: strong / stronger on warning, success, info, discovery
- Every semantic color has a $description
- Renamed tokens keep their values, except light cards (white -> neutral.50) and text on an intent's soft fill

## 0.3.0

Breaking: semantic color names (ADR 0017, 0018)
- Neutral colors: background, content, border (canvas, surface, inverse)
- Status colors: intent/<danger|warning|success|info|discovery>/{background,content,border}
- default, on-, and primary are gone; recommend is now discovery
- Primitive palette group renamed to color (--palette-* -> --color-*)
- Warning, success, info, discovery drop hover and pressed
- New: always/white, always/black, content/inverse/muted, intent border/subtle
- Renamed variables keep their values, except tooltips now use the inverse fill

## 0.2.0

Breaking: package names and import paths (ADR 0016)
- Token source moved to tokens/, docs to apps/storybook
- @pts/css and @pts/fonts merged into @pts/web:
  @pts/css   -> @pts/web/tokens.css
  @pts/fonts -> @pts/web/fonts.css
- Built CSS unchanged

## 0.1.1

- Background states visible on every surface (neutral.850), enforced by npm run check
- Color token generator in the repository
- IBM Plex Mono and Serif bundled with the tokens
- Type-checked scripts, Node >=22.18, stricter pre-commit, CI workflow
- ADRs accepted; ADR 0015 records the audit

## 0.1.0

First tagged baseline (ADR 0014).
