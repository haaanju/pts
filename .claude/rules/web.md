---
paths:
  - "packages/web/**"
---

# @pts/web

## Build (`terrazzo.config.ts`)

- One config; each web format is a plugin. A new format for this platform is a plugin here plus a subpath export in `package.json`, not a new package (ADR 0016, 0030).
- `tokens.css` blocks are listed in the config's comments: `:root` at the defaults, then each modifier's selectors repeating only its tokens. Each modifier's blocks list the token ids Terrazzo's resolver says that modifier defines (`modifierTokens()` in `tokens/source.ts`, ADR 0038); the config reads no token file. The wide media query takes its width from `breakpoint/md`. `modifierBlocks()` builds them in resolver order: theme and viewport have their own selectors, and every other modifier (density, shape) is `[data-<modifier>="<context>"]` for each context, default last (ADR 0048). A semantic token whose value a modifier's contexts change joins its blocks (`text/display-*` the viewport's), since the blocks hold values (ADR 0079); `repeated()` compares the resolver's values. `npm test` checks every block against the resolver (`test/output.test.ts`, ADR 0039): a new modifier context needs a selector there too.
- `sass()` must come after `css()` in `plugins`, or its token map builds empty without a build error (ADR 0030); `npm test` catches it.
- The package ships the semantic tier only (ADR 0079): every `css()` takes `include: [...shipped]` (`tierIds()` in `tokens/source.ts`) and `transform: resolved`, which writes a token's value instead of `var(--<alias>)` (`withoutAliases()`). `plugin-js` has no filter, so `shippedOnly()` hands it a resolver that drops the other tiers.
- `tokens.js` and `tokens.scss` hold `var(--…)` references to the CSS variables, not values. `tokens.d.ts` types every value as `string`.
- Products (ADR 0047): `products.ts` maps each product to the modifier inputs it fixes. `blocks(fixed)` builds the CSS permutations for `tokens.css` (`blocks({})`) and every product, so a product's blocks match `tokens.css`'s minus the fixed modifiers'. A new product needs only a line in `products.ts`; `npm test` checks its files.

## Fonts (`fonts/`)

- All three families are self-hosted; consumers `@import "@pts/web/fonts.css"` before `@pts/web/tokens.css`. Nothing is loaded from a font service.
  - Aspekta (sans): one variable woff2, weight 100–900.
  - IBM Plex Mono and IBM Plex Serif: static woff2 at 400, 500, 600, 700 (the font-weight tokens).
- Licenses: SIL OFL 1.1, one `LICENSE.txt` per folder. "Aspekta" and "Plex" are Reserved Font Names, so ship the files unmodified (no subsetting or conversion) or rename the family.
- Aspekta is Latin only, and the product UI is English-only. Missing glyphs (`^ ~ ± •`) fall back to `system-ui`.
