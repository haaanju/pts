# 0058. Android Library and CI Build

- Status: accepted
- Date: 2026-10-17

## Decision

Chosen: make `packages/android` a Gradle library, `io.github.haaanju.pts:pts-android`, published to `mavenLocal` at the version in its `package.json`, have the demo app depend on it, and build both in a CI job, because an app should depend on a release rather than a folder, and only a compiler catches what ADR 0057's first build did.

## What we learned

The demo app compiled `packages/android/dist` as one of its own source folders (ADR 0057). That proved the pipeline, but no real app would point at another repository's build folder, and "release, then the app changes" needs a versioned artifact. CI didn't compile the Kotlin at all: the KDoc comment bug of ADR 0057 passed every test and only failed in Android Studio.

Options considered:

- **Where the library lives**: in the demo's Gradle build (one wrapper), or in `packages/android` (what ships lives in `packages/`, ADR 0016). The second, with its own wrapper.
- **Where it is published**: `mavenLocal` (no account, no credentials; this machine and the CI runner only), GitHub Packages (needs a token even to read), or Maven Central (signing, a namespace, review). `mavenLocal` until another app needs it.
- **Its version**: the shared `@pts/*` version (ADR 0014), read from `package.json`, which Changesets bumps; no second version to keep in step.
- **How CI compiles it**: inside the `verify` job, or a separate job. Separate: it needs a JDK and Gradle, runs in parallel, and doesn't hold up the docs.

## Why it matters

- **`packages/android` is an npm package and a Gradle library.** `npm run build` writes `dist/PtsColors.kt`; `./gradlew publishToMavenLocal` compiles it with AGP 9.4.1 and publishes the AAR, its sources, and its POM. It exposes Compose `ui-graphics` and `runtime` as `api`, since `PtsColors` uses `Color` and `@Immutable`. `minSdk` 23, `compileSdk` 37.
- **The demo app depends on `pts-android`** at the version `packages/android/package.json` holds, from `mavenLocal()`, so a release moves both together.
- **CI's `android` job** builds the Kotlin, publishes the library to the runner's `mavenLocal`, and builds the demo app against it, on every pull request and push. `setup-gradle` also validates both wrapper jars.

## Trade-offs

- **Two Gradle wrappers** (`packages/android`, `apps/android-demo`), the same version and checksum: each project builds on its own. Update both together.
- **Publishing again replaces a version in `mavenLocal`.** Fine for a demo; a shared repository would need a new version for every change.
- **CI takes longer**: the `android` job runs beside `verify` and downloads Gradle and the Android dependencies, cached by `setup-gradle` after the first run.

## Implementation notes

- `packages/android/build.gradle.kts`: `com.android.library` and `maven-publish`; `kotlin.directories += "dist"`; `group`, `version` from `package.json`; a `release` publication with sources. `settings.gradle.kts`, `gradle.properties`, `.gitignore`, and a copy of the demo's wrapper.
- `apps/android-demo`: `mavenLocal()` first in the repositories; the source folder replaced by `implementation("io.github.haaanju.pts:pts-android:$ptsVersion")`.
- `.github/workflows/ci.yml`: the `android` job (Node for `npm run build`, Temurin 21, `gradle/actions/setup-gradle`).
- Checked locally: `publishToMavenLocal` writes `pts-android-0.10.0.aar`, `-sources.jar` (holding `PtsColors.kt`), `.pom`, and `.module`; the demo resolves `io.github.haaanju.pts:pts-android:0.10.0` and builds; the app runs on the emulator as before.

## Documented in

- `CLAUDE.md` — Structure, Commands
- `README.md` — Usage (Android)
- `docs/how-it-works.md` — the library row
- `docs/progress.md` — Next
- ADR 0057 — amended by this ADR
