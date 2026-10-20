# 0073. iOS Accent Is inverse/base

- Status: accepted
- Date: 2026-10-20

## Decision

Chosen: on iOS the accent is `inverse/base` for every control, as on the web, and a text-only control carries a cue other than color (an underline, a glyph), because Plain's interface is black and white (owner, 2026-10-20), and the HIG's concern in ADR 0070 was interactivity shown by color alone, which a cue answers without a second color.

## What we learned

- **ADR 0072 left two interactive colors**: black buttons with a shape, and blue text-only controls (Ghost, links, Menu, list actions, the tab bar's selection). The owner wants one, black.
- **The HIG's ask** (Color, Accessibility): don't rely on color alone for interactivity. With the accent the text color's near twin, a text-only control needs another cue. Options considered:
  - **Blue for text-only controls** (ADR 0072): the HIG's own way, but not black and white.
  - **Black, and a cue per text-only control**: chosen. A link is underlined; a menu and the list actions carry an SF Symbol; See all a chevron.
- **Where iOS 26 gives the cue itself**: toolbar buttons and the tab bar's selected item sit on Liquid Glass shapes; alert and dialog buttons are buttons by place.

## Why it matters

- **One interactive color on every platform**: black in light, near-white in dark, with `content/inverse/base` on a filled one.
- **ADR 0072 is superseded**: buttons no longer set their own tint; they take the app's.

## Trade-offs

- **Ghost has no cue but its place**: a row of buttons. The web's Ghost has none either.
- **Every new text-only control needs its cue by hand**; nothing checks it.

## Implementation notes

- `apps/ios-demo/PtsDemo/PtsDemoApp.swift`: `.tint(PtsColors.inverseBase)`. `Parts.swift`: the button helpers set no tint. `ComponentsScreen.swift`: the Menu and list actions with symbols. `HomeScreen.swift`: See all with a chevron. `SettingsScreen.swift`: the link underlined.
- Checked: `xcodebuild` for the simulator; Components, Home, and Settings in light and dark: buttons, the tab bar's selection, and the link black (near-white in dark). Not seen: the Menus and dialogs section and See all, below the fold.

## Documented in

- ADR 0070: amended by this ADR; ADR 0072: superseded by this ADR
- `docs/progress.md`: Next
