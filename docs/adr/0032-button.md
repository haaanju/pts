# 0032. Button

- Status: proposed
- Date: 2026-10-02

The spec for the first component, written before the Figma component and the code, one question at a time. This draft settles the variants; the rest of the spec is listed under Open and is added here as it is decided. The ADR becomes `accepted` once the code ships.

## What we learned

The variants were meant to come from existing semantic tokens only, since Button is the first test of the color ladders (ADR 0019). The first suggestion was Primary (`inverse/*`), a filled Secondary (`surface/subtle` → `strong` → `stronger`), Ghost (transparent → `surface/strong` → `stronger`), and Danger (`intent/danger/surface/*`). Checked against the token values, the filled Secondary fails twice:

- **It disappears on surfaces.** Cards, popovers, and modals are `surface/subtle`, so a Secondary on them has the same fill as its container at rest and shows only its label.
- **It looks disabled.** `disabled/surface` has the same value as `surface/subtle` in both themes (light `neutral.50`, dark `neutral.900`).

Three other shapes were weighed:

- **Fill plus a `border/subtle` outline** (Primer's default button): the fill shows on the page, the outline on a surface. No new token.
- **Outline only** (transparent with `border/subtle`): looks the same on every layer, but is Ghost with a border, and loses the tint that sets it apart from Ghost on the page.
- **A fill one step stronger** (`surface/strong` at rest): visible everywhere, but pressed would need a fourth step below `stronger`, and Secondary at rest would be the same color as Ghost on hover.

For intents, every role already has `surface/base`, `strong`, and `stronger` (ADR 0019), so any of them could have a button with no new token. Only destructive actions need one now.

## Why it matters

### Variants

Four variants, all from existing semantic tokens:

| Variant | Rest | Hover | Pressed | Content | Border |
|---|---|---|---|---|---|
| Primary | `inverse/base` | `inverse/strong` | `inverse/stronger` | `content/inverse/base` | none |
| Secondary | `surface/subtle` | `surface/strong` | `surface/stronger` | `content/base` | `border/subtle` at `stroke/thin` |
| Ghost | transparent | `surface/strong` | `surface/stronger` | `content/base` | none |
| Danger | `intent/danger/surface/base` | `intent/danger/surface/strong` | `intent/danger/surface/stronger` | `intent/danger/content/inverse` | none |

- **Primary** is the main action of a view, at most one per group. **Secondary** is every other action next to it. **Ghost** is for low-emphasis and repeated actions (toolbars, table rows, a dismiss button). **Danger** is for destructive actions (delete, remove), usually confirmed.
- **Secondary is filled and outlined.** On the page the fill sets it apart; on a surface the outline does.
- **Danger is the only intent button.** A pressable warning, success, info, or discovery button is added when a control needs one; it needs no new token, and adding a variant is not breaking (ADR 0014). This is ADR 0018's rule that a fill gets pressable states only when a component uses it, applied to the component.
- **Every variant has the same box.** Variants without a border reserve `stroke/thin` as a transparent border, so heights and widths match side by side.

### Focus and disabled

- **Focus**, every variant: an outline in `border/focus`, `focus-ring/width` wide at `focus-ring/offset`, on keyboard focus only.
- **Disabled**, every variant: content `disabled/content`; fill `disabled/surface`, except Ghost, which stays transparent; Secondary keeps its outline in `disabled/border`. No hover or pressed.

### Contrast

Every pair a variant uses is one `npm run check` already derives (`tokens/lint/pairs.ts`), in both themes:

- `content/base` on `background` and `surface/*` (Secondary, Ghost); `content/inverse/base` on `inverse/*` (Primary); `intent/danger/content/inverse` on the danger `surface/base`, `strong`, and `stronger` (Danger), all at 4.5:1.
- `inverse/*` and the danger `surface/base`, `strong`, `stronger` at 3:1 against `background` and `surface/*`, so Primary and Danger read as controls on any layer.
- `surface/strong` and `stronger` differ from `background`, `surface/subtle`, and `disabled/surface` (`pts/visible-steps`), so hover and pressed show on the page and on a surface.

### Trade-offs

- **Secondary's outline is decorative.** `border/subtle` is exempt from contrast. WCAG 1.4.11 does not require a visible boundary for a button identified by its label, and Ghost has none at all; the outline only places the button on a surface.
- **A disabled Secondary differs from a resting one by its text only**, since `disabled/surface` = `surface/subtle` and `disabled/border` = `border/subtle` in both themes. Disabled controls are exempt from contrast, and the dimmed label carries the state.
- **Secondary and Ghost share their hover and pressed fills.** Both are neutral; they differ at rest.

## Open

Decided next, in this order, and added above:

- **Sizes**: which `size/control/*` steps, and whether `padding/*` needs a split (buttons pad asymmetrically, likely a component token).
- **Anatomy**: label type style, icon slots and `size/icon/*`, radius, gap between icon and label, full width.
- **States beyond these**: loading, and anything component-specific (ADR 0018).
- **Component tokens or semantic tokens directly**, and whether a component token that aliases a density token is repeated in the density blocks (ADR 0025).
- **Code**: CSS classes or React, where it lives (ADR 0016 roles), and whether props take tokens by category (`tokens.d.ts` types every value as `string`, ADR 0030).
- **Figma**: the component, checked in both themes and densities before the code.

## Implementation notes

- No token, code, or Figma change yet.

## Documented in

- `docs/progress.md` — In flight
