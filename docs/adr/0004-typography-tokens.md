# 0004. Typography Tokens

- Status: accepted (amended by 0011, 0013)
- Date: 2026-09-25

## What we learned

Typography is the first category where a single design decision (a text style) spans several properties. DTCG models this with the `typography` composite type, while individual properties (size, weight, family, line height) remain useful on their own. Terrazzo merges all token files into one namespace, so primitive and semantic groups cannot share a top-level name.

## Why it matters

- **Per-property tokens plus composites**: `font-size`, `font-weight`, `font-family`, `line-height`, and `letter-spacing` are usable individually, and `text/*` composites bundle them into styles that map 1:1 to Figma Text Styles. Terrazzo emits both per-property variables and a `font` shorthand for each composite.
- **Composites reference semantic property tokens**, not primitives. This is the one exception to "semantic references only primitives", so a change to `line-height/tight` flows into every heading style.
- **Distinct primitive group names** (`typeface`, `weight`, `ratio`) avoid colliding with semantic groups (`font-family`, `font-weight`, `line-height`).
- **Unitless line heights** follow DTCG and CSS best practice: they scale with font size, so three ratios cover every style.
- **Step-numbered font sizes** (`font-size/400` = 16px body default) follow the `layout` convention: ten steps would be unwieldy as t-shirt sizes.

## Implementation notes

- Primitives: `dimension/10, 14, 18` added; `typeface/ibm-plex-{sans,serif,mono}` with fallbacks (`IBM Plex Sans KR` for Korean in sans); `weight/400–700`; `ratio/120, 150, 175`.
- `font-size/100–1000` → 10, 12, 14, 16, 18, 20, 24, 32, 40, 48px.
- `letter-spacing/normal` = 0 is included because the DTCG composite requires `letterSpacing`. The CSS `font` shorthand cannot carry letter spacing, so consumers apply `--text-*-letter-spacing` separately when it becomes non-zero.
- Styles: `display-lg/md`, `heading-lg/md/sm`, `body-lg/md/sm`, `label-md/sm`, `caption`, `code-md`.
- Font files are not bundled; loading IBM Plex is the consumer's responsibility for now.

## Documented in

- `CLAUDE.md` — Token rules section
- `packages/tokens/src/semantic/typography.tokens.json`
