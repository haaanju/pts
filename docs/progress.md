# Progress

The handoff note between work sessions and machines. Read it before starting; update it in the same commit as the work it describes. Keep it short: history belongs in git and ADRs, not here.

## Current state

- Latest release: `v0.9.2` (Button, ADR 0032: the component tier with `button/*`, `text/label-lg`, and `@pts/components` with `<pts-button>`). `main` is stable; CI and the pre-commit hook run check and typecheck.
- Contribution flow (ADR 0020, proposed): steps 5–6 (Storybook on GitHub Pages, branch protection on `main`) wait until the repository goes public, since a private repo needs a paid plan for both; the ADR becomes `accepted` then.
- Figma `pts` file: in line with the tokens at `v0.9.2` (variables, styles, specimens, the Button page and component sets; Overview count 331 variables). How to keep it so: the `figma` skill.

## In flight

- None.

## Next

In no set order:

- Next component: Input or Select would reuse `size/control/*` and `radius/md` (ADR 0032 keeps them shared). Start with the spec, as for Button.
- Large containers may need more than `padding/xl` (24px); buttons don't (ADR 0032).
- A literal-typed `tokens.d.ts` (ADR 0030) waits for a component whose properties take tokens (a Box or Stack).
- Dark-mode letter spacing: light text on a dark page reads tighter, so fine-tune letter spacing in dark. That makes `letter-spacing` (and the `text/*` composites that use it) theme-dependent: it would move into the theme files, the dark CSS blocks, and the Figma `Theme` collection. Since ADR 0028, text sizes share `letter-spacing/normal` (0), so dark may need per-size text values too. Needs an ADR. Low value for its cost: keep it until dark text visibly needs it.

Still deferred (see CLAUDE.md): Figma sync, native platforms (iOS, Android; through a custom Terrazzo plugin, ADR 0022: `@terrazzo/plugin-swift` 0.3.3 emits colors only and reads dark from `$extensions.mode`, not the resolver).

## Open questions

- The Size page specimen (and possibly other older specimens) binds text to deleted `Theme` variables `on-surface/base` and `on-surface/subtle` (from before ADR 0019). They still render, but rebind them to `content/base` and `content/subtle`.
- Raw values in JS (`@terrazzo/plugin-js`, one token set per permutation) are left out (ADR 0030); add them as another subpath when a consumer needs real numbers or colors (charts, canvas).
