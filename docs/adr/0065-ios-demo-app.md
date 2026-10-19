# 0065. An iOS Demo App

- Status: accepted
- Date: 2026-10-19

## Decision

Chosen: `apps/ios-demo`, a SwiftUI app whose Xcode project depends on `packages/ios` as a local Swift package and shows native components in the token colors on one screen, because the goal of the native work is to see a token change in the iOS Simulator (ADR 0063), and a local package needs no publishing step.

## What we learned

- **A local package reference** (`XCLocalSwiftPackageReference`, `../../packages/ios`): the app builds against whatever `npm run build` last wrote, so a token change shows after a build and a run. Android needed `mavenLocal` (ADR 0058) because Gradle resolves a version; SwiftPM resolves a path.
- **The Xcode project, hand-written** (`project.pbxproj`): no XcodeGen or Tuist is installed, and Xcode 16's synchronized folders (`PBXFileSystemSynchronizedRootGroup`) keep the Swift files out of the project file, so it stays short and rarely changes. Generating it would add a tool to install.
- **No Simulator window**: Xcode 27.1 has no separate Simulator app. `xcodebuild` and `simctl` run the app headless and take screenshots; to watch it, run it from Xcode.

## Why it matters

- **One screen, native components**: a navigation title, cards, `borderedProminent` and `bordered` buttons with capsule shapes, and an intent's soft badge per intent, all in `PtsColors`. A sheet holds a card, to see concentric corners in a sheet.
- **The accent is `inverse/base`**, through `.tint` on the root view, since the package can't set the app's `AccentColor` asset (ADR 0063, 0064). The primary button's label is `content/inverse/base`, as the pairing rules say; without it SwiftUI writes white, which fails on dark mode's light `inverse/base`.
- **Light and dark follow the system**: the screen has no theme code.

## Trade-offs

- **Type, spacing, and radius are literals** (system fonts, 16 and 20pt padding, a 32pt minimum corner) until the package has them, the next steps of ADR 0063.
- **The project file is edited by hand**: a new target or setting means editing `project.pbxproj`, or letting Xcode rewrite it.
- **Not in CI yet**: the macOS job is the last step of ADR 0063.

## Implementation notes

- `apps/ios-demo/PtsDemo/`: `PtsDemoApp.swift` (the app, its tint) and `HomeScreen.swift` (the screen, `Card`, `Intent`). The bundle id is `io.github.haaanju.pts.demo`; the deployment target is iOS 26.
- Cards use `ConcentricRectangle(corners: .concentric(minimum: .fixed(32)), isUniform: true)`.
- Checked: `xcodebuild` for the iPhone 18 Pro simulator (iOS 27.1) builds; installed and launched with `simctl`, screenshots in light and dark show every token color as expected, the primary button's label dark on its light fill in dark mode.

## Documented in

- `CLAUDE.md`: Structure, After a token change
- `README.md`: Packages, iOS - try it
- `docs/how-it-works.md`: the iOS demo row
- `docs/progress.md`: Next
