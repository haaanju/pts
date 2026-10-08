# 0048. Shape Modifier for Control Corners

- Status: accepted
- Date: 2026-10-08

## What we learned

The two example products of ADR 0047 differed by density only, so the per-product outputs showed one kind of fixed choice. Products also differ in look: a data tool keeps square-ish controls, a consumer or marketing product often uses pill buttons. Corners are a good second example, since they change no layout and no contrast, and the repository had nothing that varied them.

Three ways were weighed:

- **Override the value outside the resolver**, in `products.ts` or a product stylesheet (`--button-radius: 9999px`). The value would bypass Terrazzo, so lint, the docs, and the product's JS would show 8px while the CSS ships a pill, the disagreement ADR 0038 removed.
- **Change the radius scale per product** (`radius/md` = 9999px in one). `radius/md` would no longer mean 8px, and every element that uses it for its own reason (chips, small cards, the docs) would turn into a pill with the buttons.
- **A role token and a resolver modifier.** `radius/control` names what controls use, the way `padding/*` names a use of the `space` scale (ADR 0026). A `shape` modifier points it at a different step of the radius scale. The scale keeps its meaning, every check runs on every permutation, and a product fixes `shape` like it fixes `density`.

ADR 0032 set a pill radius aside because buttons share a row with inputs and selects. A role token for every control keeps that: in the round shape, inputs and selects round with the buttons.

## Why it matters

- **`radius/control`**, a semantic role token: the corners of controls (buttons, inputs, selects). It aliases the radius scale: `{radius.md}` (8px) in `soft`, `{radius.full}` in `round`. `button/radius` aliases it instead of `radius/md`, so the component tier still aliases semantic tokens only.
- **A tier exception, like `padding/*`**: semantic `radius/control` may alias `radius/*`, and only `radius/*`. `pts/tier-aliases` takes a role by group or by single token, so its `roleAliases` gains `"radius.control": ["radius"]`; a single token is named in messages as `radius/control`, a group as `padding/*`.
- **A `shape` modifier with contexts `soft` (default) and `round`.** Today's corners are `soft`, so nothing changes until a page or product opts in. The names say how the corners look, not which product uses them; `sharp` would suggest 0px.
- **Scope: `radius/control` only** (`pts/orthogonal-modifiers` takes `tokens` as well as `types` and `groups`). The radius scale stays in the base set. A later role (a container radius) can join the same modifier with its own scope entry.
- **Files**: `semantic/border.soft.tokens.json` and `semantic/border.round.tokens.json`, named after the base file that holds the radius scale (`border.tokens.json`), as `spacing.relaxed` sits next to `spacing`. Both define the same token with the same `$description`, which names both values (`pts/theme-parity`).
- **Resolution order: last**, after viewport. No token is defined by two modifiers (`pts/orthogonal-modifiers`), so the order changes no value; last keeps the order in which the modifiers were added, so every existing permutation label and docs key gains `shape` at the end.
- **CSS**: `[data-shape="round"]` and `[data-shape="soft"]` blocks after the viewport query, each with `radius/control` and the component tokens that reach it (`button/radius`), since a variable declared on `:root` keeps the soft value inside a round subtree (ADR 0025, 0032). Like `data-density`, the attribute works on any subtree and nests without resetting the other modifiers. The build config now builds an attribute modifier's blocks from the resolver: every modifier other than theme and viewport gets `[data-<modifier>="<context>"]` for every context, default last, so a third attribute modifier needs no build change.
- **Products**: `dense-app` fixes `density: compact, shape: soft`, `roomy-app` `density: relaxed, shape: round`. Their CSS has no `[data-shape]` blocks, and their JS one shape context, so each still holds 4 token sets.
- **Docs**: a shape toggle next to the density toggle (`data-shape` on `<html>`), soft and round columns where a group differs by shape (the Radius table on the Border page, the Button's radius), and the Products page shows the difference.

### Not breaking

`radius/control` and `[data-shape]` are new; no token is renamed or removed, and `button/radius` still resolves to 8px by default. `button/radius` now references `var(--radius-control)` instead of `var(--radius-md)`, the same value. The release is a patch (ADR 0014).

## Trade-offs

- **Permutations double**: 16 instead of 8 (theme × density × viewport × shape). Lint and the docs data cover all of them; `tz check` stays under a second, and the docs data grows by about the same factor.
- **A modifier for one token.** A product override would be less machinery for one value. The modifier is what keeps the value in the resolver, where lint, the build, the docs, and Figma all read it.
- **The CI token comparison sees every token as changed**: permutations are compared by label, and every label gains `shape=…`. A `New:` changeset covers it; a later modifier will do the same.

## Implementation notes

- `tokens/src/pts.resolver.json`: `modifiers.shape` and its `resolutionOrder` entry.
- `tokens/terrazzo.config.ts`: `roleAliases["radius.control"]`, `scope.shape = { tokens: ["radius.control"] }`. `tokens/lint/rules.test.ts`: a role token outside its scale (`radius.control → {dimension.max}`) and a shape-scoped modifier defining another token.
- `packages/web/terrazzo.config.ts`: `:root` takes the resolver's defaults; `modifierBlocks(name)` gives each modifier's blocks, in resolver order; `repeated(name)` lists a modifier's tokens plus the component tokens that reach them. `tokens.css` is unchanged up to the viewport query; the shape blocks follow it.
- `packages/web/test/output.test.ts` needed no change: it reads the modifiers from the resolver, so it checks both shape blocks and the products' missing ones. Verified by leaving `button/radius` out of the shape blocks: `[data-shape="soft"] lacks --button-radius, which shape changes`.
- Storybook: `.storybook/density.ts` became `attributes.ts`, one helper for the density and shape globals; `manager.tsx` builds both toggles from it; `src/tokens.ts` keys permutations `theme/density/viewport/shape` and adds `isShaped`; `TokenTable` adds soft and round columns through `ShapeCell`. The size/control samples and the focus ring demo use `radius/control`.
- Figma (2026-10-08): a `Shape` collection (`soft`, `round`) holds `Border/radius/control`, aliasing `Border/radius/md` and `Border/radius/full`, with the token's description, the `CORNER_RADIUS` scope, and `var(--radius-control)` as its code syntax. `button/radius` aliases it, so every Button instance follows the frame's Shape mode. `Border/radius/md` has the new description. The Border page's Radius table and the Button page's Shape table have soft and round columns, each cell pinning its mode, with the Storybook leads; the Button page lead and Preview lead mention the shape. Overview: a Shape row, 332 variables.

## Documented in

- `CLAUDE.md` — Structure, Commands, Output, Token Rules (Tiers, Modifiers, Semantic → Border)
- `.claude/rules/web.md` — Build
- `.claude/rules/storybook.md` — Files, Modes
- `docs/how-it-works.md` — Source and structure, Outputs, Documentation
- `README.md` — Usage
- `CONTRIBUTING.md` — files per modifier
- ADR 0032 — amended: the Button's radius is `radius/control`
- ADR 0047 — amended: the example products also fix the shape
