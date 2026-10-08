# Plain

A personal study project: a design token monorepo, built end to end to learn how token pipelines work, including the tooling around them (linting, accessibility checks, docs, automation), and shared with colleagues for reference, not as a recommendation. Tokens and their outputs are the product; components exist only to test the component tier (ADR 0034).

**Plain** is the display name (Storybook title and docs). `pts` / `@pts/*` are the code, package, and repository names.

## Language

- **Every deliverable is in English**: code, comments, token names and descriptions, docs, ADRs, Storybook content, commit messages, and PR text. No Korean in the repository.
- Conversation with the user is in Korean.

## Where things are written

Each fact has one home; elsewhere, link to it (ADR 0031).

| What | Where | Loaded |
|---|---|---|
| Rules for every task | this file | always |
| Storybook docs rules | `.claude/rules/storybook.md` | with files in `apps/storybook/` |
| Web build and font rules | `.claude/rules/web.md` | with files in `packages/web/` |
| Component code rules | `.claude/rules/components.md` | with files in `apps/components/` or `apps/storybook/src/component/` |
| Figma rules and procedures | `.claude/skills/figma/` | the `figma` skill, before any Figma work |
| Session handoff: state, in flight, next | `docs/progress.md` | printed at session start |
| Why a decision was made | `docs/adr/` | on demand |
| Token values | `tokens/src/**/*.tokens.json` | on demand; this file gives representative values only |
| What each check enforces, and why | the header of each `tokens/lint/rules/*.ts` | on demand |
| Human guides | `README.md` (usage), `CONTRIBUTING.md` (changing tokens), `docs/how-it-works.md` (a map of the repository, for colleagues) | on demand |

## Tech Stack

- npm workspaces, Node ≥ 22.18 (`engines`, `.nvmrc`), TypeScript.
- Tokens: DTCG 2025.10, built with Terrazzo (`@terrazzo/cli` + per-platform plugins).
- Docs: Storybook 10 (React + Vite).

## Structure

Three roles (ADR 0016): `tokens/` is the source; `packages/` holds what ships, one package per platform for the token outputs (`@pts/<platform>`, depending on `@pts/tokens`); `apps/<name>` holds what runs or tests the tokens: the docs and the component fixtures (`@pts/components`, ADR 0034), never published.

```
tokens/                     @pts/tokens (private)
  terrazzo.config.ts        lint only (npm run check)
  source.ts                 the tokens as Terrazzo resolves them, for lint, the build, and the docs (ADR 0038)
  lint/                     the pts/* lint plugin (ADR 0021); pairs.ts holds the color pairing rules
  src/pts.resolver.json     combines the token files and the modifiers (build entry point)
  src/primitive/<category>.tokens.json
  src/semantic/<category>[.<context>].tokens.json
  src/component/<component>.tokens.json
packages/web/               @pts/web: dist/ tokens.css, tokens.js + .d.ts, tokens.scss, products/ (ADR 0047); fonts/
apps/components/            @pts/components: Lit web components testing the component tier, src/ → dist/ (<pts-button>)
apps/storybook/             @pts/storybook: token docs
docs/progress.md, docs/adr/
.claude/                    settings.json (SessionStart hooks), rules/, skills/
.changeset/                 pending release notes and the Changesets config (ADR 0035)
.githooks/pre-commit, .github/ (CI and Release workflows, their scripts, PR template)
```

- Register every new token file in `pts.resolver.json`: mode-independent files in `sets.base`, modifier-specific files in the matching `modifiers.<theme|density|viewport|shape>` context. `npm run check` reports a file that isn't registered.
- The files of one modifier's contexts (`color.light` / `color.dark`, `spacing.relaxed` / `spacing.compact`, `typography.narrow` / `typography.wide`, `border.soft` / `border.round`) define **the same token names and descriptions**.
- The token JSON is edited by hand, color included; nothing generates it (ADR 0020). `npm run check` enforces the rules a generator would.
- Only Terrazzo resolves aliases (ADR 0038). Lint, the build config, and the docs take tokens from `tokens/source.ts`; use the resolver's API (`apply`, `aliasChain`, `partialAliasOf`, `resolver.source`) instead of reading the files to work out a value.

## Commands

- `npm run check`: `tz check` in `tokens/` (ADR 0021). Terrazzo's built-in rules plus the `pts/*` rules. The rules that compare values check every theme × density × viewport × shape permutation (Terrazzo alone lints the default one); `component-pairs`, `color-hex`, `tier-aliases`, `registered-files`, and `orthogonal-modifiers` check names, files, and the resolver. Errors start with the rule name; the rule file's header says what it enforces.
  - Built-in rules turned on beyond the recommended ones: `$type` required, a `$description` on every semantic token, srgb colors, text styles at least 12px.
  - `pts/*`: `theme-parity`, `contrast`, `component-pairs`, `visible-steps`, `density-order`, `gap-order`, `min-font-size`, `type-scale`, `line-height-grid`, `color-hex`, `tier-aliases`, `registered-files`, `orthogonal-modifiers`, `component-states`.
  - A new check goes to a built-in rule if one fits; otherwise a new `pts/*` rule file whose header says why no built-in rule does it. Every `pts/*` message gets a case in `tokens/lint/rules.test.ts`, unless it can't be reached (the file says why).
