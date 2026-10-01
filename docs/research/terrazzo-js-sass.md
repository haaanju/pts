# Terrazzo JS and Sass plugins: research

Research for the "JS/TS and SCSS outputs in `@pts/web`" item in `docs/progress.md`.

**Outcome (ADR 0030):** both formats are CSS variable references: `@terrazzo/plugin-css-in-js` for `@pts/web/tokens.js` and `@terrazzo/plugin-sass` for `@pts/web/tokens.scss`, primitives included. `@terrazzo/plugin-js` (raw values) is left out until a consumer needs it.

**Since this research, a third modifier exists** (viewport, ADR 0029). `plugin-js` would emit 2 × 2 × 2 = 8 permutations, and its typed `apply()` would require all three inputs. The reference plugins need nothing: the viewport media query lives in `tokens.css`. The measurements below are from the two-modifier build.

Setup: `@terrazzo/cli` 2.7.1 (package-lock). `@terrazzo/plugin-js`, `@terrazzo/plugin-sass`, and `@terrazzo/plugin-css-in-js` are all published at 2.7.1, with peer dependency `@terrazzo/cli ^2.7.1`. Read from the npm tarballs (`README.md`, `dist/*.js`), then tried on a scratch copy of `packages/web/terrazzo.config.ts` (installed with `--no-save`, then removed). The `tokens.css` built with the extra plugins was byte-identical to the current build.

## @terrazzo/plugin-js

**Options** (`dist/lib.d.ts`): `filename` (default `index.js`; a `.d.ts` is written next to it), `contexts` (limit which modifier contexts get permutations), `properties` (which token fields to keep; default `$type`, `$value`, `$description`, `$extensions`, `$deprecated`). No value transform option: values are the resolved DTCG objects, not CSS strings.

**Modifiers**: by default it emits **every permutation** of the resolver (`resolver.listPermutations()`), so theme × density = 4 full token sets. `contexts` narrows that. Output is one object keyed by the permutation's JSON, plus a `resolver.apply(input)` that fills in the resolver defaults and looks the set up:

```js
export const PERMUTATIONS = {
  "{\"density\":\"relaxed\",\"theme\":\"light\"}": {
    "surface.subtle":{"$type":"color","$description":"Cards, popovers, …","$value":{"colorSpace":"srgb","components":[0.9725,0.9725,0.9725],"hex":"#f8f8f8","alpha":1}},
  …
  "{\"density\":\"relaxed\",\"theme\":\"dark\"}": {
    "surface.subtle":{…,"$value":{"colorSpace":"srgb","components":[0.1412,0.1412,0.1412],"hex":"#242424","alpha":1}},
  …
};
const INPUT_DEFAULTS = {"theme":"light","density":"relaxed"};
export const resolver = { apply(userInput) { … return PERMUTATIONS[inputKey]; }, listPermutations() { … } };
```

`padding.md` across the four permutations (relaxed light, relaxed dark, compact light, compact dark):

```js
"padding.md":{"$type":"dimension","$description":"Padding inside controls and list items.","$value":{"value":12,"unit":"px"}}  // relaxed (x2)
"padding.md":{"$type":"dimension","$description":"Padding inside controls and list items.","$value":{"value":8,"unit":"px"}}   // compact (x2)
```

**Typings**: the `.d.ts` types every token id and the modifier input:

```ts
import type { TokenNormalizedSet, ColorTokenNormalized, … } from "@terrazzo/token-types";
type InputType = { "theme": "light" | "dark"; "density": "relaxed" | "compact"; };
export type Color = Pick<ColorTokenNormalized, "$type" | "$value" | "$description" | "$extensions" | "$deprecated">;
export interface Tokens { "surface.subtle": Color; "padding.md": Dimension; … }
export const resolver: { apply(input: InputType): Tokens; listPermutations(): InputType[]; };
```

Checked with `tsc --strict`: `apply({ theme: "dark", density: "compact" })["surface.subtle"].$value.hex` and `["padding.md"].$value.value` type-check; `theme: "sepia"` is rejected. `InputType` requires **both** modifiers, although `apply()` at runtime fills in defaults, so `apply({ theme: "dark" })` works in JS but fails in TS.

**Other facts**

- All 287 tokens, primitives included (`color.neutral.*`, `dimension.*`). No include/exclude option.
- Size: 189 KB for 4 permutations with default properties; 55 KB with `contexts: { theme: ["light", "dark"], density: ["relaxed"] }` and `properties: ["$value"]` (2 permutations).
- The `.d.ts` imports types from `@terrazzo/token-types`, so `@pts/web` would need it as a dependency for consumers to get the types.
- The README notes the resolver support made the output heavy for client-side use and points to `@terrazzo/plugin-css-in-js` instead (below).

