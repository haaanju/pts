# Plain

A personal study project: building my own design token pipeline while learning how design token monorepos work.

**Plain** is the display name (Storybook title and docs). `pts` / `@pts/*` are the code, package, and repository names.

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
├── README.md                    # human-facing overview (usage, commands, status)
├── .claude/settings.json        # SessionStart hook: fetches, prints git state and docs/progress.md
├── .githooks/pre-commit         # runs check, lint, typecheck before every commit
├── .github/workflows/ci.yml     # CI: checks + both builds
├── docs/progress.md             # session handoff: current state, in flight, next
├── docs/adr/                    # architecture decision records
├── tokens/                      # @pts/tokens — DTCG source, single source of truth (private)
│   ├── scripts/check.ts         # token validation (npm run check)
│   ├── scripts/generate-color.ts  # generates primitive + semantic color with descriptions (npm run generate:color)
│   ├── scripts/pairs.ts         # color pairing rules, shared by check.ts and the Storybook docs
│   └── src/
│       ├── pts.resolver.json         # combines token files + theme modifier (build entry point)
│       ├── primitive/
│       │   ├── dimension.tokens.json   # dimension
│       │   ├── typography.tokens.json  # typeface, weight, ratio, tracking
│       │   ├── color.tokens.json       # color palette (incl. black-alpha)
│       │   └── motion.tokens.json      # duration, easing
│       └── semantic/
│           ├── spacing.tokens.json     # space, layout
│           ├── border.tokens.json      # radius, stroke, focus-ring
│           ├── typography.tokens.json  # font-*, line-height, letter-spacing, text
│           ├── size.tokens.json        # size (icon, control)
│           ├── breakpoint.tokens.json
│           ├── motion.tokens.json      # motion (duration, easing)
│           ├── z-index.tokens.json
│           ├── color.tokens.json            # always (theme-independent colors)
│           ├── color.{light,dark}.tokens.json   # background, surface, inverse, content, border, disabled, utility, intent, per theme
│           └── shadow.{light,dark}.tokens.json  # shadow, per theme
├── packages/                    # shippable outputs, one package per platform
│   └── web/                     # @pts/web — CSS custom properties and self-hosted fonts
│       ├── terrazzo.config.ts   # one config; each web format is a plugin
│       ├── fonts/               # fonts.css + <font>/ (woff2 + OFL license)
│       └── dist/tokens.css      # build output (gitignored)
└── apps/                        # things that run rather than get imported
    └── storybook/               # @pts/storybook — token documentation
        ├── .storybook/          # main, theme (light/dark UI themes), manager (theme toggle), preview (tokens.css, theme sync)
        └── src/
            ├── tokens.ts        # data layer: reads the resolver, resolves aliases per theme
            ├── components.tsx   # doc blocks (TokenTable, ColorTable, Palette, …)
            ├── Introduction.mdx # Overview
            ├── semantic/*.mdx   # Semantic group: Color, Typography, Spacing, Border, Elevation, Size, Motion, Layout
            └── primitive/*.mdx  # Primitive group: Palette, Scales
```

- Three roles, see ADR 0016: `tokens/` is the source; `packages/<platform>` (named `@pts/<platform>`) holds shippable outputs and depends on `@pts/tokens`; `apps/<name>` holds tools and docs that run.
- A new format for an existing platform is a plugin in that platform's Terrazzo config plus a subpath export (e.g. JS/TS and SCSS go in `@pts/web`), not a new package.
- Register every new token file in `pts.resolver.json`: theme-independent files go in `sets.base`, theme-specific files in the matching `modifiers.theme` context.
- Files for different themes (`color.light` / `color.dark`) must define **the same set of token names**.

## Commands

- Node ≥ 22.18 (`engines`, `.nvmrc`): the `.ts` scripts run directly with Node's type stripping.
- `npm run check`: validates tokens (`tokens/scripts/check.ts`) per theme — missing `$type`, broken aliases, token-name mismatches between themes, color contrast, visible background states, color `hex` matching `components`, a `$description` on every semantic color, and semantic tokens aliasing primitives (the tier rules below).
- `npm run lint`: Terrazzo's own DTCG validation (`tz check`).
- `npm run typecheck`: TypeScript for the token scripts and Storybook.
- The pre-commit hook runs check, lint, and typecheck, and blocks the commit on failure. It is wired by the `prepare` script (`git config core.hooksPath .githooks`) on `npm install`. Skip once with `git commit --no-verify`.
- CI (`.github/workflows/ci.yml`) runs the same checks plus both builds on pushes to `main` and on pull requests.
- `npm run generate:color -w @pts/tokens`: regenerates `primitive/color.tokens.json` and `semantic/color{,.light,.dark}.tokens.json` from the Figma anchors and the selection rules. **Color tokens are generated: change the script, not the JSON**, then run `npm run check`. On an unchanged script it produces no diff.
- `npm run build`: builds every workspace (`@pts/web` → `packages/web/dist/tokens.css`).
  - Light values go on `:root` and `[data-theme="light"]`; dark values under `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`. `data-theme` on `<html>` forces a theme; on any element it themes that subtree (e.g. a light region inside a dark page).
  - `terrazzo.config.ts` reads the dark context files in the resolver to decide which groups go in the dark blocks.
- `npm run storybook`: token docs dev server (http://localhost:6006). Builds `@pts/web` first.
- `npm run build-storybook`: static docs build (`apps/storybook/dist`).

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
- `color/<hue>/N`: higher is darker. Hues (red, orange, green, blue, purple) have 10 steps (50–900); `neutral` has 13 (50–1000, including 850). Plus `color/white`, `color/black`.
- `color/black-alpha/N`: black at N% opacity (5–90), for shadows and scrims only. There are no standalone opacity tokens.
- `duration/N`: N ms. `easing/standard, decelerate, accelerate`: cubic Bézier.

### Semantic

- `space/N`: px = N ÷ 25 (`space/400` = 16px). Range `space/0`–`space/800` (0–32px), for component-level spacing.
- `layout/N`: ordinal steps in hundreds (not px), for gaps of 40px+. 100 = 40, 200 = 48, 300 = 64. Insert in-between steps like 150.
- `radius`: t-shirt sizes. none = 0, xs = 2, sm = 4, md = 8, lg = 12, xl = 16, `full` = max.
- `stroke`: weight names. thin = 1, thick = 2, thicker = 4. No zero-width token; "no border" means removing the border.
- `focus-ring/width`, `focus-ring/offset`: 2px each. Color is `border/focus`.
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

See ADR 0019. Layers first, then what sits on them; each intent repeats the same shape:

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

- **Layers**: `background` is the page (inside a surface, the inset fill for code blocks and neutral badges). `surface/subtle` sits on it: cards, popovers, modals, and tinted areas, one step from the background in both themes. `inverse` is the flipped fill for primary buttons, tooltips, and snackbars.
- **Strength**: `subtle` < `base` < `strong` < `stronger`, as distance from the background (darker in light, lighter in dark). `subtle` is the soft fill everywhere; `base` is the resting default; `strong` / `stronger` are the hover and pressed fills in every group. The neutral surface has no `base`: its strong resting fill is the `inverse` layer. Never `default`, `canvas`, `raised`, `muted`, `emphasis`, or `on-`.
- **Content**: `content/base` and `subtle` are text and icons on the background and surfaces. `content/inverse` is text on a flipped fill: on `inverse/*`, and on an intent's `surface/base`, `strong`, and `stronger`.
- **Intents**: danger (red), warning (orange), success (green), info (blue), discovery (purple: new features, onboarding, recommendations, AI). Role first, then the same `surface` / `content` / `border` words as the neutral colors. `surface/subtle` is the soft fill (alerts, banners, soft badges), `surface/base` the strong fill (buttons, strong badges, tags). An intent's `content/base` also sits on its own `surface/subtle`.
- **States**: interaction states are strength steps, and `$description` says hover or pressed. Every pressable fill has `strong` / `stronger`; component-specific states (selected, checked) go to a future component tier (ADR 0018). `disabled/*` is shared by every control. From hover to pressed, light gets darker and dark gets lighter.
- **Utility**: colors outside the pairing system (the modal scrim). **Always**: the same in every theme, for icons and text on images; theme-independent, so they live in `semantic/color.tokens.json` (base set).
- **Descriptions**: every semantic color has a `$description` (written in `generate-color.ts`) that says when to use it and which content goes on a fill. The Figma variable descriptions carry the same text.
- **Figma**: variable scopes follow the name (`content/*` and `disabled/content` → text and shape fills plus strokes; a `border` segment → strokes; `always/*` → all; everything else → frame and shape fills). The `Theme` collection holds only values that change with the theme; shadow offsets, blurs, and spreads are in `Semantic`. Primitives are hidden from pickers.

### Accessibility (required in both themes)

- Content: 4.5:1 against every paired background (WCAG 1.4.3): `content/base` and `subtle` on `background` and `surface/*`; `content/inverse/*` on `inverse/*`; an intent's `content/base` on the page and its own `surface/subtle`; an intent's `content/inverse` on its `surface/base`, `strong`, and `stronger`.
- UI boundaries (`border/base`, `border/focus`, intent `border/base`, `inverse/*`, and an intent's `surface/base`, `strong`, `stronger`): 3:1 against `background` and `surface/*` (WCAG 1.4.11).
- Exempt: `disabled/*` (inactive), `border/subtle` and intent `border/subtle` (decorative), `utility/*` (translucent scrim), `always/*` (sits on images; pair `always/white` with a dark overlay).
- Translucent colors can't be contrast-checked; `npm run check` errors if one enters a contrast pair.
- `npm run check` derives the pairs from these names (`tokens/scripts/pairs.ts`), so new color tokens must follow them to be checked. A content name other than a level (`base`, `subtle`) or `inverse` is reported.
- Steps must be visible: every step of a surface ladder (the neutral `background` / `surface/*`, `inverse/*`, each intent's `surface/*`) differs from the others, and `surface/strong` / `stronger` differ from `disabled/surface`. `npm run check` enforces this.

## Fonts

- All three families are self-hosted in `@pts/web`; consumers `@import "@pts/web/fonts.css"` before `@pts/web/tokens.css`. Nothing is loaded from a font service.
  - Aspekta (sans): one variable woff2, weight 100–900.
  - IBM Plex Mono and IBM Plex Serif: static woff2 at 400, 500, 600, 700 (the font-weight tokens).
- Licenses: SIL OFL 1.1, one `LICENSE.txt` per folder in `packages/web/fonts/`. "Aspekta" and "Plex" are Reserved Font Names, so ship files unmodified (no subsetting or conversion) or rename the family.
- Aspekta is Latin only; the product UI is English-only. Missing glyphs (e.g. `^ ~ ± •`) fall back to `system-ui`. It has no tabular figures: use `font-family/mono` where digits must line up.

## Token Docs (Storybook)

- Docs are generated from the token JSON. New tokens in an existing group appear without code changes.
- The sidebar mirrors the tiers, ordered by how often each is used: Overview → Semantic → Primitive (a Component group would go above Semantic). Semantic pages show only semantic tokens; primitive pages are reference for defining tokens and say so, since product code uses semantic tokens only.
- Page layout: `<PageHeader eyebrow title groups>` (stacked, left-aligned: eyebrow · token count, title, lead), then `<Section title lead>…</Section>` blocks (heading and lead, full-width content). Sections are separated by space, not lines; only the Introduction uses `<Section divider>`. Table rows keep hairlines for scanning. No cards or boxes; `ThemeCell` is the only filled surface because its background is the information.
- When adding a new **group**, wrap its block in a section on the matching `.mdx` page (e.g. `<Section title="New group"><TokenTable prefix="new-group" /></Section>`) and add the prefix to the page's `groups`.
- Groups that differ by theme are shown with light and dark side by side. `ThemeCell` sets `data-theme` so CSS variables inside it resolve to that theme.
- Contrast badges use the same pairing rules as `npm run check` (both import `tokens/scripts/pairs.ts`); each badge shows the lowest ratio among a token's pairs.
- Sample text in the docs is English only.
- Docs styling dogfoods the tokens: color, type, spacing, radius, stroke, shadow, and motion come from `@pts/web` variables. Values that only describe the docs layout or sample geometry are `--docs-*` variables at the top of `docs.css`; never add product tokens just for the docs. Card preview illustrations may use raw geometry.
- Light/dark: the sun/moon button at the top right toggles a `theme` global. The preview sets `data-theme` on `<html>` from it, so the whole docs page switches through token variables; the manager switches between the two UI themes. The choice is saved in localStorage; `?globals=theme:dark` in the URL also works.
- The Storybook UI themes (`.storybook/theme.ts`) use hex copies of token values, since the manager can't read CSS variables. Update them if those tokens change.
- Manager files (`.storybook/manager.tsx`, `theme.ts`, `main.ts`) are only compiled at startup: restart `npm run storybook` after editing them. The manager uses the classic JSX runtime, so `manager.tsx` imports React.

## Decisions

Record decisions that change token structure, naming, tooling, or the pipeline as ADRs: `docs/adr/NNNN-kebab-case-title.md`, in English.

- Status lifecycle: `proposed` while under discussion, `accepted` once implemented. When a later ADR changes an accepted one, add `(amended by NNNN)` to its status; use `superseded by NNNN` only when it is replaced entirely.

## Continuity

Work continues across chats and machines through the repository only. Chat history and Claude's local memory stay on one machine, so don't rely on them.

- A session starts with git state and `docs/progress.md` in context (the SessionStart hook in `.claude/settings.json`). If the branch is behind its upstream, pull before editing.
- `docs/progress.md` is the handoff note: current state, in-flight branches, next steps, open questions. When a unit of work is done, or before stopping mid-task, update it in the same commit. Record what isn't obvious from the code and git log; keep it short and replace stale lines instead of appending history.
- Push work branches before switching machines. Uncommitted changes don't travel.
- Decisions go in ADRs, rules in this file, not in `progress.md`.

## Deferred

- Figma sync mechanism. Figma is treated as one consumer of the tokens: when tokens change, update its variables and specimens by hand (or a one-off script). The plan is Pro, so the REST variables API (Enterprise only) is not an option.
- Native platform outputs (iOS, Android)

## Git Convention

- **main**: stable
- **feature/xxx**: work branches
- Releases: annotated tags on `main` (`v0.1.0`), see ADR 0014
  - Semantic Versioning, one fixed version for every `@pts/*` package. Bump all workspaces together: `npm version X.Y.Z --workspaces --no-git-tag-version`.
  - `0.x` during initial development: breaking changes bump MINOR, new tokens and fixes bump PATCH. From `1.0.0`, standard SemVer.
  - Breaking = renaming or removing a token, changing what a name means, or changing the output format or selectors. Adjusting a value within its role is a fix.
