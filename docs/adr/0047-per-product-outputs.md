# 0047. Per-Product Outputs

- Status: accepted (amended by 0048)
- Date: 2026-10-08

## What we learned

`tokens.css` serves every product the same way: all three modifiers switch at runtime, so it carries `[data-density]` blocks that a product with one fixed density never uses, and its JS and SCSS hold `var(--…)` references, not values (ADR 0030). Two questions were open:

- How one source serves products that differ by a fixed choice, such as a dense data tool and a roomy marketing site.
- Where raw values in JS go when a consumer can't read a CSS variable (`docs/progress.md`, ADR 0030).

The resolver already describes a product: a fixed set of modifier inputs, such as `{ density: "compact" }`. Terrazzo 2.7 can build from that with its own plugins, without changing the resolver file:

- **`@terrazzo/plugin-css`** takes a list of `permutations`, each an input, an `include` list, and a `prepare()` that wraps the block. Several `css()` instances with different filenames build in one pass. Each stores its transforms by permutation id; where two instances share an id (`roomy-app`'s blocks and `tokens.css`'s, since relaxed is the default), they compute the same values. Each instance also stores its first block as the default transforms, which `cssInJs()` and `sass()` read for the variable names only; `tokens.css`, `tokens.js`, `tokens.d.ts`, and `tokens.scss` build byte-identical with the product instances listed before or after them.
- **`@terrazzo/plugin-js`** writes resolved token sets, one per permutation, behind `resolver.apply(input)`, with a `.d.ts`. Its `contexts` option limits the permutations (one context for a fixed modifier), and `properties` limits each token to `$type` and `$value`. Its runtime fills an omitted modifier with the resolver's default, so `dense-app`'s `apply({ theme: "dark" })` returns `undefined` in plain JS; its types require every modifier, so TypeScript catches it. The `.d.ts` imports types from `@terrazzo/token-types`.

A hand-written plugin could emit a simpler shape (`{ light, dark }` maps of values). It was turned down: plugin-js gives the values and types with no output code of our own, which is what ADR 0030 planned for raw values.

## Why it matters

- **A product is a fixed set of modifier inputs**, defined in one place: `packages/web/products.ts`. The build config, the output test, and the Storybook page read it.
- **Two example products, not real ones**: `dense-app` (density compact) and `roomy-app` (density relaxed). Like the Button for the component tier (ADR 0034), they exist to show and test per-product outputs from one source.
- **Subpaths of `@pts/web`** (one package per platform, ADR 0016): `@pts/web/products/<name>.css` and `@pts/web/products/<name>.js` (typed by `<name>.d.ts`), from `dist/products/`.
- **CSS**: `:root` holds every token at the product's inputs (the others at their defaults). A modifier the product fixes has no blocks; the others keep theirs exactly as in `tokens.css`, built by the same function: the theme blocks with the component tokens that reach theme tokens, and the `breakpoint/md` media query. A product's CSS replaces `tokens.css`; both declare every token on `:root`.
- **JS holds resolved values**, the first answer to the raw-values question: one token set per permutation of the modifiers the product leaves open, each token's `$type` and `$value` as Terrazzo resolves it (a color with `hex` and `components`, a dimension with `value` and `unit`). Consumers pass every modifier, the product's own included: `apply({ theme: "dark", density: "compact", viewport: "narrow" })`.
- **The viewport stays in the JS.** It is one more context in `contexts`, so both narrow and wide sets are there (4 per product); the consumer picks with `matchMedia` and `breakpoint/md`. Leaving wide out would give a canvas heading the phone size on a desktop.
- **`@terrazzo/token-types` is a dependency of `@pts/web`**, so the product `.d.ts` resolves for consumers. It holds types only.
- **The resolver file doesn't change**, and `tokens.css`, `tokens.js`, `tokens.d.ts`, and `tokens.scss` stay byte-identical.

## Trade-offs

- **The JS is large**: about 150 KB per product unminified (4 permutations × 327 tokens, `$type` and `$value` only), since every permutation repeats every token. It is for code that needs values, not for every page.
- **The JS shape is plugin-js's**, not a shape of our own: `resolver.apply(input)` and DTCG values. A plainer shape would need a hand-written plugin and `.d.ts` to maintain.
- **A product fixing the theme or the viewport is supported by the build** (its blocks are left out), but no example product does, so only density is exercised.

## Implementation notes

- `packages/web/products.ts`: `products`, name → modifier inputs.
- `packages/web/terrazzo.config.ts`: `blocks(fixed)` returns the CSS permutations for a set of fixed inputs; `tokens.css` is `blocks({})`. Each product adds `css({ filename: "products/<name>.css", permutations: blocks(fixed) })` and `js({ filename: "products/<name>.js", contexts, properties: ["$type", "$value"] })`.
- `packages/web/package.json`: exports `./products/*.css` and `./products/*.js` (`types` → `dist/products/*.d.ts`); devDependency `@terrazzo/plugin-js`, dependency `@terrazzo/token-types`.
- `packages/web/test/output.test.ts` (ADR 0039) runs the CSS checks for each product file at its inputs: `:root` holds every token (an alias references its target at the product's density), every block of an open modifier is complete and declares no other modifier's token, and a fixed modifier has no block. For the JS: one token set per open permutation and no other, each token's `$type` and `$value` equal to `resolver.apply` for that permutation, and the `.d.ts` types every token. Verified by breaking the build: `[data-density]` blocks in a product fail with `has a block for density, which it fixes`; the JS built with every density fails its permutation list.
- Storybook: an **Output/Products** page (`apps/storybook/src/output/Products.mdx`) lists each product's inputs and imports, previews the same layout in each, and lists the tokens whose values differ between the products (`ProductList`, `ProductPreview`, `ProductDiff` in `components.tsx`, values from the docs' Terrazzo data, ADR 0038). One page has one `:root`, so the preview doesn't load the product files: each cell sets its product's inputs as `tokens.css` attributes (`data-density`), which give the values the product's `:root` holds; `npm test` checks both files against the resolver. Checked by `npm run test-a11y` in light and dark.
- Checked from a consumer: `import { resolver } from "@pts/web/products/dense-app.js"` passes `tsc --strict` with `nodenext` resolution, and `density: "relaxed"` is a type error.

## Documented in

- `CLAUDE.md` — Structure, Commands, Output
- `.claude/rules/web.md` — Build
- `.claude/rules/storybook.md` — Files, Content
- `docs/how-it-works.md` — Outputs, Documentation
- `README.md` — Packages, Usage
- `docs/progress.md` — Open questions (the raw-values question is answered here)
- ADR 0030 — amended by this ADR
