# 0065. An iOS Demo App

- Status: accepted
- Date: 2026-10-19

## Decision

Chosen: `apps/ios-demo`, a SwiftUI app with the Android demo's four tabs (Home, Tokens, Components, Settings), whose Xcode project depends on `packages/ios` as a local Swift package, because the goal of the native work is to see a token change in the iOS Simulator (ADR 0063), the same structure lets the two demos be compared, and a local package needs no publishing step.

## What we learned

- **A local package reference** (`XCLocalSwiftPackageReference`, `../../packages/ios`): the app builds against whatever `npm run build` last wrote, so a token change shows after a build and a run. Android needed `mavenLocal` (ADR 0058) because Gradle resolves a version; SwiftPM resolves a path.
- **The token pages need data the colors don't carry**: each token's path, description, and alias. Android generates `PtsCatalog.kt` beside the library (ADR 0060). Options for iOS:
  - **A folder of the Xcode project pointing at `packages/ios/dist/catalog`**: tried; Xcode didn't compile a synchronized folder outside the project's directory.
  - **A second target and product of the Swift package, `PtsCatalog`**: chosen. SwiftPM's own way to split a package; the app adds the product, and `Pts` stays as it was.
- **The Xcode project, hand-written** (`project.pbxproj`): no XcodeGen or Tuist is installed, and Xcode 16's synchronized folders keep the Swift files out of the project file, so it stays short and rarely changes.
- **No Simulator window**: Xcode 27.1 has no separate Simulator app. `xcodebuild` and `simctl` run the app headless and take screenshots; to watch it, run it from Xcode.

## Why it matters

- **Home**, as on Android (ADR 0061, 0062): a greeting by the time of day, What's new (this version's changelog entries counted by kind, and its tag's date), About, At a glance (counted from the catalog), then Examples: an info banner, a summary card, and recent projects with status tags.
- **Tokens**: the docs' Color page as a native list: a section per group (`intent/danger/*`), each row the swatch, path, hex and alias in the current theme, and description. Type, spacing, and corners follow with their steps.
- **Components**: SwiftUI's own controls in a grouped list (its background the system's, ADR 0063): buttons (prominent, bordered, borderless, destructive, disabled, glass, glass prominent), icon buttons, tags, a toggle, pickers, a stepper, a text field, a slider, a date picker, progress views, a gauge, a card, a menu, an alert, a confirmation dialog, and a sheet.
- **Settings**: the theme (System, Light, Dark), the one modifier iOS follows, and About.
- **The accent is `inverse/base`**, through `.tint` on the root view, since the package can't set the app's `AccentColor` asset (ADR 0063, 0064). A prominent button's label is `content/inverse/base`, as the pairing rules say; without it SwiftUI writes white, which fails on dark mode's light `inverse/base`.
- **The toggle keeps the system's green**: iOS draws its knob white, and a white knob on dark mode's light `inverse/base` can't be told apart.

## Trade-offs

- **Type, spacing, and radius are literals** (system fonts, 16 and 20pt padding, a 32pt minimum corner) until the package has them, the next steps of ADR 0063.
- **`PtsCatalog` is a product anyone can add**, though only the demo needs it; Android's catalog stays out of the library. Its name says what it is.
- **The project file is edited by hand**: a new target or setting means editing `project.pbxproj`, or letting Xcode rewrite it.
- **Not in CI yet**: the macOS job is the last step of ADR 0063.

## Implementation notes

- `packages/ios/plugin-ios.ts` writes `dist/catalog/PtsCatalog.swift` with a catalog option: per color, the path, description, and alias and hex per theme; the version, release date, and release notes, which `terrazzo.config.ts` reads from `package.json`, `packages/web/CHANGELOG.md`, and the tag, as the Android demo's Gradle file does. `Package.swift` adds the `PtsCatalog` target and product.
- `apps/ios-demo/PtsDemo/`: `PtsDemoApp.swift` (the tabs, the tint, the theme), one file per screen, and `Parts.swift` (card, section title, tag, stat, the primary and danger button styles). The open tab is kept in `@AppStorage`, so `-tab tokens` as a launch argument opens a tab. The bundle id is `io.github.haaanju.pts.demo`; the deployment target is iOS 26.
- `packages/ios/test/output.test.ts`: the catalog lists every color with its path, and alias and hex per theme as the resolver gives them, and the package's version.
- Checked: `npm test` (the iOS suite: 7 tests; changing `utility.scrim`'s generated dark alpha and its catalog hex by hand fails three); `xcodebuild` for the iPhone 18 Pro simulator (iOS 27.1) builds; every tab screenshotted in light and dark with `simctl`. Fixed from them: the toggle's knob in dark, and a tag wrapping to two lines. Not checked: the alert, dialog, and sheet, which need a tap.

## Documented in

- `CLAUDE.md`: Structure, After a token change
- `README.md`: Packages, iOS - try it
- `docs/how-it-works.md`: the iOS demo row
- `docs/progress.md`: Next
- ADR 0064: amended by this ADR (the `PtsCatalog` product)
