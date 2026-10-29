# 0076. Upstream TrueType Files for the Native Fonts

- Status: accepted
- Date: 2026-10-29

## Decision

Chosen: `@pts/android` and `@pts/ios` bundle upstream's own TrueType files, committed in `packages/android/fonts/` and copied unchanged, instead of decompressing `@pts/web`'s WOFF2 files, because the OFL counts a format change as a Modified Version, which may not keep the Reserved Font Names "Aspekta" and "Plex".

## What we learned

ADR 0059 converted the WOFF2 files to TrueType at build time to keep one source of font files, and ADR 0066 reused them for iOS. Whether a lossless decompression counts as a modification was left open (found 2026-10-21). The license settles it: its definition of "Modified Version" includes a derivative made "by changing formats". The converted files weren't the originals either: the IBM Plex TrueType files carry `DSIG` and `meta` tables that the decompressed ones lack.

Both upstreams publish TrueType files in the releases `@pts/web` already takes its WOFF2 files from (each WOFF2 file is byte for byte the release's, checked 2026-10-29): Aspekta `packages/fonts/variable/AspektaVF.ttf` at `@aspekta/fonts@2.100`, and IBM Plex `fonts/complete/ttf/` in the `@ibm/plex-mono@2.5.0` and `@ibm/plex-serif@2.0.0` release archives (the npm packages hold web fonts only).

Options considered:

- **Upstream TrueType files, committed**: chosen. Nothing is converted, so the names stay; about 1.6 MB in the repository.
- **Keep converting**: no extra files, but every native package would ship Modified Versions under the reserved names, which the license forbids once a package is public (`docs/plans/automated-delivery.md`, step 0).
- **Rename the converted families**: allowed, but the tokens' font stacks, `PtsFonts`, and the demos would name a family that isn't Aspekta or IBM Plex.
- **Fonts without Reserved Font Names** (Inter, Roboto): converting would be allowed, but replacing the typeface undoes ADR 0013 for a build step.

## Why it matters

- The native packages can be published (step 0 of the delivery plan) with the fonts as their authors released them.
- The fonts register under the same names as before: each file's family, full, and PostScript names and its version are those of the converted file (checked 2026-10-29), so `PtsFonts`, `PtsTypography`, and the demos don't change.

## Trade-offs

- **Two copies of each family**, the WOFF2 file in `@pts/web` and the TrueType file in `@pts/android`, kept in step by hand: a font update takes both from the same release. `packages/android/fonts.ts` names the releases.
- **iOS reads `@pts/android`'s folder**, as it already read its `fonts.ts` (ADR 0066), rather than holding a third copy.
- **The TrueType files are larger** (1.6 MB against about 0.3 MB of WOFF2); they are what the platforms load either way.

## Implementation notes

- `packages/android/fonts/<family>/`: the TrueType files and the family's `LICENSE.txt` (the same text as `@pts/web`'s). `fonts.ts` lists them; `build-fonts.ts` in both packages copies them into `dist/` with their licenses. `wawoff2` and its type declarations are removed.
- `packages/android/test/output.test.ts` and `packages/ios/test/output.test.ts`: every bundled font equals its file in `packages/android/fonts/`, byte for byte; appending a byte to one in `dist/` fails each.
- Checked: `npm run check`, `npm test`, `npm run typecheck`, `npm run build`, `npm run compile -w @pts/ios`.

## Documented in

- `CLAUDE.md`: Structure
- `README.md`: Fonts and license
- `docs/how-it-works.md`: the Android row
- `docs/plans/automated-delivery.md`: step 0
- `docs/progress.md`: Open questions
- ADR 0059, 0066: amended by this ADR
