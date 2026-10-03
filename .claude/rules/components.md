---
paths:
  - "apps/components/**"
  - "apps/storybook/src/component/**"
---

# @pts/components

Fixtures for the component tier, not a published library (ADR 0034): a component is added only when the tier needs a test it doesn't have. They are written with Lit as web components, one file per element in `src/` (`button.ts` defines `<pts-button>`), each a subpath export (`@pts/components/button.js`). The spec of each lives in its ADR (Button: ADR 0032); the code follows it.

## Code

- **A real native element inside the shadow root** does the keyboard, role, and screen-reader work (`<button>` in `<pts-button>`). The host adds only what the native element can't do from inside a shadow root: form association (`static formAssociated`, `ElementInternals`), `delegatesFocus`, and the states the spec adds.
- **Styles read component tokens only**: the element's own `<component>/*` variables, plus `border/focus`, `focus-ring/*`, and `motion/*`, which are shared by every focusable or animated element. Never a semantic color or size directly: if a value is missing, add a component token (aliasing a semantic one) first.
- **Variant, size, and state attributes on the host set private variables** (`--_surface`, `--_height`, …) that the inner element reads. They are declared on the host, which sits inside the page's `[data-theme]` / `[data-density]` subtree, so modes resolve correctly.
- **No `::part()`** until a real need appears: page CSS can't change a component outside its spec.
- **Attributes take named values, not tokens** (`variant`, `size`). Reactive properties use `static properties` with `declare`d fields, so there are no decorators and no build step beyond `tsc`.
- **Disabled stays focusable** (`aria-disabled`, clicks stopped at the host); a loading state keeps the element's width.

## Build and types

- `tsc -p tsconfig.build.json` emits `dist/` (JS and declarations); `lit` stays a dependency, resolved by the consumer's bundler. The page loads `@pts/web/fonts.css` and `tokens.css`.
- Storybook type-checks against `src/` through a `paths` mapping (`apps/storybook/tsconfig.json`), so `npm run typecheck` needs no build. Storybook's dev server and build use `dist/` (`prestorybook` builds it).
- React JSX types for the elements live in `apps/storybook/src/component/elements.d.ts`, since Storybook is the only React consumer; ship them from the package when another consumer needs them.

## Stories

- `apps/storybook/src/component/<Name>.stories.tsx`, attached to the component's docs page (`<Meta of>` in `<Name>.mdx`). Only the Playground is listed in the sidebar (`tags: ["!dev"]` on the meta, `["dev"]` on the Playground); the page embeds the others (`<Story of>`).
- The page keeps the token sections aligned with Figma (`.claude/rules/storybook.md`), and adds Preview (every theme × density, like the Figma page), Usage, and Playground.
