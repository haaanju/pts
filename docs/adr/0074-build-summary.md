# 0074. Build Output: What Each Platform Wrote

- Status: accepted
- Date: 2026-10-21

## Decision

Chosen: each platform's build prints its package and `dist/` folder when it starts, and what it wrote, folder by folder with each class's token count, when it ends, through a small shared Terrazzo plugin; the builds run quietly and empty their `dist/` first, because the output had grown to three platforms that each said only "329 tokens built", the number of tokens Terrazzo read, not what the platform made.

## What we learned

`npm run build` printed 33 lines: npm's two-line banner per workspace, Terrazzo's `✔ 329 tokens built` three times, eight `Permutation 1/4 done ({"density":"compact",…})` lines from `@terrazzo/plugin-js` (the products' JS), a fonts line of its own shape, and nothing at all for `@pts/components`. None of it said which files a platform wrote or where. Android writes only the semantic tokens, yet its line said 329.

The Android `dist/` also held five Kotlin files from 2026-10-17, written before its classes moved to `dist/kotlin/`: Terrazzo doesn't empty `outDir`, so a file a build stops writing stays. Gradle reads only `dist/kotlin/`, and `dist/` isn't committed, so nothing shipped them, but nothing showed them either.

Options:

- **A summary plugin per platform**: chosen (owner, 2026-10-20). Each config knows what its files hold (the classes and their token counts, the products and the inputs they fix); `buildEnd` gives the files written.
- **A root build script that prints one table at the end**: one place for the format, but `npm run build -w @pts/ios` would print nothing of it, and it would have to re-derive what each config already knows.
- **Leave the output and document it**: the output stays unreadable as platforms grow.

For the noise: `tz build --quiet` sets Terrazzo's log level to `error`, which drops plugin-js's info lines and also any warning; npm's `--silent` drops the banners.

## Why it matters

- **The output says what was built**: `@pts/android → packages/android/dist`, then `kotlin/` with `PtsBorder 15`, `PtsColors 60`, … one per line, so a token added to a group shows as a count that moved, and a platform that wrote nothing is visible.
- **A failure shows under its platform**: the heading prints before the build, so an error from one platform's plugin sits under that platform's name. With `--silent`, npm no longer names the failed workspace, so the heading has to.
- **Nothing written goes unlisted**: a file no row covers is listed under `other`, so a new output folder can't drop out of the summary.
- **`dist/` holds this build's files only**: each build empties it first.

## Trade-offs

- **Warnings are hidden in the builds**: `--quiet` keeps errors only. Lint warnings belong to `npm run check`, which runs every rule; a warning from an output plugin (an unsupported value in CSS, say) no longer shows during a build.
- **Terrazzo's line stays**: the CLI prints `✔ 329 tokens built` itself, even with `--quiet`, so it sits between the summary rows and the fonts rows, which a separate script writes after Terrazzo.
- **The rows are written per platform**: a new output folder lists under `other` until its config gives it a row.
- **`rm -rf`**: the build scripts assume a POSIX shell, as CI (Ubuntu, macOS) and the owner's Mac have.

## Implementation notes

- `tokens/summary.ts`: the plugin (`summary(dir, rows)`: the heading from the `config` hook, once; the rows from `buildEnd`, with `other`), `print()` for the rows, `names()` (a `.d.ts` folded into its `.js`), `counted()` (class names with token counts), `count()`, `heading()`.
- The heading carries the package's version, the one a demo app shows and Android publishes to `mavenLocal`. The web rows carry each file's size (a `.js`'s, not its `.d.ts`'s: what a page loads), which shows that a product's JS, every permutation of resolved values, is twice the size of `tokens.css`; Android's and iOS's files compile into an app, so their sizes say nothing.
- One entry per line (owner, 2026-10-21: read top to bottom, not across): a folder label, then each entry's name and detail in two aligned columns, a class's token count right-aligned in its list.
- Colors, on a terminal only (owner, 2026-10-21: the plain text read poorly): the package name bold, the folder labels dim, the counts cyan, through Node's `styleText`, which leaves them out when stdout isn't a terminal or `NO_COLOR` is set. A label is padded before it is dimmed, so the codes don't shift the columns.
- Each platform's `terrazzo.config.ts` adds `summary()` last, with its rows: web, the shared files and each product with what it fixes; Android, each Kotlin class with its token count and the catalog; iOS, the color sets with how many have Increase Contrast values (ADR 0071), each Swift file with its count, and the catalog. `build-fonts.ts` prints the font row with `print()`. The font licenses are still copied into `dist/licenses/` (the OFL asks for them next to the files) but not listed: they never change, and the line said nothing about the build (owner, 2026-10-21).
- `apps/components/scripts/summary.ts`: the same shape after `tsc`, which prints nothing: the heading, each file in `dist/` with the element it defines, and `✔ 1 component built`; type-checked by `scripts/tsconfig.json`.
- Scripts: root `build` with `--silent`; each package's `build` starts with `rm -rf dist` and runs `tz build --quiet`.
- Checked: `npm run build` against the mock-up agreed before (the same rows, with real counts); piped, no color codes; with `FORCE_COLOR=1`, colors on 34 lines, and the output with them stripped equal to the piped one; an alias broken in the light colors (every platform reports it, exit 1); a font family Android doesn't bundle (the error under `@pts/android`, the other platforms still build, exit 1); fake output files outside every row (listed under `other`); a stale `PtsColors.kt` put in Android's `dist/` gone after a build; `npm run check`, `typecheck`, `npm test`, and `test-a11y`.

## Documented in

- `CLAUDE.md`: Commands (`npm run build`)
- `README.md`: Commands
- `docs/how-it-works.md`: Outputs
