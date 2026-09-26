# 0012. Docs Dark Mode and Scoped Light Theme

- Status: accepted
- Date: 2026-09-26

## What we learned

The docs were fixed to light, with dark values only visible in side-by-side cells. Reading the docs in dark mode is the most direct way to review the dark theme as a whole. Building it exposed a gap in the CSS output: light values were only on `:root`, so a `[data-theme="light"]` region inside a dark page inherited dark values.

## Why it matters

- **The docs page itself is themed by tokens.** A toolbar toggle sets a `theme` global; the preview writes it to `data-theme` on `<html>`, and every docs style follows through CSS variables. No docs-specific dark styles were needed beyond Storybook's own code block.
- **Themes can be scoped.** `@pts/css` now emits light values for `:root` and `[data-theme="light"]`, so both themes can be applied to any subtree. Products get this for free (e.g. a light card inside a dark page).
- **The Storybook UI follows too.** Two manager themes (hex copies of the same tokens) switch with the toggle, so the sidebar matches the page.

## Implementation notes

- Toggle: a `TOOLEXTRA` addon in `.storybook/manager.tsx` using `@storybook/icons` (sun/moon). Clicking saves the choice in localStorage and sets the `theme` global.
- Mode resolution (`resolveMode` in `.storybook/theme.ts`), applied independently by manager and preview: explicit global (toggle or `?globals=theme:…`) → saved choice → light. The global is declared in `globalTypes` without a default, so an unset value falls back to the saved choice. An earlier version restored the saved choice by sending a global update from the manager on mount; that update could arrive before the preview was ready, so full-page loads came back light.
- Links inside docs pages use `./?path=…` with `target="_top"`: a bare `?path=…` resolves against `iframe.html` and loads the preview without the Storybook UI.
- The canvas toolbar is shown again for the toggle; the built-in backgrounds, measure, outline, and viewport tools are disabled.
- Code blocks: Storybook's source block uses a static theme, so its surface and syntax colors are overridden with color tokens (all contrast-checked foregrounds).
- Dark manager `colorSecondary` is neutral.800: Storybook renders selected sidebar items with white text on it.
- Swatch edges use `color.border.default` (outline on the palette ramp) so steps that match the page stay visible.

## Documented in

- `CLAUDE.md` — Commands, Token Docs (Storybook)
- `packages/css/terrazzo.config.ts`
- `packages/storybook/.storybook/`
