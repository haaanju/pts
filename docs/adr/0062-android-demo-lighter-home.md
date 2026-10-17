# 0062. A Lighter Android Demo Home

- Status: accepted
- Date: 2026-10-17

## Decision

Chosen: the greeting in `heading-md` and a What's new section that counts this version's changelog entries by kind, with a one-sentence about text and no buttons, because the owner found the 40px greeting too large and the Home text too detailed.

## What we learned

ADR 0061's Home read as a document: a 40px greeting, each changelog entry's first sentence, two buttons, and three about paragraphs. Options considered for the release news:

- **Each entry's first sentence** (ADR 0061): still long, since an entry's first sentence names files and classes.
- **The count of entries by kind, as tags** ("3 New", "1 Fix"): the version and date say what shipped; the entries are in the changelog.

## Why it matters

- The greeting is one step down from 40, `heading-md` (24), the size of the section titles below it: the same size, told apart by its place (ADR 0023). The scale has no step between 24 and 40.
- Home leads with the version, date, and counts; the reader goes to the changelog for the entries.

## Trade-offs

- **No entry text on Home**: what changed isn't readable in the app.

## Implementation notes

- `HomeScreen.kt`: `WhatsNew` groups `BuildConfig.RELEASE_NOTES` by its `New:` / `Fix:` prefix and shows a tag per kind; `About` is "Material 3 components, styled by the `@pts/android` tokens."; `HomeScreen` takes no navigation callback.
- Checked in the emulator: the greeting at 24, the 0.10.1 tags "3 New" and "1 Fix", no crash.

## Documented in

- ADR 0061 — amended by this ADR
