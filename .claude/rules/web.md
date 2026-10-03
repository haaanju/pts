---
paths:
  - "packages/web/**"
---

# @pts/web

## Build (`terrazzo.config.ts`)

- One config; each web format is a plugin. A new format for this platform is a plugin here plus a subpath export in `package.json`, not a new package (ADR 0016, 0030).
- `tokens.css` blocks are listed in the config's comments: `:root` at the defaults, then each modifier's selectors repeating only its tokens. Each modifier's blocks list the token ids Terrazzo's resolver says that modifier defines (`modifierTokens()` in `tokens/source.ts`, ADR 0038); the config reads no token file. The wide media query takes its width from `breakpoint/md`. Component tokens join the theme and density blocks when their aliases reach a token of that modifier (ADR 0032), since a variable declared on `:root` keeps the default value inside a `[data-theme]` or `[data-density]` subtree. Their aliases come from Terrazzo (`aliasChain`, `partialAliasOf`). `npm test` checks every block against the resolver (`test/output.test.ts`, ADR 0039): a new modifier context needs a selector there too.
- `sass()` must come after `css()` in `plugins`, or its token map builds empty without a build error (ADR 0030); `npm test` catches it.
- `tokens.js` and `tokens.scss` hold `var(--…)` references, not values; primitives are included, as in `tokens.css`. `tokens.d.ts` types every value as `string`.

## Fonts (`fonts/`)

- All three families are self-hosted; consumers `@import "@pts/web/fonts.css"` before `@pts/web/tokens.css`. Nothing is loaded from a font service.
  - Aspekta (sans): one variable woff2, weight 100–900.
  - IBM Plex Mono and IBM Plex Serif: static woff2 at 400, 500, 600, 700 (the font-weight tokens).
- Licenses: SIL OFL 1.1, one `LICENSE.txt` per folder. "Aspekta" and "Plex" are Reserved Font Names, so ship the files unmodified (no subsetting or conversion) or rename the family.
- Aspekta is Latin only, and the product UI is English-only. Missing glyphs (`^ ~ ± •`) fall back to `system-ui`.
