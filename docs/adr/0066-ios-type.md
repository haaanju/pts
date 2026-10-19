# 0066. iOS Type: Aspekta at Apple's Text Style Sizes

- Status: accepted (amended by 0070)
- Date: 2026-10-20

## Decision

Chosen: each `text/*` token names the iOS text style it follows in `$extensions["io.github.haaanju.pts"].ios.textStyle`, the one nearest its own size, and `@pts/ios` writes `PtsTypography` with the token's family, weight, and letter spacing at Apple's size for that style, scaled as Apple scales it, because ADR 0063 keeps Aspekta and Dynamic Type, and Apple's sizes are what Dynamic Type scales from.

## What we learned

- **Which style each token follows**: the iOS text style nearest the token's own size at the defaults (narrow): 12 → `caption`, 14 → `subheadline` (15), 16 → `callout`, 20 → `title3`, 24 → `title2` (22), 40 → `title` (28), 64 → `largeTitle` (34). Options considered:
  - **By role** (body-md → `body`, heading-sm → `headline`): Apple's names fit the roles, but the pairs the web keeps break: heading-sm and body-lg are one size on the web (ADR 0023), `headline` and `body` would be, but then body-md has no smaller step left but `callout`, and heading-md had to share `title3` with nothing above it.
  - **By nearest size**: chosen. Tokens of one size share one style, so every pair and order of the web holds on iOS; `body` (17) and `headline` go unused, and body text is `callout` (16), the web's 16.
- **Weight of a variable font**: SwiftUI's `Font.custom(_:size:relativeTo:).weight(_:)` leaves Aspekta, one variable file, at its default weight: tried, every heading drew regular. Core Text exposes no named instance (`AspektaVariable-Bold` falls back to Helvetica). A Core Text font with the `wght` variation draws the weight; `Font(CTFont)` has no `relativeTo`, so the text style reads the Dynamic Type size from the environment and scales Apple's size with `UIFontMetrics`.
- **Letter spacing**: ADR 0063 kept the token's values. At Apple's smaller sizes the same points would be tighter than the web, so each style keeps the token's share of its size: display-lg's -1.25px at 64px is -0.66pt at 34pt.
- **Line height**: SwiftUI sets line spacing, not line height, so the token's ratio isn't applied; the font's own line height stands.

## Why it matters

- **`PtsTypography`**: one `PtsTextStyle` per `text/*` token (13), set with `.textStyle(_:)`, which follows the Dynamic Type size live. Each carries the token's description and its iOS style and size.
- **`PtsFonts.register()`**: the package bundles the fonts @pts/android bundles (Aspekta, IBM Plex Mono and Serif, TrueType from @pts/web's WOFF2) and registers them for the process; an app calls it once at launch.
- **`pts/ios-text-style`**: every `text.*` token names one of Apple's 11 text styles, so a new text style can't ship without an iOS size. Component tokens (`button.*.label`) are left out: native buttons set their own text (ADR 0063).
- **The web and Android don't change**: the sizes stay theirs; `$extensions` is team data, which DTCG reserves for it, not a mode.

## Trade-offs

- **iOS text is a little different from the web**: 15 for 14, 22 for 24, 28 and 34 for 40 and 64. That is the point of following Apple's sizes.
- **`body` and `headline` are unused**: an app's own `.font(.body)` text is 17, a point larger than Plain's body (`callout`, 16).
- **A text style is a modifier, not a `Font`**: `PtsTextStyle.font(for:)` gives a `Font` at one Dynamic Type size, for the rare place a modifier can't go.
- **Navigation titles are UIKit's**: the demo sets them through `UINavigationBar.appearance()`, with the same `wght` variation; the package doesn't, since that is an app's choice.

## Implementation notes

- `tokens/src/semantic/typography.tokens.json`: the `$extensions` on each `text/*`. `tokens/lint/rules/ios-text-style.ts`, configured in `tokens/terrazzo.config.ts` with Apple's 11 styles; two cases in `tokens/lint/rules.test.ts`.
- `packages/ios/plugin-ios.ts`: `PtsTypography.swift` (with `APPLE_SIZES`) and `PtsFonts.swift`; `terrazzo.config.ts` maps a font stack's first family to the name its file registers (Aspekta registers as "Aspekta Variable"); `build-fonts.ts` writes `dist/Pts/Fonts/` from `packages/android/fonts.ts`'s list; `Package.swift` copies the folder as a resource. The catalog lists the text styles too.
- `packages/ios/test/output.test.ts`: every text style once, at Apple's size (a table written apart from the plugin) with its family, weight, and tracking; display-lg's tracking; every family bundled with its license; the catalog's text styles.
- Checked: `npm run check`, `npm test` (the iOS suite: 11 tests; changing display-lg's generated size by hand fails two; the lint cases pass), `npm run typecheck`, `npm run compile -w @pts/ios`; the demo in the simulator: headings bold in Aspekta, code in IBM Plex Mono, and the text larger at the accessibility size `accessibility-medium`.

## Documented in

- `CLAUDE.md`: Structure, Commands, Typography
- `README.md`: Packages
- `docs/how-it-works.md`: the iOS row, Checks as code
- `docs/progress.md`: Next
