# 0061. Android Demo Type Scale and Home

- Status: accepted (amended by 0062)
- Date: 2026-10-17

## Decision

Chosen: larger text in the demo, page titles in `heading-lg` (Material's `headlineMedium`, in a large top app bar), section titles in `heading-md`, and a Home screen that opens with a time-of-day greeting and the current release's changelog entries read at build time, because the owner wanted headings clearly apart from body text and the release news to stay true after the next release.

## What we learned

The demo's titles were 20px over 16px body text, and its banner stacked a 16px title on 14px text: both an in-between difference, which ADR 0023 rules out for stacked levels (the same size, or 1.5 times apart). Material's `ListItem` stacked `bodyLarge` (16) on `bodyMedium` (14) the same way.

Options considered for the release news on Home:

- **Text written in the app**: stale after the next release.
- **The changelog section for this version, read by Gradle at build time**: `packages/web/CHANGELOG.md` is already the project's changelog (ADR 0035), and the app already reads its version from `packages/android/package.json` (ADR 0058).
- **The GitHub Release, fetched at run time**: needs the network and a public API call for a demo.

## Why it matters

- **Type**: page titles 40 (`heading-lg`, collapsing to `heading-sm` on scroll), greeting 40 (`display-md`), section titles 24 (`heading-md`, 1.5 times the 16 body), card title and text both 20 (`heading-sm`, `body-lg`, told apart by weight), numbers 40 in mono. Material's `bodyMedium` is now `body-md`, so a list item's headline and supporting text are the same size.
- **Greeting**: "Good morning", "afternoon", "evening", or "Working late" from 05, 12, 18, and 22 o'clock, then ", Hanju"; read again every minute.
- **Home order**: the greeting; What's new in Plain (this version's changelog entries, first sentence each, tagged New or Fix, with the tag's date when the tag exists, and buttons to the Tokens and Settings tabs); About this app; At a glance (token counts and modes from `PtsCatalog`); then the sample banner, summary, and project list. The floating button and the sample subtitle are gone.

## Trade-offs

- **Release notes need a build**: the app shows the changelog it was built with. That's the version it runs, so it is right.
- **No date in CI**: the shallow checkout has no tags, so the date line is left out there; local builds show it.
- **A name in the source**: the greeting names the owner, which suits this personal study app only.

## Implementation notes

- `apps/android-demo/app/build.gradle.kts`: `RELEASE_NOTES` (the `- ` lines of `## <version>`) and `RELEASE_DATE` (`git log -1 --format=%cs v<version>`) as `BuildConfig` fields.
- `Theme.kt`: `headlineMedium` ← `heading-lg`, `bodyMedium` ← `body-md`. `LargeTopAppBar` with `exitUntilCollapsedScrollBehavior` on Tokens, Components, and Settings.
- `HomeScreen.kt`: `greeting()`, `WhatsNew`, `About`, `AtAGlance`; code spans in the notes and the about text in `PtsFonts.mono`.
- Checked in the emulator: the greeting at 07:26 (Australia/Brisbane), 16:26 (America/Chicago), 18:26 (America/Sao_Paulo), and 23:27 (Europe/Berlin), set with `cmd alarm set-timezone`; the 0.10.1 notes and date; every tab in light and dark; no crash.

## Documented in

- `README.md` — Usage (Android)
- ADR 0060 — amended by this ADR
