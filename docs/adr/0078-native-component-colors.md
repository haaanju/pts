# 0078. The Component Tier's Colors on Android and iOS

- Status: accepted
- Date: 2026-10-30

## Decision

Chosen: `@pts/android` and `@pts/ios` write every color of the component tier, `PtsComponentColors`, the way they write the semantic colors, and the demos hand the switch's to the native switch where it takes them, because native components draw a component's shape and size themselves, so its colors are what can reach them, and a generic class needs no change for the next component.

## What we learned

ADR 0056 and 0063 left the component tier on the web: a native component has its own anatomy, and nothing native used `button/*`. Switch (ADR 0077) was chosen because both platforms have one natively. What each takes:

- **Material 3 `Switch`** (Android): a color per part and state through `SwitchDefaults.colors`: the track, thumb, and outline, checked and unchecked, enabled and disabled. No size, and no hover or pressed color: Material draws those as a state layer over the track.
- **SwiftUI `Toggle`** (iOS): one color, the on track (`tint`). iOS draws the knob white, in both appearances.

How much of the tier to write, decided by the owner (2026-10-29):

- **Every component color, one generic class**: chosen. `button/*` comes along with `switch/*`; only the switch is wired in the demos, and the button's wiring is left for later.
- **The switch only**: the smallest output, but the plugins would name a component.
- **Every color, and wire the demos' buttons too**: more than one night's work, and Material's and Apple's buttons take fewer of the button's colors than the switch's.

Component sizes stay on the web: neither native switch exposes one, and Material's and Apple's buttons have their own heights.

## Why it matters

- **Android**: `PtsComponentColors` (`Light`, `Dark`), 34 colors in lower camel case (`switchOnSurfaceRest`), one more group in `terrazzo.config.ts`; the plugin needed no change. The catalog lists them too, as `PtsCatalog.componentColors`.
- **iOS**: a color set per component color in `Colors.xcassets`, with the light and dark values of the semantic color it aliases, and at Increase Contrast that color's next step (ADR 0071): `switch/on/surface/rest` takes `inverse/strong`, as `inverse/base` does. `PtsComponentColors` makes them public.
- **Android demo**: `switchColors(PtsComponentColors)` in `Theme.kt` maps them onto `SwitchDefaults.colors`, beside the Material color scheme; the Components tab shows a switch on, and one disabled off and one disabled on.
- **iOS demo**: the `Toggle` keeps the system's green. `switch/on/surface/rest` is `inverse/base`, light in dark mode, where the white knob would disappear on it; the demo had chosen green for that reason before (ADR 0065).
- **Figma**: the 34 component color variables carry ANDROID (`components.switchOnSurfaceRest`, the instance the demo names `components`) and iOS (`PtsComponentColors.switchOnSurfaceRest`) code syntax (ADR 0075).

## Trade-offs

- **The switch's on color reaches iOS nowhere.** `Toggle`'s one color can't be `inverse/base` in dark mode. The ways out are the owner's to choose (`docs/progress.md`, Open questions): a custom `ToggleStyle` that draws the track and thumb from the tokens (ADR 0063's native-first rule would bend), an on color that carries a white thumb in both themes on every platform (ADR 0077's choice would change), or the system's green, as now.
- **Colors with no native use ship anyway**: the button's colors on both platforms, and the switch's hover and pressed tracks, which Material and iOS draw themselves.
- **Android's hover and pressed** come from Material's state layer over Plain's track, not from `switch/*/surface/hover` and `pressed`.

## Implementation notes

- `packages/android/terrazzo.config.ts`: the `PtsComponentColors` group. `packages/android/test/output.test.ts`: the class count (34) and one value (`switchOnSurfaceRest` in dark, `Color(0xFFE8E8E8)`); the generic tests check every value in both themes.
- `packages/ios/plugin-ios.ts`: a `componentColors` option, written after the semantic colors, with Increase Contrast from the aliased color (`aliasChain`); `PtsComponentColors.swift`. `terrazzo.config.ts` lists them and counts their high-contrast sets in the build summary (35 of 94). `packages/ios/test/output.test.ts`: a color set per component color, its values the resolver's and its high-contrast values its semantic color's next step, and `PtsComponentColors`; changing one by hand fails it.
- `apps/android-demo`: `Plain` holds `components`; `switchColors()` in `Theme.kt`; three switches in Components.
- Checked: `npm run check`, `npm test`, `npm run typecheck`, `publishToMavenLocal` and the Android demo's `assembleDebug`, `npm run compile -w @pts/ios` and the iOS demo's `xcodebuild`; the Android demo in the emulator: on, a dark track with a white thumb (black on a light track in dark); off, outlined with a gray thumb; disabled off outlined faintly, disabled on filled gray.

## Documented in

- `CLAUDE.md`: Structure, Commands (`npm test`), Deferred
- `README.md`: Packages, Usage (Android)
- `docs/how-it-works.md`: the component colors row
- the `figma` skill: ANDROID and iOS code syntax
- `docs/progress.md`: Open questions
