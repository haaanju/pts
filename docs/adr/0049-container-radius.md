# 0049. Container Radius in the Shape Modifier

- Status: accepted
- Date: 2026-10-08

## What we learned

ADR 0048 gave the `shape` modifier one token, `radius/control`, so the two example products differed only in their buttons: the Products preview showed pill buttons in `roomy-app`, but both previews sat in the same 8px container. A product that rounds its controls rounds its cards and dialogs too, and the preview fixed its container at `radius/md`, a value neither product's output would change. The preview should show what each product's CSS ships, so the container needs a token the shape changes. ADR 0048 left room for it: "a later role (a container radius) can join the same modifier with its own scope entry."

The round value: 32px. At 24px the container still reads as a soft card next to pill buttons; at 32px it reads as a deliberate round look, and it stays well under half the height of a card, so the corners never meet. The radius scale stopped at `xl` (16px), so the value needed a home. Three ways were weighed:

- **Alias `{dimension.32}` directly.** No new scale step, but `radius/container` would be the only radius role reaching past the scale, with its own tier exception, and 32px would exist as a corner nowhere else for Figma or the docs to show.
- **Shift the whole scale in the round shape** (`radius/md` = 12px, `lg` = 24px, and so on). The names would stop meaning a size: `radius/md` would be 8px or 12px depending on a modifier, and every element that uses the scale for its own reason would change with it, the problem ADR 0048 avoided for controls.
- **A new scale step, `radius/2xl` = 32px**, and a role that aliases it in the round shape. The scale keeps its meaning and gains one step; `radius/container` aliases the scale only, like `radius/control`. No default changes.

The scope: cards, panels, dialogs, and sheets, the surfaces that hold a page's content. Popovers and menus keep `radius/lg`: they are small and dense with rows, and 32px corners would clip their first and last items.

## Why it matters

- **`radius/2xl`** = `{dimension.32}`, in the base set after `xl`: very rounded corners for large surfaces. Nothing aliases it by default.
- **`radius/container`**, a semantic role token: `{radius.md}` (8px) in `soft`, `{radius.2xl}` (32px) in `round`, in `semantic/border.soft.tokens.json` and `semantic/border.round.tokens.json` with the same `$description`, which names both values. Soft keeps 8px, the value the docs' sample containers had, so nothing changes for a page that doesn't opt in.
- **The tier exception extends to it**: `pts/tier-aliases` `roleAliases` gains `"radius.container": ["radius"]`, and `pts/orthogonal-modifiers` scopes `shape` to `radius.control` and `radius.container`.
- **Descriptions**: `radius/lg` no longer claims cards; it is for popovers and menus and points cards, dialogs, and sheets at `radius/container`. `radius/xl` points containers at the role; `radius/md` names both roles.
- **Docs**: the Products preview container uses `var(--radius-container)`, so `dense-app` shows 8px and `roomy-app` 32px, and the "Tokens that differ" table lists `radius/container`. The Border page's Radius table shows it next to `radius/control`, in soft and round columns.

### Not breaking

Two new tokens; no token is renamed or removed and no existing value changes. The `[data-shape]` blocks gain `--radius-container`. A patch (ADR 0014), with a `New:` changeset.

## Trade-offs

- **No component uses it yet.** The Button is the only component (ADR 0034); the docs preview is the first consumer. A card or dialog fixture would test it the way the Button tests `radius/control`; per ADR 0034 it waits for a reason.
- **One shape for every container.** A product that wants round cards but square dialogs would need a second role. Nothing asks for that.

## Implementation notes

- `tokens/src/semantic/border.tokens.json`: `radius/2xl`; new descriptions for `radius/md`, `lg`, `xl`. `border.soft` and `border.round`: `radius/container`.
- `tokens/terrazzo.config.ts`: `roleAliases["radius.container"]`, `scope.shape.tokens` adds `radius.container`. `tokens/lint/rules.test.ts`: the container radius aliasing outside its scale; the shape-scoped case now adds `radius.media`, since `radius.container` is in scope, and its message lists both tokens.
- `packages/web` needed no change: the shape blocks list what the resolver says the modifier defines, and `npm test` checks them.
- Storybook: `.pts-product-sample` in `docs.css`; the Border page's Radius lead and the Products page's Preview and "Tokens that differ" leads. The Radius table and the diff table read the tokens, so they needed no code change.

## Documented in

- `CLAUDE.md` — Token Rules (Tiers, Modifiers, Semantic → Border)
- `README.md` — Usage (Shape, Per-product outputs)
- `CONTRIBUTING.md` — tiers, files per modifier
- `docs/how-it-works.md` — Source and structure
- ADR 0048 — amended: the shape modifier also sets `radius/container`
