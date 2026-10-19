# 0063. Native iOS Styles Mapped from the Tokens

- Status: proposed
- Date: 2026-10-19

## Decision

Chosen: native SwiftUI and UIKit components wherever Apple provides one, with the tokens connected only where the native component takes a value: asset-catalog color sets per theme, the button shape from `shape`, and Aspekta under Dynamic Type's text styles. Everything else is left to iOS, because the owner chose native components wherever possible (2026-10-18), and Apple sets more constraints than Android.

## What we learned

The owner settled the approach on 2026-10-18. The decisions under Why it matters were made on 2026-10-19 in a chat, choosing among options Claude recommended, before the study session; they have not been tried in an app yet, and the SwiftUI demo is where they get checked. Options considered for the connection:

- **`@terrazzo/plugin-swift` as is**: it emits colors only, reads dark from `token.mode`, which our resolver leaves at `.`, so it writes the light values only. It stays the reference for the color set JSON.
- **A custom plugin writing color sets from `resolver.apply` per theme**: chosen for colors. An asset catalog holds light and dark per color, which fits, since colors change with the theme only (`pts/orthogonal-modifiers`).
- **A `platform` modifier**: rejected. Like viewport, it changes display sizes, against Terrazzo's advice to keep modifiers orthogonal and `pts/orthogonal-modifiers`; it would make 48 permutations, `ios × wide` among them.
- **One resolver per platform**: rejected. Terrazzo's resolver guide describes one resolver with its inputs set in the plugin options, and the DTCG resolver spec has no per-platform split either.
- **Platform data in `$extensions`**: chosen for the iOS text style each `text/*` follows, under a reverse-domain key (`"io.github.haaanju.pts"`). This is team data, not a mode, so it does not break the `$extensions.mode` rule.

## Why it matters

- **Colors**: `AccentColor` is `inverse/base`, the same fill as the primary button. List and Form backgrounds stay the system colors, which adapt to the system's own grouped backgrounds. Increase Contrast has no token set, so it is out of scope for now.
- **Shape**: `soft` maps to `.roundedRectangle(radius: 8)` and `round` to `.capsule`, through `.buttonBorderShape`, matching `radius/control`.
- **Density and size**: `size/control` and compact density apply to custom controls only, since native controls size themselves (`.controlSize`). A custom control keeps a 44pt hit area, so the 40pt compact height gets padding around it.
- **Spacing**: `padding` and `gap` stay fixed pt and do not follow Dynamic Type. Text does.
- **Type**: display letter spacing uses the token values at every size. Aspekta has no automatic tracking, so the token is what gives the display sizes their spacing.
- **Motion and shadows**: not used on iOS. The tokens stay on the web and Android.
- **Button states**: a native button draws its own pressed state; the tokens give only the resting colors.
- **Lint**: shared rules run for every platform in `npm run check`. Web and Android keep `min-font-size`, `line-height-grid`, and `type-scale`, which Apple's sizes break (11pt, a 22pt line height, 17/15/13). iOS adds rules such as every `text/*` having a valid text style, so a shared token change can't break iOS unseen.
- **No viewport on iOS**: the plugin fixes viewport to `narrow` (as products fix modifiers, ADR 0047) and writes no breakpoints. Size classes and Dynamic Type handle the layout.

## Trade-offs

- **Native first means fewer token values reach the screen.** A reader sees iOS's own sizes and shapes, and the tokens show only where the native component accepts them. That is the point of the demo, but a change to, for example, spacing won't appear in iOS at all.
- **A custom plugin is more code than the reference plugin**, and the color set JSON must be kept in step with Xcode's asset format.

## Implementation notes

- **Liquid Glass**: no opt-out. An Apple Frameworks Engineer's answer on the developer forums (July 2026), quoting the documentation: "The system ignores this key when you build for iOS 27 or later", and with the Xcode 27 SDK `UIDesignRequiresCompatibility` is ignored "even if your app's deployment target is set to the 26 releases or earlier"; with the Xcode 26 SDK it is still honored ([thread](https://developer.apple.com/forums/thread/838637)). The demo builds with Xcode 27, so native components take Liquid Glass as they ship; no token covers it.
- **Corners**: cards and other containers keep `radius/container` as a fixed radius, and buttons keep the shape mapping above. iOS 26's concentric corners (`ConcentricRectangle`, `Edge.Corner.Style.concentric`; [Apple docs](https://developer.apple.com/documentation/swiftui/concentricrectangle.md)) would round a button inside a card from the card's corner and its inset, which conflicts with the shape mapping; the demo shows both before choosing.
- **Not built yet.** The package, its tests (values equal to the resolver's, and a compile), and a SwiftUI demo follow this ADR. A macOS CI job is planned after them.
- **Study list**: the HIG (Color, Typography, Layout, Materials, Dark Mode, Accessibility, and the components used), the WWDC25 Liquid Glass sessions, WWDC26 "What's new in SwiftUI", and Apple Design Resources.

## Documented in

- [`docs/progress.md`](../progress.md), the iOS item (the open questions and the next steps).