- `npm test`: breaks each `pts/*` rule on purpose in a copy of `tokens/` and expects `tz check` to report it, so a rule that silently stops reporting fails (ADR 0037); then builds `@pts/web` and checks its output against the resolver: every token in `:root`, every modifier context in its block with every token it changes and none another modifier changes, and every token in `tokens.js`, `tokens.d.ts`, and `tokens.scss` (ADR 0039); each product's CSS and JS the same way at the inputs it fixes, its JS values equal to the resolver's (ADR 0047).
- `npm run typecheck`: TypeScript for the lint plugin, the `@pts/web` build config and tests, the components, and Storybook.
- `npm run build`: every workspace (`@pts/web` → `packages/web/dist/`, `@pts/components` → `apps/components/dist/`).
- `npm run storybook`: docs dev server (http://localhost:6006), builds `@pts/web` and `@pts/components` first. `npm run build-storybook`: static build.
- `npm run test-a11y`: builds Storybook, then checks every docs page and story with axe-core (WCAG 2.2 A and AA) in light and dark (ADR 0036). Needs Playwright's Chromium once: `npx playwright install chromium`.
- The pre-commit hook runs check and typecheck and blocks the commit on failure (wired by `prepare` on `npm install`; skip once with `--no-verify`). CI runs the same plus `npm test`, both builds, and `test-a11y` on pushes to `main` and on pull requests, and deploys the docs to GitHub Pages on pushes to `main`.

## Output (`@pts/web`)

- `tokens.css`: `:root` holds every token at the defaults (light, relaxed, narrow, soft). `[data-theme="light"|"dark"]` (plus `prefers-color-scheme: dark`) repeat only the theme groups; `[data-density="compact"|"relaxed"]` only the density tokens; `[data-shape="round"|"soft"]` only the shape tokens (ADR 0048). They work on any subtree and nest without resetting each other. `@media (min-width: 768px)` (from `breakpoint/md`) repeats only the viewport tokens; there is no viewport attribute, since the viewport is the window (ADR 0029).
- `tokens.js` (+ `tokens.d.ts`) and `tokens.scss` hold `var(--…)` references, not values, so every modifier works through `tokens.css` (ADR 0030).
- A token that aliases a theme, density, or shape token must be repeated in that modifier's blocks, since CSS variables resolve where they are declared (ADR 0025). The build repeats the component tokens that do (the Button's colors, sizes, paddings, and radius; ADR 0032); `npm test` checks it.
- Per-product outputs (ADR 0047): `products/<name>.css` and `.js` (+ `.d.ts`) for each product in `packages/web/products.ts`, a fixed set of modifier inputs (the examples `dense-app` and `roomy-app` fix the density and the shape, ADR 0048). The CSS has no blocks for a fixed modifier; the JS holds resolved values from `@terrazzo/plugin-js`.

## Token Rules

### Structure

- **Tiers**: primitive → semantic → component. Semantic tokens reference primitives only. Exceptions: composite tokens (`text/*`) reference semantic property tokens; `padding/*` and `gap/*` reference the `space` scale (ADR 0026), and `radius/control` and `radius/container` the `radius` scale (ADR 0048, 0049); `z-index`, `breakpoint`, and `line-height` hold values directly, since they have no meaning outside their role (ADR 0024, 0028).
- **Component tier** (ADR 0032): `component/<component>.tokens.json`, in `sets.base`. Component tokens reference semantic tokens only, with no exceptions; a value no semantic token holds is a missing semantic token. Names: `<component>/<variant>/<surface | content | border>/<state>` for colors (a property that changes with state names every state, `rest` included, and its states resolve differently, checked by `pts/component-states`; Ghost's fill, transparent at rest, is the one exception; one that doesn't change is a single token), `<component>/<size>/<part>` for sizes. State words (`rest`, `hover`, `pressed`) appear only in this tier. A variant's `content` (or `content/<state>`, with that state's fill) and `surface/*` must alias a pair `pts/contrast` checks (`pts/component-pairs`). The build repeats a component token in the theme, density, and shape blocks when its aliases reach a token of that modifier.
- **Group names**: primitive and semantic top-level groups never share a name (Terrazzo merges all files into one namespace): primitive `weight` ↔ semantic `font-weight`.
- **Format**: every token declares `$type`; no group-level `$type` inheritance. Every semantic token has a `$description` that says when to use it, the same in every context file and in Figma.
- **Values**: dimensions in `px` object form, `{ "value": 16, "unit": "px" }`. Colors in DTCG 2025.10 object form, `{ "colorSpace": "srgb", "components": [r, g, b], "hex": "#rrggbb" }` (components 0–1, optional `alpha`).
- **Aliases**: always the full path from the top-level group, whatever the file: `"{dimension.16}"`.
- **Naming**: kebab-case.

