# 0072. iOS Buttons Keep inverse/base

- Status: superseded by 0073
- Date: 2026-10-20

## Decision

Chosen: on iOS, every button with a shape (prominent, bordered, glass) takes `inverse/base`, the web's primary color, and only text-only controls (borderless buttons, links, menus, list actions, the tab bar's selection) take the blue accent of ADR 0070, because the owner keeps the primary color across platforms, and the HIG problem ADR 0070 fixed was text-only controls reading as text, not the color of a filled button.

## What we learned

- **The HIG asks a primary action to color its background** (Color, Liquid Glass); it doesn't ask that color to be the accent. A filled black button is told apart from text by its shape.
- **Options considered**:
  - **The accent black again, with shapes or underlines on every text-only control**: one color, but every borderless button, link, and list action would need a glyph or a shape, and system controls that use the tint (menus, alerts, list rows) can't take one.
  - **Two colors by kind of control**: chosen. Shapes black, text blue; SwiftUI's `.tint(_:)` per button style does it.

## Why it matters

- **The primary button matches the web**: black in light, near-white in dark, its label `content/inverse/base`.
- **Blue means "tap this text"**: Ghost, links, Menu, list actions, and the tab bar's selected item.

## Trade-offs

- **Two interactive colors** on one screen: black filled buttons, blue text buttons.

## Implementation notes

- `apps/ios-demo/PtsDemo/Parts.swift`: `primaryButton()`, `secondaryButton()`, and `glassButton(prominent:)` tint `inverse/base`; the root `.tint` stays `intent/info/surface/base`.
- Checked: Components in the simulator, light and dark.

## Documented in

- ADR 0070: amended by this ADR
- `docs/progress.md`: Next
