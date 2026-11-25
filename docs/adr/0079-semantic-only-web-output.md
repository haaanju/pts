# 0079. Semantic-Only Web Output, Component Tokens beside the Components

- Status: proposed
- Date: 2026-11-25

## Decision

Chosen: `@pts/web` ships the semantic tier only, each token resolved to its value in every block, with no primitive; the component tier's CSS is written next to the components in `apps/components`, declared on each component's `:host` as `var()` references to semantic tokens, because consumers can no longer skip the semantic tier, the web ships what Android and iOS already do, and a property declared on the host resolves inside whatever modifier subtree holds it, so component tokens stop being repeated in every modifier block (ADR 0025, 0032).

## What we learned

Today `tokens.css` holds all three tiers as `var()` chains: `--button-primary-surface-rest: var(--inverse-base)`, `--inverse-base: var(--color-neutral-900)`, `--color-neutral-900: #242424`. Since a custom property resolves where it is declared, every component token that reaches a theme, density, or shape token is declared again in that modifier's blocks (`--button-*` is 118 lines of `tokens.css`, `--switch-*` 75). `@pts/android` and `@pts/ios` already write semantic tokens only, as values.

Options for the primitives:

- **Keep them** (now): anyone can write `var(--color-neutral-900)` and skip the semantic tier, which `npm run check` can't see.
- **Keep them under a private prefix** (`--_color-…`): discourages that use without stopping it, and keeps the chains.
- **Leave them out, semantic tokens as values**: chosen.

Options for a semantic token that aliases another semantic token (`radius/control` → `radius/md`): a `var()` reference would bring back the repeating problem inside the semantic tier, so it is resolved too.

Options for the component tier:

- **In `tokens.css` on `:root`** (now): the repeated blocks stay.
- **A separate `components.css` in `@pts/web`, on `:root`**: separate, but the repeated blocks stay.
- **Next to the components, on `:host`, as `var()` references**: chosen. Each property is computed on the component element, inside its subtree, so one declaration follows every modifier; values would need a block per modifier again.

The owner chose (2026-11-25): only the output moves. The source stays in `tokens/src/component/`, where the resolver, `pts/component-pairs`, `pts/tier-aliases`, Figma, and `PtsComponentColors` (ADR 0078) read it. Native packages don't change.

## Why it matters

- **`tokens.css`**: `:root` holds every semantic token at the defaults as a value (`--inverse-base: #242424`); each modifier block repeats, as a value, every semantic token whose value that context changes. No primitive, no component token.
- **`tokens.js`, `tokens.d.ts`, `tokens.scss`**: the same set, still `var(--…)` references (ADR 0030). `products/*` (ADR 0047) lose the primitives and component tokens too.
- **`apps/components`**: each component's tokens, `:host { --button-primary-surface-rest: var(--inverse-base); … }`, in the component's shadow styles. Component code keeps reading `--button-*` and `--switch-*` as now.
- **`pts/tier-aliases`** already holds component tokens to semantic tokens only, so every `var()` the components write names a property `tokens.css` declares.

## Trade-offs

- **Breaking**: CSS variables, JS exports, and Sass variables are removed, a MINOR bump in `0.x` (ADR 0014). The source doesn't change, so the CI token diff (ADR 0040) won't ask for it; the changeset says `Breaking:` by hand.
- **No rebrand through a primitive** (overriding `--color-blue-500`); an override names semantic tokens.
- **The blocks follow values, not files.** A semantic token in the base set whose value changes with a modifier must be repeated in that modifier's blocks, which a `var()` chain did for free on `:root`: `text/display-*` is in `semantic/typography.tokens.json` but changes with the viewport.
- **DevTools stop showing the chain**: `--inverse-base: #242424`, not `var(--color-neutral-900)`.
- **Component tokens leave the published package.** A consumer building its own button doesn't get `button/*`; components are fixtures (ADR 0034), so nothing outside the repository reads them.

## Implementation notes

Done when:

- `tokens.css` declares no primitive and no component token, and `npm test` (ADR 0039) checks each block against the resolver's resolved values: every semantic token whose value a context changes, and nothing else.
- Each component's `:host` declares every token of its file, each `var()` naming the semantic token its alias names; a test checks it against the resolver.
- `<pts-button>` and `<pts-switch>` render the same in every theme × density × shape, nested, checked in Storybook and by `npm run test-a11y`.
- The repeating of component tokens in `packages/web/terrazzo.config.ts` (ADR 0032) is gone.

Still open, to settle with the owner before implementing:

- How the component CSS reaches a shadow root: a generated Lit `css` module per component, or a `.css` file imported inline. And what builds it: a `terrazzo.config.ts` in `apps/components`, or a step in `@pts/web`'s build.
- The Storybook primitive pages: they show `--color-neutral-900` to copy, which will no longer exist.
- Figma: the primitive variables' WEB code syntax names properties that will no longer exist (the `figma` skill).
- On acceptance, mark ADR 0025, 0030, 0032, 0039, and 0047 amended.

## Documented in

To update when implemented: `CLAUDE.md` (Structure, Commands, Output), `.claude/rules/tokens.md` and `web.md`, `README.md`, `docs/how-it-works.md`, the `figma` skill.
