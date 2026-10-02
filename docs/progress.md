# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.9.1` (JS/TS and SCSS outputs, ADR 0030). `main` is stable; CI and the pre-commit hook run check and typecheck.
- Contribution flow (ADR 0020, proposed): steps 5–6 (Storybook on GitHub Pages, branch protection on `main`) wait until the repository goes public, since a private repo needs a paid plan for both; the ADR becomes `accepted` then.
- Figma `pts` file: in line with the tokens at `v0.9.1` (variables, styles, specimens; Overview count 295 variables). How to keep it so: the `figma` skill.

## In flight

- `feature/button`: Button, ADR 0032 (proposed). Done: the spec, the tokens (39 `button/*`, `text/label-lg`, `pts/component-pairs`, theme and density blocks, the Storybook page), and Figma (a `Component` collection, the `Button` and `Icon button` sets, the Button page). Next: the code, `@pts/components` with `<pts-button>` (Lit) and its stories; then release and accept the ADR.

## Next

Button first; the rest in no set order:

- First component (Button): validates `inverse` and its `strong`/`stronger` steps, an intent's `surface/base`/`strong`/`stronger` (danger for destructive buttons), the focus ring, `disabled/*`, and control height, and starts the component tier (ADR 0018).
  - Order: the spec, tokens, and Figma are done; next the code (`@pts/components`), then a release (new tokens: PATCH, ADR 0014).
  - Large containers may need more than `padding/xl` (24px); buttons don't (ADR 0032).
  - A literal-typed `tokens.d.ts` (ADR 0030) waits for a component whose properties take tokens (a Box or Stack); Button's don't (ADR 0032).
- Dark-mode letter spacing: light text on a dark page reads tighter, so fine-tune letter spacing in dark. That makes `letter-spacing` (and the `text/*` composites that use it) theme-dependent: it would move into the theme files, the dark CSS blocks, and the Figma `Theme` collection. Since ADR 0028, text sizes share `letter-spacing/normal` (0), so dark may need per-size text values too. Needs an ADR. Low value for its cost: keep it until dark text visibly needs it.

Still deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android; through a custom Terrazzo plugin, ADR 0022: `@terrazzo/plugin-swift` 0.3.3 emits colors only and reads dark from `$extensions.mode`, not the resolver).

## Open questions

- The Size page specimen (and possibly other older specimens) binds text to deleted `Theme` variables `on-surface/base` and `on-surface/subtle` (from before ADR 0019). They still render, but rebind them to `content/base` and `content/subtle`.
- Raw values in JS (`@terrazzo/plugin-js`, one token set per permutation) are left out (ADR 0030); add them as another subpath when a consumer needs real numbers or colors (charts, canvas).
