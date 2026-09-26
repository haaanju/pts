# PTS — Personal Token System

A personal study project: building my own design token pipeline while learning how design token monorepos work.

The system's display name is **Plain** (Storybook title and docs). `pts` / `@pts/*` remain the code and package names.

## Language

- **Every deliverable is in English**: code, comments, token names and descriptions, docs, ADRs, Storybook content, commit messages, and PR text. No Korean in the repository.
- Conversation with the user is in Korean.

## Tech Stack

- Package manager: npm (workspaces)
- Token format: DTCG (W3C Design Tokens Community Group, 2025.10)
- Build tool: Terrazzo (`@terrazzo/cli` + per-platform plugins)
- Docs: Storybook 10 (React + Vite)
- Language: TypeScript

## Structure

```
pts/
├── .githooks/pre-commit         # runs npm run check before every commit
├── docs/adr/                    # architecture decision records
└── packages/
    ├── tokens/                  # @pts/tokens — DTCG source, single source of truth
    │   ├── scripts/check.ts     # token validation (npm run check)
    │   ├── scripts/generate-color.ts  # generates palette + semantic color (npm run generate:color)
    │   └── src/
    │       ├── pts.resolver.json         # combines token files + theme modifier (build entry point)
    │       ├── primitive/
    │       │   ├── dimension.tokens.json   # dimension
    │       │   ├── typography.tokens.json  # typeface, weight, ratio, tracking
    │       │   ├── palette.tokens.json     # palette (incl. black-alpha)
    │       │   └── motion.tokens.json      # duration, easing
    │       └── semantic/
    │           ├── spacing.tokens.json     # space, layout
    │           ├── border.tokens.json      # radius, stroke, focus-ring
    │           ├── typography.tokens.json  # font-*, line-height, letter-spacing, text
    │           ├── size.tokens.json        # size (icon, control)
    │           ├── breakpoint.tokens.json
    │           ├── motion.tokens.json      # motion (duration, easing)
    │           ├── z-index.tokens.json
    │           ├── color.{light,dark}.tokens.json   # color, per theme
    │           └── shadow.{light,dark}.tokens.json  # shadow, per theme
    ├── fonts/                   # @pts/fonts — self-hosted fonts: files/<font>/ (woff2 + OFL license) and fonts.css
    ├── css/                     # @pts/css — CSS custom properties
    │   ├── terrazzo.config.ts
    │   └── dist/tokens.css      # build output (gitignored)
    └── storybook/               # @pts/storybook — token documentation
        ├── .storybook/          # main, theme (light/dark UI themes), manager (theme toggle), preview (tokens.css, theme sync)
        └── src/
            ├── tokens.ts        # data layer: reads the resolver, resolves aliases per theme
            ├── components.tsx   # doc blocks (TokenTable, Palette, ForegroundTable, …)
            ├── Introduction.mdx # Overview
            ├── semantic/*.mdx   # Semantic group: Color, Typography, Spacing, Border, Elevation, Size, Motion, Layout
            └── primitive/*.mdx  # Primitive group: Palette, Scales
```

- Add new packages as `packages/<name>` named `@pts/<name>`. Output packages depend on `@pts/tokens`.
- Register every new token file in `pts.resolver.json`: theme-independent files go in `sets.base`, theme-specific files in the matching `modifiers.theme` context.
- Files for different themes (`color.light` / `color.dark`) must define **the same set of token names**.

## Commands

- `npm run check`: validates tokens (`packages/tokens/scripts/check.ts`) per theme — missing `$type`, broken aliases, token-name mismatches between themes, and color contrast. The pre-commit hook runs it on every commit and blocks the commit on failure.
  - The hook is wired by the `prepare` script (`git config core.hooksPath .githooks`) on `npm install`. Skip once with `git commit --no-verify`.
- `npm run generate:color -w @pts/tokens`: regenerates `palette.tokens.json` and `color.{light,dark}.tokens.json` from the Figma anchors and the selection rules. **Color tokens are generated: change the script, not the JSON**, then run `npm run check`. On an unchanged script it produces no diff.
- `npm run build`: builds every workspace (`@pts/css` → `packages/css/dist/tokens.css`).
  - Light values go on `:root` and `[data-theme="light"]`; dark values under `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`. `data-theme` on `<html>` forces a theme; on any element it themes that subtree (e.g. a light region inside a dark page).
  - `terrazzo.config.ts` reads the dark context files in the resolver to decide which groups go in the dark blocks.
