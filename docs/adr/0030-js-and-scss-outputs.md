# 0030. JS/TS and SCSS Outputs as CSS Variable References

- Status: accepted
- Date: 2026-10-01

## What we learned

ADR 0016 planned JS/TS and SCSS as more formats of `@pts/web`, built by plugins in the same Terrazzo config. The research in `docs/research/terrazzo-js-sass.md` compared the official plugins (2.7.1):

- **`@terrazzo/plugin-js`** writes the resolved DTCG values, one full token set per resolver permutation, read through `resolver.apply(input)`. With theme × density × viewport that is 8 sets of 287 tokens (the research measured 189 KB for 4), and the consumer has to pick the permutation and re-render when it changes. Its typed `apply()` also requires every modifier, although the runtime fills in defaults.
- **`@terrazzo/plugin-css-in-js`** writes nested camelCase objects of CSS variable references (`surface.subtle` is `"var(--surface-subtle)"`) with a `.d.ts`, about 16 KB.
- **`@terrazzo/plugin-sass`** writes a private map of the same references, read through a `token()` function and a `typography()` mixin. It has no option for plain `$variables` or raw values.

The modifiers already work in CSS: `[data-theme]`, `[data-density]`, and the viewport media query switch the variables. A reference follows them for free; a copied value doesn't.

## Why it matters

- **Both formats are references to the CSS variables**: `@pts/web/tokens.js` (with `tokens.d.ts`) from `plugin-css-in-js`, and `@pts/web/tokens.scss` from `plugin-sass`. Theme, density, and viewport keep working through `tokens.css`, which consumers still import; the JS and SCSS add names, autocomplete, and type errors on typos, not values.
- **Raw values are left out** until a consumer needs real numbers or colors (charts, canvas, email HTML). Adding `plugin-js` then is a new output, not a breaking change.
- **Primitives are included**, as in `tokens.css`: `plugin-css-in-js` has no option to drop them, and both formats stay the same set. Product code still uses semantic tokens only.
- **Limits, the same as CSS today**: a value is `var(…)`, so Sass can't compute with it (`math.div`, color functions), and breakpoints can't be used in `@media`.
- **Plugin order**: `sass()` comes after `css()` in `plugins`. Listed before it, the build succeeds but the token map is empty; the plugin asks to run last (`enforce: "post"`), but the parser's sort doesn't reliably honor it (see the research).
- **`@pts/web` is an ES module package** (`"type": "module"`), like `@pts/tokens` and `@pts/storybook`, so Node loads `tokens.js` without reparsing it.

## Implementation notes

- `packages/web/terrazzo.config.ts`: `cssInJs({ filename: "tokens.js" })` and `sass({ filename: "tokens.scss" })` after `css()`. `tokens.css` is byte-identical to the build before.
- `packages/web/package.json` exports `./tokens.js` (`types` → `dist/tokens.d.ts`) and `./tokens.scss`.
- Checked: `import { surface } from "@pts/web/tokens.js"` in Node gives `"var(--surface-subtle)"`; a TypeScript file using it passes `tsc --strict` with `nodenext` and `bundler` resolution, and `surface.subtl` fails with "Did you mean 'subtle'?"; Dart Sass 1.105 compiles `@use "pkg:@pts/web/tokens.scss" as t` with `--pkg-importer=node`, giving `var(--padding-md)` and, for `@include t.typography("text.display-lg")`, `font` and `letter-spacing` variables.

## Documented in

- `CLAUDE.md` — Structure, Commands
- `README.md` — Packages, Usage, Status
- `docs/research/terrazzo-js-sass.md` — the comparison, with the option taken
