# 0013. Self-Hosted Aspekta as the Sans Family

- Status: accepted (amended by 0015)
- Date: 2026-09-26

## What we learned

IBM Plex Sans was reliable but gave the system little character. Aspekta (Ivo Dolenc, SIL OFL 1.1) is a modern geometric sans shipped as a variable font. Inspecting the file showed: a `wght` axis of 100–900 (covers the 400–700 the tokens use), Latin only, no Hangul, a handful of missing symbols (`^ ~ ± • « » ½ ²`), and no tabular figures. The product UI will be English-only, so Hangul is not a concern.

Two options were considered: Aspekta for display and headings only with IBM Plex for body text, or Aspekta as the single sans. With no Korean UI, the missing glyphs are rare in UI copy and fall back gracefully, so a single sans is simpler and more consistent.

## Why it matters

- **Aspekta is the sans family everywhere**; every `text/*` style follows `font-family/sans`.
- **Fonts ship with the tokens.** `@pts/fonts` self-hosts the file and its `@font-face`, so products don't depend on a third-party font service.
- **Numbers that must align use mono.** Without tabular figures, proportional digits drift in tables, prices, and timers.
- **The license is respected.** The OFL file ships alongside the font. "Aspekta" is a Reserved Font Name, so the file is used unmodified; subsetting or converting it would require renaming the family.

## Implementation notes

- `packages/fonts/files/aspekta/AspektaVF.woff2` (30 KB) and `LICENSE.txt` (moved into a per-font folder in ADR 0015), from the upstream repo (`@aspekta/fonts@2.100`).
- `packages/fonts/fonts.css`: `@font-face { font-family: "Aspekta"; font-weight: 100 900; font-display: swap; }`; the package exports it as `@pts/fonts`.
- `typeface/aspekta` = `["Aspekta", "system-ui", "sans-serif"]`; `font-family/sans` aliases it. `typeface/ibm-plex-sans` (and its IBM Plex Sans KR fallback) was removed.
- Storybook: the preview imports `@pts/fonts`; the manager gets the file through `staticDirs` and an `@font-face` in `manager-head.html`. Google Fonts then loaded only IBM Plex Serif and Mono; ADR 0015 bundled those too.
- Verified with `document.fonts` in both the docs iframe and the manager (Aspekta `loaded`), plus screenshots of the Typography page, including a coverage section that shows fallback glyphs and proportional vs mono digits.

## Documented in

- `CLAUDE.md` — Structure, Primitives, Semantic, Fonts
- `packages/fonts/`
