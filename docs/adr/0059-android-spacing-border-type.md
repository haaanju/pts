# 0059. Android Spacing, Borders, and Type

- Status: accepted (amended by 0076)
- Date: 2026-10-17

## Decision

Chosen: one Kotlin class per modifier, each with one value per context, `PtsSpacing` (density), `PtsBorder` (shape), and `PtsTypography` (viewport) next to `PtsColors` (theme), with the web fonts converted to TrueType and bundled as `PtsFonts`, because each modifier changes only its own tokens (`pts/orthogonal-modifiers`), so an app picks one value per modifier the way `data-*` attributes pick a mode on the web.

## What we learned

ADR 0056 wrote the semantic colors only. The rest of what a screen uses, spacing, corners, and type, also changes with a modifier: density changes padding, gaps, and control heights; shape changes the control and container radius; viewport changes the display sizes. Android resources have no qualifier for density or shape (ADR 0056), so values in Kotlin are the way to follow them.

Options considered:

- **One class per modifier**: four small classes; an app holds four choices. Matches the resolver's structure, and what a class holds never changes with another modifier.
- **One class for everything, one value per permutation** (2 × 2 × 2 × 2 = 16): a single object to pass, but sixteen named values, most repeating the same numbers.
- **Material's `ColorScheme`, `Typography`, `Shapes`**: familiar, but their slots are Material's names, not these tokens; an app can map them itself.

And for the fonts:

- **Convert at build time** from `@pts/web`'s WOFF2 (`wawoff2`, Google's decoder in WebAssembly): one source of font files. Android font resources read TrueType and OpenType, not WOFF2.
- **Commit TrueType copies**: about 1.5 MB more in the repository, and two copies to keep in step.

## Why it matters

- **`PtsSpacing`** (`Relaxed`, `Compact`): `space/*`, `padding/*`, `gap/*`, and `size/*`, 34 values in `Dp`. A token's px is one dp, the unit Android scales by screen density.
- **`PtsBorder`** (`Soft`, `Round`): `radius/*`, `stroke/*`, and `focus-ring/*`, 15 values in `Dp`. `radius/full` is 9999dp, which a `RoundedCornerShape` clamps to a pill.
- **`PtsTypography`** (`Narrow`, `Wide`): the 13 `text/*` styles as `TextStyle`, named without the `text` prefix (`bodyMd`). Font size and letter spacing are `sp`, so they follow the user's text size; line height is the size times the token's ratio. `Wide` matches `breakpoint/md`, 768dp, a tablet.
- **`PtsFonts`**: `sans` (Aspekta, one variable font with a `FontVariation` weight per used weight), `serif`, and `mono` (IBM Plex, four static weights each), from `dist/res/font/`, with their OFL licenses in `dist/licenses/`. The library's `minSdk` is 26, where Android reads a variable font's axes.

## Trade-offs

- **Motion, elevation, z-index, breakpoints, and component tokens** aren't written yet: none has a use on Android so far, and shadows don't map one-to-one onto Android elevation (ADR 0022).
- **A dev dependency, `wawoff2`**, unchanged since 2022; it wraps Google's reference decoder, so the TrueType files are the same fonts.
- **`minSdk` 26** for the library (it was 23). Apps on Android 7 and earlier can't use it.

## Implementation notes

- `packages/android/plugin-compose.ts` takes `groups` (file, class, tokens, modifier, kind: color, dp, or textStyle) and writes `PtsFonts.kt`; `terrazzo.config.ts` lists the four groups; `fonts.ts` the families and files; `build-fonts.ts` decompresses them (`npm run build` runs it after `tz build`). `build.gradle.kts` adds `dist/res` and the Compose `ui-unit` and `ui-text` APIs.
- `test/output.test.ts`: each class declares its tokens once and holds every context's values, written out apart from the plugin (19 tests); the font files are TrueType and their licenses are there.
- The demo app reads all four classes and has Theme, Density, and Shape buttons.
- Checked in the emulator (420 dpi, 2.625 px per dp): the soft danger box is 126 px, 48dp, in relaxed and 105 px, 40dp, in compact (`size/control/md`); toggling density narrows each toggle button by 8dp (`padding/xl` 20 → 16 on both sides); round turns the buttons into pills and the card's corners to 32dp; Aspekta and IBM Plex Mono render. `npm run check`, `npm test`, `npm run typecheck`; `publishToMavenLocal` and the demo build.

## Documented in

- `CLAUDE.md` — Structure, Commands, Deferred
- `README.md` — Packages, Usage (Android)
- `docs/how-it-works.md` — the Android row, Checks as code
- `docs/progress.md` — Next
- ADR 0056 — amended by this ADR
