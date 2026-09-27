# 0015. Audit Fixes: Visible States, Reproducible Color, Bundled Fonts, Tooling

- Status: accepted (amended by 0017)
- Date: 2026-09-26

## What we learned

An audit of everything up to `v0.1.0` found the token and contrast checks solid (Terrazzo lint clean, no alias type mismatches, 368 contrast pairs, no vulnerable dependencies) but surfaced gaps elsewhere:

1. **Invisible states.** In dark, `default-hover`, `subtle`, `raised`, and `disabled` were all `neutral.900`, so a hover inside a card or modal showed nothing. In light, `default-hover` equaled `disabled`. Contrast checks compare text with backgrounds, so they never saw two backgrounds being identical.
2. **Color was not reproducible.** The palette midpoints and the semantic step selection came from a throwaway script outside the repository.
3. **Mono and serif fonts were not shipped.** The tokens named IBM Plex Mono and Serif, but only Aspekta was bundled; products got `ui-monospace`, while the docs loaded Plex from Google Fonts.
4. **Tooling gaps.** The `.ts` scripts were never type-checked, no Node version was declared though they depend on type stripping, verification ran only in a local hook without Terrazzo's own linter, and there was no CI.
5. **Every ADR was still `proposed`** although all were implemented, and later decisions had changed several of them.

## Why it matters

- **States must be visible, and the check proves it.** `neutral.850` (#323232, OKLab midpoint of 800 and 900) gives dark hover its own step. `npm run check` now fails if `X`, `X-hover`, and `X-pressed` share a color, or if `default-hover` / `default-pressed` match `subtle`, `raised`, or `disabled`.
- **Color tokens are generated.** `scripts/generate-color.ts` holds the Figma anchors, the OKLab midpoints, and the selection rules, and reproduces the committed JSON byte for byte. Edits go through the script.
- **Every font the tokens name ships with them.** Products and docs render the same, and nothing is loaded from a font service.
- **Checks run the same way everywhere.** Pre-commit runs check, lint, and typecheck; CI adds both builds.
- **ADR status reflects reality.** Implemented ADRs are `accepted`; `amended by` points to the later ADRs that changed them.

## Implementation notes

- Dark: `default-hover` → `neutral.850`, `default-pressed` stays `neutral.800`, `disabled` stays `neutral.900`. Light: `disabled` → `neutral.50`. All 368 contrast pairs still pass.
- `npm run generate:color -w @pts/tokens`; key order and rounding are fixed so an unchanged script produces no diff.
- `@pts/fonts/files/` is one folder per font (`aspekta/`, `ibm-plex-mono/`, `ibm-plex-serif/`), each with its OFL license. Plex ships at 400–700 to match the font-weight tokens.
- `packages/tokens/tsconfig.json` uses `erasableSyntaxOnly`, so the scripts stay runnable with type stripping. Root `engines.node` is `>=22.18`, plus `.nvmrc`.
- Removed the empty `.claude/skills/adr` and `.claude/skills/figma-sync` placeholders.
- Left as is, by decision: primitive CSS variables stay public (the `var()` chain needs them); 16 unused primitives stay as the reserve of full ramps; no `$description` yet; the Figma file is stale until the sync mechanism is decided; packages remain private.

## Documented in

- `CLAUDE.md` — Commands, Color, Fonts
- `packages/tokens/scripts/`, `packages/fonts/`, `.githooks/pre-commit`, `.github/workflows/ci.yml`