### Modifiers

The DTCG resolver's modifiers. Never `$extensions.mode`.

- **theme**: `light` (default) | `dark`. Colors and shadows.
- **density** (ADR 0025): `relaxed` (default) | `compact`. Only `padding/*`, `gap/within/*`, `gap/between/*`, and `size/control/*` change: compact aliases exactly the next smaller `space` (or `dimension`) step (`pts/density-order`). Each modifier changes only its scope, and no token is changed by two (`pts/orthogonal-modifiers`).
- **viewport** (ADR 0029): `narrow` (default, mobile first) | `wide` from `breakpoint/md` (768px). Only `font-size|line-height|letter-spacing/display/*` change: on narrow screens `display/xl` and `display/lg` take the next smaller step's values (so `display/lg` equals `display/md`). The `text/*` composites alias them and need no change.
- **shape** (ADR 0048, 0049): `soft` (default) | `round`. Only `radius/control` and `radius/container` change: `radius/control` is `radius/md` (8px) in soft and `radius/full` in round, `radius/container` `radius/md` in soft and `radius/2xl` (32px) in round. Components take their corners from them (`button/radius`).

### Primitives

- `dimension/N`: N is the px value; `dimension/max` = 9999px.
- `typeface/<font-name>`: font stack array with fallbacks: `aspekta` (sans), `ibm-plex-serif`, `ibm-plex-mono`.
- `weight/N`: numeric font weight (400–700). `tracking/N`: letter spacing, N = px × 100, negatives as `neg-` (`tracking/neg-50` = -0.5px).
- `color/<hue>/N`: higher is darker. Hues red, orange, green, blue, purple have 50–900; `neutral` has 50–1000 including 850. Plus `color/white`, `color/black`.
- `color/black-alpha/N`: black at N% opacity, for shadows and scrims only. There are no standalone opacity tokens.
- `duration/N`: N ms. `easing/standard|decelerate|accelerate`: cubic Bézier.

### Semantic

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
  - `text/<role>-<size>`: `typography` composites, roles display, heading, body, label, caption, code × lg, md, sm, with all five properties (fontFamily, fontSize, fontWeight, letterSpacing, lineHeight). display-lg, display-md, heading-lg, heading-md use `display/xl`, `lg`, `md`, `sm`; heading-sm (bold) and body-lg (regular) share `text/lg` as a title and subtitle pair.
- **Size**: `size/icon/sm–lg` (`md` = 24px); `size/control/sm–lg`, the shared height for buttons, inputs, and selects (`md` = 48px, compact 40; relaxed md and up meet the 44–48px touch target).
- **Layout**: `breakpoint/sm–xl` (min-width, 640–1280px), CSS variables for reference only, since custom properties can't be used in media queries. `z-index/base, dropdown, sticky, overlay, modal, popover, toast, tooltip` in that order.
- **Motion**: `motion/duration/fast|normal|slow`, `motion/easing/standard|enter|exit`.
- **Elevation**: `shadow/sm–xl`, per theme (dark uses higher opacity).

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

- **Layers**: `background` is the page (inside a surface, the inset fill for code blocks and neutral badges). `surface/subtle` sits on it, one step from the background in both themes: cards, popovers, modals, and tinted areas. `inverse` is the flipped fill for primary buttons, tooltips, and snackbars.
- **Strength**: `subtle` < `base` < `strong` < `stronger`, as distance from the background (darker in light, lighter in dark). `subtle` is the soft fill, `base` the resting default, `strong` / `stronger` the hover and pressed fills. The neutral surface has no `base`: its strong resting fill is `inverse`. Never `default`, `canvas`, `raised`, `muted`, `emphasis`, or `on-`.
- **Content**: `content/base` and `subtle` go on the background and surfaces. `content/inverse` goes on a flipped fill: `inverse/*`, and an intent's `surface/base`, `strong`, `stronger`. An intent's `content/base` also sits on its own `surface/subtle`.
- **Intents**: danger (red), warning (orange), success (green), info (blue), discovery (purple: new features, onboarding, recommendations, AI). `surface/subtle` is the soft fill (alerts, banners, soft badges), `surface/base` the strong fill (buttons, strong badges, tags).
- **States**: interaction states are strength steps, and `$description` says hover or pressed. From hover to pressed, light gets darker and dark gets lighter. Component-specific states (selected, checked) go to the component tier (ADR 0018). `disabled/*` is shared by every control.
- **Utility**: colors outside the pairing system (the modal scrim). **Always**: the same in every theme, for icons and text on images; in `semantic/color.tokens.json` (base set).
- **Descriptions**: a color's `$description` also says which content goes on a fill.