- `npm run storybook`: token docs dev server (http://localhost:6006). Builds `@pts/css` first.
- `npm run build-storybook`: static docs build (`packages/storybook/dist`).

## Token Rules

### Structure

- **Tiers**: primitive → semantic. Semantic tokens reference primitives only. Exceptions: composite tokens (`text/*`) reference semantic property tokens; `z-index` holds values directly because stacking order has no meaning outside its role. Add a component tier when components exist.
- **Group names**: primitive and semantic top-level groups never share a name (Terrazzo merges all files into one namespace). Example: primitive `weight` ↔ semantic `font-weight`.
- **Files**: both tiers are split by category: `primitive/<category>.tokens.json`, `semantic/<category>.tokens.json`.
- **Format**: every token declares `$type`. No group-level `$type` inheritance.
- **Dimension**: `px`, object form: `{ "value": 16, "unit": "px" }`.
- **Color**: DTCG 2025.10 object form: `{ "colorSpace": "srgb", "components": [r, g, b], "hex": "#rrggbb" }` (components 0–1, optional `alpha`).
- **Themes**: the DTCG resolver's `theme` modifier (`light` | `dark`, default `light`). Do not use `$extensions.mode`.
- **Aliases**: always the full path from the top-level group, regardless of file: `"{dimension.16}"`.
- **Naming**: kebab-case.

### Primitives

- `dimension/N`: N is the px value. Exception: `dimension/max` = 9999px.
- `typeface/<font-name>`: font stack array, including fallbacks. `aspekta` (sans), `ibm-plex-serif`, `ibm-plex-mono`.
- `weight/N`: numeric font weight (400, 500, 600, 700).
- `ratio/N`: N = value × 100 (`ratio/150` = 1.5).
- `tracking/N`: letter spacing in px, N = px × 100; negative values use `neg-` (`tracking/neg-50` = -0.5px).
- `palette/<hue>/N`: higher is darker. Hues (red, orange, green, blue, purple) have 10 steps (50–900); `neutral` has 13 (50–1000, including 850). Plus `palette/white`, `palette/black`.
- `palette/black-alpha/N`: black at N% opacity (5–90), for shadows and scrims only. There are no standalone opacity tokens.
- `duration/N`: N ms. `easing/standard, decelerate, accelerate`: cubic Bézier.

### Semantic

- `space/N`: px = N ÷ 25 (`space/400` = 16px). Range `space/0`–`space/800` (0–32px), for component-level spacing.
- `layout/N`: ordinal steps in hundreds (not px), for gaps of 40px+. 100 = 40, 200 = 48, 300 = 64. Insert in-between steps like 150.
- `radius`: t-shirt sizes. none = 0, xs = 2, sm = 4, md = 8, lg = 12, xl = 16, `full` = max.
- `stroke`: weight names. thin = 1, thick = 2, thicker = 4. No zero-width token; "no border" means removing the border.
- `focus-ring/width`, `focus-ring/offset`: 2px each. Color is `color/border/focus`.
- `font-family`: sans (Aspekta), serif and mono (IBM Plex). Use `mono` wherever digits must line up: Aspekta has no tabular figures.
- `font-weight`: regular, medium, semibold, bold.
- `font-size/N`: ordinal steps, 400 = 16px (body default). 100 = 10 … 1000 = 48.
- `line-height`: unitless multipliers. tight = 1.2, normal = 1.5, loose = 1.75.
- `letter-spacing`: tighter = -1px, tight = -0.5px, normal = 0, wide = 1px. px because DTCG dimensions only allow px/rem (no em). Display styles use tighter, heading-lg/md tight, the rest normal; wide is for uppercase labels.
- `text/<role>-<size>`: `$type: typography` composites. Roles display, heading, body, label, caption, code × sizes lg, md, sm. All five properties (fontFamily, fontSize, fontWeight, letterSpacing, lineHeight) are required.
- `size/icon/sm, md, lg` = 16, 20, 24. `size/control/sm, md, lg` = 32, 40, 48 (shared control height for buttons, inputs, selects).
- `breakpoint/sm, md, lg, xl` = 640, 768, 1024, 1280 (min-width). Emitted as CSS variables for reference only; custom properties can't be used inside media queries.
- `motion/duration/fast, normal, slow` = 100, 200, 300ms. `motion/easing/standard, enter, exit`.
- `z-index/base, dropdown, sticky, overlay, modal, popover, toast, tooltip` = 0, 1000, 1100, 1300 … 1700.
- `shadow/sm, md, lg, xl`: t-shirt sizes, per theme (dark uses higher opacity).

### Color

`color/<property>/<role>[-<emphasis>][-<state>]` — property is background, foreground, or border.

- **Page backgrounds**: `background/default`, `default-hover`, `default-pressed`, `subtle`, `raised`. Transparent elements (list items, ghost buttons) use `default-hover` / `default-pressed` for their states.
- **Raised surfaces**: cards, popovers, and modals use `background/raised` with a `shadow/*`. Light: same as the page (the shadow separates it). Dark: one step lighter than the page, since shadows barely show on dark.
- **Neutral**: `background/inverse`, `background/overlay` (modal scrim), `foreground/default, muted, on-inverse`, `border/default, strong, focus`.
- **Primary**: monochrome (neutral). `background/primary[-hover|-pressed]`, `foreground/on-primary`.
- **Status roles**: danger (red), warning (orange), success (green), info (blue), recommend (purple). Each has `background/<role>[-hover|-pressed]`, `background/<role>-subtle`, `foreground/<role>`, `foreground/on-<role>`, `foreground/on-<role>-subtle`, `border/<role>`.
- **Disabled**: `background/disabled`, `foreground/disabled`, `border/disabled`.
- **State direction**: from hover to pressed, light gets darker and dark gets lighter.
- **Pairing**: `foreground/on-X` is used on `background/X` and its hover/pressed states. Foregrounds without `on-`, and borders, are used on the page backgrounds.

### Accessibility (required in both themes)

- Foreground text: 4.5:1 against every paired background (WCAG 1.4.3).
- UI boundaries (`border/*`, solid `background/*` and their states, including the focus ring): 3:1 against the page backgrounds (WCAG 1.4.11).
- Exempt: `border/default` (decorative divider), `*/disabled` (inactive), `background/overlay` (translucent scrim).
- Translucent colors can't be contrast-checked; `npm run check` errors if one enters a contrast pair.
- `npm run check` derives the pairs from these naming rules, so new color tokens must follow them to be checked.
- States must be visible: `background/X`, `X-hover`, and `X-pressed` resolve to different colors, and `default-hover` / `default-pressed` differ from `subtle`, `raised`, and `disabled` (a hover inside a card must show). `npm run check` enforces this.

## Fonts

- All three families are self-hosted in `@pts/fonts`; consumers `@import "@pts/fonts"` before `@pts/css`. Nothing is loaded from a font service.
  - Aspekta (sans): one variable woff2, weight 100–900.
  - IBM Plex Mono and IBM Plex Serif: static woff2 at 400, 500, 600, 700 (the font-weight tokens).
- Licenses: SIL OFL 1.1, one `LICENSE.txt` per folder in `packages/fonts/files/`. "Aspekta" and "Plex" are Reserved Font Names, so ship files unmodified (no subsetting or conversion) or rename the family.
- Aspekta is Latin only; the product UI is English-only. Missing glyphs (e.g. `^ ~ ± •`) fall back to `system-ui`. It has no tabular figures: use `font-family/mono` where digits must line up.

## Token Docs (Storybook)

- Docs are generated from the token JSON. New tokens in an existing group appear without code changes.
- The sidebar mirrors the tiers, ordered by how often each is used: Overview → Semantic → Primitive (a Component group would go above Semantic). Semantic pages show only semantic tokens; primitive pages are reference for defining tokens and say so, since product code uses semantic tokens only.
- Page layout: `<PageHeader eyebrow title groups>` (stacked, left-aligned: eyebrow · token count, title, lead), then `<Section title lead>…</Section>` blocks (heading and lead, full-width content). Sections are separated by space, not lines; only the Introduction uses `<Section divider>`. Table rows keep hairlines for scanning. No cards or boxes; `ThemeCell` is the only filled surface because its background is the information.
- When adding a new **group**, wrap its block in a section on the matching `.mdx` page (e.g. `<Section title="New group"><TokenTable prefix="new-group" /></Section>`) and add the prefix to the page's `groups`.
- Groups that differ by theme are shown with light and dark side by side. `ThemeCell` sets `data-theme` so CSS variables inside it resolve to that theme.
- Contrast badges use the same pairing rules as `npm run check`.
- Sample text in the docs is English only.
- Docs styling dogfoods the tokens: color, type, spacing, radius, stroke, shadow, and motion come from `@pts/css` variables. Values that only describe the docs layout or sample geometry are `--docs-*` variables at the top of `docs.css`; never add product tokens just for the docs. Card preview illustrations may use raw geometry.
- Light/dark: the sun/moon button at the top right toggles a `theme` global. The preview sets `data-theme` on `<html>` from it, so the whole docs page switches through token variables; the manager switches between the two UI themes. The choice is saved in localStorage; `?globals=theme:dark` in the URL also works.
- The Storybook UI themes (`.storybook/theme.ts`) use hex copies of token values, since the manager can't read CSS variables. Update them if those tokens change.
- Manager files (`.storybook/manager.tsx`, `theme.ts`, `main.ts`) are only compiled at startup: restart `npm run storybook` after editing them. The manager uses the classic JSX runtime, so `manager.tsx` imports React.

## Decisions

Record decisions that change token structure, naming, tooling, or the pipeline as ADRs: `docs/adr/NNNN-kebab-case-title.md`, in English.

## Deferred

- Figma sync mechanism
- Platform outputs other than CSS

## Git Convention

- **main**: stable
- **feature/xxx**: work branches
- Releases: annotated tags on `main` (`v0.1.0`), see ADR 0014
  - Semantic Versioning, one fixed version for every `@pts/*` package. Bump all workspaces together: `npm version X.Y.Z --workspaces --no-git-tag-version`.
  - `0.x` during initial development: breaking changes bump MINOR, new tokens and fixes bump PATCH. From `1.0.0`, standard SemVer.
  - Breaking = renaming or removing a token, changing what a name means, or changing the output format or selectors. Adjusting a value within its role is a fix.
