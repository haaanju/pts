# 0060. Android Demo on Material 3

- Status: accepted (amended by 0061)
- Date: 2026-10-17

## Decision

Chosen: rebuild the demo app on Material 3's own components, themed from the tokens through a mapping in the app (`Theme.kt`), with four tabs in Material's adaptive navigation (Home with sample content, Components, Tokens, Settings), and a token catalog the plugin writes for the demo only, because the owner wanted the demo to look like an app and read like the Storybook docs, and the mapping is how a token system meets a platform's component library.

## What we learned

The demo was one screen of hand-drawn boxes (ADR 0057, 0059). Native components read `MaterialTheme`: its color roles, type scale, and shapes. Plain's names aren't Material's, so every role needs a token, and some have none.

Options considered:

- **Navigation**: a drawer like the docs' sidebar, a bottom bar, or `NavigationSuiteScaffold`, which shows a bottom bar on a phone and a rail on a wider window. Material 3's current guidance favors the adaptive scaffold over a drawer on phones; four destinations fit a bottom bar.
- **Where the mapping lives**: in `@pts/android` (every Compose app gets it) or in the app. In the app: the roles are Material's names (ADR 0059), and another app may map them differently.
- **How the Tokens tab lists tokens**: reflection over the classes (no descriptions or aliases at runtime), a catalog in the library (more API for every consumer), or a catalog only the demo compiles. The last: `dist/catalog/PtsCatalog.kt`, outside the library's sources.

## Why it matters

- **The color mapping**: `primary` ← `inverse/base` (primary buttons), `onPrimary` ← `content/inverse/base`; `surface` and `background` ← `background`; `onSurface` ← `content/base`, `onSurfaceVariant` ← `content/subtle`; every `surfaceContainer*` ← `surface/subtle`, since Plain has one container layer and its `strong` and `stronger` steps are hover and pressed fills (`secondaryContainer`, the selected-item indicator, is `surface/strong`); `tertiary*` ← the discovery intent; `error*` ← the danger intent; `outline` ← `border/base`, `outlineVariant` ← `border/subtle`; `scrim` ← `utility/scrim`; no surface tint. Every role is set, so no Material baseline color shows.
- **Type and shapes**: Material's 15 type slots take the 13 text styles (some share one); `small` ← `radius/control` (buttons, chips, fields), `medium` and `extraLarge` ← `radius/container` (cards, dialogs, sheets), `large` ← `radius/lg` (menus).
- **Where Material differs, the app says so**: buttons default to a pill and 40dp, so the demo passes `radius/control` and `size/control/md`; the floating action button takes `inverse/base` rather than `primaryContainer`; hover and pressed are Material's state layers, not Plain's fills.
- **Tabs**: Home (a projects app with a banner, a summary card in mono digits, a list with intent tags, a floating button), Components (Material's buttons, icon buttons, chips, selection controls, segmented buttons, inputs, progress, cards, dialog, snackbar), Tokens (Color, Type, Spacing, Border tables with each token's path, value in the current mode, alias, and description, sections titled like the docs), Settings (theme, density, and shape as segmented buttons, and the tokens' version). The system bars follow the app's theme.
- **`@pts/android`'s Kotlin moves to `dist/kotlin/`**, which the library compiles; `dist/catalog/` is the demo's.

## Trade-offs

- **The mapping is a judgment**, not derived: when a semantic token's meaning changes, `Theme.kt` may need a look. Some Material roles reuse a token (`inversePrimary` is `content/inverse/base`).
- **Material keeps its own behavior**: state layers, ripple, elevation shadows, and motion are Material's, not Plain's tokens.
- **`material-icons-core`** (1.7.8, no longer updated) gives the navigation and action icons.

## Implementation notes

- `packages/android/plugin-compose.ts`: output paths under `kotlin/`; with the `catalog` option, `catalog/PtsCatalog.kt` (an entry per token: path, description, alias per context, getter). `build.gradle.kts` compiles `dist/kotlin`; the test checks the catalog and that it stays out of `dist/kotlin` (20 tests).
- `apps/android-demo`: `Theme.kt` (the mapping), `App.kt` (navigation), `HomeScreen.kt`, `ComponentsScreen.kt`, `TokensScreen.kt`, `SettingsScreen.kt`, `Parts.kt`; Material 3, the adaptive navigation suite, and core icons from the Compose BOM; `BuildConfig.PTS_VERSION` from `packages/android/package.json`.
- Checked in the emulator, light and dark, relaxed and compact, soft and round, on every tab: no crash; screenshot pixels equal their mapped tokens for the top app bar, navigation bar, selected indicator, summary card, floating button, info banner, and spacing bars. The first builds caught two things a reader would miss: Material's buttons ignore the theme's shapes, and a KDoc holding `surface/*` opened a nested comment (ADR 0057).

## Documented in

- `CLAUDE.md` — Structure
- `README.md` — Packages, Usage (Android)
- `docs/how-it-works.md` — the demo app row
- `docs/progress.md` — Next
- ADR 0057 — amended by this ADR
