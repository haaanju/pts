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
| Token rules: tiers, names, modifiers, color, accessibility | `.claude/rules/tokens.md` | with files in `tokens/`, `packages/`, `apps/components/`, or `apps/storybook/`; read it first for any other question about tokens |
| Web build and font rules | `.claude/rules/web.md` | with files in `packages/web/` |
| Component code rules | `.claude/rules/components.md` | with files in `apps/components/` or `apps/storybook/src/component/` |
| Figma rules and procedures | `.claude/skills/figma/` | the `figma` skill, before any Figma work |
| Session handoff: state, in flight, next | `docs/progress.md` | printed at session start |
| Why a decision was made | `docs/adr/` | on demand |
| A plan for later, not scheduled | `docs/plans/` | on demand; becomes ADRs when started |
| Token values | `tokens/src/**/*.tokens.json` | on demand; the token rules give representative values only |
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
packages/android/           @pts/android: dist/kotlin/Pts{Colors,Spacing,Border,Typography,Fonts,ComponentColors}.kt and dist/res/font/ for
                            Jetpack Compose, from plugin-compose.ts and build-fonts.ts (ADR 0056, 0059); dist/catalog/ for the
                            demo (ADR 0060); fonts/, upstream's TrueType files, copied unchanged (ADR 0076); also a Gradle
                            library, io.github.haaanju.pts:pts-android, published to mavenLocal (ADR 0058)
packages/ios/               @pts/ios: dist/Pts/ Colors.xcassets (a light and dark color set per semantic color, stronger for Increase Contrast) and
                            PtsColors.swift, PtsComponentColors.swift (ADR 0078), PtsTypography.swift, PtsFonts.swift and Fonts/, PtsSpacing.swift, PtsBorder.swift,
                            PtsShape.swift, from plugin-ios.ts and build-fonts.ts; Package.swift makes it the Swift package
                            Pts (ADR 0063–0068);
                            dist/catalog/ is the PtsCatalog product, for the demo (ADR 0065)
apps/components/            @pts/components: Lit web components testing the component tier, src/ → dist/ (<pts-button>, <pts-switch>)
apps/android-demo/          a Compose app (Gradle, not an npm workspace): Material 3 themed from pts-android, with Home, Tokens,
                            Components, and Settings tabs (ADR 0057, 0060, 0061)
apps/ios-demo/              a SwiftUI app (Xcode, not an npm workspace) on packages/ios as a local Swift package, with Home,
                            Tokens, Components, and Settings tabs like the Android demo (ADR 0065)
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
  - Built-in rules turned on beyond the recommended ones: `$type` required, a `$description` on every semantic token, srgb colors, text styles at least 12px, every intent with the same tokens (`core/required-children`, ADR 0050).
  - `pts/*`: `theme-parity`, `contrast`, `component-pairs`, `visible-steps`, `density-order`, `gap-order`, `min-font-size`, `type-scale`, `line-height-grid`, `color-hex`, `tier-aliases`, `registered-files`, `orthogonal-modifiers`, `component-states`, `icon-side-padding`, `ios-text-style`.
  - A new check goes to a built-in rule if one fits; otherwise a new `pts/*` rule file whose header says why no built-in rule does it. Every `pts/*` message gets a case in `tokens/lint/rules.test.ts`, unless it can't be reached (the file says why).
