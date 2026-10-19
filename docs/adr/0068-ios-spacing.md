# 0068. iOS Spacing: PtsSpacing at Density Relaxed

- Status: accepted
- Date: 2026-10-20

## Decision

Chosen: `@pts/ios` writes `PtsSpacing`, the space scale, padding, gaps, and icon and control sizes (34 tokens) in points at density relaxed, in the same shape as `PtsBorder` (ADR 0067), because ADR 0063 fixed density to relaxed and kept spacing in fixed points.

## What we learned

- **The same group as Android's `PtsSpacing`** (ADR 0059), with the same names, so the two demos read alike: `PtsSpacing.paddingLg`, `gapWithinMd`, `sizeControlMd`.
- **Fixed points** (ADR 0063): spacing doesn't follow Dynamic Type. Options considered:
  - **`@ScaledMetric` per use**: an app can still wrap a token in one where a layout needs it; the package doesn't decide that.
  - **Constants**: chosen; the tokens are the steps, as on the web and Android.
- **Touch targets**: relaxed `size/control/md` is 48pt and `lg` 56pt, above Apple's 44pt; `sm` is 32pt, as on the web, so a custom control at `sm` needs a 44pt hit area (`contentShape`). Native controls size themselves.

## Why it matters

- **The demo has no literal spacing left**: every padding, gap, and fixed size is a `PtsSpacing` token, and the Tokens tab has a Spacing page, each step as a bar, like Android's.
- **ADR 0063's steps are built but CI**: colors (0064), the demo (0065), type (0066), corners (0067), spacing (this one).

## Trade-offs

- **Spacing stays put at large text sizes**: text grows with Dynamic Type, the room around it doesn't, as ADR 0063 chose.
- **No compact density on iOS**: a dense screen takes smaller steps of the same scale.

## Implementation notes

- `packages/ios/terrazzo.config.ts`: a `PtsSpacing` group in `dimensions`, the `space`, `padding`, `gap`, and `size` tokens.
- `packages/ios/test/output.test.ts`: the groups' counts (34 and 15); `padding/md` at 12pt (relaxed) and every control height but `sm` at 44pt or more.
- Checked: `npm test` (the iOS suite: 17 tests), `npm run typecheck`, `npm run compile -w @pts/ios`; the demo's Home and Spacing page in the simulator.

## Documented in

- `CLAUDE.md`: Structure, Commands, Deferred
- `README.md`: Packages, Status
- `docs/how-it-works.md`: the iOS row
- `docs/progress.md`: Next
