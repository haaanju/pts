# 0057. Android Demo App

- Status: accepted (amended by 0058, 0060)
- Date: 2026-10-17

## Decision

Chosen: a Compose app in `apps/android-demo`, a Gradle project outside the npm workspaces that compiles `packages/android/dist/PtsColors.kt` as one of its source folders, because it proves the generated Kotlin compiles and shows a token change in the emulator after one build, with nothing to publish yet.

## What we learned

ADR 0056 left `PtsColors.kt` uncompiled: the Mac had no JDK. With Android Studio installed, the first compile failed. A description holding `content/inverse/*` put `/*` inside a KDoc, and Kotlin nests block comments, so the file never closed. The text test had passed. The plugin now writes `/&#42;` and `&#42;/` in KDoc, and a test checks that no KDoc opens or closes a comment.

Options considered for how the app gets the colors:

- **A source folder pointing at `packages/android/dist`**: one `npm run build` and the next app build has the new colors; no publishing, nothing to version.
- **A library published to `mavenLocal`**: what a real app would do, and the step toward "release, then see the app change"; it needs a Gradle library module, a version, and a publish step.
- **Copying the file into the app**: easy to forget, and the copy drifts.

The first is enough to see the pipeline work; the second is the next step.

## Why it matters

- **`apps/android-demo`**: `settings.gradle.kts`, the Gradle wrapper (9.8.1, checksum pinned), and one `app` module. Android Gradle Plugin 9.4.1 with its built-in Kotlin, the Compose compiler plugin 2.4.21, Compose BOM 2026.09.00, `compileSdk` and `targetSdk` 37 (the BOM requires 37), `minSdk` 26.
- **One screen, colors only from `PtsColors`**: page and card, primary and danger fills, every intent soft and strong, and a theme toggle. It follows the system theme until toggled. Sizes are plain `dp` until `@pts/android` writes spacing and type.
- **Not an npm workspace**: it has no `package.json`, so npm skips it; `npm run build` and `npm test` don't build it.
- **Verified end to end**: in the emulator, five points of each theme's screenshot match their `PtsColors` values exactly (background, surface/subtle, inverse/base, the danger fill, the info soft fill). Changing light `inverse.base` to `color.blue.700`, then `npm run build` and `./gradlew installDebug`, turned the primary fill blue; the change was reverted.

## Trade-offs

- **CI doesn't compile the Kotlin yet**: the bug above would only show on a machine with Android tools. A CI job with a JDK and the Android SDK is the fix, at a few minutes per run.
- **The app depends on the source folder, not a release**: it can't show "release, then the app changes" until `@pts/android` is published.
- **A Gradle wrapper jar in the repository** (48 KB, binary): the usual way to pin Gradle; the distribution's checksum is pinned too.

## Implementation notes

- `packages/android/plugin-compose.ts`: `kdocText()` escapes comment markers; `test/output.test.ts` checks every KDoc line.
- Built with Android Studio's JDK (`JAVA_HOME=/Applications/Android Studio.app/Contents/jbr/Contents/Home`, JDK 25) and `ANDROID_HOME=~/Library/Android/sdk`; Android Studio writes `local.properties` (ignored).
- Checked: `./gradlew assembleDebug` succeeds; the app runs on the AVD `Medium_Phone_API_37.0` (API 37) in light and dark; the pixel and token-change checks above; `npm test` (the Android suite now 6 tests), `npm run typecheck`, `npm run check`.

## Documented in

- `CLAUDE.md` — Structure
- `README.md` — Packages, Usage (Android)
- `docs/how-it-works.md` — the demo app row
- `docs/progress.md` — Next
