# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Releases: Changesets and the Release workflow (ADR 0035); the latest version is in `packages/web/CHANGELOG.md` and the tags. CI and the pre-commit hook run check and typecheck.
- Public repository (ADR 0043); docs on https://haaanju.github.io/pts/, deployed from `main` after CI passes (ADR 0020). `main` is not protected (ADR 0042): workspace changes go through a pull request so the changeset check runs. The Release workflow runs after CI passes on `main` (ADR 0041); `v0.9.5` was its first full run: release PR with `verify`, tag, GitHub Release.
- Repository: recreated on 2026-10-03 with the commit author emails rewritten; the same files and tags, new commit hashes. The pull requests before that (#1–#29) are in the private `haaanju/pts-archive`.
- Figma `pts` file: in line with the tokens through ADR 0049 (variables, styles, specimens, the Button page and component sets; Overview count 335 variables; no binding to a deleted variable). How to keep it so: the `figma` skill.
- **Figma behind ADR 0051** (motion): the Desktop Bridge wasn't connected on 2026-10-09. To do: in `Primitive`, add `duration/200`, `400`, `600` and `easing/emphasized`; in `Semantic`, set `Motion/motion/duration/normal` → `duration/200`, `slow` → `duration/400`, add `slower` → `duration/600` and `Motion/motion/easing/emphasized`, with the tokens' descriptions (all four easings' and three durations' changed); redraw the Motion page's Duration and Easing tables and the Scales page's; update the Overview counts. Then delete this line.

## In flight

- None.

## Next

The monorepo comes first; no new components (ADR 0034). Decide the next step with the owner before starting. Left from the plan:

- **Next, chosen by the owner (2026-10-09; starts after this week): native platforms, Android first, then iOS**, through a custom Terrazzo plugin (ADR 0022: `@terrazzo/plugin-swift` 0.3.3 emits colors only and reads dark from `$extensions.mode`, not the resolver). The goal is an end-to-end demo: change a semantic color, release, and see a dummy app change in the Android emulator and then the iOS simulator. Android: resolve each theme with the resolver into `values/` and `values-night/` resources, a dummy Compose app, published to `mavenLocal` first. iOS: one `.xcassets` colorset per color holding light and dark. Needs an ADR. The owner's Mac has neither Android Studio nor Xcode (only `~/Library/Android/sdk` with the emulator and an android-35 image); ask before installing anything.
- Figma sync stays manual (the `figma` skill).

Waiting for a reason, not scheduled:

- Six rules from the pipeline audit (ADR 0039) stay unchecked by choice: every top-level group shown on a docs page, numeric names matching values, headings bold and no semibold text style, z-index order, dark shadows more opaque than light; and the direction of each surface step (darker in light, lighter in dark, intents on their hue; ADR 0045). The tokens follow all six (checked 2026-10-06), these tokens rarely change, and a break shows on the docs page. Add a check once one breaks.
- An upstream Terrazzo issue for `core/required-children` (ADR 0050): it pools every token a match covers, so one match per intent and part is needed; `main` still does it (checked 2026-10-09), and #804 doesn't cover it. Not filed yet, by the owner's choice; revisit later. Terrazzo's `CONTRIBUTING.md` asks for an issue before any pull request, on the `bug.yml` template (issues without it are closed). Once a fixed release ships, cut the config to three matches and update ADR 0050.
- Large containers may need more than `padding/xl` (24px); buttons don't (ADR 0032).
- A literal-typed `tokens.d.ts` (ADR 0030) waits for a component whose properties take tokens (a Box or Stack); per ADR 0034 that component is added only as a fixture for it.
- Dark-mode letter spacing: light text on a dark page reads tighter, so fine-tune letter spacing in dark. That makes `letter-spacing` (and the `text/*` composites that use it) theme-dependent: it would move into the theme files, the dark CSS blocks, and the Figma `Theme` collection. Since ADR 0028, text sizes share `letter-spacing/normal` (0), so dark may need per-size text values too. Needs an ADR. Low value for its cost: keep it until dark text visibly needs it.

## Open questions

- None. (Raw values in JS, open since ADR 0030, ship with each product's JS: ADR 0047. A product-independent values file, every permutation in one, is left out until a consumer needs it.)
