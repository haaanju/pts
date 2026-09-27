# 0018. Interaction States in the Semantic Tier

- Status: accepted
- Date: 2026-09-27

## What we learned

Semantic colors include interaction states (`hover`, `pressed`, `disabled`). A common view is that states belong to components, since how a control reacts is the component's behavior. Design systems split three ways:

- **Explicit state tokens in the semantic tier**: Atlassian (`background.brand.bold.hovered`, `text.disabled`), Carbon (`background-hover`, `text-disabled`), Polaris (`bg-fill-hover`, `bg-fill-disabled`).
- **States only in component tokens**: most of Primer's control states (`button-primary-bgColor-hover`) and many of Spectrum's.
- **State layers**: Material overlays the content color at a fixed opacity (8% hover, 10% pressed, 38% disabled) instead of defining state colors.

Two facts decide it here. There are no components yet, so there is no component tier to hold states. And every rendered color must exist as a token so `npm run check` can verify contrast and visibility (ADR 0006); state layers produce colors that depend on what is underneath, and ADR 0015's invisible-hover bug was only caught because states are explicit tokens.

The rename in ADR 0017 also showed that four intents carried `hover` / `pressed` with no likely component: warning, success, info, and discovery fills are used for badges and tags, which are not pressable.

## Why it matters

- **Shared states stay semantic.** `hover`, `pressed`, and `disabled` are the same across every component that has them, so they are semantic tokens and stay contrast-checked. `border/focus` is the shared focus ring.
- **States exist only on interactive fills.** A fill gets `hover` / `pressed` only when a pressable component uses it:
  - `background/canvas` → `background/hover`, `pressed`: transparent elements (ghost buttons, list items).
  - `background/inverse/base` → `inverse/hover`, `pressed`: primary buttons.
  - `intent/danger/background/emphasis` → `hover`, `pressed`: destructive buttons.
- **The other four intents drop `hover` / `pressed`** (8 tokens). If a pressable warning, success, info, or discovery control appears, its states are added then; adding tokens is not breaking (ADR 0014).
- **Component-specific states go to the component tier** once it exists: `selected`, `checked`, `dragging`, and the like. Component tokens alias the semantic states (`button/primary/background-hover` → `{background.inverse.hover}`) and add only what one component needs.

## Implementation notes

- Implemented together with ADR 0017: `generate-color.ts` stops emitting the 8 tokens, and `check.ts` derives state pairs only for the states that exist.
- With these rules the test collection has 58 color tokens and 138 contrast pairs per theme, all passing.

## Documented in

- `CLAUDE.md` — Token Rules (Color)
