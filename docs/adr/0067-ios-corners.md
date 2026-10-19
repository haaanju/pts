# 0067. iOS Corners: PtsBorder and PtsShape

- Status: accepted
- Date: 2026-10-20

## Decision

Chosen: `@pts/ios` writes `PtsBorder`, every radius, stroke, and focus-ring token in points at shape round, and `PtsShape`, the two shapes ADR 0063 chose from them: `control`, a capsule, and `container`, a concentric rectangle with `radius/container` as its minimum, because an app should take ADR 0063's corners from the package rather than repeat them.

## What we learned

- **Dimensions as points**: one px is one point, as on Android one px is one dp (ADR 0059). Options considered for the shape of the output:
  - **`CGFloat` constants in an enum per group** (`PtsBorder.radiusContainer`): chosen, the same group as Android's `PtsBorder` and the same names; spacing follows as `PtsSpacing`.
  - **SwiftUI values** (`Edge.Corner.Style`, `RoundedRectangle`): fit only some uses; a number goes everywhere, and `PtsShape` covers the two shapes ADR 0063 named.
- **`PtsShape.control` follows the token**: `radius/control` is `radius/full` at shape round, so it writes `.capsule`; a smaller radius would write `.roundedRectangle(radius:)`.
- **`PtsShape.container`** is `ConcentricRectangle(corners: .concentric(minimum: .fixed(PtsBorder.radiusContainer)), isUniform: true)`, ADR 0063's choice, as a computed property, since a shape isn't a constant to share across threads.

## Why it matters

- **One source for the demo's corners**: buttons set `.buttonBorderShape(PtsShape.control)`, cards and the banner `.background(_:in: PtsShape.container)`, and the token pages' swatches `PtsBorder.radiusMd` and `strokeThin`.
- **The Tokens tab has a Border page**, like Android's: each radius on a square, each stroke around one, with its alias and description.

## Trade-offs

- **The sheet is still unchecked**: a card in a sheet should follow the sheet's corner; it needs a tap, which the headless simulator can't make. Open it from the Components tab in Xcode.
- **No shape for popovers and menus** (`radius/lg` on the web): iOS draws its own.

## Implementation notes

- `packages/ios/plugin-ios.ts`: a `dimensions` option, each group an enum of `CGFloat`s (`Pts<Group>.swift`); `PtsShape.swift` from `radius.control` and `radius.container`. `terrazzo.config.ts` passes `PtsBorder`: the `radius`, `stroke`, and `focus-ring` tokens (15). The catalog lists each dimension with its alias.
- `packages/ios/test/output.test.ts`: every border token once with its value; the capsule and the concentric container; the catalog's dimensions.
- The demo's Tokens page is kept in `@AppStorage` like the tab, so `-tokensPage Border` opens it.
- Checked: `npm test` (the iOS suite: 15 tests; changing `radiusContainer` by hand fails two), `npm run typecheck`, `npm run compile -w @pts/ios`; the demo's Border page in the simulator.

## Documented in

- `CLAUDE.md`: Structure, Commands
- `README.md`: Packages
- `docs/how-it-works.md`: the iOS row
- `docs/progress.md`: Next
