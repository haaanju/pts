# 0005. Color Tokens and Theme Resolver

- Status: proposed
- Date: 2026-09-25

## What we learned

The starting palette came from a Figma exploration file where colors were drawn as shapes and chips, not Variables or Styles. It had a 12-step neutral ramp, white and black, and five hues with five steps each, named "Low / Medium / Normal / High contrast / Highlight". Those step names assume a dark background: the darkest swatch is "low contrast". On a light theme the meaning flips. The file's "Semantic" section was empty.

Color is also the first category whose values change per theme. DTCG 2025.10 models this with a resolver document (sets + modifiers), which Terrazzo 2 supports natively. The older `$extensions.mode` approach is deprecated there.

## Why it matters

- **Primitives are named by hue and lightness** (`palette/red/500`), not by role or contrast. Lightness is theme-neutral; roles and contrast belong to the semantic layer, where they can differ per theme.
- **Primitive group is `palette`, semantic group is `color`**. This follows the rule that primitive and semantic top-level groups never share a name.
- **Semantic names follow property → role → emphasis** (`color/background/danger-subtle`). Properties are `background`, `foreground`, and `border`. `foreground` pairs naturally with `background` and covers icons as well as text; `content` was rejected because it collides with the CSS `content` property and "page content".
- **Foreground tokens name their background.** `foreground/on-X` is only used on `background/X`; foreground tokens without `on-` are used on `background/default` or `background/subtle`. Every foreground therefore has a known backdrop, so contrast can be verified exhaustively.
- **Hue palettes have 10 steps (50–900).** The Figma values stay at 100/300/500/700/900; 200/400/600/800 are OKLab midpoints and 50 is halfway between white and 100. The extra steps give room to satisfy contrast without leaving the hue family.
- **Themes use a resolver** (`pts.resolver.json`): a `base` set for mode-independent tokens and a `theme` modifier with `light` and `dark` contexts. Each context has its own file with an identical set of token names. New axes (density, brand) can be added as further modifiers.
- **Contrast is checked, not assumed, in both themes.** Text pairs must reach 4.5:1 (WCAG 1.4.3). UI boundaries (`border/strong`, `border/<role>`, solid `background/<role>`) must reach 3:1 against the page backgrounds (WCAG 1.4.11). `border/default` is a decorative divider and exempt. Steps were chosen as the nearest step to a preferred one that satisfies every constraint; 47 pairs per theme pass.

## Implementation notes

- Hue mapping from Figma: Highlight → 100, High → 300, Normal → 500, Medium → 700, Low → 900. Neutral steps: 50, 100, 200–900, 950, 1000.
- Unlabeled Figma rows were assigned roles: red → `danger`, blue → `info`. Orange → `warning`, green → `success`, purple → `recommend` follow the Figma labels.
- Contrast forced several departures from a uniform mapping:
  - Light solid `background/warning` and `background/success` use 600, because orange-500 and green-500 are under 3:1 against white.
  - Dark solid `background/recommend` uses purple-400, because purple-500 is under 3:1 against the dark page.
  - `foreground/on-recommend` is white in light (on purple-500) and black in dark (on purple-400). The Figma chips put black on purple-500, which is 3.2:1.
  - `border/strong` is neutral-600 in both themes; neutral-400 was under 3:1 against white.
- Light: role text 700, text on subtle 800, borders 600, subtle backgrounds 100. Dark: role text 300, text on subtle 200, borders 400, subtle backgrounds 900.
- Dark defaults: `background/default` = neutral-950 (#181818), not the near-black neutral-1000.
- `npm run check` (`packages/tokens/scripts/check.ts`) re-derives the contrast pairs from token names and fails on any violation, so the rule stays enforced as tokens change.
- CSS output (`@pts/css`): light on `:root`; dark under `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `[data-theme="dark"]`. Dark blocks include only `color.**` tokens. Colors are emitted as hex (`legacyHex`).
- The Figma file itself was not modified.

## Documented in

- `CLAUDE.md` — Structure, Commands, Token rules
- `packages/tokens/src/pts.resolver.json`
- `packages/tokens/src/semantic/color.{light,dark}.tokens.json`
- `packages/css/terrazzo.config.ts`
