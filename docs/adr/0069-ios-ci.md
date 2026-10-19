# 0069. iOS in CI: a macOS Job

- Status: accepted
- Date: 2026-10-20

## Decision

Chosen: an `ios` job in CI on GitHub's `macos-26` runner that builds `@pts/ios`, compiles its Swift package for the iOS Simulator, and builds the demo app against it, because `npm test` reads the generated Swift as text, and only Xcode, which runs only on macOS, can say it compiles (as ADR 0058 did for Kotlin).

## What we learned

- **The runner**: `macos-26` (arm64) has Xcode 26.6 by default, enough for iOS 26 and Swift tools 6.2; Xcode 27 is a preview there. The owner's Mac builds with Xcode 27.1, so CI checks the oldest Xcode the package claims.
- **No signing**: a Simulator build needs none; `CODE_SIGNING_ALLOWED=NO` keeps the demo from asking for a team.
- **No simulator boot**: `generic/platform=iOS Simulator` compiles and links without starting a device, which takes minutes on a runner and adds nothing a compile doesn't check.
- **Release waits for it**: the Release workflow runs when the whole CI run succeeds on `main` (ADR 0041), so a release now also waits for the Swift to compile. macOS minutes are free in a public repository.

## Why it matters

- **ADR 0063's last step**: colors (0064), the demo (0065), type (0066), corners (0067), spacing (0068), and now CI; ADR 0063 is accepted.
- **A token change that breaks the Swift fails the pull request**, as one that breaks the Kotlin does.

## Trade-offs

- **The slowest job**: a macOS runner starts slower than Ubuntu and builds the package twice (alone, then in the app).
- **The release date is empty in CI**: the shallow checkout has no tags, as on Android (ADR 0061); the demo built there isn't shipped.

## Implementation notes

- `.github/workflows/ci.yml`: the `ios` job: checkout, Node from `.nvmrc`, `npm ci`, `xcodebuild -version` (the log says which Xcode ran), `npm run compile -w @pts/ios`, and `xcodebuild` for `apps/ios-demo`.
- Checked: the job's two `xcodebuild` commands on the owner's Mac (Xcode 27.1); the job itself on this pull request.

## Documented in

- `CLAUDE.md`: Commands, Deferred
- `README.md`: Development, Status
- `docs/how-it-works.md`: the iOS rows, Gates
- `docs/progress.md`: Current state, Next
- ADR 0063: accepted
