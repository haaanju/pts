# Plain

Design tokens in the [DTCG](https://www.designtokens.org/) format, built with [Terrazzo](https://terrazzo.app) into CSS custom properties, with light and dark themes, bundled fonts, and generated documentation.

Plain is a personal study project: a small design token monorepo built end to end, from token source to published output, to learn how token pipelines work.

## Packages

| Package | What it holds |
|---------|---------------|
| [`@pts/tokens`](tokens) | The token source (DTCG JSON), the resolver that combines files and themes, and the validation and generation scripts |
| [`@pts/web`](packages/web) | Web output: CSS custom properties (`@pts/web/tokens.css`) and self-hosted fonts (`@pts/web/fonts.css`: Aspekta, IBM Plex Mono, IBM Plex Serif) |
| [`@pts/storybook`](apps/storybook) | Token documentation, generated from the token source |

The source lives in `tokens/`, shippable outputs in `packages/` (one package per platform), and the docs in `apps/`. JS/TS and SCSS outputs are planned for `@pts/web`.

## Tokens

Two tiers:

- **Primitive** (`tokens/src/primitive/`): raw values such as `dimension.16`, `color.red.600`, `duration.200`.
- **Semantic** (`tokens/src/semantic/`): values with a role, such as `space.400`, `content.subtle`, `intent.danger.surface.base`, `text.body-md`. Semantic tokens alias primitives. Product code uses semantic tokens only.

Categories: color, typography, spacing, border, elevation, size, motion, and layout.

Colors are layers (`background`, `surface`, `inverse`) with the `content` and `border` on them, plus one group per intent (`intent.danger.*`) with the same shape; see ADR 0019. Color and shadow have **light** and **dark** values, combined by a DTCG resolver (`pts.resolver.json`).

## Usage

```css
@import "@pts/web/fonts.css"; /* @font-face for Aspekta and IBM Plex */
@import "@pts/web/tokens.css"; /* token custom properties */

.button {
  height: var(--size-control-md);
  padding: 0 var(--space-400);
  border-radius: var(--radius-md);
  background: var(--inverse-base);
  color: var(--content-inverse-base);
  font: var(--text-label-md);
}
.button:hover {
  background: var(--inverse-strong);
}
.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--border-focus);
  outline-offset: var(--focus-ring-offset);
}
```

**Themes.** Light values apply on `:root`. Dark values apply when the OS prefers dark, or with `data-theme="dark"`. `data-theme` works on any element, so a region can use a different theme from the page:

```html
<html data-theme="dark">
  <!-- … -->
  <div data-theme="light">A light region inside a dark page</div>
</html>
```

## Accessibility

Contrast is checked in both themes on every commit:

- Every content color meets **4.5:1** against each background it is paired with. Level content (`content.base`, `content.subtle`) sits on the background and surfaces; `content.inverse` sits on a flipped fill (`inverse.*`, or an intent's `surface.base` and its hover and pressed steps).
- Borders and solid fills meet **3:1** against the page surfaces.
- Background states are visible: hover and pressed never resolve to the same color as the surface they sit on.

## Development

Requires Node 22.18 or later (see `.nvmrc`); the TypeScript scripts run directly with Node's type stripping.

```sh
npm install              # also installs the pre-commit hook
npm run storybook        # token docs at http://localhost:6006
npm run build            # build @pts/web
```

| Command | What it does |
|---------|--------------|
| `npm run check` | Validates the tokens: types, aliases, theme parity, contrast, visible states, hex values, semantic color descriptions, tier rules, unregistered files |
| `npm run lint` | Terrazzo's DTCG validation |
| `npm run typecheck` | TypeScript for the scripts and Storybook |
| `npm run build` | Builds `@pts/web` |
| `npm run build-storybook` | Builds the static docs |

**Working across machines.** Everything needed to continue lives in the repository. On a new machine: clone, `nvm use`, `npm install`. Pull before starting and push before switching. [`docs/progress.md`](docs/progress.md) records where work left off.

The pre-commit hook runs `check`, `lint`, and `typecheck`. CI runs the same checks plus both builds on every push to `main` and every pull request.

**Changing tokens.** Edit the JSON in `tokens/src/` directly, color included, then run `npm run check`. It enforces contrast, visible states, the tier rules, and a description on every semantic color.

## Decisions and conventions

- **Architecture decisions** are recorded in [`docs/adr/`](docs/adr).
- **Token naming and authoring rules** live in [`CLAUDE.md`](CLAUDE.md), which also guides the AI assistant used on this project.
- **Versioning**: one Semantic Version for every package, released as a git tag (`vX.Y.Z`); see [ADR 0014](docs/adr/0014-versioning-policy.md). While in `0.x`, breaking changes bump the minor version.

## Status

Planned:

- JS/TS and SCSS outputs in `@pts/web`

Deferred for now:

- Syncing the tokens to Figma Variables
- Native platforms (iOS, Android)

## Licenses

The fonts in `@pts/web` are licensed under the SIL Open Font License 1.1; each font folder in [`packages/web/fonts/`](packages/web/fonts) includes its license. They are shipped unmodified.

The rest of the repository has no license yet.
