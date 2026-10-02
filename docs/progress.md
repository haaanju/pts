# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.9.1` (JS/TS and SCSS outputs, ADR 0030). `main` is stable; CI and the pre-commit hook run check and typecheck.
- Contribution flow (ADR 0020, proposed): steps 5–6 (Storybook on GitHub Pages, branch protection on `main`) wait until the repository goes public, since a private repo needs a paid plan for both; the ADR becomes `accepted` then.
- Figma `pts` file: in line with the tokens at `v0.9.1` (variables, styles, specimens; Overview count 295 variables). How to keep it so: the `figma` skill.

## In flight

- `feature/button`: the Button spec, ADR 0032 (proposed). Decided: variants (Primary, Secondary with a `border/subtle` outline, Ghost, Danger), sizes (`sm`, `md`, `lg` on `size/control/*`, horizontal `padding/*` only, a new `text/label-lg`), and anatomy (leading, trailing, icon-only; the icon side padded one step less; `radius/md`; full width; labels never cut). Next question: states beyond these (loading).

## Next

Button first; the rest in no set order:

- First component (Button): validates `inverse` and its `strong`/`stronger` steps, an intent's `surface/base`/`strong`/`stronger` (danger for destructive buttons), the focus ring, `disabled/*`, and control height, and starts the component tier (ADR 0018).
  - Order agreed: the spec first (variants, sizes, states, anatomy, and the token for each part, as an ADR draft), then the Figma component to check it in both themes and densities, then code.
  - To decide, one question at a time: CSS classes or React, where the code lives (ADR 0016 roles), component tokens or semantic tokens directly, a Figma component too, which variants and sizes, and whether props take tokens by category.
  - Variants, sizes, and anatomy decided (ADR 0032). Next open question: states beyond rest, hover, pressed, focus, and disabled (loading); the rest of the order is under Open in ADR 0032.
  - Large containers may need more than `padding/xl` (24px); buttons don't (ADR 0032).
  - `tokens.d.ts` types every value as `string` (ADR 0030): `background: padding.md` type-checks, and a prop can't be limited to, say, colors. If Button needs that, generate the `.d.ts` with literal types (`"subtle": "var(--surface-subtle)"`, so `(typeof surface)[keyof typeof surface]` is the set of surface colors) through a small custom plugin or post-build step; `@terrazzo/plugin-css-in-js` has no option for it.
- Dark-mode letter spacing: light text on a dark page reads tighter, so fine-tune letter spacing in dark. That makes `letter-spacing` (and the `text/*` composites that use it) theme-dependent: it would move into the theme files, the dark CSS blocks, and the Figma `Theme` collection. Since ADR 0028, text sizes share `letter-spacing/normal` (0), so dark may need per-size text values too. Needs an ADR. Low value for its cost: keep it until dark text visibly needs it.

Still deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android; through a custom Terrazzo plugin, ADR 0022: `@terrazzo/plugin-swift` 0.3.3 emits colors only and reads dark from `$extensions.mode`, not the resolver).

## Open questions

- Raw values in JS (`@terrazzo/plugin-js`, one token set per permutation) are left out (ADR 0030); add them as another subpath when a consumer needs real numbers or colors (charts, canvas).
