# 0025. Density Modifier

- Status: proposed
- Date: 2026-09-30

## What we learned

Some screens need the same UI packed tighter: tables, dashboards, and other data-heavy views. Themes already show how to vary tokens without renaming them: the resolver's `theme` modifier swaps the color and shadow files, and the CSS repeats only those groups in the dark blocks. Density is the same kind of switch for spacing.

Two findings shape the design:

- **The light block resets everything.** The first CSS block is `:root, [data-theme="light"]` with every token. A light region inside a compact region would therefore put the spacing back to the default. Each modifier's selector has to repeat only that modifier's groups.
- **CSS variables resolve where they are declared.** A token that aliases a density token (a future component token such as a button padding) keeps the value computed at `:root` unless it is declared again in the density block. Density blocks have to include such aliases too.

## Why it matters

- **Two modes, `relaxed` (default) and `compact`.** Today's values become `relaxed`, so nothing changes until a page opts in; `compact` is one step tighter.
- **Scope: `padding/*`, `gap/*` (not `gap/section/*`), and `size/control/*`** (amended by ADR 0026: the role tokens change, not the `space` scale, so `space/400` stays 16px in every mode). Page-region gaps, line height, font sizes, and icon sizes don't change with density.
- **A resolver modifier, like `theme`**: `modifiers.density` with contexts `relaxed` and `compact`, default `relaxed`. The density groups move out of the base set into `semantic/spacing.{relaxed,compact}.tokens.json` (padding and component gaps) and `semantic/size.{relaxed,compact}.tokens.json` (control); `space/*`, `gap/section/*`, and `size/icon/*` stay in the base files. Both files define the same names and descriptions.
- **Compact values step down the `space` scale**: each role token aliases the next smaller step (for example `gap/lg` `space/400` 16 → `space/300` 12px, `size/control/md` 48 → 40px).
- **CSS blocks**:
  - `:root`: every token, light and relaxed
  - `[data-theme="light"]`: the theme groups only
  - the two dark blocks, as today
  - `[data-density="compact"]` and `[data-density="relaxed"]`: the density groups, plus any token that aliases them
- **Checks**: the `pts/*` rules already run on every resolver permutation (theme × density). A new `pts/density-order` rule checks that each density token is no larger in `compact` than in `relaxed`; built-in rules can't compare permutations.
- **Docs**: a density toggle next to the theme toggle, and density groups shown with `relaxed` and `compact` side by side.
- **Figma**: a `Density` collection (modes `relaxed`, `compact`) holding only the density variables, the same principle as `Theme`. The existing `Spacing/space/*` and `Size/size/control/*` variables are recreated there and their bindings moved.

### Order

The spacing logic is revised first (ADR 0026, released as `0.7.0`), so the compact values are chosen once, on the final scale. Since density then changes role tokens that alias an unchanging `space` variable, the "resolves at `:root`" concern above applies only to tokens added later that alias the role tokens.

### Breaking

The `[data-theme="light"]` block changes content, a selector change, so the release that ships density is `0.8.0` (ADR 0014).

## Implementation notes

(Filled in when implemented.)

## Documented in

- `CLAUDE.md` — Structure, Commands, Token Rules, Figma, Token Docs (when implemented)
- `README.md` — Usage (when implemented)
