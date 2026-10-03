# Practices

A map of the practices in this repository for anyone building a design token pipeline: what each one is, why it's here, where it lives, and the ADR that explains the decision. This page links; the files and ADRs it points to hold the details.

Plain is a small design token monorepo (DTCG 2025.10, built with Terrazzo, documented in Storybook). The practices are meant to carry over to other stacks; where one depends on Terrazzo, it says so.

## If you take three things

1. **Lint the tokens for what your design rules say, in every mode.** Contrast, scale order, density order, and tier rules are checked on every commit, in every theme × density × viewport combination, not only the default one. → [Checks](#checks-as-code)
2. **Derive contrast pairs from token names, and share them.** The names say which content sits on which fill, so the lint, the docs badges, and the docs accessibility check all read one pairing file instead of hand-kept lists. → [Accessibility](#accessibility)
3. **Write the release note with the change.** Every pull request carries a changeset whose summary starts with `Breaking:`, `New:`, or `Fix:`; CI checks that the version bump matches. → [Releases](#releases-and-versions)

## Source and structure

| Practice | Why | Where | ADR |
|---|---|---|---|
| Source, outputs, and tools in separate roles: `tokens/` (source), `packages/<platform>` (what ships), `apps/` (docs and fixtures) | Consumers take one package per platform; the source isn't something to install | [`tokens/`](../tokens), [`packages/web/`](../packages/web), [`apps/`](../apps) | [0016](adr/0016-platform-packages.md), [0034](adr/0034-components-as-token-fixtures.md) |
| Token JSON edited by hand, color included; no generator | A generator hides decisions in code; the checks enforce what a generator would | [`tokens/src/`](../tokens/src) | [0020](adr/0020-hand-edited-tokens-and-ci-gates.md) |
| Modes as DTCG resolver modifiers (theme, density, viewport), never `$extensions.mode` | One standard source for every mode, readable by any resolver-aware tool | [`pts.resolver.json`](../tokens/src/pts.resolver.json) | [0005](adr/0005-color-tokens-and-theme-resolver.md), [0025](adr/0025-density-modifier.md), [0029](adr/0029-viewport-modifier.md) |
| Three tiers, primitive → semantic → component, each aliasing only the one below | Product code depends on meaning, not raw values; a component can change without touching the semantic tier | [`tokens/src/`](../tokens/src), checked by `pts/tier-aliases` | [0032](adr/0032-button.md) |
| Terrazzo rather than Style Dictionary | Native DTCG resolver and a lint API; native platforms through a custom plugin | [`terrazzo.config.ts`](../packages/web/terrazzo.config.ts) | [0022](adr/0022-terrazzo-over-style-dictionary.md) |

### Naming systems

| System | The idea | ADR |
|---|---|---|
| Color layers and strength steps | `background` → `surface` → `inverse`, with `content` and `border` on them; `subtle` < `base` < `strong` < `stronger` as distance from the page; each intent repeats the shape | [0017](adr/0017-color-names-by-property-and-intent.md), [0019](adr/0019-color-layers-and-strength-steps.md) |
| States as strength steps | Hover and pressed are the next steps of the same ladder; component-only states (selected, checked) live in the component tier | [0018](adr/0018-interaction-states-in-the-semantic-tier.md) |
| Spacing roles on one scale | One `space/*` scale; `padding/*`, `gap/within`, `gap/between`, `gap/section` name the role, and every `within` < `between` < `section` | [0026](adr/0026-spacing-roles.md), [0027](adr/0027-gap-within-and-between.md) |
| Type scale logic | Two zones (text, display); stacked levels are the same size or ×1.5 apart, never in between; every size has its line height on the 4px grid | [0028](adr/0028-type-scale-logic.md) |
| Breakpoints, z-index, line heights hold values | Tokens with no meaning outside their role skip the primitive tier | [0024](adr/0024-breakpoints-hold-values.md), [0028](adr/0028-type-scale-logic.md) |

## Checks as code

`npm run check` runs Terrazzo's built-in lint rules plus 12 project rules ([`tokens/lint/rules/`](../tokens/lint/rules)). Terrazzo lints the default mode only, so every project rule checks every theme × density × viewport permutation ([ADR 0021](adr/0021-terrazzo-lint.md)).

- **A built-in rule first.** A project rule exists only when no built-in one does the job, and its file header says why ("Why not built-in: …"). Read the headers to see what each rule enforces.
- **What the rules cover**: contrast (`contrast`, `component-pairs`), visible state changes (`visible-steps`), mode parity and descriptions (`theme-parity`), scale order (`density-order`, `gap-order`, `type-scale`, `line-height-grid`, `min-font-size`), tiers (`tier-aliases`), consistent color values (`color-hex`), and files the build would silently skip (`registered-files`).
- **Gates**: a pre-commit hook ([`.githooks/pre-commit`](../.githooks/pre-commit)) runs check and typecheck; CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) adds both builds, the docs accessibility check, and the changeset check ([ADR 0020](adr/0020-hand-edited-tokens-and-ci-gates.md)).

## Outputs

| Practice | Why | ADR |
|---|---|---|
| One `tokens.css`: defaults on `:root`, then `[data-theme]` and `[data-density]` blocks that repeat only their own tokens | A mode attribute works on any subtree, and theme and density nest without resetting each other | [0025](adr/0025-density-modifier.md) |
| Viewport through `@media`, with no attribute | The viewport is the window; a token can't pretend otherwise | [0029](adr/0029-viewport-modifier.md) |
| A token aliasing a mode token is repeated in that mode's block | CSS variables resolve where they are declared, so an alias on `:root` would freeze the default | [0025](adr/0025-density-modifier.md), [0032](adr/0032-button.md) |
| JS/TS and SCSS hold `var(--…)` references, not values | Every mode keeps working through the CSS; the JS adds names, autocomplete, and typo errors | [0030](adr/0030-js-and-scss-outputs.md) |
| Fonts shipped with the tokens | The type tokens name fonts; the package that names them provides them | [0013](adr/0013-self-hosted-aspekta.md), [0016](adr/0016-platform-packages.md) |

## Accessibility

- **Contrast in both themes, from the names.** Content on its paired backgrounds at 4.5:1, UI boundaries at 3:1 (WCAG 1.4.3, 1.4.11). The pairs come from the naming system in one file, [`tokens/lint/pairs.ts`](../tokens/lint/pairs.ts), which the lint and the docs badges both import; a new token that follows the names is checked with no list to update ([ADR 0019](adr/0019-color-layers-and-strength-steps.md)).
- **Exemptions in one place.** Disabled, decorative, and translucent colors are exempt in `pairs.ts`; the docs check reads the same function and marks those samples, so nothing else can be excluded ([ADR 0036](adr/0036-docs-accessibility-check.md)).
- **No size below 12px**, and hover and pressed always visible against their resting fill and against disabled (`min-font-size`, `visible-steps`; [ADR 0023](adr/0023-font-size-minimum.md)).
- **The docs are checked too.** axe-core runs on every docs page and story in light and dark in CI; Storybook's own tools check stories only ([ADR 0036](adr/0036-docs-accessibility-check.md)).
- **Components as fixtures.** One web component, `<pts-button>`, tests the component tier the way product code would use it: a real `<button>` inside, disabled that stays focusable (`aria-disabled`), form association ([ADR 0032](adr/0032-button.md), [0034](adr/0034-components-as-token-fixtures.md)).

## Documentation

| Practice | Why | Where | ADR |
|---|---|---|---|
| Docs generated from the token JSON | A new token in an existing group shows up with no docs change | [`apps/storybook/src/tokens.ts`](../apps/storybook/src/tokens.ts) | [0009](adr/0009-storybook-token-docs.md) |
| Docs styled with the tokens themselves | The docs are the first consumer; a broken token shows on its own page | [`docs.css`](../apps/storybook/src/docs.css) | [0011](adr/0011-letter-spacing-and-docs-dogfooding.md) |
| Light and dark (and density) toggles on the whole page, plus side-by-side cells per mode | Every mode is reviewable without a second build | [`.storybook/`](../apps/storybook/.storybook) | [0012](adr/0012-docs-dark-mode.md) |
| Docs and Figma specimens kept aligned: the same pages, sections, and leads | Designers and developers read the same structure | [`.claude/rules/storybook.md`](../.claude/rules/storybook.md) | — |

## Releases and versions

| Practice | Why | ADR |
|---|---|---|
| One version for every package; breaking = a token renamed or removed, a name's meaning changed, or the output format changed | For tokens, the public API is the set of names | [0014](adr/0014-versioning-policy.md) |
| A changeset per pull request, summary starting `Breaking:`, `New:`, or `Fix:`, checked against the bump | The note is written by whoever made the change, when they made it | [0035](adr/0035-changesets-releases.md) |
| A "Release" pull request collects changesets; merging it tags `vX.Y.Z` and publishes the GitHub Release from the changelog | Releasing is a reviewable merge, and the timing stays a choice | [0035](adr/0035-changesets-releases.md) |

How to write a changeset: [`CONTRIBUTING.md`](../CONTRIBUTING.md#releases). What changed in each version: [`packages/web/CHANGELOG.md`](../packages/web/CHANGELOG.md).

## Decisions and contribution

- **Architecture decision records** for every change to structure, naming, tooling, or the pipeline ([`docs/adr/`](adr)). Each has the same sections: what we learned (the options compared), why it matters (the decision), implementation notes, and where it is documented. Status is `proposed` → `accepted`; a later ADR that changes one marks it `amended by NNNN` instead of rewriting history.
- **A contribution guide for designers** ([`CONTRIBUTING.md`](../CONTRIBUTING.md)): edit JSON in the browser or locally, read the check's error, open a pull request with the template ([`.github/pull_request_template.md`](../.github/pull_request_template.md)).

## Working with an AI agent

This repository is built with Claude Code. These practices matter only if your team works with an agent, and they reflect one person's workflow more than the rest of this page.

- **One home per fact.** [`CLAUDE.md`](../CLAUDE.md) holds the rules every task needs, with a table of where everything else lives; area rules load only with their files ([`.claude/rules/`](../.claude/rules)); Figma procedures are a skill ([`.claude/skills/figma/`](../.claude/skills/figma)) ([ADR 0031](adr/0031-agent-docs-by-scope.md)).
- **Handoff through the repository.** A session starts by printing git state and [`docs/progress.md`](progress.md) ([`.claude/settings.json`](../.claude/settings.json)), so work continues across machines and cloud sessions with no chat history.
- **Rules the agent can't skip are checks, not instructions.** Anything that must hold is a lint rule or a CI step; the instructions explain, the checks enforce.

## Not done yet

- **Figma is synced by hand** (the `figma` skill), until Figma or the tooling offers a native sync ([ADR 0022](adr/0022-terrazzo-over-style-dictionary.md)).
- **No native outputs** (iOS, Android); planned as a custom Terrazzo plugin ([ADR 0022](adr/0022-terrazzo-over-style-dictionary.md)).
- **The docs aren't hosted.** Storybook on GitHub Pages and branch protection wait until the repository is public ([ADR 0020](adr/0020-hand-edited-tokens-and-ci-gates.md)).
- **The release pull request runs no CI**, since the workflow's own token can't trigger workflows; the release is verified before it is tagged instead ([ADR 0035](adr/0035-changesets-releases.md)).
