# 0056. Android Colors for Compose

- Status: accepted (amended by 0059)
- Date: 2026-10-17

## Decision

Chosen: a new package, `@pts/android`, whose Terrazzo plugin writes `PtsColors.kt`: a `PtsColors` class with every semantic color and one value per theme (`PtsColors.Light`, `PtsColors.Dark`), because Compose reads colors from Kotlin values the app can switch, and the resolver already resolves each theme.

## What we learned

The goal is an end-to-end demo: change a semantic color, release, and see a Compose app change in the Android emulator. ADR 0022 chose a custom Terrazzo plugin for native outputs, since Terrazzo has no Android plugin and `@terrazzo/plugin-swift` reads dark values from `$extensions.mode`, not the resolver. A Terrazzo plugin's `build` hook receives the resolver, so it can resolve each theme the way `@pts/web` does.

Options considered for the format:

- **XML resources** (`values/colors.xml`, `values-night/colors.xml`): the platform's own light and dark switch, usable from Views and Compose. But resource qualifiers cover the night mode only, not density or shape, so the other modifiers couldn't follow; and an app can't pick a theme apart from the system's.
- **A Kotlin constant per token and theme** (`PtsColorsLight.contentBase`): simple, but the app has to choose between two objects at every use.
- **A class with one value per theme context**: the app picks `PtsColors.Light` or `Dark` once (from `isSystemInDarkTheme()` or its own setting) and passes it down, the way Compose's `MaterialTheme` passes `ColorScheme`. Density and shape can follow as more classes of the same shape.

And for what it holds:

- **Primitives** are reference for defining tokens (the docs' primitive pages say so); product code uses semantic tokens.
- **Component tokens** wait for a Compose component that needs them.
- **The semantic colors**, 60 tokens: what a screen uses.

## Why it matters

- **`packages/android` (`@pts/android`)**, in the fixed version group like every `@pts/*` package. `npm run build` writes `dist/PtsColors.kt`; nothing is published yet.
- **Names are the token path in lower camel case** (`content.inverse.base` → `contentInverseBase`), the Kotlin convention, and the same words as the docs and Figma. Each property carries the token's description as KDoc.
- **Colors are `Color(0xAARRGGBB)`** from the srgb components, alpha included (`utility.scrim` in dark is `0xB3000000`).
- **The package is `io.github.haaanju.pts`**, from the docs' domain.

## Trade-offs

- **Kotlin isn't compiled yet.** There is no JDK on the owner's Mac; the Compose app, the next step, compiles it. Until then the test reads the file as text.
- **Colors only.** Spacing (`Dp`), type (`TextStyle`), and shapes come when the app needs them, and with them the density and shape values.
- **No View-system output.** XML resources would serve apps without Compose; none needs them.

## Implementation notes

- `packages/android/plugin-compose.ts`: the plugin; options name the file, Kotlin package, class, token ids, and the modifier whose contexts become the values. `terrazzo.config.ts` passes the semantic colors from `tokens/source.ts`, in file order.
- `packages/android/test/output.test.ts` (in `npm test`): the class declares every semantic color once and nothing else, and each theme's value equals the token's own hex and alpha (worked out apart from the plugin); one test fixes `utility.scrim`'s alpha.
- `packages/android/CHANGELOG.md` points to the shared changelog, and `version-packages` restores it after `changeset version`, like the other packages.
- Checked: `npm run build`, `npm test` (the new suite: 5 tests; changing one generated alpha by hand fails it), `npm run typecheck`, `npm run check`.

## Documented in

- `CLAUDE.md` — Structure, Commands, Deferred
- `README.md` — Packages, Usage, Development
- `docs/how-it-works.md` — the Android row, Checks as code
- `docs/progress.md` — Next