## @terrazzo/plugin-sass

**Options** (`dist/lib.d.ts`): `filename` (default `index.scss`) and `exclude` (globs). Nothing else.

**Modifiers**: none handled. It requires `@terrazzo/plugin-css` and maps every token to its **CSS variable**, so the values are `var(--…)`, and theme and density come from `tokens.css` at runtime (`[data-theme]`, `[data-density]`). The `.scss` is the same for every permutation.

**Shape**: one private map plus a function and a mixin, no `$variables`:

```scss
$__token-values: (
  "padding.md": var(--padding-md),
  "surface.subtle": var(--surface-subtle),
  "text.body-md": var(--text-body-md),
  …
);
$__token-typography-mixins: (
  "text.body-md": ( "font": var(--text-body-md), "letter-spacing": var(--text-body-md-letter-spacing) ),
  …
);
@function token($tokenName) { … }
@mixin typography($tokenName) { … }
```

Compiled with Dart Sass 1:

```scss
@use "tokens" as t;
.card { background: t.token("surface.subtle"); padding: t.token("padding.md"); @include t.typography("text.body-md"); }
```
```css
.card {
  background: var(--surface-subtle);
  padding: var(--padding-md);
  font: var(--text-body-md);
  letter-spacing: var(--text-body-md-letter-spacing);
}
```

**Other facts**

- Because every value is a `var()`, Sass can't compute with them (`math.div`, color functions) and `token("breakpoint.md")` can't be used in `@media` (custom properties don't work in media queries; same limit as today's CSS).
- Includes primitives (`"color.neutral.50": var(--color-neutral-50)`), unless excluded with `exclude`.
- **Plugin order matters**: sass must come **after** `css()` in `plugins`. Listed before it, the build succeeds but `$__token-values` is empty (only the typography mixins are filled). The plugin sets `enforce: "post"`, but the parser's sort comparator (`parser/dist/config.js`) only returns 1 when `a` is post and `b` isn't, never -1 for the reverse, so the sort doesn't reliably move it.
- The README shows `filename: "index.sass"`, but the output is SCSS syntax.

## For comparison: @terrazzo/plugin-css-in-js

Not asked for, but it is what the plugin-js README recommends for client code, so it is one more option for the JS shape. Option: `filename` only. Like plugin-sass, it needs plugin-css and emits CSS variable references, so theme and density stay in `tokens.css`. Output is nested camelCase objects with a matching `.d.ts` (`string` values):

```js
export const padding = { "lg": "var(--padding-lg)", "md": "var(--padding-md)", … };
export const surface = { "strong": "var(--surface-strong)", "stronger": "var(--surface-stronger)", "subtle": "var(--surface-subtle)" };
export const text = { "bodyMd": { "fontFamily": "var(--text-body-md-font-family)", "fontSize": "var(--text-body-md-font-size)", … } };
```

16 KB, primitives included (`color`, `dimension`, …).

## Decisions for the user

- **What JS consumers get**: raw values per permutation (plugin-js: DTCG objects, every theme × density, for code that needs real numbers and colors, such as charts, canvas, or native bridges), or CSS variable references (plugin-css-in-js: strings like `"var(--surface-subtle)"`, theme and density follow `tokens.css`), or both.
- **If plugin-js, which permutations**: all four (default), or only some through `contexts` (for example both themes at relaxed density). With plugin-js, both themes survive either way; the shape is fixed (one set per permutation, read through `resolver.apply()`), not values keyed by theme inside each token.
- **If plugin-js, which token fields**: everything (default, with descriptions, 189 KB) or only `$value` (`properties`).
- **Typed exports**: plugin-js and plugin-css-in-js always write a `.d.ts`; with plugin-js, add `@terrazzo/token-types` as a dependency of `@pts/web`, and accept that the typed `apply()` needs both modifiers.
- **SCSS shape**: plugin-sass only offers the `token()` function and `typography()` mixin over a private map of CSS variables. Plain `$variables` or raw values (for Sass math or breakpoints in `@media`) would need a custom plugin.
- **Primitives in JS and SCSS**: ship them as the plugins do, or exclude them (plugin-sass has `exclude`; plugin-js and plugin-css-in-js have no option for it).
- **Subpath names**: for example `@pts/web/tokens.js` (+ `tokens.d.ts`) and `@pts/web/tokens.scss`, next to `./tokens.css`.
