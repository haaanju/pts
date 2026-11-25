# 0079. Semantic-Only Web Output, Component Tokens beside the Components

- Status: accepted
- Date: 2026-11-25

## Decision

Chosen: `@pts/web` ships the semantic tier only, each token resolved to its value in every block, with no primitive; the component tier's CSS is written next to the components in `apps/components`, declared on each component's `:host` as `var()` references to semantic tokens, because consumers can no longer skip the semantic tier, the web ships what Android and iOS already do, and a property declared on the host resolves inside whatever modifier subtree holds it, so component tokens stop being repeated in every modifier block (ADR 0025, 0032).

## What we learned

Today `tokens.css` holds all three tiers as `var()` chains: `--button-primary-surface-rest: var(--inverse-base)`, `--inverse-base: var(--color-neutral-900)`, `--color-neutral-900: #242424`. Since a custom property resolves where it is declared, every component token that reaches a theme, density, or shape token is declared again in that modifier's blocks. `@pts/android` and `@pts/ios` already write semantic tokens only, as values.

Options for the primitives:

- **Keep them** (now): anyone can write `var(--color-neutral-900)` and skip the semantic tier, which `npm run check` can't see.
- **Under a private prefix** (`--_color-…`): discourages that use without stopping it.
- **Leave them out, semantic tokens as values**: chosen.

A semantic token aliasing another (`radius/control` → `radius/md`) is resolved too: a `var()` would bring the repeating back.

Options for the component tier:

- **In `tokens.css` on `:root`** (now): the repeated blocks stay.
- **A separate `components.css` in `@pts/web`, on `:root`**: separate, but the repeated blocks stay.
- **Next to the components, on `:host`, as `var()` references**: chosen. Each property is computed on the component element, inside its subtree, so one declaration follows every modifier; values would need a block per modifier again.

The owner chose (2026-11-25):

- **Only the output moves.** The source stays in `tokens/src/component/`, where the resolver, the lint rules, Figma, and `PtsComponentColors` (ADR 0078) read it. Native packages don't change.
- **A generated Lit `css` module per component**, over a `.css` file imported as a CSS module script (uneven browser support) or through a bundler (a new tool; the package builds with `tsc` only).
- **Built by a `terrazzo.config.ts` in `apps/components`**, not by `@pts/web`'s build, so the published package writes nothing into an app. One build writes every module; parsing 352 tokens takes about 0.16s.
- **The modules are committed**, since typecheck and Storybook read `src/`; a test checks them, so a stale one fails.
- **The Storybook primitive pages stay**, without a CSS variable to copy.

## Why it matters

- **`tokens.css`**: `:root` holds every semantic token at the defaults as a value (`--inverse-base: #242424`); each modifier block repeats, as a value, every semantic token whose value that context changes. No primitive, no component token.
- **`tokens.js`, `tokens.d.ts`, `tokens.scss`**: the same set, still `var(--…)` references (ADR 0030). `products/*` (ADR 0047) lose the primitives and component tokens too.
- **`apps/components`**: `src/tokens/<component>.tokens.ts`, `:host { --button-primary-surface-rest: var(--inverse-base); … }`, first in the component's `static styles`. Component code keeps reading `--button-*` and `--switch-*`.
- **`pts/tier-aliases`** keeps component aliases semantic, so every `var()` they write names a property `tokens.css` declares.

## Trade-offs

- **Breaking**: CSS variables, JS exports, and Sass variables are removed, a MINOR bump in `0.x` (ADR 0014). The source doesn't change, so the CI token diff (ADR 0040) won't ask for it; the changeset says `Breaking:` by hand.
- **No rebrand through a primitive** (overriding `--color-blue-500`); an override names semantic tokens.
- **The blocks follow values, not files.** A semantic token in the base set whose value changes with a modifier must be repeated in that modifier's blocks, which a `var()` chain did for free on `:root`: `text/display-*` is in `semantic/typography.tokens.json` but changes with the viewport.
- **DevTools stop showing the chain.**
- **Component tokens leave the published package.** Components are fixtures (ADR 0034): nothing outside the repository reads them.

## Implementation notes

- Surprises: `plugin-js` takes no filter, so it gets a resolver that keeps the semantic tier; `plugin-css` doesn't export `buildCSS`, so each component gets its own `css()` instance, whose `prepare` writes the module.
- The output test, broken on purpose, reported the viewport block without `text/display-lg`, and `:root` with `--always-black: var(--color-black)`.
- Checked: `npm run check`, `npm test`, `npm run typecheck`, `npm run build`, `npm run test-a11y` (18 pages × 2 themes, no violations); in the built Storybook, `<pts-button>`'s fill, height, and radius follow light and dark, relaxed and compact, soft and round (`#f8f8f8` → `#242424`, 48px → 40px, 8px → 9999px).
- Figma: the 121 `Primitive` variables lost their WEB code syntax; no text in the file names a removed property.

## Documented in

- `CLAUDE.md`: Structure, Commands (`npm test`), Output
- `.claude/rules/tokens.md`, `web.md`, `components.md`; the `figma` skill (code syntax)
- `README.md`, `CONTRIBUTING.md`, `docs/how-it-works.md`
- Storybook: the Overview's tiers and Usage, the primitive pages, Products