### Accessibility (both themes)

`npm run check` derives the pairs from the names above (`tokens/lint/pairs.ts`), so new color tokens must follow them to be checked; a content name other than `base`, `subtle`, or `inverse` is reported.

- **Content 4.5:1** (WCAG 1.4.3) against every background it is paired with, as listed under Content above.
- **UI boundaries 3:1** (WCAG 1.4.11) against `background` and `surface/*`: `border/base`, `border/focus`, intent `border/base`, `inverse/*`, and an intent's `surface/base`, `strong`, `stronger`.
- **Exempt**: `disabled/*` (inactive), `border/subtle` and intent `border/subtle` (decorative), `utility/*` (translucent), `always/*` (sits on images; pair `always/white` with a dark overlay). A translucent color in a contrast pair is an error.
- **Visible steps**: every step of a surface ladder differs from the others, and `surface/strong` / `stronger` differ from `disabled/surface`, by at least ΔE 2 (OKLab ×100; ADR 0045).

## After a token change

- Storybook follows the tokens: the docs data reloads on save; `tokens.css` and the UI themes are built at startup, so restart `npm run storybook` to see a token change in them (ADR 0046).
- Figma doesn't: load the `figma` skill and bring it in line.
- Add a changeset: the change type (breaking, new, fix) decides the next version; see Git Convention.

## Decisions

Record decisions that change token structure, naming, tooling, or the pipeline as ADRs: `docs/adr/NNNN-kebab-case-title.md`, with the sections of the recent ones.

- Status: `proposed` while under discussion, `accepted` once implemented. When a later ADR changes an accepted one, add `(amended by NNNN)`; `superseded by NNNN` only when it is replaced entirely.
- A rule that follows from a decision goes where the table above says, not into the ADR alone.
- An ADR that adds or changes how the repository works also updates its row in `docs/how-it-works.md`, which links rather than restates.

## Continuity

Work continues across chats and machines through the repository only; chat history and local memory stay on one machine.

- A session starts with git state and `docs/progress.md` in context (SessionStart hook). If the branch is behind its upstream, pull before editing.
- `docs/progress.md` is the handoff note: current state, in-flight branches, next steps, open questions. Update it in the same commit when a unit of work is done, or before stopping mid-task. Record only what isn't in the code, git log, ADRs, or rules; replace stale lines instead of appending history.
- Push work branches before switching machines. Cloud sessions (`claude --cloud`, claude.ai/code) clone the pushed branch and run `npm ci` through a second SessionStart hook. Name the work branch `feature/xxx` in the task.
- Several sessions may share this checkout. Before switching branches, check for other sessions (`ListAgents`) and work in a separate git worktree (`.claude/worktrees/`) if there is one. After changing another session's branch or shared files, message it (`SendMessage`): what changed, the new commit hashes, which files to re-read.

## Deferred

- Figma sync: Figma is updated by hand (the `figma` skill).
- Native platforms (iOS, Android): a custom Terrazzo plugin rather than Style Dictionary (ADR 0022).

## Git Convention

- The repository is public (ADR 0043); `main` deploys the docs on https://haaanju.github.io/pts/, after CI passes on it. It isn't protected (ADR 0042): a change to a workspace (`tokens/`, `packages/`, `apps/`) goes on a `feature/xxx` branch and a pull request, so CI and the changeset check run before it lands; a change that touches none (docs, ADRs, agent rules, CI) may go straight to `main`.
- One Semantic Version for every `@pts/*` package (ADR 0014). In `0.x`, breaking changes bump MINOR, new tokens and fixes bump PATCH. Breaking = renaming or removing a token, changing what a name means, or changing the output format or selectors. Adjusting a value within its role is a fix.
- Every PR that changes a workspace adds a changeset (ADR 0035), written by hand in `.changeset/<kebab-name>.md`: front matter `"@pts/web": patch` (always `@pts/web`; the fixed group bumps the rest), then a summary starting `Breaking:`, `New:`, or `Fix:` whose bump matches the rule above. A change that ships nothing gets an empty one (`npx changeset --empty`). CI enforces it, and compares the tokens with the base (ADR 0040): a removed or renamed token needs `Breaking:`, and an added token or a changed value needs a changeset that releases.
- Releasing is merging the "Release" PR the Release workflow keeps open; once CI passes on that commit, the workflow tags `vX.Y.Z` and creates the GitHub Release from `packages/web/CHANGELOG.md` (ADR 0041). Never bump versions or tag by hand.