- `npm test`: breaks each `pts/*` rule on purpose in a copy of `tokens/` and expects `tz check` to report it, so a rule that silently stops reporting fails (ADR 0037); then builds `@pts/web` and checks its output against the resolver: every token in `:root`, every modifier context in its block with every token it changes and none another modifier changes, and every token in `tokens.js`, `tokens.d.ts`, and `tokens.scss` (ADR 0039); each product's CSS and JS the same way at the inputs it fixes, its JS values equal to the resolver's (ADR 0047); and builds `@pts/android` and checks that each class (`PtsColors`, `PtsSpacing`, `PtsBorder`, `PtsTypography`, `PtsComponentColors`) declares every token of its group with each context's value equal to the resolver's, and that every bundled font exists (ADR 0056, 0059); and builds `@pts/ios` and checks a color set per semantic color, its light and dark values equal to the resolver's and its high-contrast ones the next step's (ADR 0071), each named in `PtsColors`, and one per component color with its semantic color's values, named in `PtsComponentColors` (ADR 0078), every text style in `PtsTypography` at Apple's size for its iOS text style, its font bundled, and every spacing and border token in `PtsSpacing` and `PtsBorder` (ADR 0064, 0066–0068).
- `npm run typecheck`: TypeScript for the lint plugin, the `@pts/web`, `@pts/android`, and `@pts/ios` build configs and tests, the components, and Storybook.
- `npm run build`: every workspace (`@pts/web` → `packages/web/dist/`, `@pts/android` → `packages/android/dist/`, `@pts/ios` → `packages/ios/dist/`, `@pts/components` → `apps/components/dist/`). Each empties its `dist/` first and prints what it wrote, folder by folder, under its package name; the token builds run `tz build --quiet`, so warnings are left to `npm run check`. A platform's rows are in its `terrazzo.config.ts` (`summary()` from `tokens/summary.ts`); a file no row covers shows under `other` (ADR 0074).
- `npm run compile -w @pts/ios`: builds `@pts/ios` and compiles the Swift package for the iOS Simulator with `xcodebuild`; needs Xcode, so it isn't in `npm test`, and CI runs it on macOS (ADR 0069).
- `npm run storybook`: docs dev server (http://localhost:6006), builds `@pts/web` and `@pts/components` first. `npm run build-storybook`: static build.
- `npm run test-a11y`: builds Storybook, then checks every docs page and story with axe-core (WCAG 2.2 A and AA) in light and dark (ADR 0036). Needs Playwright's Chromium once: `npx playwright install chromium`.
- The pre-commit hook runs check, typecheck, and the ADR length check and blocks the commit on failure (wired by `prepare` on `npm install`; skip once with `--no-verify`). CI runs the same plus `npm test`, both builds, and `test-a11y` on pushes to `main` and on pull requests, and in a second job publishes `pts-android` to the runner's `mavenLocal` and builds the demo app against it, so the Kotlin compiles (ADR 0058), and in a third, on macOS, compiles `@pts/ios` and the iOS demo with Xcode (ADR 0069); and deploys the docs to GitHub Pages on pushes to `main`.

## Output (`@pts/web`)

- `tokens.css`: `:root` holds every token at the defaults (light, relaxed, narrow, soft). `[data-theme="light"|"dark"]` (plus `prefers-color-scheme: dark`) repeat only the theme groups; `[data-density="compact"|"relaxed"]` only the density tokens; `[data-shape="round"|"soft"]` only the shape tokens (ADR 0048). They work on any subtree and nest without resetting each other. `@media (min-width: 768px)` (from `breakpoint/md`) repeats only the viewport tokens; there is no viewport attribute, since the viewport is the window (ADR 0029).
- `tokens.js` (+ `tokens.d.ts`) and `tokens.scss` hold `var(--…)` references, not values, so every modifier works through `tokens.css` (ADR 0030).
- A token that aliases a theme, density, or shape token must be repeated in that modifier's blocks, since CSS variables resolve where they are declared (ADR 0025). The build repeats the component tokens that do (the Button's colors, sizes, paddings, and radius; ADR 0032); `npm test` checks it.
- Per-product outputs (ADR 0047): `products/<name>.css` and `.js` (+ `.d.ts`) for each product in `packages/web/products.ts`, a fixed set of modifier inputs (the examples `dense-app` and `roomy-app` fix the density and the shape, ADR 0048). The CSS has no blocks for a fixed modifier; the JS holds resolved values from `@terrazzo/plugin-js`.

## After a token change

- Storybook follows the tokens: the docs data reloads on save; `tokens.css` and the UI themes are built at startup, so restart `npm run storybook` to see a token change in them (ADR 0046).
- Figma doesn't: load the `figma` skill and bring it in line.
- Android follows on the next build (`npm run build`); the demo app shows it after a publish to `mavenLocal` (README, Android section). iOS follows on the next build too, and the demo app on its next run from Xcode (README, iOS section).
- Add a changeset: the change type (breaking, new, fix) decides the next version; see Git Convention.

