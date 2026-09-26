# 0016. Source at the Root, One Package per Platform

- Status: accepted
- Date: 2026-09-27

## What we learned

Everything lived under `packages/`: the token source (`@pts/tokens`), two web outputs (`@pts/css`, `@pts/fonts`), and the docs (`@pts/storybook`). `packages/` reads as "what gets shipped", so the source and the docs sitting next to the outputs was confusing. The source-as-a-package setup from ADR 0003 also gave little in practice: every package was private, and both `@pts/css` and Storybook read the token files by relative path rather than through the package.

Web output will grow beyond CSS to JS/TS and SCSS, and native platforms (iOS, Android) may follow. Two ways to split outputs were considered:

- **One package per format** (`@pts/css`, `@pts/js`, `@pts/scss`): a Terrazzo config and a build per package, and consumers pick packages by file type.
- **One package per platform** (`@pts/web`, later `ios`, `android`): one Terrazzo config with several plugins builds every web format in one pass, and formats are subpath exports. This is how `@primer/primitives` ships `dist/css`, `dist/scss`, and `dist/js` from one package.

Per platform matches how consumers think (a web app takes the web package), and fonts are platform-specific too (woff2 and `@font-face` for web; native apps bundle fonts differently).

## Why it matters

- **Three top-level roles.** `tokens/` is the source every platform builds from. `packages/<platform>` holds shippable outputs, one per platform. `apps/` holds things that run rather than get imported (Storybook now; tools later).
- **`@pts/web` replaces `@pts/css` and `@pts/fonts`.** Formats are subpath exports: `@pts/web/tokens.css` and `@pts/web/fonts.css` now; JS/TS and SCSS are added as Terrazzo plugins in the same config.
- **Breaking.** The package names and import paths change, so the next release is `0.2.0` (ADR 0014). The built CSS is byte-identical.

## Implementation notes

- Moves (with `git mv`): `packages/tokens` → `tokens/`, `packages/storybook` → `apps/storybook/`, `packages/css` → `packages/web/`, `packages/fonts/files/*` and `fonts.css` → `packages/web/fonts/`.
- `tokens/` stays a private workspace (`@pts/tokens`) so its scripts and devDependencies stay scoped, and `npm run check` / `typecheck` still run through workspaces.
- Root `workspaces`: `["tokens", "packages/*", "apps/*"]`.
- Relative paths updated in `packages/web/terrazzo.config.ts`, `apps/storybook/src/tokens.ts`, and the Storybook `staticDirs` (`packages/web/fonts` served at `/fonts` for the manager UI).
- iOS and Android outputs, when added, would ship through Swift Package Manager and Gradle, not npm; whether they are npm workspaces is decided then.

## Documented in

- `CLAUDE.md` — Structure, Commands, Fonts, Token Docs
- `README.md` — Packages, Usage
