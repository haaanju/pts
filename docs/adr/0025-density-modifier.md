# 0025. Density Modifier

- Status: accepted (amended by 0038)
- Date: 2026-09-30

## What we learned

Some screens need the same UI packed tighter: tables, dashboards, and other data-heavy views. Themes already show how to vary tokens without renaming them: the resolver's `theme` modifier swaps the color and shadow files, and the CSS repeats only those groups in the dark blocks. Density is the same kind of switch for spacing.

Two findings shape the design:

- **The light block resets everything.** The first CSS block is `:root, [data-theme="light"]` with every token. A light region inside a compact region would therefore put the spacing back to the default. Each modifier's selector has to repeat only that modifier's groups.
- **CSS variables resolve where they are declared.** A token that aliases a density token (a future component token such as a button padding) keeps the value computed at `:root` unless it is declared again in the density block. Density blocks have to include such aliases too.

## Why it matters

- **Two modes, `relaxed` (default) and `compact`.** Today's values become `relaxed`, so nothing changes until a page opts in; `compact` is one step tighter.
- **Scope: `padding/*`, `gap/within/*`, `gap/between/*`, and `size/control/*`** (refined by ADR 0026 and 0027 before implementation: the role tokens change, not the `space` scale, so `space/400` stays 16px in every mode; `gap/section/*` doesn't change). Page-region gaps, line height, font sizes, and icon sizes don't change with density.
- **A resolver modifier, like `theme`**: `modifiers.density` with contexts `relaxed` and `compact`, default `relaxed`. The density groups move out of the base set into `semantic/spacing.{relaxed,compact}.tokens.json` (padding and component gaps) and `semantic/size.{relaxed,compact}.tokens.json` (control); `space/*`, `gap/section/*`, and `size/icon/*` stay in the base files. Both files define the same names and descriptions.
- **Compact values step down the `space` scale**: each role token aliases the next smaller step (for example `gap/within/lg` `space/400` 16 → `space/300` 12px, `size/control/md` 48 → 40px). Every `gap/within/*` must stay smaller than every `gap/between/*` in both modes (ADR 0027).
- **CSS blocks**:
  - `:root`: every token, light and relaxed
  - `[data-theme="light"]`: the theme groups only
  - the two dark blocks, as today
  - `[data-density="compact"]` and `[data-density="relaxed"]`: the density tokens, plus any token that aliases them
- **Checks**: the `pts/*` rules already run on every resolver permutation (theme × density). Two new rules compare permutations, which built-in rules can't: `pts/density-order` (each density token is no larger in `compact` than in `relaxed`, in every theme) and `pts/gap-order` (every `within` gap is below every `between` gap, which is below every `section` gap, in every permutation).
- **Docs**: a density toggle next to the theme toggle, and density groups shown with `relaxed` and `compact` side by side.
- **Figma**: a `Density` collection (modes `relaxed`, `compact`) holding only the density variables, the same principle as `Theme`. The existing `Spacing/padding/*`, `Spacing/gap/within|between/*`, and `Size/size/control/*` variables are recreated there and their bindings moved.

### Order

The spacing logic is revised first (ADR 0026, released as `0.7.0`), so the compact values are chosen once, on the final scale. Since density then changes role tokens that alias an unchanging `space` variable, the "resolves at `:root`" concern above applies only to tokens added later that alias the role tokens.

### Breaking

The `[data-theme="light"]` block changes content, a selector change, so the release that ships density is `0.8.0` (ADR 0014), together with the gap rename (ADR 0027) and the type scale (ADR 0028).

## Implementation notes

- Compact values (one step down): `padding/xs–xl` 2, 4, 8, 12, 20px; `gap/within/xs–lg` 2, 4, 8, 12px; `gap/between/sm–lg` 16, 20, 28px; `size/control/sm–lg` 28, 40, 48px. The largest `within` gap (12) stays below the smallest `between` gap (16).
- `size/control/md`'s description now says it meets the touch target "in relaxed", since compact is 40px and descriptions are the same in both files.
- `packages/web/terrazzo.config.ts` lists the density tokens by id (from the compact files), because `gap` and `size` also hold base tokens; the theme groups are still listed by top-level group.
- Checked in Chrome on the built CSS: a probe with `padding: var(--padding-lg)` computes 16px at `:root`, 12px in compact, 12px in a light region inside compact (16px before this change), 12px in a dark region inside compact, 16px in a relaxed region inside compact, and 12px in compact inside dark.
- `pts/density-order`, `pts/gap-order`, and `pts/theme-parity` were each broken on purpose (compact larger than relaxed, a compact `within` gap equal to a `between` gap, a `between` gap equal to a `section` gap, a token missing from a compact file) and reported every case.
- `tokens/lint/source.ts`: `themes()` entries carry their resolver input; `modifierTokens()` lists the ids a modifier's contexts define.
- Docs: `tokens.ts` builds every theme × density permutation; `TokenTable` adds relaxed and compact columns through `DensityCell`; `.storybook/density.ts` and the toolbar toggle mirror the theme toggle.

## Documented in

- `CLAUDE.md` — Structure, Commands, Token Rules (Density, Semantic), Figma, Token Docs
- `README.md` — Usage
