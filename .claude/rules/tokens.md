---
paths:
  - "tokens/**"
  - "packages/**"
  - "apps/components/**"
  - "apps/storybook/**"
---

# Token rules

## Structure

- **Tiers**: primitive → semantic → component. Semantic tokens reference primitives only. Exceptions: composite tokens (`text/*`) reference semantic property tokens; `padding/*` and `gap/*` reference the `space` scale (ADR 0026), and `radius/control` and `radius/container` the `radius` scale (ADR 0048, 0049); `z-index`, `breakpoint`, and `line-height` hold values directly, since they have no meaning outside their role (ADR 0024, 0028).
- **Component tier** (ADR 0032): `component/<component>.tokens.json`, in `sets.base`. Component tokens reference semantic tokens only, with no exceptions; a value no semantic token holds is a missing semantic token. Names: `<component>/<variant>/<surface | content | border>/<state>` for colors (a property that changes with state names every state, `rest` included, and its states resolve differently, checked by `pts/component-states`; Ghost's fill, transparent at rest, is the one exception; one that doesn't change is a single token), `<component>/<size>/<part>` for sizes. A component-specific state that changes every color is the variant: Switch's `on` and `off`, with its disabled colors in `switch/disabled/<on | off>/*` (ADR 0077). State words (`rest`, `hover`, `pressed`) appear only in this tier. A variant's `content` (or `content/<state>`, with that state's fill) and `surface/*` must alias a pair `pts/contrast` checks (`pts/component-pairs`). The build repeats a component token in the theme, density, and shape blocks when its aliases reach a token of that modifier.
- **Group names**: primitive and semantic top-level groups never share a name (Terrazzo merges all files into one namespace): primitive `weight` ↔ semantic `font-weight`.
- **Format**: every token declares `$type`; no group-level `$type` inheritance. Every semantic token has a `$description` that says when to use it, the same in every context file and in Figma.
- **Values**: dimensions in `px` object form, `{ "value": 16, "unit": "px" }`. Colors in DTCG 2025.10 object form, `{ "colorSpace": "srgb", "components": [r, g, b], "hex": "#rrggbb" }` (components 0–1, optional `alpha`).
- **Aliases**: always the full path from the top-level group, whatever the file: `"{dimension.16}"`.
- **Naming**: kebab-case.

## Modifiers

The DTCG resolver's modifiers. Never `$extensions.mode`.

- **theme**: `light` (default) | `dark`. Colors and shadows.
- **density** (ADR 0025): `relaxed` (default) | `compact`. Only `padding/*`, `gap/within/*`, `gap/between/*`, and `size/control/*` change: compact aliases exactly the next smaller `space` (or `dimension`) step (`pts/density-order`). Each modifier changes only its scope, and no token is changed by two (`pts/orthogonal-modifiers`).
- **viewport** (ADR 0029): `narrow` (default, mobile first) | `wide` from `breakpoint/md` (768px). Only `font-size|line-height|letter-spacing/display/*` change: on narrow screens `display/xl` and `display/lg` take the next smaller step's values (so `display/lg` equals `display/md`). The `text/*` composites alias them and need no change.
- **shape** (ADR 0048, 0049): `soft` (default) | `round`. Only `radius/control` and `radius/container` change: `radius/control` is `radius/md` (8px) in soft and `radius/full` in round, `radius/container` `radius/md` in soft and `radius/2xl` (32px) in round. Components take their corners from them (`button/radius`).

## Primitives

- `dimension/N`: N is the px value; `dimension/max` = 9999px.
- `typeface/<font-name>`: font stack array with fallbacks: `aspekta` (sans), `ibm-plex-serif`, `ibm-plex-mono`.
- `weight/N`: numeric font weight (400–700). `tracking/N`: letter spacing, N = px × 100, negatives as `neg-` (`tracking/neg-50` = -0.5px).
- `color/<hue>/N`: higher is darker. Hues red, orange, green, blue, purple have 50–900; `neutral` has 50–1000 including 850. Plus `color/white`, `color/black`.
- `color/black-alpha/N`: black at N% opacity, for shadows and scrims only. There are no standalone opacity tokens.
- `duration/N`: N ms. `easing/standard|emphasized|decelerate|accelerate`: cubic Bézier.

## Semantic

- **Spacing** (ADR 0026, 0027): a scale plus role tokens on top of it. Pick a role token first; use `space/*` only when no role fits. A role token aliases a `space/*` step, never a `dimension`.
  - `space/N`: px = N ÷ 25 (`space/400` = 16px), the same in every mode. Steps `0`, `50`, `100` … `800`, `1000`, `1200`, `1600`: 4px apart up to 32px, then 40, 48, 64.
  - `padding/xs–xl`: inside an element (`padding/md` = 12px).
  - `gap/*`, between elements, in three families: `within/xs–lg` spaces the items of one group (4–16px), `between/sm–lg` separates groups (20–32px), `section/sm–lg` separates page regions (40–64px). Every `within` < every `between` < every `section`, in both densities.
- **Border**: `radius/none–2xl` and `full` (t-shirt sizes), plus two roles by shape: `radius/control` for buttons, inputs, and selects, and `radius/container` for cards, panels, dialogs, and sheets (popovers and menus keep `radius/lg`); `stroke/thin|thick|thicker` (1, 2, 4px; no zero width: "no border" means removing it); `focus-ring/width|offset` (color is `border/focus`).
- **Typography** (ADR 0023, 0028):
  - Levels stacked together are either the same size, told apart by weight or color, or clearly apart (×1.5 or more). Never an in-between difference.
  - `font-family/sans|serif|mono`. Use `mono` wherever digits must line up: Aspekta has no tabular figures.
  - `font-weight/regular|medium|semibold|bold`. Every heading and display style is bold; no text style uses semibold.
  - `font-size`: two zones. `text/xs–lg` = 12–20px for reading and UI (`text/md` = 16px is the body default). `display/sm–xl` for headings and display, about ×1.6 apart on the 4px grid (up to 104px wide). 12px is the minimum; there is no smaller step.
  - `line-height/<zone>/<step>`: one per font-size step, a unitless ratio held directly so that size × ratio is a whole 4px step (16/24). A text style uses the line height of its size.
  - `letter-spacing/display/*`: tighter as size grows (about -0.01em to -0.025em, in px since DTCG has no em). `normal` = 0 for text sizes; `wide` = 1px for uppercase labels.
  - `text/<role>-<size>`: `typography` composites, roles display, heading, body, label, caption, code × lg, md, sm, with all five properties (fontFamily, fontSize, fontWeight, letterSpacing, lineHeight). display-lg, display-md, heading-lg, heading-md use `display/xl`, `lg`, `md`, `sm`; heading-sm (bold) and body-lg (regular) share `text/lg` as a title and subtitle pair. Each names the iOS text style of its role in `$extensions["io.github.haaanju.pts"].ios.textStyle` (body-md is Body); on iOS the text takes that style's size and leading, with the token's family and weight (`pts/ios-text-style`, ADR 0066, 0070).
- **Size**: `size/icon/sm–lg` (`md` = 24px); `size/control/sm–lg`, the shared height for buttons, inputs, and selects (`md` = 48px, compact 40; relaxed md and up meet the 44–48px touch target).
- **Layout**: `breakpoint/sm–xl` (min-width, 640–1280px), CSS variables for reference only, since custom properties can't be used in media queries. `z-index/base, dropdown, sticky, overlay, modal, popover, toast, tooltip` in that order.
- **Motion** (ADR 0051): `motion/duration/fast|normal|slow|slower` (150, 200, 400, 600ms), `motion/easing/standard|emphasized|enter|exit`. `enter`, `standard`, and `emphasized` share their landing, (0, 1), and differ in x1, how long they hold first (0, 0.2, 0.5). `slow` and `slower` pair with `emphasized` (a dialog or sheet, a screen change). Leaving uses `exit` one duration step shorter than entering; going back to a screen is a screen change.
- **Elevation**: `shadow/sm–xl`, per theme (dark uses higher opacity).

## Color

See ADR 0019. Layers first, then what sits on them; each intent repeats the same shape (`npm run check` reports a missing token):

```
background                                 the page
surface/       subtle, strong, stronger
inverse/       base, strong, stronger
content/       base, subtle, inverse/{base, subtle}
border/        base, subtle, focus
disabled/      surface, content, border
intent/<danger | warning | success | info | discovery>/
               surface/{subtle, base, strong, stronger}, content/{base, inverse}, border/{base, subtle}
utility/       scrim
always/        white, black
```

- **Layers**: `background` is the page (inside a surface, the inset fill for code blocks and neutral badges). `surface/subtle` sits on it, one step from the background in both themes: cards, popovers, modals, and tinted areas. `inverse` is the flipped fill for primary buttons, tooltips, and snackbars.
- **Strength**: `subtle` < `base` < `strong` < `stronger`, as distance from the background (darker in light, lighter in dark). `subtle` is the soft fill, `base` the resting default, `strong` / `stronger` the hover and pressed fills. The neutral surface has no `base`: its strong resting fill is `inverse`. Never `default`, `canvas`, `raised`, `muted`, `emphasis`, or `on-`.
- **Content**: `content/base` and `subtle` go on the background and surfaces. `content/inverse` goes on a flipped fill: `inverse/*`, and an intent's `surface/base`, `strong`, `stronger`. An intent's `content/base` also sits on its own `surface/subtle`.
- **Intents**: danger (red), warning (orange), success (green), info (blue), discovery (purple: new features, onboarding, recommendations, AI). `surface/subtle` is the soft fill (alerts, banners, soft badges), `surface/base` the strong fill (buttons, strong badges, tags).
- **States**: interaction states are strength steps, and `$description` says hover or pressed. From hover to pressed, light gets darker and dark gets lighter. Component-specific states (selected, checked) go to the component tier (ADR 0018). `disabled/*` is shared by every control.
- **Utility**: colors outside the pairing system (the modal scrim). **Always**: the same in every theme, for icons and text on images; in `semantic/color.tokens.json` (base set).
- **Descriptions**: a color's `$description` also says which content goes on a fill.

## Accessibility (both themes)

`npm run check` derives the pairs from the names above (`tokens/lint/pairs.ts`), so new color tokens must follow them to be checked; a content name other than `base`, `subtle`, or `inverse` is reported.

- **Content 4.5:1** (WCAG 1.4.3) against every background it is paired with, as listed under Content above.
- **UI boundaries 3:1** (WCAG 1.4.11) against `background` and `surface/*`: `border/base`, `border/focus`, intent `border/base`, `inverse/*`, and an intent's `surface/base`, `strong`, `stronger`.
- **Exempt**: `disabled/*` (inactive), `border/subtle` and intent `border/subtle` (decorative), `utility/*` (translucent), `always/*` (sits on images; pair `always/white` with a dark overlay). A translucent color in a contrast pair is an error.
- **Visible steps**: every step of a surface ladder differs from the others, and `surface/strong` / `stronger` differ from `disabled/surface`, by at least ΔE 2 (OKLab ×100; ADR 0045).
