# 0064. iOS Colors as an Asset Catalog in a Swift Package

- Status: accepted (amended by 0065, 0071)
- Date: 2026-10-19

## Decision

Chosen: a new package, `@pts/ios`, whose Terrazzo plugin writes a Swift package's sources: an asset catalog with a color set per semantic color, holding its light and dark value, and `PtsColors`, which makes each color public under the asset symbol Xcode generates for it, because a color set is how Apple has an app follow the system's appearance (ADR 0063), and the resolver already resolves each theme.

## What we learned

This is the first step of ADR 0063: colors, then a SwiftUI demo, then type, corners, spacing, and a macOS CI job. Options considered:

- **`@terrazzo/plugin-swift` 0.3.4**: writes color sets, but only the light value under our resolver (ADR 0063), converts every color to Display P3, and writes no Swift. Its JSON is the reference for ours.
- **Swift values per theme, like Android's `PtsColors.Light` / `Dark`** (ADR 0056): the app would switch them itself. On iOS the system switches a color set by its appearance, in SwiftUI and UIKit alike, with no code.
- **A color set per color, with public names**: chosen. Xcode generates an asset symbol for each color set (`ColorResource.contentInverseBase`), but a package's symbols are internal, so `PtsColors` repeats them as public `Color`s.

## Why it matters

- **`packages/ios` (`@pts/ios`)**, in the fixed version group. `npm run build` writes `dist/Pts/`: `Colors.xcassets` and `PtsColors.swift`. `Package.swift` points the `Pts` target there; nothing is published yet, like `pts-android` before `mavenLocal`.
- **Names are the token path in lower camel case** (`content.inverse.base` → `contentInverseBase`), the same as Android, used as the color set's name, so the generated symbol and the public name are the same word. Each carries the token's description as a doc comment.
- **Colors stay sRGB**, written as Xcode writes 8-bit colors (`"0xRR"` per channel, alpha as a decimal), so each value is the token's hex exactly.
- **The resolver's inputs are fixed but theme**: `density: relaxed`, `shape: round`, `viewport: narrow` (ADR 0063).

## Trade-offs

- **The app can't pick a theme apart from the system's** without its own code (`.preferredColorScheme`); Android's classes allow it. The demo follows the system.
- **The package needs a build first.** Its sources are in `dist/`, so a checkout has no Swift until `npm run build`.
- **The compile runs on a Mac only.** `npm test` checks the files as text on any machine; the compile is `npm run compile -w @pts/ios` until the macOS CI job.

## Implementation notes

- `packages/ios/plugin-ios.ts`: the plugin; `terrazzo.config.ts` passes the semantic colors from `tokens/source.ts` in file order, and the fixed inputs.
- `packages/ios/test/output.test.ts` (in `npm test`): a color set per semantic color and nothing else; each light and dark value equal to the token's hex and alpha at the fixed inputs, worked out apart from the plugin; `utility.scrim`'s two alphas; `PtsColors` names every color set once, by its own symbol.
- `Package.swift` needs Swift tools 6.2 for `.iOS(.v26)`, the release ADR 0063's concentric corners need.
- Checked: `npm run build`, `npm test` (the new suite: 6 tests; changing the generated dark alpha of `utility.scrim` by hand fails two), `npm run typecheck`, `npm run check`, and `xcodebuild` for the iOS Simulator with Xcode 27.1: the build succeeds, and Xcode's generated symbols number 60, one per public name.

## Documented in

- `CLAUDE.md`: Structure, Commands, After a token change, Deferred
- `README.md`: Packages, Development
- `docs/how-it-works.md`: the iOS row
- `docs/progress.md`: Next
