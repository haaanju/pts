# 0070. iOS: Apple's Defaults Where the Tokens Differed

- Status: accepted (amended by 0072, 0073)
- Date: 2026-10-20

## Decision

Chosen: on iOS, text takes Apple's size, leading, and tracking for the text style each token names, by role, keeping only the token's family and weight; the accent is `intent/info/surface/base`; the demo has no appearance setting and uses the system's backgrounds; and text styles respond to Bold Text, because a check of the iOS work against the Human Interface Guidelines found these places where the tokens or the demo went against them.

## What we learned

A review against the HIG (the `apple-hig` skill: Typography, Color, Dark Mode, Accessibility, Toggles) found six places:

- **Body text was 16pt, not 17pt.** The HIG's iOS default is 17pt (Body). ADR 0066 had mapped each token to the nearest size, which put body text on Callout. Options considered:
  - **Brand first**: the tokens' own sizes, scaled by Dynamic Type (`Font.custom(_:size:relativeTo:)`), which Apple supports for custom fonts.
  - **Platform first**: chosen (owner, 2026-10-20). Apple's text styles by role; the tokens give the family and, kept by the owner, the weight. A token still owns its role, its iOS style, its family, and its weight; ADR 0023's size ratios don't apply on iOS.
- **Tracking**: Apple adjusts tracking by size only for its own fonts; a custom font gets none. Following Apple means no tracking, so the share-of-size tracking of ADR 0066 is gone.
- **Leading**: Apple's text styles set it (Body 17/22); SwiftUI sets line spacing, so a style adds the difference between Apple's leading and the font's own line height, both scaled by Dynamic Type.
- **Links and borderless buttons looked like text.** The accent, `inverse/base`, is the text color's near twin; the HIG says not to use one color for two meanings, or color alone for interactivity. `intent/info/surface/base` (blue) passes 4.5:1 as text on the system's backgrounds and `surface/subtle` in both themes (5.31:1 at the least, on light grouped) and carries its `content/inverse` as a fill (5.93:1).
- **An appearance setting in the app**: the HIG says not to offer one; the demo had copied Android's.
- **Bold Text**: the HIG asks custom fonts to respond to it; the text styles ignored `legibilityWeight`.
- **Custom page backgrounds**: the HIG prefers the system's, which switch to elevated in sheets and popovers in dark mode; Home painted `background`.
- **Increase Contrast** has no token set: ADR 0071 (proposed) weighs the options.

## Why it matters

- **Text maps by role**: body-md and label-lg to Body, caption to Footnote; the rest as before (display-lg Large Title, display-md and heading-lg Title 1, heading-md Title 2, heading-sm and body-lg Title 3, body-sm, label-md, and code-md Subheadline, label-sm Caption 1). Callout is unused.
- **The primary button is blue on iOS**, black on the web: the accent fills prominent buttons, as the HIG has it.
- **The `background` token is unused on iOS**, like the List and Form backgrounds (ADR 0063); `surface/subtle` cards sit on the system's background.

## Trade-offs

- **iOS reads less like the web**: blue primary buttons, Apple's sizes, no tracking on display text.
- **Bold Text adds 200 to a weight** (regular to semibold, bold to heavy), close to Apple's emphasized weights, not a table of Apple's. Navigation titles read Bold Text at launch only.
- **Content contrast was checked against the tokens' backgrounds**, not the system's; the system's pure black in dark raises it.

## Implementation notes

- `tokens/src/semantic/typography.tokens.json`: body-md, label-lg (`body`), and caption (`footnote`).
- `packages/ios/plugin-ios.ts`: `APPLE_STYLES` (size and leading); `PtsTextStyle` has `leading`, no `tracking`, and `ctFont`, `font`, and `lineSpacing` for a Dynamic Type size and legibility weight; the modifier reads both from the environment.
- Demo: `.tint(PtsColors.intentInfoSurfaceBase)`, prominent labels in `intentInfoContentInverse`, no `preferredColorScheme` or theme picker, no page background on Home.
- `packages/ios/test/output.test.ts`: every style at Apple's size and leading, Body 17/22 for body-md, no tracking.
- Checked: `npm run check`, `npm test`, `npm run typecheck`, `npm run compile -w @pts/ios`; the demo in the simulator in light and dark.

## Documented in

- ADR 0063, 0065, 0066: amended by this ADR
- `CLAUDE.md`: Typography
- `docs/how-it-works.md`: the iOS rows
- `docs/progress.md`: Next