## Working on a change

- **Large work starts from a `proposed` ADR** (a new platform, tier, modifier, or output): write what will prove it done and what is still open, and settle those with the owner before implementing. A value adjustment or a small fix doesn't need one.
- **A review reads the related ADRs with the diff** and reports where they disagree, since no check catches that.
- **A bug fix starts from a failing test**: commit a test that reproduces the bug and fails for the expected reason, then fix the code without editing that test. If the test turns out to be wrong, tell the owner rather than changing it.
- **A change is cut before it lands**, in a pull request or on `main`: run `/simplify` on changed code, and delete any new line of docs whose loss would cost nothing. Skip it for a typo-sized change.

## Decisions

Record decisions that change token structure, naming, tooling, or the pipeline as ADRs: `docs/adr/NNNN-kebab-case-title.md`.

- Sections, from 0054 on: `Decision` first, one or two sentences ("Chosen: X, because Y."); `What we learned`, the context with the options considered as a list; `Why it matters`; `Trade-offs`; `Implementation notes`, including what was checked; `Documented in`. They follow MADR (https://adr.github.io/): Decision Outcome, Context and Problem Statement with Considered Options, Consequences, Confirmation, More Information. Earlier ADRs keep their sections.

- `Implementation notes` holds only what the code can't show: what was checked, the owner's choices and why, and surprises. No list of files or functions.
- From 0079 on, an ADR is at most 800 words (`.github/scripts/check-adr-length.mjs`). If it needs more, split the decision into two ADRs.
- Status: `proposed` while under discussion, `accepted` once implemented. When a later ADR changes an accepted one, add `(amended by NNNN)`; `superseded by NNNN` only when it is replaced entirely.
- An accepted ADR's body doesn't grow: a later change to the decision is a new, short ADR, and the old one only gains the status note. Fixing a mistake or a broken link is fine.
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
- Native platforms: Android has colors, spacing, borders, and type (`@pts/android`, ADR 0056, 0059); iOS has colors, type, corners, and spacing (`@pts/ios`, ADR 0063–0069), a SwiftUI demo, and a macOS CI job. Both have the component tier's colors (`PtsComponentColors`, ADR 0078); its sizes stay on the web, since the native components have their own. Left for both, waiting for a use: motion, elevation, and publishing beyond a local build.

## Git Convention

- The repository is public (ADR 0043); `main` deploys the docs on https://haaanju.github.io/pts/, after CI passes on it. No pull request is required (ADR 0042); a ruleset only blocks force pushes and deleting `main` (ADR 0054). A change to a workspace (`tokens/`, `packages/`, `apps/`) goes on a `feature/xxx` branch and a pull request, so CI and the changeset check run before it lands; a change that touches none (docs, ADRs, agent rules, CI) may go straight to `main`.
- One Semantic Version for every `@pts/*` package (ADR 0014). In `0.x`, breaking changes bump MINOR, new tokens and fixes bump PATCH. Breaking = renaming or removing a token, changing what a name means, or changing the output format or selectors. Adjusting a value within its role is a fix.
- Every PR that changes a workspace adds a changeset (ADR 0035), written by hand in `.changeset/<kebab-name>.md`: front matter `"@pts/web": patch` (always `@pts/web`; the fixed group bumps the rest), then a summary starting `Breaking:`, `New:`, or `Fix:` whose bump matches the rule above. A change that ships nothing gets an empty one (`npx changeset --empty`). CI enforces it, and compares the tokens with the base (ADR 0040): a removed or renamed token needs `Breaking:`, and an added token or a changed value needs a changeset that releases.
- Releasing is merging the "Release" PR the Release workflow keeps open; once CI passes on that commit, the workflow tags `vX.Y.Z` and creates the GitHub Release from `packages/web/CHANGELOG.md` (ADR 0041). Never bump versions or tag by hand.
