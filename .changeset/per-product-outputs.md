---
"@pts/web": patch
---

New: per-product outputs, `@pts/web/products/<name>.css` and `@pts/web/products/<name>.js` (typed by `<name>.d.ts`), for two example products: `dense-app` (density compact) and `roomy-app` (density relaxed). A product's CSS holds every token at its density on `:root`, keeps the theme blocks and the viewport media query, and has no `[data-density]` blocks. Its JS holds resolved values from Terrazzo's resolver, one token set per theme × viewport (ADR 0047). `tokens.css`, `tokens.js`, and `tokens.scss` are unchanged.
