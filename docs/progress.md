# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Releases: Changesets and the Release workflow (ADR 0035); the latest version is in `packages/web/CHANGELOG.md` and the tags. CI and the pre-commit hook run check and typecheck.
- Public repository (ADR 0043); docs on https://haaanju.github.io/pts/, deployed from `main` after CI passes (ADR 0020). `main` requires no pull request (ADR 0042; a ruleset blocks force pushes and deletion only, ADR 0054): workspace changes go through a pull request so the changeset check runs. The Release workflow runs after CI passes on `main` (ADR 0041); `v0.9.5` was its first full run: release PR with `verify`, tag, GitHub Release.
- Repository: recreated on 2026-10-03 with the commit author emails rewritten; the same files and tags, new commit hashes. The pull requests before that (#1–#29) are in the private `haaanju/pts-archive`.
- Figma `pts` file: in line with the tokens through ADR 0055 (variables, styles, specimens, the Button page and component sets, the Icons page; Overview count 340 variables; no binding to a deleted variable). How to keep it so: the `figma` skill.

## In flight

- None.

## Next

The monorepo comes first. Decide the next step with the owner before starting; a second component is an open question below. Left from the plan:

- **Next, chosen by the owner (2026-10-09; starts after this week): native platforms, Android first, then iOS**, through a custom Terrazzo plugin (ADR 0022: `@terrazzo/plugin-swift` 0.3.3 emits colors only and reads dark from `$extensions.mode`, not the resolver). The goal is an end-to-end demo: change a semantic color, release, and see a dummy app change in the Android emulator and then the iOS simulator. Android: Kotlin for Compose, not XML resources (owner, 2026-10-12): the resolver's permutations as Kotlin objects (`PtsColors.Light` / `Dark`), since resource qualifiers cover only night, not density or shape, and `Dp` / `TextStyle` / shapes can follow later; a dummy Compose app, published to `mavenLocal` first. Done: `@pts/android` writes `PtsColors.kt` (ADR 0056), and `apps/android-demo` compiles it and shows it in the emulator; a token change showed after one build (ADR 0057). Android Studio is installed (2026-10-17): its JDK (25) builds from the terminal, and the AVD `Medium_Phone_API_37.0` runs the app. `pts-android` is a Gradle library in `mavenLocal`, which the app depends on, and CI compiles both (ADR 0058). Spacing, borders, type, and fonts followed (ADR 0059). The demo is a Material 3 app themed from the tokens, with Home, Components, Tokens, and Settings tabs (ADR 0060). Left for Android, waiting for a use: motion, elevation, component tokens, and publishing beyond `mavenLocal` (GitHub Packages or Maven Central). Next native step: iOS (needs Xcode; ask before installing). iOS: one `.xcassets` colorset per color holding light and dark. Needs an ADR. The owner's Mac has neither Android Studio nor Xcode (only `~/Library/Android/sdk` with the emulator, platform-tools, build-tools 35, and an android-35 image; no JDK, no `cmdline-tools`, no AVD, checked 2026-10-12). Running the app needs JDK 17+ and `cmdline-tools` (or Android Studio, which bundles both); ask before installing anything.
- Figma sync stays manual (the `figma` skill).

Waiting for a reason, not scheduled:

- Six rules from the pipeline audit (ADR 0039) stay unchecked by choice: every top-level group shown on a docs page, numeric names matching values, headings bold and no semibold text style, z-index order, dark shadows more opaque than light; and the direction of each surface step (darker in light, lighter in dark, intents on their hue; ADR 0045). The tokens follow all six (checked 2026-10-06), these tokens rarely change, and a break shows on the docs page. Add a check once one breaks.
- An upstream Terrazzo issue for `core/required-children` (ADR 0050): it pools every token a match covers, so one match per intent and part is needed; `main` still does it (checked 2026-10-09), and #804 doesn't cover it. Not filed yet, by the owner's choice; revisit later. Terrazzo's `CONTRIBUTING.md` asks for an issue before any pull request, on the `bug.yml` template (issues without it are closed). Once a fixed release ships, cut the config to three matches and update ADR 0050.
- Large containers may need more than `padding/xl` (20px since ADR 0052); buttons don't. The answer would be a new role token, not a larger `xl`.
- A literal-typed `tokens.d.ts` (ADR 0030) waits for a component whose properties take tokens (a Box or Stack); per ADR 0034 that component is added only as a fixture for it.
- Dark-mode letter spacing: light text on a dark page reads tighter, so fine-tune letter spacing in dark. That makes `letter-spacing` (and the `text/*` composites that use it) theme-dependent: it would move into the theme files, the dark CSS blocks, and the Figma `Theme` collection. Since ADR 0028, text sizes share `letter-spacing/normal` (0), so dark may need per-size text values too. Needs an ADR. Low value for its cost: keep it until dark text visibly needs it.
- Scheduled releases (owner, 2026-10-12): releasing stays merging the Release PR by hand, since releases are rare and the native demo needs one on demand. To learn it later, a GitHub Actions `schedule` workflow that merges the Release PR, not a Claude Code routine. It must merge with a PAT or a GitHub App token: a push by `GITHUB_TOKEN` starts no CI, so the Release workflow (ADR 0041) wouldn't tag. Cron runs in UTC and can be late, and GitHub turns scheduled workflows off after 60 days without activity in a public repository. Needs an ADR.

## Open questions

- **A second component, and whether before or after Android** (owner, 2026-10-13: thinking it over). Components stay fixtures (ADR 0034): add one for what it tests, not to grow a library. A second one would also test ADR 0052's rule that Figma properties are what a designer chooses. Candidates:
  - **Checkbox** (suggested first): the first component-specific state (`checked`, ADR 0018), so `pts/component-states` and `pts/component-pairs` meet checked × hover / pressed for the first time.
  - **Input**: shares `size/control` and `radius/control` with the button and uses `border/focus`, testing that controls line up; brings form and ARIA work that isn't about tokens.
  - **Card**: the first user of `radius/container`, `surface/subtle`, and `padding/xl`, checking the 20px `padding/xl` (ADR 0052) on a large container; the simplest.
  - A Box or Stack would instead unlock the literal-typed `tokens.d.ts` (Waiting, above).
- Settled: raw values in JS, open since ADR 0030, ship with each product's JS (ADR 0047); a product-independent values file, every permutation in one, is left out until a consumer needs it.
