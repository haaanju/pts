# Plan: Automated Delivery to Every Consumer

- Status: not scheduled (owner, 2026-10-28). A study repository doesn't need it yet; this records how it would go, assuming it goes as far as automation, so the work can start without re-deriving it. Each step becomes its own ADR when it starts, and this file is deleted once the last one is accepted.

## Premise

- **Code is the source.** The token JSON is the only source of truth (ADR 0020). Every output is a consumer: web, Android, iOS, and **Figma**. Figma is reached from a release like the platforms and never read back: a designer may still try a change there first (`CONTRIBUTING.md`), but a value counts once it is in the JSON (owner, 2026-10-28).
- **End to end means**: once the Release PR is merged, the version reaches every consumer's registry with no other step by hand, and a check proves it arrived. Merging the Release PR stays the one manual gate, by choice: it is the approval of a release.

## Today

The Release workflow tags `vX.Y.Z` and creates the GitHub Release after CI passes on `main` (ADR 0041). The publish jobs would run after that step.

| Consumer | Reached today | Missing |
|---|---|---|
| Web | `@pts/web` is `private`; nothing is published | a public npm package |
| Android | `mavenLocal`, on the owner's Mac and in CI (ADR 0058) | a public Maven repository |
| iOS | a local Swift package in `packages/ios`; `dist/` is generated and not committed | a git repository SwiftPM can resolve |
| Figma | by hand, the `figma` skill | a sync from the build |

## Steps, in order

### 0. Font licenses (blocks 2 and 3)

Done (ADR 0076): the OFL counts a format change as a modification, so `@pts/android` and `@pts/ios` now bundle upstream's TrueType files unchanged instead of decompressing the WOFF2 files.

### 1. Web → npm

- **Scope**: the npm name `pts` belongs to an existing account or org (it holds `rc-image-editor`, checked 2026-10-28), so `@pts` is probably not available. An owned scope (`@haaanju/...`) renames every package: a `Breaking:` release. GitHub Packages is the other registry, but it asks for a token even to install a public package.
- **Package**: remove `"private": true` from `@pts/web` only; the source, Android, iOS, components, and Storybook packages stay private. Move `@pts/tokens` from `dependencies` to `devDependencies`: `dist/` imports only `@terrazzo/token-types` (checked 2026-10-28), so an install would otherwise fail on a package that isn't published.
- **Changesets**: `access` to `public`; the release script (`.github/scripts/release.mjs`) publishes after it tags.
- **Auth**: npm trusted publishing (OIDC) from `release.yml`, with provenance: no token to store. The job needs `id-token: write`.

### 2. Android → Maven Central

- **Already there**: `maven-publish`, group `io.github.haaanju.pts`, artifact `pts-android`, a sources jar, the version from `package.json`.
- **Missing**: a Central Portal account with the namespace `io.github.haaanju` verified; the POM (name, description, URL, license `MIT AND OFL-1.1`, developer, SCM); a javadoc jar (Central requires one); GPG signing (the `signing` plugin); an upload to the Portal, which Gradle doesn't do on its own (a plugin such as `com.vanniktech.maven.publish`, or the Portal's publisher API).
- **Secrets**: a Portal user token, the signing key and its passphrase.
- **CI**: pull requests keep publishing to `mavenLocal`, since they compile versions that aren't released; the demo app takes the released version only in step 5.
- GitHub Packages for Maven also needs a token to install, so it isn't the alternative.

### 3. iOS → a Swift package repository

- SwiftPM resolves git tags, not a registry, and `dist/` isn't committed.
- **Direction** (decide in its ADR): a second repository (`haaanju/pts-ios`, name open) holding `Package.swift` and the generated sources. The release job builds `@pts/ios`, compiles it on macOS (the ADR 0069 job), commits `dist/` to that repository, and tags the same version. The alternative, committing `dist/` on a release-only branch here, keeps one repository, but this repository's tag points at the source commit, so the package would need a second tag.
- **Auth**: a deploy key or a fine-grained token for the second repository; `GITHUB_TOKEN` can't push to another repository.
- **Open**: whether `PtsCatalog`, the demo's product (ADR 0065), ships too.

### 4. Figma

- **The constraint** (checked 2026-10-28): writing variables through the REST API is for full members of an Enterprise org with edit access to the file, and reading them is Enterprise-only too. Text and effect styles can't be written through the REST API at all, only from a plugin.
- **Direction**: a Terrazzo plugin writes what Figma needs (the variable collections and modes, the text and effect styles, following the `figma` skill's conventions) as JSON in `dist/figma/`, attached to the GitHub Release. A private Figma plugin in this repository imports it in one run. On an Enterprise plan, CI could push the variables through the REST API and the plugin would handle the styles.
- **Without Enterprise this step stays one click by hand**, and nothing detects Figma drifting from the JSON, as today (ADR 0020).
- The specimen pages and their hand-drawn contrast badges stay manual until the plugin can draw them.

### 5. Proof of arrival

After the publish jobs, one job per registry installs the released version into a project that has never seen this repository and builds it: a page importing `tokens.css` and `tokens.js` from npm; the Android demo against the Maven Central version; the iOS demo against the remote package. Registries take time to serve a new version (Maven Central can take tens of minutes), so these jobs retry before failing.

### 6. Follow-ups

- **Docs version**: the docs show `main`, not the last release, a choice ADR 0020 left to revisit "when packages are published". Decide between docs per release and marking unreleased changes.
- Install sections in `README.md`, the Deferred section in `CLAUDE.md`, and the rows in `docs/how-it-works.md`.

## Not in this plan

- Merging the Release PR on a schedule (`docs/progress.md`, Waiting): it would remove the one manual gate, which this plan keeps.
