# Plain

Design tokens in the [DTCG](https://www.designtokens.org/) format, built with [Terrazzo](https://terrazzo.app) into CSS custom properties (with JS/TS and SCSS references to them), with light and dark themes, two densities, responsive display sizes, bundled fonts, and generated documentation.

Plain is a personal study project: a small design token monorepo built end to end, from token source to published output, to learn how token pipelines work and to work out practices for the tooling around them (linting, accessibility checks, docs, automation).

## Packages

| Package | What it holds |
|---------|---------------|
| [`@pts/tokens`](tokens) | The token source (DTCG JSON), the resolver that combines the files and modes, and the lint rules that check them |
| [`@pts/web`](packages/web) | Web output: CSS custom properties (`@pts/web/tokens.css`), JS/TS and SCSS references to them (`@pts/web/tokens.js`, `@pts/web/tokens.scss`), and self-hosted fonts (`@pts/web/fonts.css`: Aspekta, IBM Plex Mono, IBM Plex Serif) |
| [`@pts/storybook`](apps/storybook) | Token and component documentation, generated from the token source |
| [`@pts/components`](apps/components) | Internal, not published: web components (Lit) that test the component tier, `<pts-button>` |

The source lives in `tokens/`, shippable outputs in `packages/` (one package per platform), and the docs and test fixtures in `apps/`.

## Tokens

Three tiers:

- **Primitive** (`tokens/src/primitive/`): raw values such as `dimension.16`, `color.red.600`, `duration.200`.
- **Semantic** (`tokens/src/semantic/`): values with a role, such as `space.400`, `content.subtle`, `intent.danger.surface.base`, `text.body-md`. Semantic tokens alias primitives. Product code uses semantic tokens.
- **Component** (`tokens/src/component/`): what one component uses, per variant, size, and state, such as `button.primary.surface.hover` or `button.md.height`. Component tokens alias semantic tokens; a component's own code uses them (ADR 0032).

Categories: color, typography, spacing, border, elevation, size, motion, and layout.

Colors are layers (`background`, `surface`, `inverse`) with the `content` and `border` on them, plus one group per intent (`intent.danger.*`) with the same shape; see ADR 0019. Color and shadow have **light** and **dark** values; padding, the gaps within and between groups, and control heights have **relaxed** and **compact** values; display font sizes, line heights, and letter spacing have **narrow** and **wide** values. A DTCG resolver (`pts.resolver.json`) combines them.

## Usage

```css
@import "@pts/web/fonts.css"; /* @font-face for Aspekta and IBM Plex */
@import "@pts/web/tokens.css"; /* token custom properties */

.button {
  height: var(--button-md-height);
  padding: 0 var(--button-md-padding-base);
  border: var(--button-border-width) solid transparent;
  border-radius: var(--button-radius);
  background: var(--button-primary-surface-rest);
  color: var(--button-primary-content);
  font: var(--button-md-label);
}
.button:hover {
  background: var(--button-primary-surface-hover);
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

**Density.** Spacing and control heights are `relaxed` by default. `data-density="compact"` makes padding, the gaps within and between groups, and control heights one step tighter, for tables and other data-heavy views; page section gaps and the `space` scale don't change. Like `data-theme`, it works on any element, and the two nest without resetting each other:

```html
<main data-density="compact">
  <!-- a dense table -->
  <aside data-density="relaxed">A relaxed panel inside a compact page</aside>
</main>
```

**Viewport.** Display and heading sizes are mobile first: `:root` holds the `narrow` sizes, and from `breakpoint/md` (768px) a media query switches to `wide`. Only the two largest display steps change (104 → 64px and 64 → 40px on narrow screens); the `text/*` styles follow on their own, so there is nothing to set. Since the viewport is the window, there is no attribute for it.

**JS/TS and SCSS.** Both hold references to the CSS variables, not values, so `tokens.css` must still be imported; theme, density, and viewport keep working through it. They add names, autocomplete, and type errors on typos.

```ts
import { padding, surface, text } from "@pts/web/tokens.js"; // with types (tokens.d.ts)

const card = { background: surface.subtle, padding: padding.md }; // "var(--surface-subtle)", "var(--padding-md)"
const title = { ...text.headingMd }; // fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, e.g. a React style
```

```scss
@use "pkg:@pts/web/tokens.scss" as t; // Dart Sass with the Node package importer

.card {
  background: t.token("surface.subtle");
  padding: t.token("padding.md");
  @include t.typography("text.heading-md"); // font and letter-spacing
}
```

Since the values are `var(…)`, Sass can't compute with them, and breakpoints can't be used in `@media` (the same limit as in CSS).

**Components.** `@pts/components` is not a component library: its web components exist to test the component tokens and show how code consumes them (ADR 0034). Inside this repository, load the fonts and tokens once, then import an element to define it:

```js
import "@pts/web/fonts.css";
import "@pts/web/tokens.css";
import "@pts/components/button.js"; // defines <pts-button>
```

```html
<pts-button variant="primary" type="submit">Save</pts-button>
<pts-button label="Close"><svg slot="start" aria-hidden="true">…</svg></pts-button>
```

`variant` (`primary`, `secondary`, `ghost`, `danger`), `size` (`sm`, `md`, `lg`), `type`, `disabled`, `loading`, `full-width`, and `label` (the accessible name of an icon-only button). It follows `data-theme` and `data-density` like everything else. See the Button page in the docs and ADR 0032.

## Accessibility

Contrast is checked in both themes on every commit:

- Every content color meets **4.5:1** against each background it is paired with. Level content (`content.base`, `content.subtle`) sits on the background and surfaces; `content.inverse` sits on a flipped fill (`inverse.*`, or an intent's `surface.base` and its hover and pressed steps).
- Borders and solid fills meet **3:1** against the page surfaces.
- Background states are visible: hover and pressed never resolve to the same color as the surface they sit on.

## Development

Requires Node 22.18 or later (see `.nvmrc`).

```sh
npm install              # also installs the pre-commit hook
npm run storybook        # docs at http://localhost:6006
npm run build            # build @pts/web and @pts/components
```

| Command | What it does |
|---------|--------------|
| `npm run check` | Validates the tokens with Terrazzo (`tz check` in `tokens/`): its built-in rules plus the project's `pts/*` rules in every theme, density, and viewport: contrast, visible states, parity between modes, spacing and type scale order, line heights on the 4px grid, hex values, descriptions, tier rules, unregistered files |
| `npm run typecheck` | TypeScript for the lint plugin, the components, and Storybook |
| `npm run build` | Builds `@pts/web` and `@pts/components` |
| `npm run build-storybook` | Builds the static docs |
| `npm run test-a11y` | Builds the docs, then checks every page and story with axe-core (WCAG 2.2 A and AA) in light and dark |

**Working across machines.** Everything needed to continue lives in the repository. On a new machine: clone, `nvm use`, `npm install`. Pull before starting and push before switching. [`docs/progress.md`](docs/progress.md) records where work left off.

The pre-commit hook runs `check` and `typecheck`. CI runs the same checks plus both builds and the docs accessibility check on every push to `main` and every pull request, and checks each pull request's changeset.

**Changing tokens.** Edit the JSON in `tokens/src/` directly, color included, then run `npm run check`. It enforces contrast, visible states, the tier rules, and a description on every semantic token. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full flow.

## Decisions and conventions

- **Architecture decisions** are recorded in [`docs/adr/`](docs/adr).
- **Token naming and authoring rules** live in [`CLAUDE.md`](CLAUDE.md), which also guides the AI assistant used on this project. Rules for one area are in [`.claude/rules/`](.claude/rules) (Storybook docs, the web build) and [`.claude/skills/figma/`](.claude/skills/figma) (the Figma file); see [ADR 0031](docs/adr/0031-agent-docs-by-scope.md).
- **Versioning**: one Semantic Version for every package, released as a git tag (`vX.Y.Z`) and a GitHub Release; see [ADR 0014](docs/adr/0014-versioning-policy.md). While in `0.x`, breaking changes bump the minor version. What changed in each version: [`packages/web/CHANGELOG.md`](packages/web/CHANGELOG.md).
- **Releases** are automated with [Changesets](https://github.com/changesets/changesets): each pull request adds a changeset, and merging the Release pull request tags and publishes the notes; see [ADR 0035](docs/adr/0035-changesets-releases.md).

## Status

Deferred for now:

- Syncing the tokens to Figma Variables
- Native platforms (iOS, Android)

## Licenses

The fonts in `@pts/web` are licensed under the SIL Open Font License 1.1; each font folder in [`packages/web/fonts/`](packages/web/fonts) includes its license. They are shipped unmodified.

The rest of the repository has no license yet.
